"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { envoyerEmail, mailConfigure, urlDuSite } from "@/lib/mail/envoyer";
import { emailConfirmation } from "@/lib/mail/gabarits";
import { traduireErreur } from "@/lib/auth-erreurs";

export type EtatAuth = {
  erreur?: string;
  message?: string;
  otpEnvoye?: boolean;
  verifie?: boolean;
  /** Adresse à laquelle le code vient d'être envoyé (réaffichée dans la fenêtre). */
  email?: string;
};

/**
 * Envoi maison du code de confirmation.
 *
 * `generateLink` fabrique le compte (ou un nouveau code pour un compte
 * existant) et nous rend le code à 6 chiffres SANS envoyer d'e-mail : c'est
 * nous qui envoyons, avec notre gabarit. Renvoie `null` quand l'envoi maison
 * n'est pas branché, pour que l'appelant retombe sur le mailer Supabase.
 */
async function envoyerCodeMaison({
  type,
  email,
  motDePasse,
  prenom,
  nom,
}: {
  type: "signup" | "magiclink";
  email: string;
  motDePasse?: string;
  prenom?: string;
  nom?: string;
}): Promise<{ ok: true } | { ok: false; erreur: string } | null> {
  const admin = creerClientAdmin();
  if (!admin || !mailConfigure()) return null;

  const site = urlDuSite();
  const { data, error } =
    type === "signup"
      ? await admin.auth.admin.generateLink({
          type: "signup",
          email,
          password: motDePasse ?? "",
          options: {
            data: { prenom: prenom ?? "", nom: nom ?? "" },
            redirectTo: `${site}/auth/confirm`,
          },
        })
      : await admin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${site}/auth/confirm` },
        });

  if (error) return { ok: false, erreur: traduireErreur(error.message) };

  const code = data?.properties?.email_otp;
  if (!code) return { ok: false, erreur: "Nous n'avons pas pu produire votre code. Réessayez." };

  const jeton = data.properties.hashed_token;
  const gabarit = emailConfirmation({
    prenom: prenom ?? String(data.user?.user_metadata?.prenom ?? ""),
    code,
    lienConfirmation: jeton
      ? `${site}/auth/confirm?token_hash=${jeton}&type=${type === "signup" ? "signup" : "email"}`
      : null,
    urlSite: site,
  });

  const envoi = await envoyerEmail({
    destinataire: email,
    sujet: gabarit.sujet,
    html: gabarit.html,
    texte: gabarit.texte,
  });

  if (!envoi.ok) {
    return {
      ok: false,
      erreur:
        "Votre compte est créé, mais l'e-mail n'a pas pu partir. Réessayez dans un instant avec « renvoyer le code ».",
    };
  }
  return { ok: true };
}

export async function sInscrire(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "La création de compte n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  const confirmation = String(donnees.get("confirmation") ?? "");
  const prenom = String(donnees.get("prenom") ?? "").trim();
  const nom = String(donnees.get("nom") ?? "").trim();

  if (!email || !motDePasse) return { erreur: "Renseignez votre e-mail et un mot de passe." };
  if (motDePasse.length < 8) return { erreur: "Choisissez un mot de passe d'au moins 8 caractères." };
  if (motDePasse !== confirmation) return { erreur: "Les deux mots de passe ne correspondent pas." };

  // Voie normale : nous fabriquons le code et nous envoyons notre e-mail.
  const maison = await envoyerCodeMaison({ type: "signup", email, motDePasse, prenom, nom });
  if (maison) {
    // Le compte existe désormais : la fenêtre de code reste ouverte même en
    // cas d'échec d'envoi, pour que l'utilisateur puisse demander un renvoi.
    if (!maison.ok) return { otpEnvoye: true, email, erreur: maison.erreur };
    return { otpEnvoye: true, email };
  }

  // Repli tant que Resend et la clé service_role ne sont pas configurés :
  // Supabase envoie son propre e-mail de confirmation.
  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { prenom, nom } },
  });
  if (error) return { erreur: traduireErreur(error.message) };

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/tableau-de-bord");
  }
  return { otpEnvoye: true, email };
}

/** Vérifie le code à 6 chiffres reçu par e-mail et ouvre la session. */
export async function verifierOtp(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "La vérification n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const code = String(donnees.get("code") ?? "").replace(/\D/g, "");
  if (!email) return { erreur: "Nous n'avons pas votre adresse e-mail." };
  if (!/^\d{6}$/.test(code)) return { erreur: "Saisissez les 6 chiffres du code reçu par e-mail." };

  // Un code d'inscription se vérifie en « signup », un code de renvoi en
  // « email ». On accepte les deux sans que l'utilisateur ait à le savoir.
  const premier = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
  const resultat = premier.error
    ? await supabase.auth.verifyOtp({ email, token: code, type: "email" })
    : premier;

  if (resultat.error) return { erreur: traduireErreur(resultat.error.message) };

  revalidatePath("/", "layout");
  return { verifie: true, email };
}

/** Renvoie un nouveau code de confirmation par e-mail. */
export async function renvoyerCode(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "L'envoi du code n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  if (!email) return { erreur: "Nous n'avons pas votre adresse e-mail." };

  // Le compte existe déjà : « signup » serait refusé, on demande un lien magique
  // qui produit lui aussi un code à 6 chiffres.
  const maison = await envoyerCodeMaison({ type: "magiclink", email });
  if (maison) {
    if (!maison.ok) return { erreur: maison.erreur, email };
    return { message: "Un nouveau code vient d'être envoyé.", email };
  }

  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { erreur: traduireErreur(error.message) };

  return { message: "Un nouveau code vient d'être envoyé.", email };
}

export async function seDeconnecter() {
  const supabase = await creerClientServeur();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
