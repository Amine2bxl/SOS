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
  date_echeance: string | null;
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
