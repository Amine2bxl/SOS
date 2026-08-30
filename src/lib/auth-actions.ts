"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";

export type EtatAuth = { erreur?: string; message?: string; otpEnvoye?: boolean };

/** Traduit les messages d'erreur Supabase en français compréhensible. */
function traduireErreur(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirmez d'abord votre adresse e-mail : vérifiez votre boîte de réception.";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cette adresse. Connectez-vous.";
  if (m.includes("password should be at least")) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (m.includes("unable to validate email")) return "Cette adresse e-mail ne semble pas valide.";
  if (m.includes("otp expired") || m.includes("token has expired") || m.includes("too many requests"))
    return "Ce code a expiré. Demandez-en un nouveau.";
  if (m.includes("invalid token") || m.includes("invalid otp") || m.includes("email otp") || m.includes("otp"))
    return "Code incorrect. Regardez le code du dernier e-mail reçu.";
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives. Réessayez dans quelques minutes.";
  return "Une erreur est survenue. Réessayez, ou appelez-nous si cela persiste.";
}

export async function seConnecter(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Le service de connexion n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim();
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  if (!email || !motDePasse) return { erreur: "Renseignez votre e-mail et votre mot de passe." };

  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) return { erreur: traduireErreur(error.message) };

  const suite = String(donnees.get("suite") ?? "/tableau-de-bord");
  revalidatePath("/", "layout");
  redirect(suite.startsWith("/") ? suite : "/tableau-de-bord");
}

export async function sInscrire(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "La création de compte n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim();
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  const confirmation = String(donnees.get("confirmation") ?? "");
  const prenom = String(donnees.get("prenom") ?? "").trim();
  const nom = String(donnees.get("nom") ?? "").trim();

  if (!email || !motDePasse) return { erreur: "Renseignez votre e-mail et un mot de passe." };
  if (motDePasse.length < 8) return { erreur: "Choisissez un mot de passe d'au moins 8 caractères." };
  if (motDePasse !== confirmation) return { erreur: "Les deux mots de passe ne correspondent pas." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { prenom, nom } },
  });
  if (error) return { erreur: traduireErreur(error.message) };

  // Le compte est créé mais pas encore activé : un code à 6 chiffres est
  // dans l'e-mail de confirmation. La fenêtre de saisie s'ouvre alors.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/tableau-de-bord");
  }
  return { otpEnvoye: true };
}

/** Vérifie le code à 6 chiffres reçu par e-mail et ouvre la session. */
export async function verifierOtp(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "La vérification n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const code = String(donnees.get("code") ?? "").replace(/\D/g, "");
  if (!email) return { erreur: "Nous n'avons pas votre adresse e-mail." };
  if (!/^\d{6}$/.test(code)) return { erreur: "Saisissez les 6 chiffres du code reçu par e-mail." };

  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
  if (error) return { erreur: traduireErreur(error.message) };

  const suite = String(donnees.get("suite") ?? "/tableau-de-bord");
  revalidatePath("/", "layout");
  redirect(suite.startsWith("/") ? suite : "/tableau-de-bord");
}

/** Renvoie un nouveau code de confirmation par e-mail. */
export async function renvoyerCode(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "L'envoi du code n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  if (!email) return { erreur: "Nous n'avons pas votre adresse e-mail." };

  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { erreur: traduireErreur(error.message) };

  return { message: "Un nouveau code vient d'être envoyé." };
}

export async function seDeconnecter() {
  const supabase = await creerClientServeur();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
