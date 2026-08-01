import type { Dossier } from "@/db/schema";
import { labelOf, MOTIFS, DOCUMENTS } from "@/lib/constants";

export type Status = "ok" | "partial" | "risk" | "info";

export interface AuditCategory {
  key: string;
  label: string;
  status: Status;
  detail: string;
}

export interface AuditPoint {
  title: string;
  detail: string;
}

export interface AuditResult {
  score: number;
  label: string;
  categories: AuditCategory[];
  favorables: AuditPoint[];
  administration: AuditPoint[];
  aVerifier: AuditPoint[];
  vigilance: AuditPoint[];
  piecesManquantes: string[];
  demandes: string[];
  confiance: "A" | "B" | "C" | "D" | "E";
  confianceLabel: string;
  recommandation: string;
  niveauDocumentaire: string;
}

const has = (arr: string[] | undefined | null, v: string) =>
  Array.isArray(arr) && arr.includes(v);

const parseDate = (v?: string) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

export function computeAudit(d: Dossier): AuditResult {
  const chrono = d.chronologie ?? {};
  const pieces = d.pieces ?? [];
  const auditDoc = d.auditDoc ?? {
    inventaire: {},
    techniques: [],
    administratives: [],
    juridiques: [],
    donnees: [],
    demandes: [],
  };
  const motif = d.motifPrincipal ?? "";
  const doc = d.documentRecu ?? "";

  const categories: AuditCategory[] = [];
  const favorables: AuditPoint[] = [];
  const administration: AuditPoint[] = [];
  const aVerifier: AuditPoint[] = [];
  const vigilance: AuditPoint[] = [];
  const piecesManquantes: string[] = [];

  let score = 48;

  // 1. Paiement / autorisation
  const paiementMotifs = ["paiement_effectue", "session_active", "app_defaillante", "horodateur_hs", "erreur_plaque"];
  const autorisationMotifs = ["carte_riverain", "carte_pro", "carte_pmr", "vehicule_remplacement"];
  const preuvePaiement = has(pieces, "preuve_paiement") || has(pieces, "releve_bancaire");
  const preuveApp = has(pieces, "capture_application");
  const preuveAutorisation = has(pieces, "carte_autorisation") || has(pieces, "document_pro");

  if (paiementMotifs.includes(motif)) {
    if (preuvePaiement && preuveApp) {
      score += 16;
      categories.push({ key: "paiement", label: "Paiement et session", status: "ok", detail: "Preuve de paiement fournie et concordante avec une capture d'application." });
      favorables.push({ title: "Paiement concordant", detail: "Un reçu et une capture d'application soutiennent le motif invoqué." });
    } else if (preuvePaiement || preuveApp) {
      score += 9;
      categories.push({ key: "paiement", label: "Paiement et session", status: "partial", detail: "Preuve partielle : la plaque, la zone ou l'horodatage restent à confirmer." });
      aVerifier.push({ title: "Concordance paiement / constat", detail: "Vérifier que la preuve indique la bonne plaque, la bonne zone et une plage horaire couvrant le constat." });
      piecesManquantes.push("Reçu mentionnant la plaque et la zone exactes");
    } else {
      score -= 8;
      categories.push({ key: "paiement", label: "Paiement et session", status: "risk", detail: "Motif de paiement invoqué sans preuve concordante au dossier." });
      administration.push({ title: "Argument non soutenu par une pièce", detail: "Le motif de paiement n'est accompagné d'aucun reçu ni capture." });
      piecesManquantes.push("Preuve de paiement ou relevé bancaire");
      piecesManquantes.push("Captures horodatées de l'application");
    }
  } else if (autorisationMotifs.includes(motif)) {
    if (preuveAutorisation) {
      score += 14;
      categories.push({ key: "paiement", label: "Autorisation ou carte", status: "ok", detail: "Une carte ou autorisation valable est jointe au dossier." });
      favorables.push({ title: "Autorisation valable", detail: `Le motif « ${labelOf(MOTIFS, motif)} » est soutenu par une pièce.` });
    } else {
      score -= 4;
      categories.push({ key: "paiement", label: "Autorisation ou carte", status: "partial", detail: "Carte ou autorisation invoquée mais non jointe au dossier." });
      piecesManquantes.push("Copie de la carte ou de l'autorisation valable à la date du constat");
    }
  } else if (motif) {
    if (pieces.length > 0) {
      score += 6;
      categories.push({ key: "paiement", label: "Motif invoqué", status: "partial", detail: "Le motif déclaré est soutenu par au moins une pièce ; sa concordance doit être vérifiée." });
    } else {
      score -= 6;
      categories.push({ key: "paiement", label: "Motif invoqué", status: "risk", detail: "Aucune pièce ne soutient encore le motif déclaré." });
      piecesManquantes.push("Pièce soutenant le motif : " + labelOf(MOTIFS, motif));
    }
  } else {
    categories.push({ key: "paiement", label: "Motif invoqué", status: "info", detail: "Aucun motif principal renseigné à ce stade." });
    aVerifier.push({ title: "Motif à préciser", detail: "Sélectionner le motif principal pour orienter l'analyse." });
  }

  // 2. Notification
  const notifDispo = chrono["notif_dispo"];
  if (notifDispo === "oui") {
    score += 6;
    categories.push({ key: "notification", label: "Notification initiale", status: "ok", detail: "La notification initiale est disponible au dossier." });
  } else if (notifDispo === "non") {
    score -= 2;
    categories.push({ key: "notification", label: "Notification initiale", status: "partial", detail: "La preuve d'envoi de la notification initiale n'a pas été fournie." });
    aVerifier.push({ title: "Preuve d'envoi à demander", detail: "Demander à l'autorité la preuve et la date d'expédition de la notification initiale." });
    piecesManquantes.push("Preuve d'envoi de la notification initiale");
  } else {
    categories.push({ key: "notification", label: "Notification initiale", status: "info", detail: "Disponibilité de la notification non renseignée ; mode de réception à confirmer." });
    piecesManquantes.push("Notification initiale complète");
  }

  // 3. Chronologie
  const seq: [string, string][] = [
    ["date_constat", "Constat"],
    ["notif_date", "Notification"],
    ["rappel1_date", "Premier rappel"],
    ["rappel2_date", "Deuxième rappel"],
    ["mise_en_demeure_date", "Mise en demeure"],
    ["contrainte_date", "Contrainte"],
    ["huissier_date", "Courrier d'huissier"],
  ];
  let lastTs: number | null = null;
  let lastLabel = "";
  let incoherente = false;
  let manquante = false;
  const filled = seq.filter(([k]) => parseDate(chrono[k]) !== null);
  for (const [k, lbl] of seq) {
    const ts = parseDate(chrono[k]);
    if (ts === null) {
      if (k === "date_constat") manquante = true;
      continue;
    }
    if (lastTs !== null && ts < lastTs) {
      incoherente = true;
      vigilance.push({ title: "Ordre chronologique incohérent", detail: `${lbl} est daté avant ${lastLabel}. Cet écart doit être expliqué ou documenté.` });
    }
    lastTs = ts;
    lastLabel = lbl;
  }
  if (incoherente) {
    score -= 10;
    categories.push({ key: "chronologie", label: "Délais de procédure", status: "risk", detail: "Une incohérence de dates a été détectée dans la frise chronologique." });
  } else if (manquante || filled.length === 0) {
    score -= 4;
    categories.push({ key: "chronologie", label: "Délais de procédure", status: "partial", detail: "Date du constat ou dates clés manquantes : impossible de vérifier les délais." });
    piecesManquantes.push("Date exacte du constat et dates des courriers");
    aVerifier.push({ title: "Délai à vérifier", detail: "Compléter les dates pour contrôler les délais applicables à chaque stade." });
  } else {
    score += 10;
    categories.push({ key: "chronologie", label: "Délais de procédure", status: "ok", detail: "Les délais légaux semblent respectés à ce stade." });
    favorables.push({ title: "Chronologie précise", detail: "Les dates renseignées forment une séquence cohérente." });
  }

  // Rappel pendant contestation
  const contestationTs = parseDate(chrono["contestation_date"]);
  const rappel1Ts = parseDate(chrono["rappel1_date"]);
  const rappel2Ts = parseDate(chrono["rappel2_date"]);
  if (contestationTs !== null && (rappel1Ts === null ? false : (rappel1Ts! > contestationTs) || (rappel2Ts !== null && rappel2Ts! > contestationTs))) {
    const reponseFond = chrono["contestation_reponse_fond"];
    if (reponseFond !== "oui") {
      score += 8;
      favorables.push({ title: "Rappel émis pendant l'examen d'une contestation", detail: "Un rappel a été émis alors qu'une contestation était pendante sans réponse sur le fond." });
      aVerifier.push({ title: "Poursuite du recouvrement pendant l'examen", detail: "Demander la suspension du recouvrement pendant l'examen de la contestation." });
    }
  }

  // 4. Constat technique
  if (has(pieces, "photos_lieu")) {
    score += 5;
    categories.push({ key: "constat", label: "Preuve du constat (scan-car)", status: "partial", detail: "Photos du lieu présentes. Métadonnées et clichés originaux à demander." });
    piecesManquantes.push("Photographies originales et métadonnées du contrôle");
  } else {
    categories.push({ key: "constat", label: "Preuve du constat (scan-car)", status: "partial", detail: "Aucune photo de la signalisation ou du constat fournie ; clichés et journal technique à demander." });
    piecesManquantes.push("Photographies complètes du lieu et de la signalisation");
    piecesManquantes.push("Journaux horodatés du scan-car");
    piecesManquantes.push("Rapport de constat et journal du scan-car");
  }

  // 5. Procédure / contestation
  const conteste = contestationTs !== null || auditDoc.inventaire?.["contestation"] === "present";
  const accuse = has(pieces, "accuse_reception") || chrono["contestation_accuse"] === "oui";
  const reponseFond2 = chrono["contestation_reponse_fond"];
  if (conteste && accuse && reponseFond2 === "non") {
    score += 9;
    favorables.push({ title: "Contestation restée sans réponse individualisée", detail: "Un accusé de réception existe mais aucune réponse sur le fond n'a été communiquée." });
    categories.push({ key: "procedure", label: "Procédure", status: "ok", detail: "Contestation enregistrée ; arguments non traités à ce jour." });
  } else if (conteste) {
    score += 4;
    categories.push({ key: "procedure", label: "Procédure", status: "partial", detail: "Une contestation a été introduite ; la portée de la réponse reçue doit être analysée." });
  } else {
    categories.push({ key: "procedure", label: "Procédure", status: "info", detail: "Aucune contestation enregistrée à ce stade." });
  }

  // 6. Frais & stade de recouvrement
  const stadeAvance = ["mise_en_demeure", "contrainte", "courrier_huissier", "mesure_execution"].includes(doc);
  if (stadeAvance) {
    score -= 6;
    categories.push({ key: "frais", label: "Frais réclamés", status: "risk", detail: "Indemnité ou frais demandés à un stade avancé sans base légale prouvée au dossier." });
    vigilance.push({ title: "Fondement des frais non communiqué", detail: "Demander le fondement réglementaire des majorations et frais ajoutés." });
    piecesManquantes.push("Règlement communal ou régional applicable à la date du constat");
    piecesManquantes.push("Détail du calcul des montants réclamés");
    if (doc === "courrier_huissier" || doc === "mesure_execution" || doc === "contrainte") {
      vigilance.push({ title: "Stade de recouvrement avancé", detail: `Document reçu : ${labelOf(DOCUMENTS, doc)}. Vérifier sans délai les voies et délais de recours.` });
    }
  } else {
    score += 6;
    categories.push({ key: "frais", label: "Frais réclamés", status: "ok", detail: "Calcul cohérent en apparence au stade actuel ; aucune mesure de recouvrement forcée à ce jour." });
  }

  // 7. Recouvrement / huissier
  if (doc === "courrier_huissier" || doc === "mesure_execution") {
    categories.push({ key: "recouvrement", label: "Recouvrement / Huissier", status: "risk", detail: "Intervention d'un huissier ou mesure d'exécution en cours." });
    score -= 6;
  } else if (doc === "contrainte") {
    categories.push({ key: "recouvrement", label: "Recouvrement / Huissier", status: "partial", detail: "Une contrainte a été émise ; vérifier si elle a été signifiée et les recours possibles." });
  } else {
    score += 5;
    categories.push({ key: "recouvrement", label: "Recouvrement / Huissier", status: "ok", detail: "Aucune mesure de recouvrement forcé à ce jour." });
  }

  // 8. Motivation / décision
  if (doc === "decision_rejet") {
    if (has(pieces, "decision_rejet")) {
      categories.push({ key: "motivation", label: "Motivation de la décision", status: "partial", detail: "Décision de rejet au dossier : vérifier si la motivation est individualisée." });
      piecesManquantes.push("Motivation individualisée et identité du signataire");
    }
  } else {
    score += 3;
    categories.push({ key: "motivation", label: "Motivation de la décision", status: "ok", detail: "Le document reçu contient les mentions obligatoires apparentes." });
  }

  // Score bounds
  score = Math.max(8, Math.min(96, score));

  const label =
    score >= 75 ? "Dossier solide"
    : score >= 55 ? "Arguments sérieux"
    : score >= 35 ? "Vérifications nécessaires"
    : "Dossier fragile";

  // Niveau documentaire
  const nbPieces = pieces.length;
  const niveauDocumentaire =
    nbPieces >= 6 ? "Dossier complet"
    : nbPieces >= 3 ? "Dossier partiellement complet"
    : nbPieces >= 1 ? "Pièces importantes manquantes"
    : "Aucune pièce déposée pour l'instant";

  // Confiance
  const confiance: AuditResult["confiance"] =
    score >= 80 && nbPieces >= 4 ? "A"
    : score >= 65 && nbPieces >= 2 ? "B"
    : score >= 50 ? "C"
    : score >= 35 ? "D"
    : "E";
  const confianceLabels: Record<string, string> = {
    A: "Niveau A — pratiquement certain",
    B: "Niveau B — très solide",
    C: "Niveau C — argument sérieux mais discuté",
    D: "Niveau D — vérifications indispensables",
    E: "Niveau E — aucune conclusion fiable",
  };

  // Demandes recommandées
  const demandes = new Set<string>(auditDoc.demandes ?? []);
  demandes.add("communication_dossier");
  demandes.add("photos");
  demandes.add("motivation");
  if (stadeAvance) {
    demandes.add("suspension");
    demandes.add("gel_frais");
    demandes.add("non_transmission");
  }
  demandes.add("non_reconnaissance");
  demandes.add("reserve_droits");
  if (favorables.some((f) => f.title.includes("Paiement") || f.title.includes("Autorisation"))) {
    demandes.add("annulation");
  } else {
    demandes.add("reexamen");
  }

  const recommandation =
    score >= 55
      ? "Au regard des documents déposés, une contestation motivée accompagnée d'une demande de communication des pièces et d'une demande de suspension du recouvrement apparaît justifiée."
      : "Les éléments actuels ne suffisent pas à soutenir une demande d'annulation. La plateforme recommande d'obtenir les photographies et l'historique administratif avant de conclure.";

  // dé-duplication
  const dedup = (arr: string[]) => [...new Set(arr)];

  return {
    score,
    label,
    categories,
    favorables,
    administration,
    aVerifier,
    vigilance,
    piecesManquantes: dedup(piecesManquantes),
    demandes: [...demandes],
    confiance,
    confianceLabel: confianceLabels[confiance],
    recommandation,
    niveauDocumentaire,
  };
}
