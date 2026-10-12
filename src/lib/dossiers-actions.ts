"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { consommerJeton, messageQuotaAtteint } from "@/lib/limites";
import { planById } from "@/lib/plans";
import {
  STATUTS_DOSSIER,
  TYPES_DOCUMENT,
  FORMULES_PAYANTES,
  type StatutDossier,
  estUuid,
  nombreOuNull,
} from "@/lib/validation";

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
  heureConstat: string;
  dateEcheance: string;
  dateEnvoi: string;
  lieuConstat: string;
  zone: string;
  communication: string;
  iban: string;
  ocrTexte: string;
  ocrConfiance: Record<string, string>;
};

const texte = (v: string | undefined | null, max: number) =>
  (v ?? "").trim().slice(0, max) || null;

/** Une date n'est acceptée qu'au format ISO : la base refuserait le reste. */
const dateIso = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null);

/** Une heure n'est acceptée qu'en HH:MM. */
const heure = (v: string) => (/^\d{2}:\d{2}$/.test(v.trim()) ? v.trim() : null);

export async function creerDossier(saisie: NouveauDossier): Promise<EtatDossier & { id?: string }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  if (!(await consommerJeton("creationDossier", user.id))) {
    return { erreur: messageQuotaAtteint("creationDossier") };
  }

  // Les valeurs viennent d'un formulaire : rien ne garantit qu'elles
  // ressemblent à ce que l'écran affichait. Un type de document hors liste
  // ferait échouer l'insertion sur une contrainte de la base ; mieux vaut le
  // ramener à la valeur neutre que de montrer une erreur technique à quelqu'un
  // qui vient de scanner son courrier.
  const typeDocument = (TYPES_DOCUMENT as readonly string[]).includes(saisie.typeDocument)
    ? saisie.typeDocument
    : "notification";

  const { data, error } = await supabase
    .from("dossiers")
    .insert({
      user_id: user.id,
      reference: texte(saisie.reference, 60),
      type_document: typeDocument,
      autorite: texte(saisie.autorite, 80),
      commune: texte(saisie.commune, 60),
      plaque: texte(saisie.plaque, 20)?.toUpperCase() ?? null,
      montant: nombreOuNull(saisie.montant, { min: 0, max: 100000 }),
      date_constat: dateIso(saisie.dateConstat),
      heure_constat: heure(saisie.heureConstat),
      date_echeance: dateIso(saisie.dateEcheance),
      date_envoi: dateIso(saisie.dateEnvoi),
      lieu_constat: texte(saisie.lieuConstat, 120),
      zone: texte(saisie.zone, 30),
      communication: texte(saisie.communication, 30),
      iban: texte(saisie.iban, 40),
      // Le texte brut est conservé pour que l'utilisateur puisse revérifier ce
      // qui avait été lu sur son document. Un déclencheur en base lui pose une
      // date d'effacement : c'est de la donnée personnelle, elle ne reste pas
      // indéfiniment (voir supabase/migrations/…_duree_de_vie_texte_ocr.sql).
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

const TITRES_STATUT: Record<StatutDossier, string> = {
  nouveau: "Dossier rouvert",
  a_contester: "Lettre de contestation prête",
  contestation_envoyee: "Contestation envoyée",
  en_attente_reponse: "En attente de la réponse de l'administration",
  accepte: "Redevance annulée",
  rejete: "Contestation rejetée",
  clos: "Dossier clôturé",
};

export async function changerStatut(dossierId: string, statut: string, note?: string) {
  const supabase = await creerClientServeur();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Deux garde-fous, et aucun des deux n'est superflu. La liste blanche de
  // statuts protège la base d'une valeur inventée ; le filtre sur `user_id`
  // double la politique RLS — si une politique est un jour modifiée par
  // erreur, la requête reste cantonnée au propriétaire.
  if (!estUuid(dossierId)) return;
  if (!(STATUTS_DOSSIER as readonly string[]).includes(statut)) return;

  const { error } = await supabase
    .from("dossiers")
    .update({ statut })
    .eq("id", dossierId)
    .eq("user_id", user.id);
  if (error) return;

  await supabase.from("evenements").insert({
    dossier_id: dossierId,
    user_id: user.id,
    type: "statut",
    titre: TITRES_STATUT[statut as StatutDossier] ?? "Statut mis à jour",
    note: texte(note, 500),
  });

  revalidatePath("/tableau-de-bord");
  revalidatePath(`/tableau-de-bord/${dossierId}`);
}

export async function supprimerDossier(dossierId: string) {
  const supabase = await creerClientServeur();
  if (!supabase) return;

  // La suppression partait sans vérifier qui la demandait : elle ne reposait
  // que sur la politique RLS. Celle-ci fait son travail, mais une suppression
  // est irréversible — elle mérite sa propre vérification.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !estUuid(dossierId)) return;

  await supabase.from("dossiers").delete().eq("id", dossierId).eq("user_id", user.id);
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
  if (!user || !estUuid(changementId)) return;
  await supabase.from("alertes_vues").insert({ user_id: user.id, changement_id: changementId });
  revalidatePath("/tableau-de-bord");
}

export type EtatAdhesion = {
  erreur?: string;
  ok?: boolean;
  /** Communication structurée à indiquer sur le virement. */
  communication?: string;
  montant?: number;
};

/**
 * Enregistre une demande d'adhésion et lui attribue sa référence de paiement.
 *
 * L'ancienne version posait un drapeau sur le profil et promettait un e-mail
 * avec les coordonnées bancaires. Deux problèmes. D'abord, la personne restait
 * les bras ballants : elle ne pouvait pas payer tout de suite. Ensuite, et
 * surtout, rien ne reliait le virement reçu à son auteur — le rapprochement se
 * faisait sur le nom du donneur d'ordre, ce qui échoue dès que c'est
 * l'employeur ou le conjoint qui paie.
 *
 * Chaque demande reçoit donc sa communication structurée, fabriquée en base.
 * C'est l'identifiant que la banque restitue tel quel sur l'extrait de compte.
 */
export async function demanderAdhesion(formule: string): Promise<EtatAdhesion> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  if (!(FORMULES_PAYANTES as readonly string[]).includes(formule)) {
    return { erreur: "Formule inconnue." };
  }

  if (!(await consommerJeton("adhesion", user.id))) {
    return { erreur: messageQuotaAtteint("adhesion") };
  }

  // Une demande en attente pour la même formule est réutilisée plutôt que
  // dupliquée : sinon un double clic produit deux références de paiement, et
  // l'association reçoit un virement qu'elle ne sait plus rattacher.
  const { data: existante } = await supabase
    .from("adhesions")
    .select("communication, montant")
    .eq("user_id", user.id)
    .eq("formule", formule)
    .eq("statut", "en_attente")
    .order("demandee_le", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existante) {
    await supabase.from("profiles").update({ plan_demande: formule }).eq("id", user.id);
    revalidatePath("/adherer");
    return {
      ok: true,
      communication: existante.communication as string,
      montant: Number(existante.montant),
    };
  }

  const { data, error } = await supabase
    .from("adhesions")
    // `communication` est obligatoire en base et remplie par un déclencheur :
    // la chaîne vide déclenche sa fabrication.
    .insert({
      user_id: user.id,
      formule,
      montant: planById(formule).prixAnnuel,
      communication: "",
    })
    .select("communication, montant")
    .single();

  if (error) return { erreur: "La demande n'a pas pu être enregistrée. Réessayez." };

  // Le profil garde la trace de la formule demandée, pour l'affichage.
  await supabase.from("profiles").update({ plan_demande: formule }).eq("id", user.id);

  revalidatePath("/adherer");
  revalidatePath("/tableau-de-bord");
  return {
    ok: true,
    communication: data.communication as string,
    montant: Number(data.montant),
  };
}

/**
 * Enregistre la lettre rédigée dans le module « Rédiger ma lettre ».
 *
 * La lettre est rattachée au dossier : on la retrouve dans sa fiche, et le
 * dossier passe au statut « lettre prête », ce qui fait remonter la bonne
 * prochaine action sur le tableau de bord (envoyer, plutôt que rédiger).
 */
export async function enregistrerLettre({
  dossierId,
  lettre,
  motif,
  explication,
}: {
  dossierId: string;
  lettre: string;
  motif: string;
  explication: string;
}): Promise<{ erreur?: string; ok?: boolean }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };
  if (!estUuid(dossierId)) return { erreur: "Ce dossier est introuvable." };

  const { data: avant } = await supabase
    .from("dossiers")
    .select("statut, lettre")
    .eq("id", dossierId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!avant) return { erreur: "Ce dossier est introuvable." };

  // On ne fait pas reculer un dossier déjà envoyé ou clôturé.
  const fige = ["contestation_envoyee", "en_attente_reponse", "accepte", "rejete", "clos"];
  const statut = fige.includes(avant.statut as string) ? (avant.statut as string) : "a_contester";

  const { error } = await supabase
    .from("dossiers")
    .update({
      lettre: lettre.slice(0, 20000),
      motif: texte(motif, 80),
      explication: texte(explication, 4000),
      statut,
    })
    .eq("id", dossierId)
    .eq("user_id", user.id);

  if (error) return { erreur: "La lettre n'a pas pu être enregistrée. Réessayez." };

  await supabase.from("evenements").insert({
    dossier_id: dossierId,
    user_id: user.id,
    type: "lettre",
    titre: avant.lettre ? "Lettre de contestation mise à jour" : "Lettre de contestation rédigée",
    note: "Il reste à l'envoyer par le canal indiqué sur votre courrier, et à garder une preuve.",
  });

  revalidatePath("/tableau-de-bord");
  revalidatePath(`/tableau-de-bord/${dossierId}`);
  return { ok: true };
}
