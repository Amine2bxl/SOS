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
import { analyser, type Faits } from "@/cerveau";
import { faitsDepuisDossier, nettoyerFaits, nettoyerReponses, REGIONS_VALIDES } from "@/lib/faits";
import { messageHorsPerimetre, regionOuverte } from "@/lib/perimetre";
import type { Dossier } from "@/lib/dossiers-format";

export type EtatDossier = { erreur?: string; quotaAtteint?: boolean };

/**
 * Ce que l'assistant envoie après le scan : les champs lus sur le courrier et
 * confirmés par l'utilisateur, la région, et ses réponses aux questions.
 */
export type NouveauDossier = {
  reference: string;
  typeDocument: string;
  crediteur: string;
  commune: string;
  region: string;
  langue: string;
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
  reponses: Record<string, string>;
  ocrTexte: string;
  ocrConfiance: Record<string, string>;
};

const texte = (v: string | undefined | null, max: number) =>
  (v ?? "").trim().slice(0, max) || null;

/** Une date n'est acceptée qu'au format ISO : la base refuserait le reste. */
const dateIso = (v: string | null | undefined) =>
  v && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null;

/** Les faits du dossier, tels que le moteur les lit, depuis la saisie. */
function faitsDeLaSaisie(saisie: NouveauDossier): Faits {
  return nettoyerFaits({
    region: saisie.region,
    commune: saisie.commune,
    crediteur: saisie.crediteur,
    stade: saisie.typeDocument,
    montant: nombreOuNull(saisie.montant, { min: 0, max: 100000 }),
    dateConstat: saisie.dateConstat,
    heureConstat: saisie.heureConstat,
    dateEnvoi: saisie.dateEnvoi,
    dateEcheance: saisie.dateEcheance,
    plaque: saisie.plaque?.toUpperCase(),
    lieu: saisie.lieuConstat,
    zone: saisie.zone,
    reference: saisie.reference,
    communication: saisie.communication,
    langueDocument: saisie.langue,
    reponses: saisie.reponses,
  });
}

/**
 * Crée le dossier — et son analyse.
 *
 * L'analyse est refaite ici, sur le serveur, à partir des faits nettoyés :
 * celle que le navigateur a affichée n'est jamais crue sur parole. Son
 * instantané est conservé avec le dossier, pour qu'on sache toujours ce qui
 * avait été conseillé et pourquoi, même si la base de savoir évolue.
 */
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
  // ferait échouer l'insertion sur une contrainte de la base ; `nettoyerFaits`
  // le ramène à la valeur neutre plutôt que de montrer une erreur technique à
  // quelqu'un qui vient de scanner son courrier.
  const faits = faitsDeLaSaisie(saisie);
  // Une région pas encore ouverte (voir `lib/perimetre.ts`) : pas de dossier,
  // une orientation vers l'association.
  if (faits.region && !regionOuverte(faits.region)) return { erreur: messageHorsPerimetre(faits.region) };
  const analyse = analyser(faits);
  const stade = (TYPES_DOCUMENT as readonly string[]).includes(faits.stade ?? "")
    ? (faits.stade as string)
    : "notification";

  const { data, error } = await supabase
    .from("dossiers")
    .insert({
      user_id: user.id,
      reference: faits.reference,
      type_document: stade,
      autorite: faits.crediteur,
      crediteur: faits.crediteur,
      commune: faits.commune,
      region: faits.region,
      langue: faits.langueDocument ?? "fr",
      plaque: faits.plaque,
      montant: faits.montant,
      date_constat: faits.dateConstat,
      heure_constat: faits.heureConstat,
      date_echeance: faits.dateEcheance,
      date_envoi: faits.dateEnvoi,
      lieu_constat: faits.lieu,
      zone: faits.zone,
      communication: faits.communication,
      iban: texte(saisie.iban, 40),
      reponses: faits.reponses,
      moyens_retenus: analyse.moyens.map((m) => m.id),
      analyse_moteur: analyse,
      // Le texte brut est conservé pour que l'utilisateur puisse revérifier ce
      // qui avait été lu sur son document. Un déclencheur en base lui pose une
      // date d'effacement : c'est de la donnée personnelle, elle ne reste pas
      // indéfiniment (voir supabase/migrations/…_duree_de_vie_texte_ocr.sql).
      ocr_texte: (saisie.ocrTexte ?? "").slice(0, 20000) || null,
      ocr_confiance: saisie.ocrConfiance ?? {},
    })
    .select("id")
    .single();

  if (error) {
    // Le plafond est appliqué par un déclencheur en base : il remonte ici.
    if (error.message.includes("QUOTA_GRATUIT_ATTEINT")) {
      return {
        quotaAtteint: true,
        erreur:
          "Vos 2 contestations offertes sont utilisées. Adhérez à l'association pour ouvrir de nouveaux dossiers, sans limite.",
      };
    }
    return { erreur: "Le dossier n'a pas pu être enregistré. Réessayez." };
  }

  await supabase.from("evenements").insert({
    dossier_id: data.id,
    user_id: user.id,
    type: "creation",
    titre: "Dossier ouvert",
    note: `${analyse.stadeLibelle} analysé : ${analyse.strategie.titre.toLowerCase()}.`,
  });

  revalidatePath("/tableau-de-bord");
  return { id: data.id as string };
}

/**
 * Met à jour les faits d'un dossier (une réponse ajoutée, une date corrigée)
 * et refait son analyse.
 */
export async function corrigerDossier(
  dossierId: string,
  modifications: { reponses?: Record<string, string>; region?: string; dateEnvoi?: string; dateEcheance?: string },
): Promise<{ erreur?: string; ok?: boolean }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };
  if (!estUuid(dossierId)) return { erreur: "Ce dossier est introuvable." };

  const { data: avant } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", dossierId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!avant) return { erreur: "Ce dossier est introuvable." };

  const dossier = avant as Dossier;
  const faits = faitsDepuisDossier(dossier);
  const reponses = { ...faits.reponses, ...nettoyerReponses(modifications.reponses) };
  const region = REGIONS_VALIDES.find((r) => r === modifications.region) ?? faits.region ?? null;
  const dateEnvoi = modifications.dateEnvoi !== undefined ? dateIso(modifications.dateEnvoi) : faits.dateEnvoi;
  const dateEcheance =
    modifications.dateEcheance !== undefined ? dateIso(modifications.dateEcheance) : faits.dateEcheance;

  const analyse = analyser({ ...faits, reponses, region, dateEnvoi, dateEcheance });

  const { error } = await supabase
    .from("dossiers")
    .update({
      reponses,
      region,
      date_envoi: dateEnvoi,
      date_echeance: dateEcheance,
      moyens_retenus: analyse.moyens.map((m) => m.id),
      analyse_moteur: analyse,
    })
    .eq("id", dossierId)
    .eq("user_id", user.id);
  if (error) return { erreur: "La modification n'a pas pu être enregistrée. Réessayez." };

  revalidatePath(`/tableau-de-bord/${dossierId}`);
  revalidatePath("/tableau-de-bord");
  return { ok: true };
}

/**
 * Range une lettre dans le dossier.
 *
 * Chaque version est gardée dans `lettres`, datée ; la dernière est aussi
 * recopiée dans le dossier, pour l'affichage rapide. Une contestation fait
 * passer le dossier à « lettre prête » — sauf s'il est déjà plus loin : on ne
 * fait jamais reculer un dossier envoyé ou clôturé.
 */
export async function enregistrerLettreDossier({
  dossierId,
  type,
  langue,
  contenu,
}: {
  dossierId: string;
  type: string;
  langue: string;
  contenu: string;
}): Promise<{ erreur?: string; ok?: boolean }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };
  if (!estUuid(dossierId)) return { erreur: "Ce dossier est introuvable." };

  const typeValide = TYPES_LETTRE.includes(type) ? type : "contestation";
  const langueValide = langue === "nl" ? "nl" : "fr";
  const corps = (contenu ?? "").slice(0, 30000);
  if (corps.trim().length < 40) return { erreur: "La lettre est vide." };

  const { data: avant } = await supabase
    .from("dossiers")
    .select("statut")
    .eq("id", dossierId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!avant) return { erreur: "Ce dossier est introuvable." };

  const { error: erreurLettre } = await supabase.from("lettres").insert({
    dossier_id: dossierId,
    user_id: user.id,
    type: typeValide,
    langue: langueValide,
    contenu: corps,
  });
  if (erreurLettre) return { erreur: "La lettre n'a pas pu être enregistrée. Réessayez." };

  const fige = ["contestation_envoyee", "en_attente_reponse", "accepte", "rejete", "clos"];
  const statut = fige.includes(avant.statut as string) ? (avant.statut as string) : "a_contester";

  await supabase
    .from("dossiers")
    .update({ lettre: corps.slice(0, 20000), statut, langue: langueValide })
    .eq("id", dossierId)
    .eq("user_id", user.id);

  await supabase.from("evenements").insert({
    dossier_id: dossierId,
    user_id: user.id,
    type: "lettre",
    titre: `${TITRES_LETTRE[typeValide] ?? "Lettre"} prête`,
    note: "Il reste à l'envoyer par le canal indiqué sur votre courrier, et à garder la preuve de l'envoi.",
  });

  revalidatePath("/tableau-de-bord");
  revalidatePath(`/tableau-de-bord/${dossierId}`);
  return { ok: true };
}

/**
 * « J'ai envoyé ma contestation. »
 *
 * La date d'envoi déclenche le suivi : c'est d'elle que court l'attente de la
 * réponse, et c'est elle que la relance citera.
 */
export async function marquerContestationEnvoyee(
  dossierId: string,
  date: string,
): Promise<{ erreur?: string; ok?: boolean }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };
  if (!estUuid(dossierId)) return { erreur: "Ce dossier est introuvable." };

  const jour = dateIso(date);
  if (!jour) return { erreur: "Indiquez la date d'envoi." };
  const t = Date.parse(`${jour}T00:00:00Z`);
  if (t > Date.now() + 86_400_000) return { erreur: "La date d'envoi ne peut pas être dans le futur." };

  const { error } = await supabase
    .from("dossiers")
    .update({ statut: "contestation_envoyee", date_envoi_contestation: jour })
    .eq("id", dossierId)
    .eq("user_id", user.id);
  if (error) return { erreur: "L'envoi n'a pas pu être noté. Réessayez." };

  await supabase.from("evenements").insert({
    dossier_id: dossierId,
    user_id: user.id,
    type: "statut",
    titre: "Contestation envoyée",
    note: "Gardez la preuve de l'envoi. Sans réponse dans un mois, nous préparons la relance.",
    date_evenement: `${jour}T12:00:00Z`,
  });

  revalidatePath("/tableau-de-bord");
  revalidatePath(`/tableau-de-bord/${dossierId}`);
  return { ok: true };
}

/** Coche ou décoche une pièce de la liste « à rassembler ». */
export async function basculerPiece(dossierId: string, piece: string, reunie: boolean) {
  const supabase = await creerClientServeur();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !estUuid(dossierId)) return;

  const nom = texte(piece, 200);
  if (!nom) return;

  const { data } = await supabase
    .from("dossiers")
    .select("pieces_reunies")
    .eq("id", dossierId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return;

  const actuelles = new Set<string>((data.pieces_reunies as string[] | null) ?? []);
  if (reunie) actuelles.add(nom);
  else actuelles.delete(nom);

  await supabase
    .from("dossiers")
    .update({ pieces_reunies: [...actuelles].slice(0, 40) })
    .eq("id", dossierId)
    .eq("user_id", user.id);

  revalidatePath(`/tableau-de-bord/${dossierId}`);
}

const TYPES_LETTRE = ["contestation", "relance", "reponse_huissier", "demande_preuves", "remboursement"];

const TITRES_LETTRE: Record<string, string> = {
  contestation: "Lettre de contestation",
  relance: "Lettre de relance",
  reponse_huissier: "Réponse à l'huissier",
  demande_preuves: "Demande des photos du contrôle",
  remboursement: "Demande d'arrêt et de remboursement",
};

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
