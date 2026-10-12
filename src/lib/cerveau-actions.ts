"use server";

/**
 * Les portes d'entrée du moteur SOS.
 *
 * Le moteur vit sur le serveur ; le navigateur lui parle par ces actions. Ce
 * qui voyage : des faits (dates, montant, commune, réponses aux questions),
 * jamais le document lui-même, qui reste sur l'appareil de l'utilisateur.
 *
 * Tout ce qui arrive ici est fabriqué par le client, donc suspect : chaque
 * champ est vérifié et borné avant d'atteindre le moteur (`nettoyerFaits`).
 */

import { headers } from "next/headers";
import { creerClientServeur } from "@/lib/supabase/server";
import { consommerJeton, messageQuotaAtteint } from "@/lib/limites";
import {
  analyser,
  composerLettre,
  rechercherSavoir,
  type Analyse,
  type Faits,
  type Identite,
  type Langue,
  type LettreComposee,
  type Region,
  type ReponseSavoir,
  type Stade,
  type TypeLettre,
} from "@/cerveau";

const REGIONS_VALIDES: Region[] = ["bruxelles", "wallonie", "flandre"];
const STADES_VALIDES: Stade[] = [
  "notification",
  "premier_rappel",
  "deuxieme_rappel",
  "mise_en_demeure",
  "contrainte",
  "courrier_huissier",
];
const TYPES_LETTRE: TypeLettre[] = [
  "contestation",
  "relance",
  "reponse_huissier",
  "demande_preuves",
  "remboursement",
];
const QUESTIONS_VALIDES = [
  "paiement",
  "carte",
  "vehicule",
  "signalisation",
  "tentative_paiement",
  "duree",
  "courrier_initial",
  "deja_conteste",
  "deja_paye",
  "doublon",
] as const;

const texte = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

const dateIso = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

/** Ramène des faits venus du navigateur à ce que le moteur accepte. */
function nettoyerFaits(brut: unknown): Faits {
  const f = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
  const reponsesBrutes = (f.reponses && typeof f.reponses === "object" ? f.reponses : {}) as Record<string, unknown>;

  const reponses: Faits["reponses"] = {};
  for (const id of QUESTIONS_VALIDES) {
    const v = reponsesBrutes[id];
    if (typeof v === "string" && /^[a-z_]{1,24}$/.test(v)) reponses[id] = v;
  }

  const montant =
    typeof f.montant === "number" && Number.isFinite(f.montant) && f.montant >= 0 && f.montant <= 100000
      ? f.montant
      : null;

  return {
    region: REGIONS_VALIDES.includes(f.region as Region) ? (f.region as Region) : null,
    commune: texte(f.commune, 60),
    crediteur: texte(f.crediteur, 80),
    stade: STADES_VALIDES.includes(f.stade as Stade) ? (f.stade as Stade) : "notification",
    montant,
    dateConstat: dateIso(f.dateConstat),
    heureConstat: typeof f.heureConstat === "string" && /^\d{2}:\d{2}$/.test(f.heureConstat) ? f.heureConstat : null,
    dateEnvoi: dateIso(f.dateEnvoi),
    dateEcheance: dateIso(f.dateEcheance),
    plaque: texte(f.plaque, 20),
    lieu: texte(f.lieu, 120),
    zone: texte(f.zone, 30),
    reference: texte(f.reference, 60),
    communication: texte(f.communication, 30),
    langueDocument: f.langueDocument === "nl" ? "nl" : f.langueDocument === "fr" ? "fr" : null,
    reponses,
  };
}

/** Adresse IP du visiteur, pour limiter le débit des appels anonymes. */
async function ipVisiteur(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "inconnue";
}

export type ResultatAnalyse = { analyse?: Analyse; erreur?: string };

/**
 * Analyse d'un dossier.
 *
 * Ouverte aux visiteurs non connectés : c'est l'analyse instantanée de la page
 * d'accueil. Elle ne renvoie que des conclusions ; la rédaction de la lettre,
 * elle, demande un compte.
 */
export async function analyserFaits(faitsBruts: unknown): Promise<ResultatAnalyse> {
  if (!(await consommerJeton("analyse", await ipVisiteur()))) {
    return { erreur: messageQuotaAtteint("analyse") };
  }
  return { analyse: analyser(nettoyerFaits(faitsBruts)) };
}

export type ResultatLettre = { lettre?: LettreComposee; erreur?: string };

/** Rédaction d'une lettre. Réservée aux membres connectés. */
export async function redigerLettre(entree: {
  type: string;
  langue: string;
  faits: unknown;
  identite: Partial<Identite>;
  moyens?: string[];
  explication?: string;
  datePremiereContestation?: string | null;
  ibanRemboursement?: string | null;
}): Promise<ResultatLettre> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Connectez-vous pour obtenir votre lettre." };

  if (!(await consommerJeton("lettre", user.id))) {
    return { erreur: messageQuotaAtteint("lettre") };
  }

  const type = TYPES_LETTRE.includes(entree.type as TypeLettre) ? (entree.type as TypeLettre) : "contestation";
  const langue: Langue = entree.langue === "nl" ? "nl" : "fr";
  const i = entree.identite ?? {};

  const lettre = composerLettre({
    type,
    langue,
    faits: nettoyerFaits(entree.faits),
    identite: {
      prenom: texte(i.prenom, 60) ?? "",
      nom: texte(i.nom, 60) ?? "",
      adresse: texte(i.adresse, 120) ?? "",
      codePostal: texte(i.codePostal, 10) ?? "",
      ville: texte(i.ville, 60) ?? "",
      email: texte(i.email, 120) ?? user.email ?? "",
      telephone: texte(i.telephone, 30) ?? "",
    },
    moyens: Array.isArray(entree.moyens)
      ? entree.moyens.filter((m): m is string => typeof m === "string").slice(0, 20)
      : undefined,
    explication: texte(entree.explication, 3000) ?? undefined,
    datePremiereContestation: dateIso(entree.datePremiereContestation),
    ibanRemboursement: texte(entree.ibanRemboursement, 40),
  });

  return { lettre };
}

export type ResultatQuestion = { reponses?: ReponseSavoir[]; erreur?: string };

/** « Demandez à SOS » : une question en langage courant, des réponses de la base. */
export async function demanderSos(question: string): Promise<ResultatQuestion> {
  const q = texte(question, 300);
  if (!q) return { reponses: [] };
  if (!(await consommerJeton("question", await ipVisiteur()))) {
    return { erreur: messageQuotaAtteint("question") };
  }
  return { reponses: rechercherSavoir(q, 5) };
}
