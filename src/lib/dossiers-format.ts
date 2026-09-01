/**
 * Types, libellés et formatage des dossiers.
 *
 * Ce module ne contient aucune dépendance serveur : il peut donc être importé
 * aussi bien par un composant client que par un composant serveur. Les
 * requêtes à la base vivent dans `dossiers.ts`, qui lui n'est utilisable que
 * côté serveur.
 */

export type Dossier = {
  id: string;
  user_id: string;
  reference: string | null;
  type_document: string;
  autorite: string | null;
  commune: string | null;
  plaque: string | null;
  montant: number | null;
  date_constat: string | null;
  heure_constat: string | null;
  date_echeance: string | null;
  /** Date d'envoi du courrier : le délai de contestation court depuis elle. */
  date_envoi: string | null;
  lieu_constat: string | null;
  zone: string | null;
  communication: string | null;
  iban: string | null;
  statut: string;
  motif: string | null;
  explication: string | null;
  lettre: string | null;
  ocr_confiance: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type Evenement = {
  id: string;
  dossier_id: string;
  type: string;
  titre: string;
  note: string | null;
  date_evenement: string;
};

export type Profil = {
  id: string;
  email: string | null;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  commune: string | null;
  plan: string;
  plan_demande: string | null;
};

export type Alerte = {
  id: string;
  commune_slug: string | null;
  titre: string;
  resume: string;
  importance: string;
  publie_le: string;
};

export const STATUTS: Record<string, { label: string; ton: "neutre" | "attention" | "ok" | "risque" }> = {
  nouveau: { label: "À traiter", ton: "attention" },
  a_contester: { label: "Lettre prête", ton: "attention" },
  contestation_envoyee: { label: "Contestation envoyée", ton: "neutre" },
  en_attente_reponse: { label: "En attente de réponse", ton: "neutre" },
  accepte: { label: "Annulée", ton: "ok" },
  rejete: { label: "Rejetée", ton: "risque" },
  clos: { label: "Clôturé", ton: "neutre" },
};

export const TYPES_DOCUMENT: Record<string, string> = {
  notification: "Notification initiale",
  premier_rappel: "Premier rappel",
  deuxieme_rappel: "Deuxième rappel",
  mise_en_demeure: "Mise en demeure",
  contrainte: "Contrainte",
  courrier_huissier: "Courrier d'huissier",
};

/** Jours restants avant l'échéance ; négatif si la date est passée. */
export function joursAvantEcheance(dateEcheance: string | null): number | null {
  if (!dateEcheance) return null;
  const echeance = new Date(dateEcheance + "T00:00:00Z").getTime();
  const maintenant = new Date();
  const debutJour = Date.UTC(
    maintenant.getUTCFullYear(),
    maintenant.getUTCMonth(),
    maintenant.getUTCDate(),
  );
  return Math.round((echeance - debutJour) / 86_400_000);
}

export const formatMontant = (m: number | null) =>
  m === null ? "—" : m.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });

export const formatDate = (d: string | null) =>
  d ? new Date(d + (d.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("fr-BE") : "—";

/**
 * La prochaine chose à faire sur un dossier.
 *
 * C'est le cœur de la valeur du tableau de bord : un utilisateur ne veut pas
 * lire un statut, il veut savoir quoi faire maintenant. La règle combine le
 * statut du dossier et le temps qui reste, l'urgence primant toujours sur
 * l'étape théorique — un délai raté ne se rattrape pas.
 */
export type ProchaineAction = {
  /** Ce qu'il faut faire, à l'impératif. */
  action: string;
  /** Pourquoi maintenant, en une ligne. */
  raison: string;
  lien: string;
  libelleLien: string;
  ton: "urgent" | "attention" | "neutre" | "termine";
};

export function prochaineAction(
  dossier: Pick<Dossier, "id" | "statut" | "date_echeance" | "lettre">,
): ProchaineAction {
  const jours = joursAvantEcheance(dossier.date_echeance);
  const fiche = `/tableau-de-bord/${dossier.id}`;
  const lettre = `/tableau-de-bord/lettre?dossier=${dossier.id}`;

  if (dossier.statut === "accepte")
    return {
      action: "Rien à faire",
      raison: "La contestation a été acceptée : le dossier est clos en votre faveur.",
      lien: fiche,
      libelleLien: "Revoir le dossier",
      ton: "termine",
    };

  if (dossier.statut === "clos")
    return {
      action: "Rien à faire",
      raison: "Ce dossier est clôturé.",
      lien: fiche,
      libelleLien: "Revoir le dossier",
      ton: "termine",
    };

  if (dossier.statut === "rejete")
    return {
      action: "Décider de la suite",
      raison: "La contestation a été rejetée. Faites-nous relire le dossier avant de payer.",
      lien: fiche,
      libelleLien: "Ouvrir le dossier",
      ton: "attention",
    };

  const envoye = dossier.statut === "contestation_envoyee" || dossier.statut === "en_attente_reponse";

  // Un délai dépassé passe devant tout le reste — sauf si la contestation est
  // déjà partie, auquel cas le délai a été tenu.
  if (jours !== null && jours < 0 && !envoye)
    return {
      action: "Nous contacter sans attendre",
      raison: `Le délai indiqué sur le courrier est dépassé depuis ${-jours} jour${-jours > 1 ? "s" : ""}. Il reste souvent une voie.`,
      lien: fiche,
      libelleLien: "Ouvrir le dossier",
      ton: "urgent",
    };

  if (envoye)
    return {
      action: "Attendre la réponse",
      raison: "Votre contestation est partie. Sans réponse d'ici un mois, relancez l'autorité.",
      lien: fiche,
      libelleLien: "Voir le suivi",
      ton: "neutre",
    };

  if (dossier.statut === "a_contester" || dossier.lettre)
    return {
      action: "Envoyer votre contestation",
      raison:
        jours !== null && jours <= 7
          ? `Votre lettre est prête et il ne reste que ${jours} jour${jours > 1 ? "s" : ""}.`
          : "Votre lettre est prête : il ne manque que l'envoi et la preuve de dépôt.",
      lien: fiche,
      libelleLien: "Reprendre le dossier",
      ton: jours !== null && jours <= 7 ? "urgent" : "attention",
    };

  return {
    action: "Rédiger votre contestation",
    raison:
      jours !== null && jours <= 7
        ? `Il ne reste que ${jours} jour${jours > 1 ? "s" : ""} avant la date limite.`
        : "Le dossier est enregistré : il faut maintenant écrire la lettre.",
    lien: lettre,
    libelleLien: "Rédiger ma lettre",
    ton: jours !== null && jours <= 7 ? "urgent" : "attention",
  };
}
