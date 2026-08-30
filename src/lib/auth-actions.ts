"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";

export type EtatAuth = { erreur?: string; message?: string };

/** Traduit les messages d'erreur Supabase en français compréhensible. */
function traduireErreur(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirmez d'abord votre adresse e-mail : vérifiez votre boîte de réception.";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cette adresse. Connectez-vous.";
  if (m.includes("password should be at least")) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (m.includes("unable to validate email")) return "Cette adresse e-mail ne semble pas valide.";
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
  const prenom = String(donnees.get("prenom") ?? "").trim();
  const nom = String(donnees.get("nom") ?? "").trim();

  if (!email || !motDePasse) return { erreur: "Renseignez votre e-mail et un mot de passe." };
  if (motDePasse.length < 8) return { erreur: "Choisissez un mot de passe d'au moins 8 caractères." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { prenom, nom } },
  });
  if (error) return { erreur: traduireErreur(error.message) };

  // Selon la configuration Supabase, la session peut être ouverte
  // immédiatement ou nécessiter une confirmation par e-mail.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/tableau-de-bord");
  }
  return {
    message:
      "Compte créé. Vérifiez votre boîte e-mail et cliquez sur le lien de confirmation pour activer votre accès.",
  };
}

export async function seDeconnecter() {
  const supabase = await creerClientServeur();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
