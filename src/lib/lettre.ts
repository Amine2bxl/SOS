/**
 * Construction de la lettre de contestation.
 *
 * Partagé par l'outil public (accessible sans compte) et par le suivi de
 * dossier, pour qu'une amélioration de la lettre profite aux deux.
 */

import { MOTIFS, DEMANDES_STANDARD } from "@/lib/data";

export type SaisieLettre = {
  prenom: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  reference: string;
  plaque: string;
  dateConstat: string;
  communeConstat: string;
  montant: string;
  motif: string;
  explication: string;
};

export const SAISIE_VIDE: SaisieLettre = {
  prenom: "", nom: "", adresse: "", codePostal: "", ville: "", email: "",
  reference: "", plaque: "", dateConstat: "", communeConstat: "", montant: "",
  motif: "paiement", explication: "",
};

/** Les champs non remplis restent visibles entre crochets, à compléter. */
const ou = (valeur: string, repere: string) => (valeur.trim() ? valeur.trim() : `[${repere}]`);

const formatDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-BE");
};

export function construireLettre(f: SaisieLettre): string {
  const motif = MOTIFS.find((m) => m.value === f.motif) ?? MOTIFS[0];
  const aujourdhui = new Date().toLocaleDateString("fr-BE");
  const nomComplet = `${ou(f.prenom, "Prénom")} ${ou(f.nom, "Nom")}`;
  const reference = ou(f.reference, "référence figurant sur votre courrier");

  const lignes: (string | null)[] = [
    nomComplet,
    ou(f.adresse, "Rue et numéro"),
    `${ou(f.codePostal, "Code postal")} ${ou(f.ville, "Commune")}`,
    f.email.trim() ? `Courriel : ${f.email.trim()}` : "",
    "",
    "Service des réclamations",
    f.communeConstat
      ? `Commune du constat : ${f.communeConstat}`
      : "[Destinataire indiqué sur votre courrier]",
    "",
    `Le ${aujourdhui}`,
    "",
    `Objet : Contestation de la redevance de stationnement — Référence ${reference}`,
    "",
    "Madame, Monsieur,",
    "",
    `Je soussigné(e) ${nomComplet} conteste par la présente la redevance de stationnement référencée ${reference}${
      f.plaque.trim() ? `, relative au véhicule immatriculé ${f.plaque.trim().toUpperCase()}` : ""
    }${f.dateConstat ? `, pour un constat daté du ${formatDate(f.dateConstat)}` : ""}${
      f.montant.trim() ? `, d'un montant réclamé de ${f.montant.trim()} €` : ""
    }.`,
    "",
    "EXPOSÉ DES FAITS",
    motif.argument,
    f.explication.trim() ? "" : null,
    f.explication.trim() ? f.explication.trim() : null,
    "",
    "DEMANDES",
    "Au vu de ce qui précède, je sollicite :",
    ...DEMANDES_STANDARD.map((d, i) => `${i + 1}. ${d}`),
    "",
    "La présente contestation ne constitue en aucune manière une reconnaissance de dette. Tous mes droits et moyens demeurent expressément réservés.",
    "",
    "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    "",
    "",
    nomComplet,
    "(signature)",
    "",
    "ANNEXES",
    ...motif.pieces.map((p) => `— ${p}`),
    "— Copie du courrier reçu",
  ];

  return lignes.filter((l) => l !== null).join("\n");
}
