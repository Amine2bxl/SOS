/**
 * Où a eu lieu le constat, et dans quelle langue le courrier est écrit.
 *
 * La région décide de presque tout : le délai, la procédure, la langue de la
 * réponse. Elle se lit rarement en toutes lettres sur un courrier ; elle se
 * déduit d'indices qu'on additionne :
 *
 *  - l'organisme (parking.brussels ne réclame qu'à Bruxelles) ;
 *  - le nom d'une commune ou d'une ville, en français ou en néerlandais ;
 *  - les codes postaux, dont les tranches sont fixées par province ;
 *  - la langue du courrier.
 *
 * Un piège guette : le courrier porte aussi l'adresse du DESTINATAIRE, qui
 * peut habiter ailleurs que là où il s'est garé. Un code postal proche des
 * mots « lieu » ou « constat » pèse donc plus lourd qu'un code postal isolé.
 * Et quand les indices se contredisent, le moteur le dit (`certaine: false`) :
 * l'utilisateur confirme d'un geste plutôt que de laisser passer une erreur.
 *
 * Module pur, sans connaissance juridique : il peut tourner dans le navigateur.
 */

import { COMMUNES } from "../../lib/data";
import type { Langue, Region } from "../types";

/** Les 19 communes bruxelloises en néerlandais, quand leur nom diffère du français. */
const BRUXELLES_NL = COMMUNES.filter((c) => c.nl !== c.nom).map((c) => c.nl);

/** Principales villes wallonnes : assez pour reconnaître la plupart des courriers. */
const VILLES_WALLONIE = [
  "Liège", "Namur", "Charleroi", "Mons", "Tournai", "Mouscron", "La Louvière", "Seraing",
  "Verviers", "Arlon", "Wavre", "Ottignies", "Louvain-la-Neuve", "Nivelles", "Waterloo",
  "Braine-l'Alleud", "Huy", "Herstal", "Spa", "Dinant", "Bastogne", "Marche-en-Famenne",
  "Ath", "Soignies", "Binche", "Châtelet", "Gembloux", "Andenne", "Eupen", "Malmedy",
  "Jodoigne", "Tubize", "Rixensart", "Ciney", "Philippeville", "Durbuy", "Fleurus",
  "Waremme", "Hannut", "Visé", "Enghien", "Lessines", "Péruwelz", "Chimay", "Couvin",
];

/** Principales villes flamandes, avec leur nom français quand il est courant. */
const VILLES_FLANDRE = [
  "Antwerpen", "Anvers", "Gent", "Gand", "Brugge", "Bruges", "Leuven", "Louvain",
  "Mechelen", "Malines", "Aalst", "Alost", "Hasselt", "Kortrijk", "Courtrai", "Oostende",
  "Ostende", "Sint-Niklaas", "Genk", "Roeselare", "Roulers", "Turnhout", "Lier", "Vilvoorde",
  "Halle", "Dendermonde", "Termonde", "Knokke-Heist", "Ieper", "Ypres", "Beveren",
  "Herentals", "Lokeren", "Waregem", "Tienen", "Tirlemont", "Zaventem", "Grimbergen",
  "Deinze", "Ninove", "Oudenaarde", "Audenarde", "Tongeren", "Tongres", "Sint-Truiden",
  "Saint-Trond", "Diest", "Blankenberge", "De Panne", "Menen", "Menin", "Maasmechelen",
  "Lommel", "Brasschaat", "Schoten", "Mortsel", "Wetteren", "Temse", "Eeklo",
];

/**
 * Région d'un code postal belge.
 *
 * Les tranches suivent les provinces : 1000–1299 Bruxelles, 1300–1499 Brabant
 * wallon, 1500–1999 et 3000–3499 Brabant flamand, 2000–2999 Anvers, 3500–3999
 * Limbourg, 4000–7999 les provinces wallonnes, 8000–9999 les Flandres.
 */
export function regionDuCodePostal(code: number): Region | null {
  if (code >= 1000 && code <= 1299) return "bruxelles";
  if (code >= 1300 && code <= 1499) return "wallonie";
  if (code >= 1500 && code <= 3999) return "flandre";
  if (code >= 4000 && code <= 7999) return "wallonie";
  if (code >= 8000 && code <= 9999) return "flandre";
  return null;
}

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Recherche d'un nom propre, en mot entier, insensible aux accents et à la casse. */
function contientNom(texteNormalise: string, nom: string): number {
  const motif = sansAccents(nom)
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/[\s-]+/g, "[\\s-]+");
  const m = texteNormalise.match(new RegExp(`(^|[^a-z])${motif}([^a-z]|$)`));
  return m?.index ?? -1;
}

/** Mots-outils typiques de chaque langue : quelques dizaines suffisent à trancher. */
const MARQUEURS_FR = /\b(le|la|les|des|du|une|pour|votre|vous|montant|redevance|stationnement|payer|rappel|commune|date)\b/g;
const MARQUEURS_NL = /\b(de|het|een|van|voor|uw|u|bedrag|retributie|parkeren|betalen|herinnering|gemeente|datum|stad)\b/g;

export function detecterLangue(texte: string): Langue | null {
  const t = sansAccents(texte).toLowerCase();
  const fr = (t.match(MARQUEURS_FR) ?? []).length;
  const nl = (t.match(MARQUEURS_NL) ?? []).length;
  if (fr + nl < 4) return null;
  if (nl > fr * 1.3) return "nl";
  if (fr > nl * 1.3) return "fr";
  return null;
}

export type Lieu = {
  region: Region | null;
  /** Commune ou ville reconnue, dans la graphie trouvée. */
  commune: string | null;
  /** Vrai quand les indices concordent nettement. */
  certaine: boolean;
  langue: Langue | null;
};

export function detecterLieu(texte: string, communeLue?: string | null): Lieu {
  const t = sansAccents(texte).toLowerCase();
  const votes: Record<Region, number> = { bruxelles: 0, wallonie: 0, flandre: 0 };
  // Un objet plutôt que trois variables : elles sont modifiées dans une
  // fonction imbriquée, ce que l'analyse de flux de TypeScript ne suit pas.
  const trouve: { commune: string | null; region: Region | null; position: number } = {
    commune: null,
    region: null,
    position: Infinity,
  };

  // 1) L'organisme. parking.brussels ne réclame qu'à Bruxelles.
  if (/parking\.?\s?brussels|agence du stationnement|parkeeragentschap/.test(t)) votes.bruxelles += 5;

  // 2) Les noms de lieux. Le premier trouvé dans le texte est le plus souvent
  //    l'en-tête de l'organisme ou le lieu du constat ; on le retient comme
  //    commune, mais chaque nom vote.
  const essayer = (nom: string, region: Region, poids: number) => {
    const pos = contientNom(t, nom);
    if (pos < 0) return;
    votes[region] += poids;
    if (pos < trouve.position) {
      trouve.position = pos;
      trouve.commune = nom;
      trouve.region = region;
    }
  };
  for (const c of COMMUNES) essayer(c.nom, "bruxelles", 3);
  for (const nom of BRUXELLES_NL) essayer(nom, "bruxelles", 3);
  for (const nom of VILLES_WALLONIE) essayer(nom, "wallonie", 3);
  for (const nom of VILLES_FLANDRE) essayer(nom, "flandre", 3);

  // Une commune déjà lue par l'extraction (et confirmée par l'utilisateur)
  // pèse plus que tout le reste.
  if (communeLue) {
    const lue = sansAccents(communeLue).toLowerCase();
    const bxl = COMMUNES.find((c) => [c.nom, c.nl].some((nom) => sansAccents(nom).toLowerCase() === lue));
    if (bxl) {
      votes.bruxelles += 8;
      trouve.commune = bxl.nom;
      trouve.region = "bruxelles";
    }
  }

  // 3) Les codes postaux. Ceux qui suivent un libellé de lieu comptent plus.
  for (const m of t.matchAll(/\b([1-9]\d{3})\s+[a-z]/g)) {
    const code = Number(m[1]);
    const region = regionDuCodePostal(code);
    if (!region) continue;
    const avant = t.slice(Math.max(0, (m.index ?? 0) - 90), m.index ?? 0);
    const prochedulieu = /(lieu|constat|vaststelling|plaats|adresse du constat|stationne)/.test(avant);
    votes[region] += prochedulieu ? 4 : 1;
  }

  // 4) La langue : un indice faible, mais utile pour départager.
  const langue = detecterLangue(texte);
  if (langue === "nl" && votes.bruxelles < 3) votes.flandre += 1;
  if (langue === "fr" && votes.flandre < 3) votes.wallonie += 0.5;

  const classement = (Object.entries(votes) as [Region, number][]).sort((a, b) => b[1] - a[1]);
  const [premier, second] = classement;

  if (premier[1] === 0) return { region: null, commune: null, certaine: false, langue };

  const region = premier[0];
  return {
    region,
    // On ne garde la commune que si elle appartient à la région retenue : un
    // « Rue de Namur » dans un courrier bruxellois ne doit pas devenir Namur.
    commune: trouve.region === region ? trouve.commune : null,
    certaine: premier[1] >= 3 && premier[1] - second[1] >= 3,
    langue,
  };
}
