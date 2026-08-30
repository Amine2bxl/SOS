"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

export type EtatProfil = { erreur?: string; message?: string };

/** Enregistre les informations personnelles du compte. */
export async function enregistrerProfil(_precedent: EtatProfil, donnees: FormData): Promise<EtatProfil> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Connectez-vous pour enregistrer vos informations." };

  const prenom = String(donnees.get("prenom") ?? "").trim().slice(0, 60);
  const nom = String(donnees.get("nom") ?? "").trim().slice(0, 60);
  const adresse = String(donnees.get("adresse") ?? "").trim().slice(0, 120);
  const codePostal = String(donnees.get("codePostal") ?? "").trim().slice(0, 10);
  const commune = String(donnees.get("commune") ?? "").trim().slice(0, 60);

  if (!prenom || !nom) return { erreur: "Renseignez votre prénom et votre nom." };

  const { error } = await supabase
    .from("profiles")
    .update({ prenom, nom, adresse, code_postal: codePostal, commune })
    .eq("id", user.id);
  if (error) return { erreur: "L'enregistrement a échoué. Réessayez." };

  // Le prénom et le nom sont aussi dans la session, pour l'en-tête du site.
  await supabase.auth.updateUser({ data: { prenom, nom } });

  revalidatePath("/tableau-de-bord");
  revalidatePath("/tableau-de-bord/compte");
  return { message: "Vos informations sont enregistrées." };
}

/** Vérifie le mot de passe actuel puis le remplace. */
export async function changerMotDePasse(_precedent: EtatProfil, donnees: FormData): Promise<EtatProfil> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Connectez-vous pour modifier votre mot de passe." };

  const ancien = String(donnees.get("ancienMotDePasse") ?? "");
  const nouveau = String(donnees.get("nouveauMotDePasse") ?? "");
  const confirmation = String(donnees.get("confirmation") ?? "");

  if (!ancien) return { erreur: "Renseignez votre mot de passe actuel." };
  if (nouveau.length < 8) return { erreur: "Choisissez un mot de passe d'au moins 8 caractères." };
  if (nouveau !== confirmation) return { erreur: "Les deux mots de passe ne correspondent pas." };

  const { error: erreurVerification } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: ancien,
  });
  if (erreurVerification) return { erreur: "Votre mot de passe actuel est incorrect." };

  const { error } = await supabase.auth.updateUser({ password: nouveau });
  if (error) return { erreur: "Le mot de passe n'a pas pu être modifié. Réessayez." };

  revalidatePath("/tableau-de-bord/compte");
  return { message: "Votre mot de passe a été modifié." };
}