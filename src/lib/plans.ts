/**
 * Formules d'adhésion.
 *
 * Aucun encaissement n'est branché pour l'instant : l'adhésion se demande
 * depuis le site et se confirme hors ligne par l'association. La structure
 * (identifiant, prix, quota) est prête pour un branchement Stripe ultérieur,
 * qui n'aura qu'à renseigner `stripePriceId`.
 */

export type PlanId = "gratuit" | "membre" | "independant" | "societe";

export type Plan = {
  id: PlanId;
  nom: string;
  pour: string;
  prixAnnuel: number;
  /** null = illimité */
  quotaContestations: number | null;
  avantages: string[];
  miseEnAvant?: boolean;
  /** À remplir le jour où Stripe est branché. */
  stripePriceId?: string;
};

export const PLANS: Plan[] = [
  {
    id: "gratuit",
    nom: "Gratuit",
    pour: "Pour un problème isolé",
    prixAnnuel: 0,
    quotaContestations: 2,
    avantages: [
      "2 contestations au total",
      "Scan automatique de votre document",
      "Lettre de contestation générée",
      "Suivi de vos dossiers en un coup d'œil",
      "Rappel avant chaque échéance",
    ],
  },
  {
    id: "membre",
    nom: "Membre",
    pour: "Pour les particuliers",
    prixAnnuel: 60,
    quotaContestations: null,
    avantages: [
      "Contestations illimitées",
      "Jusqu'à 2 véhicules",
      "Relecture de votre lettre par l'association",
      "Alertes quand le règlement de votre commune change",
      "Réponse prioritaire au téléphone et par e-mail",
    ],
    miseEnAvant: true,
  },
  {
    id: "independant",
    nom: "Indépendant",
    pour: "Pour les indépendants et les professions libérales",
    prixAnnuel: 400,
    quotaContestations: null,
    avantages: [
      "Tout ce que comprend la formule Membre",
      "Jusqu'à 5 véhicules",
      "Facture établie au nom de votre activité",
      "Traitement prioritaire des dossiers",
      "Accompagnement téléphonique dédié",
    ],
  },
  {
    id: "societe",
    nom: "Société",
    pour: "Pour les entreprises et les flottes",
    prixAnnuel: 800,
    quotaContestations: null,
    avantages: [
      "Tout ce que comprend la formule Indépendant",
      "Flotte de véhicules illimitée",
      "Plusieurs utilisateurs sur un même compte",
      "Facturation entreprise et récapitulatif annuel",
      "Interlocuteur dédié au sein de l'association",
    ],
  },
];

export const planById = (id: string | null | undefined): Plan =>
  PLANS.find((p) => p.id === id) ?? PLANS[0];

export const formatPrix = (montant: number) =>
  montant === 0 ? "Gratuit" : `${montant} €`;

/** Vrai lorsque l'utilisateur a épuisé son quota et doit adhérer. */
export function quotaAtteint(planId: string | null | undefined, contestationsUtilisees: number): boolean {
  const quota = planById(planId).quotaContestations;
  return quota !== null && contestationsUtilisees >= quota;
}

/** Nombre de contestations restantes, ou null si illimité. */
export function contestationsRestantes(
  planId: string | null | undefined,
  contestationsUtilisees: number,
): number | null {
  const quota = planById(planId).quotaContestations;
  if (quota === null) return null;
  return Math.max(0, quota - contestationsUtilisees);
}
