"use server";

/**
 * Connexion et création de compte : un seul geste, sans mot de passe.
 *
 * On entre son adresse, on reçoit un code, on le saisit. C'est tout. Il n'y a
 * plus de différence entre « créer un compte » et « se connecter » : la
 * première fois, le code crée le compte ; les fois suivantes, il l'ouvre.
 * Personne n'a de mot de passe à inventer, à retenir, ni à se faire voler.
 *
 * Deux façons d'envoyer le code, selon ce qui est configuré :
 *
 *  - `code` (la voie voulue) : nous fabriquons le code avec la clé de service
 *    Supabase et envoyons NOTRE e-mail, par la boîte Gmail de l'association
 *    (SMTP) ou par Resend (voir `lib/mail/canal.ts`). Le code se saisit dans
 *    le formulaire resté ouvert.
 *  - `lien` (le repli) : Supabase envoie son propre e-mail. Son gabarit par
 *    défaut ne contient qu'un lien ; si le gabarit a été modifié pour inclure
 *    le code (`{{ .Token }}`), l'écran accepte aussi le code. Le lien ouvre la
 *    session dans le navigateur qui le suit, quel qu'il soit (flux implicite :
 *    voir `lib/supabase/lien.ts` et `RetourLienEmail`). L'expéditeur par
 *    défaut de Supabase est plafonné à quelques envois par heure : c'est la
 *    raison pour laquelle des e-mails « n'arrivaient pas ». Il ne convient pas
 *    à un service ouvert au public.
 */

import { headers } from "next/headers";
import { cheminSur } from "@/lib/chemin-sur";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { creerClientLien } from "@/lib/supabase/lien";
import { jetonsPlausibles } from "@/lib/lien-email";
import { envoyerEmail, mailConfigure, urlDuSite } from "@/lib/mail/envoyer";
import { emailConfirmation } from "@/lib/mail/gabarits";
import { traduireErreur } from "@/lib/auth-erreurs";
import { consommerJeton, messageQuotaAtteint } from "@/lib/limites";
import { canoniserEmail, domaineJetable, emailValide } from "@/lib/email-canonique";
import { verifierHumain } from "@/lib/anti-robot";

export type ModeConfirmation = "code" | "lien";

export type EtatAuth = {
  erreur?: string;
  message?: string;
  /** L'e-mail est parti : l'écran passe à la saisie du code. */
  envoye?: boolean;
  /** Le code est bon : la session est ouverte. */
  verifie?: boolean;
  email?: string;
  mode?: ModeConfirmation;
  /** Première connexion : le compte vient d'être créé. */
  nouveau?: boolean;
  /** Nombre de chiffres du code envoyé (réglage Supabase « Email OTP Length »). */
  longueur?: number;
};

/** Le mode réellement actif, décidé par les variables d'environnement. */
export async function modeConfirmation(): Promise<ModeConfirmation> {
  return creerClientAdmin() && mailConfigure() ? "code" : "lien";
}

/** Redirection sûre : un chemin interne, jamais une autre origine. */
async function ipVisiteur(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "inconnue";
}

/** Mot de passe technique, jamais montré : la connexion se fait par code. */
function motDePasseTechnique(): string {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`;
}

/**
 * Envoie un code de connexion — et crée le compte s'il n'existe pas.
 */
export async function envoyerCode(precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  try {
    return await envoyerCodeInterne(precedent, donnees);
  } catch {
    return { erreur: "Le service d'envoi est momentanément indisponible. Réessayez dans un instant." };
  }
}

async function envoyerCodeInterne(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "La connexion n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const jetonHumain = String(donnees.get("cf-turnstile-response") ?? "") || null;
  const suite = cheminSur(donnees.get("suite"));
  const ip = await ipVisiteur();

  if (!emailValide(email)) return { erreur: "Cette adresse e-mail ne semble pas valide." };
  if (domaineJetable(email)) {
    return {
      erreur:
        "Les adresses jetables ne sont pas acceptées : votre adresse sert à vous envoyer les rappels de vos dossiers. Utilisez votre adresse habituelle.",
    };
  }

  if (!(await verifierHumain(jetonHumain, ip))) {
    return { erreur: "La vérification anti-robot a échoué. Rechargez la page et réessayez." };
  }

  // Deux compteurs : par adresse (on ne bombarde pas une boîte) et par
  // adresse IP (on n'arrose pas des centaines d'adresses depuis un poste).
  const canonique = canoniserEmail(email);
  if (!(await consommerJeton("codeConnexion", canonique)) || !(await consommerJeton("codeConnexion", `ip:${ip}`))) {
    return { erreur: messageQuotaAtteint("codeConnexion") };
  }

  const admin = creerClientAdmin();

  // Une variante d'une adresse déjà inscrite (points, « +… ») n'ouvre pas un
  // second compte. On oriente vers l'adresse d'origine, sans la dévoiler.
  let existant: { email: string | null } | null = null;
  if (admin) {
    const { data } = await admin
      .from("profiles")
      .select("email")
      .eq("email_canonique", canonique)
      .maybeSingle();
    existant = data;
    if (existant?.email && existant.email.toLowerCase() !== email) {
      return {
        erreur:
          "Un compte existe déjà pour une variante de cette adresse. Connectez-vous avec l'adresse que vous aviez utilisée à l'inscription.",
      };
    }
  }

  /* ---------------------------------------------- voie normale : notre e-mail */
  if (admin && mailConfigure()) {
    const site = urlDuSite();
    const redirectTo = `${site}/auth/confirm?suite=${encodeURIComponent(suite)}`;
    let nouveau = !existant;
    let { data, error } = nouveau
      ? await admin.auth.admin.generateLink({ type: "signup", email, password: motDePasseTechnique(), options: { redirectTo } })
      : await admin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo } });

    // Compte présent dans l'authentification mais sans profil (cas rare) :
    // on bascule sur un code de connexion plutôt que d'afficher une impasse.
    if (error && nouveau && /already|registered|exists/i.test(error.message)) {
      nouveau = false;
      ({ data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo } }));
    }

    if (error) return { erreur: traduireErreur(error.message) };

    const code = data?.properties?.email_otp;
    if (!code) return { erreur: "Nous n'avons pas pu produire votre code. Réessayez dans un instant." };

    const gabarit = emailConfirmation({
      prenom: String(data.user?.user_metadata?.prenom ?? ""),
      code,
      urlSite: site,
      nouveau,
    });

    const envoi = await envoyerEmail({
      destinataire: email,
      sujet: gabarit.sujet,
      html: gabarit.html,
      texte: gabarit.texte,
    });
    if (!envoi.ok) {
      return { erreur: "L'e-mail n'a pas pu partir. Réessayez dans un instant." };
    }
    return { envoye: true, email, mode: "code", nouveau, longueur: code.length };
  }

  /* ---------------------------------------- repli : l'e-mail de Supabase */
  const clientLien = creerClientLien();
  if (!clientLien) return { erreur: "La connexion n'est pas disponible pour le moment." };
  const { error } = await clientLien.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${urlDuSite()}/connexion?suite=${encodeURIComponent(suite)}`,
    },
  });
  if (error) return { erreur: traduireErreur(error.message) };
  return { envoye: true, email, mode: "lien" };
}

/** Vérifie le code reçu par e-mail et ouvre la session. */
export async function verifierCode(precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  try {
    return await verifierCodeInterne(precedent, donnees);
  } catch {
    return { erreur: "La vérification est momentanément indisponible. Votre saisie est conservée : réessayez." };
  }
}

async function verifierCodeInterne(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "La vérification n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const code = String(donnees.get("code") ?? "").replace(/\D/g, "");
  if (!emailValide(email)) return { erreur: "Cette adresse e-mail ne semble pas valide." };
  // Supabase fabrique des codes de 6 à 10 chiffres selon le réglage du projet.
  if (!/^\d{6,10}$/.test(code)) return { erreur: "Saisissez tous les chiffres du code reçu par e-mail.", email };

  // Un code à 6 chiffres, c'est un million de combinaisons : sans plafond,
  // elles se testent.
  if (!(await consommerJeton("verificationCode", canoniserEmail(email)))) {
    return { erreur: messageQuotaAtteint("verificationCode"), email };
  }

  // Un code de création de compte se vérifie en « signup », un code de
  // connexion en « email ». On essaie les deux sans que la personne ait à le
  // savoir.
  const premier = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  const resultat = premier.error && !/rate limit|too many|request this after/i.test(premier.error.message)
    ? await supabase.auth.verifyOtp({ email, token: code, type: "signup" })
    : premier;

  if (resultat.error) return { erreur: traduireErreur(resultat.error.message), email };
  if (!resultat.data.session || !resultat.data.user) {
    return { erreur: "La session n'a pas pu être ouverte. Demandez un nouveau code.", email };
  }

  revalidatePath("/", "layout");
  return { verifie: true, email };
}

/** Un ancien lien ouvert dans un autre onglet peut avoir validé cette adresse. */
export async function verifierSession(email: string): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase || !emailValide(email)) return {};
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email_confirmed_at || user.email?.toLowerCase() !== email.trim().toLowerCase()) return {};
  return { verifie: true, email: user.email };
}

/**
 * Ouvre la session rapportée par un lien de connexion (voir `lib/lien-email.ts`).
 *
 * `setSession` fait vérifier le jeton par Supabase avant d'écrire les cookies :
 * un jeton inventé ou périmé n'ouvre rien, et un jeton valide n'ouvre que la
 * session de son titulaire, dans le navigateur qui l'apporte.
 */
export async function ouvrirSessionDepuisLien(accessToken: string, refreshToken: string): Promise<{ ok: boolean }> {
  try {
    if (!jetonsPlausibles(accessToken, refreshToken)) return { ok: false };
    if (!(await consommerJeton("verificationCode", `lien:${await ipVisiteur()}`))) return { ok: false };
    const supabase = await creerClientServeur();
    if (!supabase) return { ok: false };
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error || !data.session) return { ok: false };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function seDeconnecter() {
  const supabase = await creerClientServeur();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
