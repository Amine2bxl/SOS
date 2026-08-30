"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";

export type EtatAuth = {
  erreur?: string;
  message?: string;
  /** Vrai quand un code à 6 chiffres vient d'être envoyé : la modale s'ouvre. */
  codeEnvoye?: boolean;
  /** Adresse à laquelle le code a été envoyé, réutilisée pour la vérification. */
  email?: string;
};

/** Traduit les messages d'erreur Supabase en français compréhensible. */
function traduireErreur(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cette adresse. Connectez-vous.";
  if (m.includes("password should be at least")) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (m.includes("unable to validate email")) return "Cette adresse e-mail ne semble pas valide.";
  if (m.includes("expired") || m.includes("invalid")) return "Ce code est incorrect ou a expiré. Demandez-en un nouveau.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("for security purposes"))
    return "Trop de tentatives. Patientez une minute avant de réessayer.";
  return "Une erreur est survenue. Réessayez, ou appelez-nous si cela persiste.";
}

export async function seConnecter(_precedent: EtatAuth, donnees: FormData): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Le service de connexion n'est pas disponible pour le moment." };

  const email = String(donnees.get("email") ?? "").trim();
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  if (!email || !motDePasse) return { erreur: "Renseignez votre e-mail et votre mot de passe." };

  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });

  if (error) {
    // Compte créé mais jamais confirmé : on renvoie un code plutôt que de
    // renvoyer l'utilisateur vers un e-mail qu'il n'a peut-être plus.
    if (error.message.toLowerCase().includes("email not confirmed")) {
      await supabase.auth.resend({ type: "signup", email });
      return { codeEnvoye: true, email };
    }
    return { erreur: traduireErreur(error.message) };
  }

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

  // Si la confirmation par e-mail est désactivée, la session est déjà ouverte.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/tableau-de-bord");
  }

  return { codeEnvoye: true, email };
}

/** Vérifie le code à 6 chiffres reçu par e-mail et ouvre la session. */
export async function verifierCode(email: string, code: string): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const chiffres = code.replace(/\D/g, "");
  if (chiffres.length !== 6) return { erreur: "Le code compte 6 chiffres." };

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: chiffres,
    type: "signup",
  });
  if (error) return { erreur: traduireErreur(error.message) };

  revalidatePath("/", "layout");
  return { message: "ok" };
}

/** Renvoie un nouveau code à la même adresse. */
export async function renvoyerCode(email: string): Promise<EtatAuth> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { erreur: traduireErreur(error.message) };
  return { codeEnvoye: true, email };
}

export async function seDeconnecter() {
  const supabase = await creerClientServeur();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
