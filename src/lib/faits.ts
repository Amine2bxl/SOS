/**
 * Les faits d'un dossier, sous la forme que le moteur SOS attend.
 *
 * Deux sources, deux fonctions :
 *  - `nettoyerFaits` : ce qui arrive du navigateur, donc suspect. Chaque champ
 *    est vérifié et borné ; ce qui ne ressemble à rien est écarté.
 *  - `faitsDepuisDossier` : ce qui est déjà en base, donc fiable, remis en
 *    forme pour l'analyse.
 *
 * Module pur, partagé par les actions serveur.
 */

import type { Faits, Region, Stade } from "@/cerveau/types";
import type { Dossier } from "@/lib/dossiers-format";

export const REGIONS_VALIDES: Region[] = ["bruxelles", "wallonie", "flandre"];

export const STADES_VALIDES: Stade[] = [
  "notification",
  "premier_rappel",
  "deuxieme_rappel",
  "mise_en_demeure",
  "contrainte",
  "courrier_huissier",
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

/** Ne garde que les réponses aux questions connues, aux valeurs plausibles. */
export function nettoyerReponses(brut: unknown): Record<string, string> {
  const r = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
  const sortie: Record<string, string> = {};
  for (const id of QUESTIONS_VALIDES) {
    const v = r[id];
    if (typeof v === "string" && /^[a-z_]{1,24}$/.test(v)) sortie[id] = v;
  }
  return sortie;
}

/** Ramène des faits venus du navigateur à ce que le moteur accepte. */
export function nettoyerFaits(brut: unknown): Faits {
  const f = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
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
    reponses: nettoyerReponses(f.reponses),
  };
}

/** Les faits d'un dossier déjà enregistré. */
export function faitsDepuisDossier(d: Dossier): Faits {
  return {
    region: REGIONS_VALIDES.includes(d.region as Region) ? (d.region as Region) : null,
    commune: d.commune,
    crediteur: d.crediteur ?? d.autorite,
    stade: STADES_VALIDES.includes(d.type_document as Stade) ? (d.type_document as Stade) : "notification",
    montant: d.montant,
    dateConstat: d.date_constat,
    heureConstat: d.heure_constat,
    dateEnvoi: d.date_envoi,
    dateEcheance: d.date_echeance,
    plaque: d.plaque,
    lieu: d.lieu_constat,
    zone: d.zone,
    reference: d.reference,
    communication: d.communication,
    langueDocument: d.langue === "nl" ? "nl" : "fr",
    reponses: nettoyerReponses(d.reponses),
  };
}
