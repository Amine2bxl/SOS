/**
 * Les règles des communes telles que la base les tient, fusionnées avec les
 * repères de référence du site.
 *
 * La base (`communes`, `communes_regles`, `regles_changements`) est la source
 * vivante : l'association y corrige une règle ou y annonce un changement, et
 * la page « Communes » l'affiche aussitôt, sur la carte et dans la fiche. Les
 * repères de `data.ts` restent le filet : sans base joignable, la page
 * s'affiche quand même, avec ce que le site sait déjà.
 *
 * Module pur, sans accès réseau, pour être testé tel quel. Import relatif
 * volontaire (`./data`) : ce fichier est compilé par les tests, sans le
 * résolveur d'alias de Next.
 */

import type { Commune } from "./data";

export type Importance = "info" | "important" | "urgent";

/* --------------------------------------------- lignes, telles que lues */

export type LigneRegle = {
  commune_slug: string;
  version: number;
  en_vigueur_depuis: string | null;
  en_vigueur_jusque: string | null;
  zones: string | null;
  horaires: string | null;
  gratuite: string | null;
  paiement: string | null;
  cartes: string | null;
  tarifs: string | null;
  contestation: string | null;
  a_savoir: string | null;
  source_url: string | null;
  mis_a_jour_le: string | null;
};

export type LigneChangement = {
  id: string;
  commune_slug: string | null;
  titre: string | null;
  resume: string | null;
  importance: string | null;
  publie_le: string | null;
  source_url: string | null;
};

export type LigneCommune = {
  slug: string;
  nom_nl: string | null;
  codes_postaux: string[] | null;
  site_officiel: string | null;
  page_parking: string | null;
  ouverte: boolean | null;
};

/* ------------------------------------------------ ce que la page reçoit */

export type RegleCommune = {
  version: number;
  enVigueurDepuis: string | null;
  zones: string | null;
  horaires: string | null;
  gratuite: string | null;
  paiement: string | null;
  cartes: string | null;
  tarifs: string | null;
  contestation: string | null;
  aSavoir: string | null;
  sourceUrl: string | null;
  misAJourLe: string | null;
};

/** Un règlement voté mais pas encore en vigueur. */
export type ProchaineRegle = { version: number; enVigueurDepuis: string };

export type Changement = {
  id: string;
  /** `null` : le changement vaut pour toute la Région. */
  slug: string | null;
  titre: string;
  resume: string;
  importance: Importance;
  publieLe: string;
  sourceUrl: string | null;
};

export type EntreeRegistre = {
  nl: string | null;
  codesPostaux: string[] | null;
  siteOfficiel: string | null;
  parking: string | null;
  ouverte: boolean;
};

/** Sérialisable tel quel du serveur vers le navigateur. */
export type ReglesEnDirect = {
  regles: Record<string, RegleCommune>;
  prochaines: Record<string, ProchaineRegle>;
  registre: Record<string, EntreeRegistre>;
  changements: Changement[];
  /** Faux quand la base n'a pas répondu : la page montre les repères de référence. */
  enDirect: boolean;
  /** Moment de la lecture (ISO 8601). */
  luLe: string;
  /** Le jour de la lecture à Bruxelles (`AAAA-MM-JJ`) : ce qui est « récent » se compte à partir de lui. */
  aujourdhui: string;
};

/* ------------------------------------------------------------- outils */

const texte = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = (v: unknown): string | null => (typeof v === "string" && DATE.test(v.slice(0, 10)) ? v.slice(0, 10) : null);

/** Un lien n'est affiché que s'il mène vers une adresse https. Rien d'autre. */
export function urlSure(v: unknown): string | null {
  const brut = texte(v);
  if (!brut) return null;
  try {
    return new URL(brut).protocol === "https:" ? brut : null;
  } catch {
    return null;
  }
}

/** La date du jour à Bruxelles, au format `AAAA-MM-JJ`. */
export function aujourdhuiBruxelles(maintenant: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(maintenant);
}

/** `AAAA-MM-JJ` décalé de `jours` (négatif : dans le passé). */
export function decalerDate(jour: string, jours: number): string {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

/** « 1er janvier 2026 ». La date est lue en UTC : un jour reste ce jour, partout. */
export function dateLisible(jour: string): string {
  const d = new Date(`${jour.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return jour;
  const lisible = d.toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return d.getUTCDate() === 1 ? lisible.replace(/^1 /, "1er ") : lisible;
}

/** « 14:32 », à l'heure de Bruxelles. */
export function heureBruxelles(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });
}

/* --------------------------------------------------- choisir la règle */

function versRegle(l: LigneRegle): RegleCommune {
  return {
    version: l.version,
    enVigueurDepuis: date(l.en_vigueur_depuis),
    zones: texte(l.zones),
    horaires: texte(l.horaires),
    gratuite: texte(l.gratuite),
    paiement: texte(l.paiement),
    cartes: texte(l.cartes),
    tarifs: texte(l.tarifs),
    contestation: texte(l.contestation),
    aSavoir: texte(l.a_savoir),
    sourceUrl: urlSure(l.source_url),
    misAJourLe: texte(l.mis_a_jour_le),
  };
}

/**
 * Pour chaque commune : la version la plus récente déjà en vigueur, et la
 * prochaine si un nouveau règlement est annoncé.
 *
 * Une version « clôturée » (`en_vigueur_jusque` passé) n'est plus affichée.
 */
export function selectionnerRegles(
  lignes: LigneRegle[],
  aujourdhui: string,
): { regles: Record<string, RegleCommune>; prochaines: Record<string, ProchaineRegle> } {
  const regles: Record<string, RegleCommune> = {};
  const prochaines: Record<string, ProchaineRegle> = {};

  for (const l of lignes) {
    const slug = texte(l?.commune_slug);
    if (!slug || !Number.isInteger(l.version)) continue;
    const depuis = date(l.en_vigueur_depuis);
    const jusque = date(l.en_vigueur_jusque);
    if (jusque && jusque < aujourdhui) continue;

    if (depuis && depuis > aujourdhui) {
      const deja = prochaines[slug];
      if (!deja || depuis < deja.enVigueurDepuis) prochaines[slug] = { version: l.version, enVigueurDepuis: depuis };
      continue;
    }
    const deja = regles[slug];
    if (!deja || l.version > deja.version) regles[slug] = versRegle(l);
  }
  return { regles, prochaines };
}

/* ------------------------------------------------------- changements */

const IMPORTANCES: Importance[] = ["info", "important", "urgent"];

/**
 * Les changements publiés à ce jour, du plus récent au plus ancien. Un
 * changement daté de demain reste caché jusqu'à demain : l'association peut
 * préparer une annonce à l'avance.
 */
export function normaliserChangements(lignes: LigneChangement[], aujourdhui: string): Changement[] {
  const sortie: Changement[] = [];
  for (const l of lignes) {
    const titre = texte(l?.titre);
    const publieLe = date(l?.publie_le);
    if (!titre || !publieLe || publieLe > aujourdhui || typeof l.id !== "string") continue;
    sortie.push({
      id: l.id,
      slug: texte(l.commune_slug),
      titre,
      resume: texte(l.resume) ?? "",
      importance: IMPORTANCES.includes(l.importance as Importance) ? (l.importance as Importance) : "info",
      publieLe,
      sourceUrl: urlSure(l.source_url),
    });
  }
  return sortie.sort((a, b) => (a.publieLe === b.publieLe ? 0 : a.publieLe < b.publieLe ? 1 : -1));
}

/** Durée pendant laquelle un changement reste signalé sur la carte. */
export const JOURS_RECENTS = 365;

export function changementsRecents(changements: Changement[], aujourdhui: string, jours = JOURS_RECENTS): Changement[] {
  const depuis = decalerDate(aujourdhui, -jours);
  return changements.filter((c) => c.publieLe >= depuis);
}

/** Les communes à signaler sur la carte : celles qu'un changement récent concerne. */
export function communesModifiees(recents: Changement[]): Set<string> {
  return new Set(recents.flatMap((c) => (c.slug ? [c.slug] : [])));
}

/**
 * Ce qui a bougé entre deux lectures de la base, pendant que la page était
 * ouverte : les communes dont la fiche a changé, et les changements nouveaux ou
 * corrigés. Rien quand l'une des deux lectures n'a pas abouti — sans quoi tout
 * clignoterait au retour de la base.
 */
export function differences(
  avant: ReglesEnDirect,
  apres: ReglesEnDirect,
): { communes: Set<string>; changements: Set<string> } {
  const communes = new Set<string>();
  const changements = new Set<string>();
  if (!avant.enDirect || !apres.enDirect) return { communes, changements };

  const different = (a: unknown, b: unknown) => JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
  for (const [table, nouvelle] of [
    [avant.regles, apres.regles],
    [avant.prochaines, apres.prochaines],
    [avant.registre, apres.registre],
  ] as const) {
    for (const slug of new Set([...Object.keys(table), ...Object.keys(nouvelle)])) {
      if (different((table as Record<string, unknown>)[slug], (nouvelle as Record<string, unknown>)[slug])) communes.add(slug);
    }
  }

  const anciens = new Map(avant.changements.map((c) => [c.id, c]));
  for (const c of apres.changements) {
    if (!different(anciens.get(c.id), c)) continue;
    changements.add(c.id);
    if (c.slug) communes.add(c.slug);
  }
  return { communes, changements };
}

/* ----------------------------------------------------------- registre */

export function lireRegistre(lignes: LigneCommune[]): Record<string, EntreeRegistre> {
  const registre: Record<string, EntreeRegistre> = {};
  for (const l of lignes) {
    const slug = texte(l?.slug);
    if (!slug) continue;
    registre[slug] = {
      nl: texte(l.nom_nl),
      codesPostaux: Array.isArray(l.codes_postaux) ? l.codes_postaux.filter((c) => /^\d{4}$/.test(c)) : null,
      siteOfficiel: urlSure(l.site_officiel),
      parking: urlSure(l.page_parking),
      ouverte: l.ouverte !== false,
    };
  }
  return registre;
}

/* ------------------------------------------------------- la fiche */

export type FicheCommune = {
  slug: string;
  nom: string;
  nl: string;
  codesPostaux: string[];
  zones: string;
  horaires: string;
  gratuite: string;
  paiement: string;
  cartes: string;
  aSavoir: string;
  tarifs: string | null;
  contestation: string | null;
  siteOfficiel: string;
  parking: string;
  sourceUrl: string | null;
  version: number | null;
  enVigueurDepuis: string | null;
  misAJourLe: string | null;
  prochaine: ProchaineRegle | null;
  ouverte: boolean;
  /** `base` : la fiche vient de la base ; `reference` : des repères du site. */
  origine: "base" | "reference";
};

/** La base l'emporte champ par champ ; un champ vide retombe sur le repère du site. */
export function ficheCommune(commune: Commune, direct: Pick<ReglesEnDirect, "regles" | "prochaines" | "registre">): FicheCommune {
  const r = direct.regles[commune.slug];
  const reg = direct.registre[commune.slug];
  return {
    slug: commune.slug,
    nom: commune.nom,
    nl: reg?.nl ?? commune.nl,
    codesPostaux: reg?.codesPostaux?.length ? reg.codesPostaux : commune.codesPostaux,
    zones: r?.zones ?? commune.zones,
    horaires: r?.horaires ?? commune.heures,
    gratuite: r?.gratuite ?? commune.gratuit,
    paiement: r?.paiement ?? commune.moyens,
    cartes: r?.cartes ?? commune.riverain,
    aSavoir: r?.aSavoir ?? commune.aSavoir,
    tarifs: r?.tarifs ?? null,
    contestation: r?.contestation ?? null,
    siteOfficiel: reg?.siteOfficiel ?? commune.siteOfficiel,
    parking: reg?.parking ?? commune.parking,
    sourceUrl: r?.sourceUrl ?? null,
    version: r?.version ?? null,
    enVigueurDepuis: r?.enVigueurDepuis ?? null,
    misAJourLe: r?.misAJourLe ?? null,
    prochaine: direct.prochaines[commune.slug] ?? null,
    ouverte: reg?.ouverte ?? true,
    origine: r ? "base" : "reference",
  };
}

/** Les repères d'une fiche qui diffèrent d'une lecture à l'autre. */
export const CHAMPS_FICHE = [
  "zones",
  "horaires",
  "gratuite",
  "paiement",
  "cartes",
  "tarifs",
  "contestation",
  "aSavoir",
] as const;
export type ChampFiche = (typeof CHAMPS_FICHE)[number];

export function champsModifies(avant: FicheCommune, apres: FicheCommune): ChampFiche[] {
  return CHAMPS_FICHE.filter((champ) => avant[champ] !== apres[champ]);
}

/* ------------------------------------------------------- recherche */

const simplifier = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Retrouve une commune par son code postal (« 1050 »), son nom français ou
 * néerlandais, même partiel et sans accents (« elsene », « st gilles »).
 *
 * Seulement quand la saisie désigne UNE commune : « woluwe » en désigne deux,
 * et rien n'est choisi tant que la personne n'a pas précisé.
 */
export function trouverCommune(communes: Commune[], requete: string): Commune | null {
  const q = simplifier(requete);
  if (!q) return null;
  if (/^\d{4}$/.test(q)) return communes.find((c) => c.codesPostaux.includes(q)) ?? null;

  // « St » abrège Saint en français comme Sint en néerlandais.
  const variantes = /\bst\b/.test(q) ? [q.replace(/\bst\b/g, "saint"), q.replace(/\bst\b/g, "sint")] : [q];
  const noms = (c: Commune) => [simplifier(c.nom), simplifier(c.nl)];
  for (const correspond of [
    (n: string, v: string) => n === v,
    (n: string, v: string) => n.startsWith(v),
    (n: string, v: string) => n.includes(v),
  ]) {
    const trouvees = communes.filter((c) => noms(c).some((n) => variantes.some((v) => correspond(n, v))));
    if (trouvees.length === 1) return trouvees[0];
    if (trouvees.length > 1) return null;
  }
  return null;
}
