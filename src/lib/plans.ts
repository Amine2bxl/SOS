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
    pour: "Pour une lettre de temps en temps",
    prixAnnuel: 0,
    quotaContestations: 2,
    avantages: [
      "2 dossiers offerts",
      "Votre lettre vérifiée point par point",
      "Réponse prête, en français ou en néerlandais",
      "Rappels avant chaque date limite",
    ],
  },
  {
    id: "membre",
    nom: "Membre",
    pour: "Pour les particuliers",
    prixAnnuel: 70,
    quotaContestations: null,
    avantages: [
      "Dossiers illimités",
      "Un bénévole relit votre dossier",
      "Alerte quand les règles de votre commune changent",
      "Réponse prioritaire",
      "Jusqu'à 2 véhicules",
    ],
    miseEnAvant: true,
  },
  {
    id: "independant",
    nom: "Indépendant",
    pour: "Pour les indépendants",
    prixAnnuel: 400,
    quotaContestations: null,
    avantages: [
      "Tout ce que contient Membre",
      "Jusqu'à 5 véhicules",
      "Facture au nom de votre activité",
      "Dossiers traités en priorité",
      "Un contact par téléphone",
    ],
  },
  {
    id: "societe",
    nom: "Société",
    pour: "Pour les entreprises",
    prixAnnuel: 800,
    quotaContestations: null,
    avantages: [
      "Tout ce que contient Indépendant",
      "Véhicules illimités",
      "Plusieurs personnes sur un compte",
      "Facture entreprise et bilan annuel",
      "Un interlocuteur dédié",
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
