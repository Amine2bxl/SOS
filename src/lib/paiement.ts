import "server-only";
import { ASSO } from "@/lib/data";
import { ibanValide, formaterIban } from "@/lib/iban";

/**
 * Coordonnées de paiement de l'association.
 *
 * L'adhésion se règle par virement sur le compte de l'ASBL. Le numéro de compte
 * n'est **pas** écrit dans ce dépôt : il est lu depuis la variable
 * d'environnement `IBAN_ASSOCIATION`. Deux raisons, et la seconde est la vraie.
 *
 * 1. Il peut changer sans qu'on redéploie le site.
 * 2. Un IBAN affiché par erreur, ou inventé pour « avoir quelque chose à
 *    montrer », enverrait de l'argent sur un compte qui n'est pas celui de
 *    l'association. Tant que la variable n'est pas renseignée, l'écran de
 *    paiement affiche la référence et propose de demander les coordonnées —
 *    ce qui est plus lent, mais jamais faux.
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
  const brut = process.env.IBAN_ASSOCIATION?.trim();
  if (!brut || !ibanValide(brut)) return null;

  return {
    iban: formaterIban(brut),
    bic: process.env.BIC_ASSOCIATION?.trim() || undefined,
    beneficiaire: ASSO.nom,
  };
}
