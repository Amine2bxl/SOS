/**
 * Le moteur SOS — point d'entrée.
 *
 * Ce module n'est importé que par du code serveur (Server Actions, routes
 * d'API). La base de connaissances, les paragraphes de lettre et le corpus de
 * l'association restent donc sur nos serveurs : le navigateur ne reçoit que
 * des résultats. Le document de l'utilisateur, lui, ne quitte jamais son
 * appareil — la lecture se fait chez lui, et seuls les faits utiles (dates,
 * montant, commune, réponses) voyagent.
 */

import { CORPUS } from "./corpus/corpus.genere";
import { FICHES, type Fiche } from "./base/savoir";
import { IndexRecherche } from "./moteur/recherche";

export { analyser, calculerDelai, evaluerMoyens } from "./moteur/analyse";
export { composerLettre, titreLettre, typeLettreConseille } from "./moteur/lettres";
export type { OptionsLettre, LettreComposee } from "./moteur/lettres";
export { questionsAPoser, QUESTIONS } from "./base/questions";
export { REGIONS, LIBELLES_STADE } from "./base/regions";
export { MOYENS } from "./base/moyens";
export { genererIcs } from "./moteur/agenda";
export type * from "./types";

/** Les fiches et le corpus, indexés une seule fois par instance de serveur. */
let index: IndexRecherche<Fiche & { texte: string }> | null = null;

function obtenirIndex() {
  if (index) return index;
  const fiches = FICHES.map((f) => ({ ...f, texte: `${f.reponse} ${f.texte ?? ""}` }));
  const passages = CORPUS.map(
    (p): Fiche & { texte: string } => ({
      id: `corpus-${p.id}`,
      titre: p.titre,
      reponse: (p.texte.match(/^.+?[.!?](\s|$)/)?.[0] ?? p.texte).trim(),
      texte: p.texte,
      categorie: "corpus",
      source: p.source,
    }),
  );
  index = new IndexRecherche([...fiches, ...passages]);
  return index;
}

export type ReponseSavoir = {
  id: string;
  titre: string;
  reponse: string;
  extrait: string;
  categorie: Fiche["categorie"];
  source?: string;
  pertinence: number;
};

/**
 * Répond à une question en langage courant.
 *
 * La pertinence est ramenée entre 0 et 1 par rapport au meilleur résultat :
 * l'interface peut ainsi n'afficher que ce qui répond vraiment, plutôt qu'une
 * liste où le cinquième résultat n'a plus rien à voir.
 */
export function rechercherSavoir(question: string, limite = 5): ReponseSavoir[] {
  const resultats = obtenirIndex().rechercher(question, limite);
  const max = resultats[0]?.score ?? 1;
  return resultats
    .map((r) => ({
      id: r.document.id,
      titre: r.document.titre,
      reponse: r.document.reponse,
      extrait: r.extrait,
      categorie: r.document.categorie,
      source: r.document.source,
      pertinence: Math.round((r.score / max) * 100) / 100,
    }))
    .filter((r) => r.pertinence >= 0.25);
}

/** Taille de la base, pour l'afficher honnêtement. */
export function tailleBase(): { fiches: number; passagesCorpus: number } {
  return { fiches: FICHES.length, passagesCorpus: CORPUS.length };
}
