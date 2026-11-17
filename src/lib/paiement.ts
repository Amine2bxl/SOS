import "server-only";
import { ASSO } from "@/lib/data";
import { ibanValide, formaterIban } from "@/lib/iban";

/**
 * Coordonnées de paiement de l'association.
 *
 * Dons et adhésions se règlent par virement sur le compte de l'ASBL : celui
 * publié dans `ASSO.iban` (vérifié : même titulaire, même numéro
 * d'entreprise), ou celui de la variable `IBAN_ASSOCIATION`, qui l'emporte —
 * pour changer de compte sans toucher au code.
 *
 * Un IBAN affiché par erreur enverrait de l'argent sur un compte qui n'est pas
 * celui de l'association : la clé de contrôle est donc vérifiée à chaque
 * affichage, et un numéro invalide n'est jamais montré.
 *
 * Le format attendu est l'IBAN belge, espaces autorisés : `BE68 5390 0754 7034`.
 */

export type CoordonneesBancaires = {
  iban: string;
  bic?: string;
  beneficiaire: string;
};

/**
 * Les coordonnées à afficher, ou `null` si elles ne sont pas configurées.
 *
 * Un IBAN dont la clé de contrôle est fausse est traité comme absent : mieux
 * vaut demander les coordonnées par e-mail que faire recopier un numéro qui
 * sera refusé par la banque — ou, pire, qui existe et appartient à quelqu'un
 * d'autre.
 */
export function coordonneesBancaires(): CoordonneesBancaires | null {
  const brut = process.env.IBAN_ASSOCIATION?.trim() || ASSO.iban;
  if (!brut || !ibanValide(brut)) return null;

  return {
    iban: formaterIban(brut),
    bic: process.env.BIC_ASSOCIATION?.trim() || undefined,
    beneficiaire: ASSO.nom,
  };
}

/**
 * Le lien de don par carte, quand l'association aura son compte Stripe.
 *
 * Un « lien de paiement » Stripe (montant libre, Bancontact, carte, Apple Pay)
 * se crée en deux minutes dans le tableau de bord Stripe, sans une ligne de
 * code : il suffit de le coller dans `LIEN_DON_CARTE` et le bouton apparaît
 * sur la page de dons. Seules les adresses de Stripe sont acceptées : une
 * faute de frappe ne peut pas envoyer les donateurs n'importe où.
 */
export function lienDonCarte(): string | null {
  const lien = process.env.LIEN_DON_CARTE?.trim();
  if (!lien) return null;
  try {
    const url = new URL(lien);
    return url.protocol === "https:" && (url.hostname === "buy.stripe.com" || url.hostname === "donate.stripe.com") ? url.toString() : null;
  } catch {
    return null;
  }
}
