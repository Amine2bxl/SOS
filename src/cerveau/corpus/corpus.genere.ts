/**
 * Corpus de l'association — FICHIER GÉNÉRÉ, ne pas modifier à la main.
 *
 * Produit par `node scripts/ingerer-savoir.mjs` à partir des documents déposés
 * dans `savoir/sources/`. Voir `src/cerveau/corpus/README.md`.
 *
 * Ce fichier n'est importé que par du code serveur : le corpus n'est jamais
 * envoyé au navigateur. Seuls des extraits, en réponse à une question, le sont.
 */

export type PassageCorpus = {
  id: string;
  /** Titre du passage : intertitre du document, ou nom du fichier. */
  titre: string;
  texte: string;
  /** Document d'origine. */
  source: string;
};

export const CORPUS: PassageCorpus[] = [];
