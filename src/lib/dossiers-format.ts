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
  /** Région du constat : elle décide du délai et de la langue de la lettre. */
  region: string | null;
  /** Organisme qui réclame la somme. */
  crediteur: string | null;
  langue: string;
  /** Réponses aux questions du moteur. */
  reponses: Record<string, string>;
  /** Moyens de défense retenus pour la lettre. */
  moyens_retenus: string[];
  /** Instantané de l'analyse au moment de la création du dossier. */
  analyse_moteur: Record<string, unknown> | null;
  /** Date d'envoi de la contestation : elle déclenche le suivi et la relance. */
  date_envoi_contestation: string | null;
  /** Pièces déjà rassemblées par l'utilisateur. */
  pieces_reunies: string[];
  created_at: string;
  updated_at: string;
};

export type Lettre = {
  id: string;
  dossier_id: string;
  type: string;
  langue: string;
  contenu: string;
  created_at: string;
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
  /** `urgent` déclenche une fenêtre modale ; le reste, un encadré. */
  importance: string;
  publie_le: string;
  /** Texte officiel qui fait foi : toujours proposé à la lecture. */
  source_url: string | null;
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
 * C'est le cœur de la valeur de l'accueil : on ne veut pas lire un statut, on
 * veut savoir quoi faire maintenant. La règle combine le statut du dossier et
 * le temps qui reste, l'urgence primant toujours sur l'étape théorique — un
 * délai raté ne se rattrape pas.
 *
 * Le délai vient du moteur quand on l'a (il connaît le délai de contestation
 * de la région, souvent plus court que la date imprimée) ; à défaut, de la
 * date limite lue sur le courrier.
 */
export type ProchaineAction = {
  /** Ce qu'il faut faire, à l'impératif. */
  action: string;
  /** Pourquoi maintenant, en une ligne. */
  raison: string;
  lien: string;
  libelleLien: string;
  ton: "urgent" | "attention" | "neutre" | "termine";
  /** Jours restants avant la date qui compte, quand on la connaît. */
  jours: number | null;
};

/** Au-delà, une contestation sans réponse mérite une relance. */
export const JOURS_AVANT_RELANCE = 30;

/** Jours écoulés depuis une date ISO (0 aujourd'hui). */
export function joursDepuis(dateIso: string | null): number | null {
  const j = joursAvantEcheance(dateIso);
  return j === null ? null : -j;
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export function prochaineAction(
  dossier: Pick<Dossier, "id" | "statut" | "date_echeance" | "lettre"> & {
    date_envoi_contestation?: string | null;
  },
  delai?: { limite: string | null } | null,
): ProchaineAction {
  const jours = joursAvantEcheance(delai?.limite ?? dossier.date_echeance);
  const fiche = `/tableau-de-bord/${dossier.id}`;

  if (dossier.statut === "accepte")
    return {
      action: "Rien à faire",
      raison: "La contestation a été acceptée : le dossier est clos en votre faveur.",
      lien: fiche,
      libelleLien: "Revoir le dossier",
      ton: "termine",
      jours: null,
    };

  if (dossier.statut === "clos")
    return {
      action: "Rien à faire",
      raison: "Ce dossier est clôturé.",
      lien: fiche,
      libelleLien: "Revoir le dossier",
      ton: "termine",
      jours: null,
    };

  if (dossier.statut === "rejete")
    return {
      action: "Décider de la suite",
      raison: "La contestation a été rejetée. Avant de payer, regardez les options : il en reste souvent une.",
      lien: `${fiche}#suivi`,
      libelleLien: "Voir les options",
      ton: "attention",
      jours,
    };

  const envoye = dossier.statut === "contestation_envoyee" || dossier.statut === "en_attente_reponse";

  if (envoye) {
    const depuis = joursDepuis(dossier.date_envoi_contestation ?? null);
    if (depuis !== null && depuis >= JOURS_AVANT_RELANCE)
      return {
        action: "Relancer l'administration",
        raison: `Aucune réponse depuis ${pluriel(depuis, "jour")} : une relance écrite, aujourd'hui, protège votre dossier.`,
        lien: `${fiche}#lettre`,
        libelleLien: "Préparer la relance",
        ton: "attention",
        jours: null,
      };
    return {
      action: "Attendre la réponse",
      raison:
        depuis !== null
          ? `Contestation envoyée il y a ${pluriel(depuis, "jour")}. Sans réponse à ${JOURS_AVANT_RELANCE} jours, nous préparons la relance.`
          : "Votre contestation est partie. Sans réponse d'ici un mois, nous préparons la relance.",
      lien: `${fiche}#suivi`,
      libelleLien: "Voir le suivi",
      ton: "neutre",
      jours: null,
    };
  }

  // Un délai dépassé passe devant tout le reste — et la réponse n'est pas de
  // baisser les bras : un courrier tardif peut encore être examiné, et il fige
  // la position avant le recouvrement.
  if (jours !== null && jours < 0)
    return {
      action: "Contester aujourd'hui",
      raison: `Le délai est dépassé depuis ${pluriel(-jours, "jour")}. Un courrier tardif peut encore être examiné : envoyez-le sans attendre.`,
      lien: `${fiche}#lettre`,
      libelleLien: "Ouvrir ma lettre",
      ton: "urgent",
      jours,
    };

  const serre = jours !== null && jours <= 7;

  if (dossier.statut === "a_contester" || dossier.lettre)
    return {
      action: "Envoyer votre contestation",
      raison: serre
        ? `Votre lettre est prête et il ne reste que ${pluriel(jours!, "jour")}.`
        : "Votre lettre est prête : il ne manque que l'envoi et la preuve de dépôt.",
      lien: `${fiche}#lettre`,
      libelleLien: "Envoyer ma lettre",
      ton: serre ? "urgent" : "attention",
      jours,
    };

  return {
    action: "Préparer votre lettre",
    raison: serre
      ? `Il ne reste que ${pluriel(jours!, "jour")} avant la date limite.`
      : "Le dossier est analysé : votre lettre est prête à être relue.",
    lien: `${fiche}#lettre`,
    libelleLien: "Voir ma lettre",
    ton: serre ? "urgent" : "attention",
    jours,
  };
}
