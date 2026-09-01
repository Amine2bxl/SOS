/**
 * Construction de la lettre de contestation.
 *
 * La lettre doit se suffire à elle-même : le service qui la reçoit doit
 * pouvoir identifier le dossier, le véhicule, le lieu et le moment du constat
 * sans rien avoir à demander. Chaque champ ajouté ici l'a été parce qu'un
 * formulaire officiel le réclame — voir `contestation.ts`, qui vérifie que
 * rien ne manque avant l'envoi.
 */

import { MOTIFS, DEMANDES_STANDARD } from "./data";

export type SaisieLettre = {
  /* Identité du requérant */
  prenom: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;

  /* Le véhicule */
  plaque: string;
  marqueVehicule: string;
  /** Rempli seulement si le véhicule n'est pas immatriculé au nom du requérant. */
  titulaireAutre: string;

  /* Le constat */
  reference: string;
  communication: string;
  dateConstat: string;
  heureConstat: string;
  lieuConstat: string;
  communeConstat: string;
  zone: string;
  montant: string;
  dateEcheance: string;

  /* La contestation */
  motif: string;
  explication: string;
  /** L'utilisateur a déjà payé et demande le remboursement. */
  dejaPaye: boolean;
  ibanRemboursement: string;
};

export const SAISIE_VIDE: SaisieLettre = {
  prenom: "", nom: "", adresse: "", codePostal: "", ville: "", email: "", telephone: "",
  plaque: "", marqueVehicule: "", titulaireAutre: "",
  reference: "", communication: "", dateConstat: "", heureConstat: "", lieuConstat: "",
  communeConstat: "", zone: "", montant: "", dateEcheance: "",
  motif: "paiement", explication: "", dejaPaye: false, ibanRemboursement: "",
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

  // Le moment du constat, en une phrase, aussi précis que possible.
  const moment = [
    f.dateConstat ? `le ${formatDate(f.dateConstat)}` : null,
    f.heureConstat ? `à ${f.heureConstat.replace(":", "h")}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const lieu = [
    f.lieuConstat.trim() || null,
    f.communeConstat.trim() ? `à ${f.communeConstat.trim()}` : null,
    f.zone.trim() ? `(zone ${f.zone.trim().toLowerCase()})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const lignes: (string | null)[] = [
    nomComplet,
    ou(f.adresse, "Rue et numéro"),
    `${ou(f.codePostal, "Code postal")} ${ou(f.ville, "Commune")}`,
    f.email.trim() ? `Courriel : ${f.email.trim()}` : "",
    f.telephone.trim() ? `Téléphone : ${f.telephone.trim()}` : "",
    "",
    "Service des réclamations",
    f.communeConstat
      ? `Commune du constat : ${f.communeConstat}`
      : "[Destinataire indiqué sur votre courrier]",
    "",
    `Le ${aujourdhui}`,
    "",
    `Objet : Contestation de la redevance de stationnement — Référence ${reference}`,
    f.communication.trim() ? `Communication structurée : ${f.communication.trim()}` : null,
    "",
    "Madame, Monsieur,",
    "",
    // Phrase d'identification : tout ce qui permet de retrouver le dossier.
    `Je soussigné(e) ${nomComplet} conteste par la présente la redevance de stationnement référencée ${reference}${
      f.plaque.trim() ? `, relative au véhicule immatriculé ${f.plaque.trim().toUpperCase()}` : ""
    }${f.marqueVehicule.trim() ? ` (${f.marqueVehicule.trim()})` : ""}${
      moment ? `, pour un constat dressé ${moment}` : ""
    }${lieu ? `, ${lieu}` : ""}${
      f.montant.trim() ? `, d'un montant réclamé de ${f.montant.trim()} €` : ""
    }.`,
    f.titulaireAutre.trim() ? "" : null,
    f.titulaireAutre.trim()
      ? `Je précise que le véhicule est immatriculé au nom de ${f.titulaireAutre.trim()}, et que j'agis en qualité de conducteur au moment des faits.`
      : null,
    f.dateEcheance ? "" : null,
    f.dateEcheance
      ? `La présente contestation est introduite dans le délai indiqué sur le document, dont l'échéance est fixée au ${formatDate(f.dateEcheance)}.`
      : null,
    "",
    "EXPOSÉ DES FAITS",
    motif.argument,
    f.explication.trim() ? "" : null,
    f.explication.trim() ? f.explication.trim() : null,
    "",
    "DEMANDES",
    "Au vu de ce qui précède, je sollicite :",
    ...DEMANDES_STANDARD.map((d, i) => `${i + 1}. ${d}`),
    f.dejaPaye
      ? `${DEMANDES_STANDARD.length + 1}. Le remboursement de la somme déjà acquittée${
          f.ibanRemboursement.trim() ? `, sur le compte ${f.ibanRemboursement.trim()}` : ""
        }.`
      : null,
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
    f.dejaPaye ? "— Preuve du paiement déjà effectué" : null,
  ];

  return lignes.filter((l) => l !== null).join("\n");
}
