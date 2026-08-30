"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";

export type EtatDossier = { erreur?: string; quotaAtteint?: boolean };

/** Champs confirmés par l'utilisateur après le scan. */
export type NouveauDossier = {
  reference: string;
  typeDocument: string;
  autorite: string;
  commune: string;
  plaque: string;
  montant: string;
  dateConstat: string;
  dateEcheance: string;
  ocrTexte: string;
  ocrConfiance: Record<string, string>;
};

export async function creerDossier(saisie: NouveauDossier): Promise<EtatDossier & { id?: string }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const montant = saisie.montant.trim() ? Number(saisie.montant.replace(",", ".")) : null;

  const { data, error } = await supabase
    .from("dossiers")
    .insert({
      user_id: user.id,
      reference: saisie.reference.trim() || null,
      type_document: saisie.typeDocument || "notification",
      autorite: saisie.autorite.trim() || null,
      commune: saisie.commune.trim() || null,
      plaque: saisie.plaque.trim().toUpperCase() || null,
      montant: montant !== null && !Number.isNaN(montant) ? montant : null,
      date_constat: saisie.dateConstat || null,
      date_echeance: saisie.dateEcheance || null,
      // Le texte OCR brut est conservé pour que l'utilisateur puisse
      // revérifier ce qui avait été lu sur son document.
      ocr_texte: saisie.ocrTexte.slice(0, 20000) || null,
      ocr_confiance: saisie.ocrConfiance,
    })
    .select("id")
    .single();

  if (error) {
    // Le plafond est appliqué par un déclencheur en base : il remonte ici.
    if (error.message.includes("QUOTA_GRATUIT_ATTEINT")) {
      return {
        quotaAtteint: true,
        erreur:
          "Vous avez utilisé vos 2 contestations gratuites. Adhérez à l'association pour en créer de nouvelles.",
      };
    }
    return { erreur: "Le dossier n'a pas pu être enregistré. Réessayez." };
  }

  await supabase.from("evenements").insert({
    dossier_id: data.id,
    user_id: user.id,
    type: "creation",
    titre: "Dossier créé",
    note: "Document analysé et informations confirmées.",
  });

  revalidatePath("/tableau-de-bord");
  return { id: data.id as string };
}

export async function changerStatut(dossierId: string, statut: string, note?: string) {
  const supabase = await creerClientServeur();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("dossiers").update({ statut }).eq("id", dossierId);
  if (error) return;

  const titres: Record<string, string> = {
    a_contester: "Lettre de contestation prête",
    contestation_envoyee: "Contestation envoyée",
    en_attente_reponse: "En attente de la réponse de l'administration",
    accepte: "Redevance annulée",
    rejete: "Contestation rejetée",
    clos: "Dossier clôturé",
  };

  await supabase.from("evenements").insert({
    dossier_id: dossierId,
    user_id: user.id,
    type: "statut",
    titre: titres[statut] ?? "Statut mis à jour",
    note: note ?? null,
  });

  revalidatePath("/tableau-de-bord");
  revalidatePath(`/tableau-de-bord/${dossierId}`);
}

export async function supprimerDossier(dossierId: string) {
  const supabase = await creerClientServeur();
  if (!supabase) return;
  await supabase.from("dossiers").delete().eq("id", dossierId);
  revalidatePath("/tableau-de-bord");
  redirect("/tableau-de-bord");
}

/** Marque une alerte réglementaire comme vue, pour ne plus l'afficher. */
export async function marquerAlerteVue(changementId: string) {
  const supabase = await creerClientServeur();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("alertes_vues")
    .insert({ user_id: user.id, changement_id: changementId });
  revalidatePath("/tableau-de-bord");
}

/**
 * Enregistre une demande d'adhésion. Aucun encaissement n'est branché :
 * l'association confirme le paiement puis bascule `plan` manuellement.
 */
export async function demanderAdhesion(formule: string): Promise<{ erreur?: string; ok?: boolean }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  if (!["membre", "independant", "societe"].includes(formule)) {
    return { erreur: "Formule inconnue." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ plan_demande: formule })
    .eq("id", user.id);

  if (error) return { erreur: "La demande n'a pas pu être enregistrée." };

  revalidatePath("/tableau-de-bord");
  return { ok: true };
}
