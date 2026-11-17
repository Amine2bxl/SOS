/**
 * Les versions en vigueur des documents juridiques.
 *
 * Chaque compte accepte une version précise, et la base garde laquelle, et
 * quand (table `consentements`). Changer un document, c'est changer sa version
 * ici : à leur prochaine visite, les membres sont invités à relire et accepter
 * la nouvelle — l'ancienne acceptation reste, comme preuve de ce qui avait été
 * accepté à l'époque.
 */

export const DOCUMENTS_LEGAUX = {
  cgu: {
    version: "CGU-2026-11-16",
    date: "2026-11-16",
    chemin: "/conditions-utilisation",
    titre: "Conditions d'utilisation",
  },
  confidentialite: {
    version: "RGPD-2026-11-16",
    date: "2026-11-16",
    chemin: "/confidentialite",
    titre: "Politique de confidentialité",
  },
} as const;

export type DocumentLegal = keyof typeof DOCUMENTS_LEGAUX;

export const DOCUMENTS_A_ACCEPTER: DocumentLegal[] = ["confidentialite", "cgu"];

/** Les documents dont la version en vigueur n'a pas encore été acceptée. */
export function documentsManquants(acceptes: { document: string; version: string }[]): DocumentLegal[] {
  return DOCUMENTS_A_ACCEPTER.filter(
    (d) => !acceptes.some((a) => a.document === d && a.version === DOCUMENTS_LEGAUX[d].version),
  );
}
