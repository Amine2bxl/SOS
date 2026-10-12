"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { motDePasseTropFaible } from "@/lib/mot-de-passe";

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
  const telephone = String(donnees.get("telephone") ?? "").trim().slice(0, 30);
  const adresse = String(donnees.get("adresse") ?? "").trim().slice(0, 120);
  const codePostal = String(donnees.get("codePostal") ?? "").trim().slice(0, 10);
  const commune = String(donnees.get("commune") ?? "").trim().slice(0, 60);

  if (!prenom || !nom) return { erreur: "Renseignez votre prénom et votre nom." };

  const { error } = await supabase
    .from("profiles")
    .update({ prenom, nom, telephone, adresse, code_postal: codePostal, commune })
    .eq("id", user.id);
  if (error) return { erreur: "L'enregistrement a échoué. Réessayez." };

  // Le prénom et le nom sont aussi dans la session, pour l'en-tête du site.
  await supabase.auth.updateUser({ data: { prenom, nom } });

  revalidatePath("/tableau-de-bord");
  revalidatePath("/tableau-de-bord/compte");
  revalidatePath("/tableau-de-bord/lettre");
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
  if (nouveau !== confirmation) return { erreur: "Les deux mots de passe ne correspondent pas." };
  if (nouveau === ancien) return { erreur: "Le nouveau mot de passe est identique à l'ancien." };

  const faible = motDePasseTropFaible(nouveau, {
    email: user.email ?? undefined,
    prenom: String(user.user_metadata?.prenom ?? ""),
    nom: String(user.user_metadata?.nom ?? ""),
  });
  if (faible) return { erreur: faible };

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
/**
 * Supprime le compte et tout ce qui s'y rattache.
 *
 * Le RGPD donne un droit à l'effacement, et jusqu'ici l'exercer demandait de
 * nous écrire — c'est-à-dire d'attendre qu'un bénévole trouve le temps de le
 * faire à la main. La page des conditions promettait « supprimez-les quand vous
 * voulez » : voilà de quoi tenir cette promesse.
 *
 * L'ordre importe. Les dossiers et les événements partent d'abord, pendant que
 * la session est encore valable et que les politiques RLS cantonnent la
 * suppression au propriétaire. Le compte d'authentification part en dernier,
 * et seulement si la clé `service_role` est disponible : lui seul peut effacer
 * une ligne de `auth.users`. Sans cette clé, les données personnelles sont
 * toutes parties et il ne reste qu'une coquille vide sans aucune information —
 * le résultat est atteint même si le nettoyage final attend.
 *
 * `adhesions` n'est pas effacée ici : elle part en cascade avec le compte
 * d'authentification. Une trace comptable d'un paiement reçu se conserve, et
 * elle ne contient ni nom, ni adresse, ni plaque.
 */
export async function supprimerMonCompte(
  _precedent: EtatProfil,
  donnees: FormData,
): Promise<EtatProfil> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Connectez-vous pour supprimer votre compte." };

  // Une suppression irréversible se confirme en recopiant un mot : un clic mal
  // placé ne doit pas effacer les dossiers de quelqu'un dont le délai court.
  const confirmation = String(donnees.get("confirmation") ?? "").trim().toUpperCase();
  if (confirmation !== "SUPPRIMER") {
    return { erreur: "Recopiez SUPPRIMER en majuscules pour confirmer." };
  }

  await supabase.from("evenements").delete().eq("user_id", user.id);
  await supabase.from("alertes_vues").delete().eq("user_id", user.id);
  await supabase.from("dossiers").delete().eq("user_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  const admin = creerClientAdmin();
  if (admin) await admin.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?compte=supprime");
}
