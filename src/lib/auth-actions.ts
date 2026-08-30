"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { traduireErreur } from "@/lib/auth-erreurs";

export type EtatAuth = { erreur?: string; message?: string; otpEnvoye?: boolean; verifie?: boolean };

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

  // Succès : la session est ouverte côté serveur. Le client affiche alors
  // l'animation de validation puis emmène l'utilisateur sur le tableau de bord.
  revalidatePath("/", "layout");
  return { verifie: true };
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
