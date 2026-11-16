"use server";

/**
 * Connexion par téléphone, et retour d'une touche sur un appareil reconnu.
 *
 * Téléphone : on tape son numéro, on reçoit un code par SMS, on le saisit.
 * Comme par e-mail, la première fois crée le compte. Le code est fabriqué par
 * Supabase ; il part par la passerelle SMS de l'association (crochet
 * `/api/auth/sms`, voir `lib/sms.ts`), ou par le fournisseur SMS configuré
 * dans Supabase.
 *
 * Appareil reconnu : après une première vérification, le proxy retient
 * l'appareil (voir `lib/appareils.ts`). Au retour, `entrerAvecAppareil`
 * vérifie le jeton, le remplace, et rouvre la session sans code.
 */

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { consommerJeton, messageQuotaAtteint } from "@/lib/limites";
import { verifierHumain } from "@/lib/anti-robot";
import { cheminSur } from "@/lib/chemin-sur";
import { emailTechnique, normaliserTelephone } from "@/lib/telephone";
import {
  COOKIE_APPAREIL,
  COOKIE_NE_PAS_RETENIR,
  lireAppareil,
  optionsCookie,
  revoquerAppareil,
  tournerJeton,
} from "@/lib/appareils";

export type EtatTelephone = {
  erreur?: string;
  envoye?: boolean;
  verifie?: boolean;
  telephone?: string;
};

async function ipVisiteur(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "inconnue";
}

function traduireErreurSms(message: string): string {
  if (/disabled|unsupported|provider/i.test(message)) {
    return "La connexion par SMS n'est pas encore ouverte. Utilisez votre adresse e-mail.";
  }
  if (/rate|too many|seconds/i.test(message)) return "Trop de demandes. Patientez une minute avant de redemander un code.";
  if (/expired|invalid|token/i.test(message)) return "Ce code n'est pas bon ou a expiré. Vérifiez-le, ou demandez-en un nouveau.";
  return "Le SMS n'a pas pu partir. Réessayez dans un instant, ou utilisez votre adresse e-mail.";
}

/** Envoie un code par SMS (et crée le compte à la première fois). */
export async function envoyerCodeSms(_p: EtatTelephone, donnees: FormData): Promise<EtatTelephone> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "La connexion n'est pas disponible pour le moment." };

  const telephone = normaliserTelephone(String(donnees.get("telephone") ?? ""));
  if (!telephone) return { erreur: "Ce numéro ne semble pas valide. Exemple : 0470 12 34 56." };

  const ip = await ipVisiteur();
  if (!(await verifierHumain(String(donnees.get("cf-turnstile-response") ?? "") || null, ip))) {
    return { erreur: "La vérification anti-robot a échoué. Rechargez la page et réessayez." };
  }
  // Un SMS coûte une place dans le forfait de l'association : plafonds serrés,
  // par numéro et par adresse IP.
  if (!(await consommerJeton("codeConnexion", `tel:${telephone}`)) || !(await consommerJeton("codeConnexion", `ip:${ip}`))) {
    return { erreur: messageQuotaAtteint("codeConnexion") };
  }

  const { error } = await supabase.auth.signInWithOtp({ phone: telephone, options: { shouldCreateUser: true } });
  if (error) return { erreur: traduireErreurSms(error.message) };
  return { envoye: true, telephone };
}

/** Vérifie le code SMS et ouvre la session. */
export async function verifierCodeSms(_p: EtatTelephone, donnees: FormData): Promise<EtatTelephone> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "La vérification n'est pas disponible pour le moment." };

  const telephone = normaliserTelephone(String(donnees.get("telephone") ?? ""));
  const code = String(donnees.get("code") ?? "").replace(/\D/g, "");
  if (!telephone) return { erreur: "Numéro manquant. Recommencez." };
  if (!/^\d{6,10}$/.test(code)) return { erreur: "Saisissez les 6 chiffres reçus par SMS.", telephone };
  if (!(await consommerJeton("verificationCode", `tel:${telephone}`))) {
    return { erreur: messageQuotaAtteint("verificationCode"), telephone };
  }

  const { data, error } = await supabase.auth.verifyOtp({ phone: telephone, token: code, type: "sms" });
  if (error || !data.session) return { erreur: traduireErreurSms(error?.message ?? "invalid"), telephone };

  revalidatePath("/", "layout");
  return { verifie: true, telephone };
}

/**
 * Rentre d'une touche sur un appareil reconnu.
 *
 * Le jeton du cookie est vérifié et remplacé. La session est ouverte par un
 * lien de connexion fabriqué et consommé côté serveur : il ne quitte jamais
 * nos serveurs, et aucun e-mail ne part. Un compte ouvert par téléphone reçoit
 * pour cela une adresse technique (domaine `.invalid`, voir `lib/telephone.ts`).
 */
export async function entrerAvecAppareil(suiteBrute: string): Promise<{ erreur?: string }> {
  const suite = cheminSur(suiteBrute);
  const jar = await cookies();
  const admin = creerClientAdmin();
  const supabase = await creerClientServeur();
  if (!admin || !supabase) return { erreur: "Le service est momentanément indisponible." };
  if (!(await consommerJeton("verificationCode", `appareil:${await ipVisiteur()}`))) {
    return { erreur: messageQuotaAtteint("verificationCode") };
  }

  const appareil = await lireAppareil(admin, jar.get(COOKIE_APPAREIL)?.value);
  if (!appareil) {
    jar.delete(COOKIE_APPAREIL);
    return { erreur: "Cet appareil n'est plus reconnu. Recevez un code pour entrer." };
  }

  const { data: compte } = await admin.auth.admin.getUserById(appareil.userId);
  const utilisateur = compte?.user;
  if (!utilisateur) return { erreur: "Ce compte n'existe plus." };

  let email = utilisateur.email;
  if (!email) {
    email = emailTechnique(utilisateur.id);
    const { error } = await admin.auth.admin.updateUserById(utilisateur.id, { email, email_confirm: true });
    if (error) return { erreur: "Impossible de vous reconnaître. Recevez un code pour entrer." };
  }

  const { data: lien, error: erreurLien } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const jeton = lien?.properties?.hashed_token;
  if (erreurLien || !jeton) return { erreur: "Impossible de vous reconnaître. Recevez un code pour entrer." };

  const { error } = await supabase.auth.verifyOtp({ token_hash: jeton, type: "magiclink" });
  if (error) return { erreur: "Impossible de vous reconnaître. Recevez un code pour entrer." };

  const neuf = await tournerJeton(admin, appareil.id);
  if (neuf) jar.set(COOKIE_APPAREIL, neuf, optionsCookie());

  revalidatePath("/", "layout");
  redirect(suite);
}

/** « Ce n'est pas moi » / « Utiliser un autre compte » : on oublie cet appareil. */
export async function oublierCetAppareil(): Promise<void> {
  const jar = await cookies();
  const admin = creerClientAdmin();
  if (admin) {
    const appareil = await lireAppareil(admin, jar.get(COOKIE_APPAREIL)?.value);
    if (appareil) await revoquerAppareil(admin, appareil.id);
  }
  jar.delete(COOKIE_APPAREIL);
  revalidatePath("/connexion");
}

/** Se déconnecter ET ne plus être reconnu ici (ordinateur partagé). */
export async function seDeconnecterEtOublier(): Promise<void> {
  await oublierCetAppareil();
  const jar = await cookies();
  jar.set(COOKIE_NE_PAS_RETENIR, "1", optionsCookie());
  const supabase = await creerClientServeur();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Retirer un appareil depuis « Mon compte ». */
export async function retirerAppareil(id: string): Promise<{ erreur?: string }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };
  const { error } = await supabase.from("appareils_reconnus").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { erreur: "L'appareil n'a pas pu être retiré." };
  // Si c'est celui-ci, on ne le recrée pas aussitôt.
  const jar = await cookies();
  if (jar.get(COOKIE_APPAREIL)?.value?.startsWith(`${id}.`)) {
    jar.delete(COOKIE_APPAREIL);
    jar.set(COOKIE_NE_PAS_RETENIR, "1", optionsCookie());
  }
  revalidatePath("/tableau-de-bord/compte");
  return {};
}
