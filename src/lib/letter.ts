import type { Dossier } from "@/db/schema";
import type { AuditResult } from "@/lib/audit";
import { DEMANDES, labelOf, MOTIFS, formatDate } from "@/lib/constants";

export interface GeneratedLetter {
  typeLabel: string;
  objet: string;
  destinataire: string;
  adresse: string[];
  canal: string;
  delai: string;
  body: string;
  piecesJointes: string[];
  demandes: string[];
}

export function generateLetter(d: Dossier, audit: AuditResult): GeneratedLetter {
  const commune = d.communeConstat || "la commune du constat";
  const operateur = d.autorite || "parking.brussels";
  const ref = d.refRedevance || d.ref || "réf. à compléter";
  const today = new Date().toLocaleDateString("fr-BE");

  const motifLabel = labelOf(MOTIFS, d.motifPrincipal);
  const demandes = audit.demandes.map((k) => labelOf(DEMANDES, k));

  const faits = (d.faits || "").trim();

  const chronologieLignes: string[] = [];
  const c = d.chronologie ?? {};
  const push = (date: string | undefined, lbl: string) => {
    if (date) chronologieLignes.push(`- ${formatDate(date)} : ${lbl}`);
  };
  push(c["date_constat"], `constat de stationnement (${c["rue"] ? c["rue"] + ", " : ""}${commune})`);
  push(c["notif_date"], "notification initiale");
  push(c["rappel1_date"], "premier rappel");
  push(c["rappel2_date"], "deuxième rappel");
  push(c["mise_en_demeure_date"], "mise en demeure");
  push(c["contrainte_date"], "contrainte");
  push(c["huissier_date"], "courrier d'huissier");
  push(c["contestation_date"], "contestation introduite par mes soins");

  const demandesBloc = demandes.map((x) => `- ${x}`).join("\n");

  const body = [
    `${d.prenom || "[Prénom]"} ${d.nom || "[Nom]"}`,
    d.adresse || "[Adresse complète]",
    `${d.codePostal || "[CP]"} ${d.communeResidence || "[Commune]"}`,
    d.email ? `Courriel : ${d.email}` : "",
    d.telephone ? `Tél. : ${d.telephone}` : "",
    "",
    `À l'attention de ${operateur}`,
    "Service Réclamations",
    commune !== "la commune du constat" ? `Commune : ${commune}` : "",
    "",
    `${commune === "la commune du constat" ? "" : ""}Le ${today}`,
    "",
    `Objet : Contestation de redevance de stationnement – Référence ${ref}${c["date_constat"] ? ` – Constat du ${formatDate(c["date_constat"])}` : ""}`,
    "",
    "Madame, Monsieur,",
    "",
    `Je soussigné(e) ${d.prenom || "[Prénom]"} ${d.nom || "[Nom]"}, conteste par la présente la redevance de stationnement référencée ${ref}${d.plaque ? `, relative au véhicule immatriculé ${d.plaque}` : ""}, pour le motif suivant : ${motifLabel}.`,
    "",
    "FAITS",
    faits || "[Décrivez ici les faits dans l'ordre chronologique, avec les heures et les éléments constatés. Distinguez ce que vous avez constaté de ce que vous supposez.]",
    "",
    "CHRONOLOGIE",
    chronologieLignes.length ? chronologieLignes.join("\n") : "- [Compléter la chronologie des documents reçus]",
    "",
    "À l'appui de ma contestation, je joins les éléments de preuve disponibles démontrant ma bonne foi et la nécessité d'un examen complet du dossier.",
    "",
    "DEMANDES",
    "À l'appui de ma contestation, je formule les demandes suivantes :",
    demandesBloc,
    "",
    "Je vous prie de bien vouloir m'accuser réception de la présente et me communiquer votre décision motivée, individualisée et signée par l'autorité compétente, dans le respect des voies et délais de recours applicables.",
    "",
    "La présente contestation ne constitue en aucune manière une reconnaissance de dette. Tous mes droits et moyens demeurent expressément réservés.",
    "",
    "Dans cette attente, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    "",
    `${d.prenom || "[Prénom]"} ${d.nom || "[Nom]"}  —  signature`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return {
    typeLabel: "Contestation + Demande de pièces + Suspension du recouvrement",
    objet: `Contestation redevance ${ref}`,
    destinataire: `${operateur} – Service Réclamations`,
    adresse: [
      `À l'attention de ${operateur}`,
      "Service Réclamations",
      commune !== "la commune du constat" ? commune : "[Adresse officielle à vérifier sur le document reçu]",
    ],
    canal: "Formulaire en ligne (recommandé) + E-mail + Courrier postal",
    delai: "Vérifiez le délai et le canal à utiliser sur le document reçu (souvent 14 à 30 jours à partir de la réception).",
    body,
    piecesJointes: (d.pieces ?? []).map((p) => p),
    demandes,
  };
}
