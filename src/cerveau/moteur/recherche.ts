/**
 * « Demandez à SOS » : la recherche dans la base de savoir.
 *
 * Algorithme : BM25, la méthode de classement qui a fait tourner les moteurs
 * de recherche pendant des décennies et reste une référence. Elle mesure à la
 * fois la rareté d'un mot dans la base (un mot rare pèse lourd) et sa
 * fréquence dans une fiche, en corrigeant l'avantage des textes longs.
 *
 * Trois couches pour qu'une question tapée comme on parle trouve la bonne
 * fiche :
 *
 *  1. la NORMALISATION : minuscules, accents retirés, mots vides écartés,
 *     pluriels et terminaisons ramenés à une racine (« contestations » →
 *     « contest ») ;
 *  2. les SYNONYMES, en français et en néerlandais : « deurwaarder » trouve
 *     l'huissier, « PV » trouve la redevance ;
 *  3. le TITRE compte double : une fiche dont le titre répond à la question
 *     passe devant une fiche qui l'évoque en passant.
 *
 * Aucun service extérieur, aucune clé : l'index se construit en mémoire en
 * quelques millisecondes et répond en moins d'une milliseconde.
 */

export type DocumentRecherche = {
  id: string;
  titre: string;
  texte: string;
  /** Mots ajoutés à l'index sans être affichés (synonymes métier, fautes courantes). */
  motsCles?: string[];
};

export type Resultat<D extends DocumentRecherche> = {
  document: D;
  score: number;
  /** La phrase du texte qui répond le mieux à la question. */
  extrait: string;
};

const MOTS_VIDES = new Set(
  (
    // français
    "a au aux avec ce ces cet cette dans de des du elle en et eux il ils je la le les leur lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous y est sont ai as avez avons etre avoir fait faire suis etes plus moins tres comme si quoi quel quelle quels quelles dois doit puis peut peux faut comment pourquoi quand ca cela ceci ete etait avait avais ont aussi tout tous toute deja combien " +
    // néerlandais
    "de het een en van in is op te dat die voor met zijn er niet aan om ook als bij of door over naar uit dan nog wel kan maar wat hoe ik je u mijn uw we wij ze zij hij"
  ).split(" "),
);

/**
 * Familles de synonymes. Le premier mot de chaque famille sert de forme
 * canonique : tous les autres y sont ramenés, à l'indexation comme à la
 * recherche.
 */
const SYNONYMES: string[][] = [
  ["redevance", "retributie", "parkeerretributie", "amende", "boete", "pv", "contravention", "ticket", "prune"],
  ["huissier", "deurwaarder", "gerechtsdeurwaarder"],
  ["contester", "contestation", "betwisten", "betwisting", "bezwaar", "reclamation", "reclamer", "recours", "contest"],
  ["rappel", "herinnering", "aanmaning", "relance"],
  ["demeure", "ingebrekestelling", "sommation"],
  ["contrainte", "dwangbevel"],
  ["riverain", "bewonerskaart", "bewoner", "habitant"],
  ["handicap", "handicape", "pmr", "mindervalide", "invalide", "invalidite"],
  ["delai", "termijn", "echeance", "vervaldatum", "limite", "deadline"],
  ["payer", "paiement", "paye", "betalen", "betaling", "regler"],
  ["photo", "foto", "cliche", "image", "camera"],
  ["plaque", "nummerplaat", "immatriculation", "kenteken"],
  ["application", "app", "sms", "4411", "smartphone", "telephone"],
  ["horodateur", "parkeermeter", "parcmetre", "automate"],
  ["signalisation", "panneau", "bord", "signalisatie", "marquage"],
  ["vendu", "vente", "verkocht", "cede", "cession"],
  ["vole", "vol", "gestolen", "diefstal"],
  ["rgpd", "avg", "gdpr", "donnees", "persoonsgegevens"],
  ["rembourser", "remboursement", "terugbetaling", "terugbetalen"],
];

const CANONIQUE = new Map<string, string>();
for (const famille of SYNONYMES) {
  for (const mot of famille) CANONIQUE.set(mot, famille[0]);
}

/** Retire les accents et la casse. */
export function plier(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Racinisation légère, pensée pour le français et le néerlandais.
 *
 * Volontairement prudente : couper trop court mélange des mots sans rapport
 * (« contrainte » et « contrat »). On retire les terminaisons les plus
 * fréquentes, et on garde au moins quatre lettres.
 */
function raciner(mot: string): string {
  if (mot.length <= 4 || /^\d+$/.test(mot)) return mot;
  const suffixes = [
    "issements", "issement", "ements", "ement", "ations", "ation", "itions", "ition",
    "ances", "ance", "ences", "ence", "ables", "able", "ibles", "ible",
    "euses", "euse", "eurs", "eur", "ives", "ive", "ifs", "if",
    "ingen", "ing", "heden", "heid", "lijk",
    "ees", "ee", "es", "er", "ez", "en", "s", "e",
  ];
  for (const s of suffixes) {
    if (mot.endsWith(s) && mot.length - s.length >= 4) return mot.slice(0, -s.length);
  }
  return mot;
}

export function jetons(texte: string): string[] {
  const sortie: string[] = [];
  for (const brut of plier(texte).split(/[^a-z0-9]+/)) {
    if (!brut || MOTS_VIDES.has(brut)) continue;
    const canonique = CANONIQUE.get(brut);
    if (canonique) {
      sortie.push(canonique);
      continue;
    }
    if (brut.length < 2) continue;
    const racine = raciner(brut);
    // Une racine peut elle-même être un synonyme (« contestations » → « contest »).
    sortie.push(CANONIQUE.get(racine) ?? racine);
  }
  return sortie;
}

type DocIndexe<D extends DocumentRecherche> = {
  document: D;
  frequences: Map<string, number>;
  longueur: number;
  /** Les mots du titre, pour le bonus de correspondance (voir `rechercher`). */
  motsTitre: Set<string>;
};

export class IndexRecherche<D extends DocumentRecherche> {
  private docs: DocIndexe<D>[] = [];
  private frequenceDocumentaire = new Map<string, number>();
  private longueurMoyenne = 0;

  // Paramètres classiques de BM25 : k1 règle la saturation (un mot répété dix
  // fois ne vaut pas dix fois plus), b la correction de longueur.
  private readonly k1 = 1.4;
  private readonly b = 0.75;

  constructor(documents: D[]) {
    let total = 0;
    for (const document of documents) {
      // Le titre est indexé deux fois : il compte double.
      const mots = [
        ...jetons(document.titre),
        ...jetons(document.titre),
        ...jetons(document.texte),
        ...jetons((document.motsCles ?? []).join(" ")),
      ];
      const frequences = new Map<string, number>();
      for (const m of mots) frequences.set(m, (frequences.get(m) ?? 0) + 1);
      for (const m of frequences.keys()) {
        this.frequenceDocumentaire.set(m, (this.frequenceDocumentaire.get(m) ?? 0) + 1);
      }
      this.docs.push({ document, frequences, longueur: mots.length, motsTitre: new Set(jetons(document.titre)) });
      total += mots.length;
    }
    this.longueurMoyenne = this.docs.length ? total / this.docs.length : 0;
  }

  get taille(): number {
    return this.docs.length;
  }

  private idf(mot: string): number {
    const n = this.frequenceDocumentaire.get(mot) ?? 0;
    const N = this.docs.length;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  }

  rechercher(question: string, limite = 5): Resultat<D>[] {
    const termes = Array.from(new Set(jetons(question)));
    if (termes.length === 0) return [];

    const resultats: Resultat<D>[] = [];
    for (const d of this.docs) {
      let score = 0;
      let dansTitre = 0;
      for (const terme of termes) {
        const f = d.frequences.get(terme);
        if (!f) continue;
        const norme = 1 - this.b + this.b * (d.longueur / (this.longueurMoyenne || 1));
        score += this.idf(terme) * ((f * (this.k1 + 1)) / (f + this.k1 * norme));
        if (d.motsTitre.has(terme)) dansTitre += this.idf(terme);
      }
      // Bonus de titre : quand la question reprend les mots du titre d'une
      // fiche, c'est presque toujours la fiche qu'on cherche. Sans lui, une
      // fiche longue qui répond exactement (« Quel est le délai pour
      // contester ? ») passait derrière une fiche courte qui en parle en passant.
      score += 0.8 * dansTitre;
      if (score > 0) resultats.push({ document: d.document, score, extrait: meilleurExtrait(d.document.texte, termes) });
    }

    return resultats.sort((a, b) => b.score - a.score).slice(0, limite);
  }
}

/** La phrase qui contient le plus de termes de la question. */
function meilleurExtrait(texte: string, termes: string[]): string {
  const phrases = texte.match(/[^.!?]+[.!?]*/g) ?? [texte];
  let meilleure = phrases[0] ?? "";
  let meilleurScore = -1;
  for (const phrase of phrases) {
    const mots = new Set(jetons(phrase));
    const score = termes.filter((t) => mots.has(t)).length;
    if (score > meilleurScore) {
      meilleurScore = score;
      meilleure = phrase;
    }
  }
  return meilleure.trim();
}
