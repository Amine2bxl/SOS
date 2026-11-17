/**
 * Le calendrier belge : les dix jours fériés légaux et les jours ouvrables.
 *
 * Un délai se compte en jours calendrier, mais son dernier jour peut tomber un
 * dimanche ou un jour férié — et le jour du constat aussi, ce qui compte tout
 * autant : dans la plupart des zones bruxelloises, le stationnement est libre
 * le dimanche et les jours fériés. Le moteur a donc besoin de savoir, sans
 * réseau et sans table à tenir à jour, quels jours sont fériés une année
 * donnée. Sept sont à date fixe ; trois dépendent de Pâques, qui se calcule.
 *
 * Source : loi du 4 janvier 1974 relative aux jours fériés (dix jours légaux).
 * Les fêtes régionales et communautaires (8 mai, 27 septembre, 11 juillet…)
 * n'en font pas partie : elles ne sont pas fériées pour tout le monde.
 *
 * Module pur : il tourne dans le navigateur comme sur le serveur.
 */

const JOUR = 86_400_000;

function versIso(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

function jourUtc(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/**
 * Le dimanche de Pâques (calendrier grégorien), par l'algorithme dit « anonyme »
 * (Meeus/Jones/Butcher). Exact pour toutes les années grégoriennes.
 */
export function dimancheDePaques(annee: number): string {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return versIso(Date.UTC(annee, mois - 1, jour));
}

export type JourFerie = { date: string; nom: string };

/** Les dix jours fériés légaux d'une année, dans l'ordre du calendrier. */
export function joursFeries(annee: number): JourFerie[] {
  const paques = jourUtc(dimancheDePaques(annee)) as number;
  const fixe = (mois: number, jour: number) => versIso(Date.UTC(annee, mois - 1, jour));
  return [
    { date: fixe(1, 1), nom: "Nouvel An" },
    { date: versIso(paques + 1 * JOUR), nom: "Lundi de Pâques" },
    { date: fixe(5, 1), nom: "Fête du Travail" },
    { date: versIso(paques + 39 * JOUR), nom: "Ascension" },
    { date: versIso(paques + 50 * JOUR), nom: "Lundi de Pentecôte" },
    { date: fixe(7, 21), nom: "Fête nationale" },
    { date: fixe(8, 15), nom: "Assomption" },
    { date: fixe(11, 1), nom: "Toussaint" },
    { date: fixe(11, 11), nom: "Armistice" },
    { date: fixe(12, 25), nom: "Noël" },
  ].sort((x, y) => x.date.localeCompare(y.date));
}

const cache = new Map<number, Map<string, string>>();

/** Le nom du jour férié tombant ce jour-là, ou null. */
export function jourFerie(iso: string): string | null {
  if (!jourUtc(iso)) return null;
  const annee = Number(iso.slice(0, 4));
  let table = cache.get(annee);
  if (!table) {
    table = new Map(joursFeries(annee).map((j) => [j.date, j.nom]));
    cache.set(annee, table);
  }
  return table.get(iso) ?? null;
}

const NOMS_JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** Le jour de la semaine, en toutes lettres. */
export function nomDuJour(iso: string): string | null {
  const t = jourUtc(iso);
  return t === null ? null : NOMS_JOURS[new Date(t).getUTCDay()];
}

export function estDimanche(iso: string): boolean {
  const t = jourUtc(iso);
  return t !== null && new Date(t).getUTCDay() === 0;
}

/** Ni samedi, ni dimanche, ni jour férié légal. */
export function estJourOuvrable(iso: string): boolean {
  const t = jourUtc(iso);
  if (t === null) return false;
  const j = new Date(t).getUTCDay();
  return j !== 0 && j !== 6 && jourFerie(iso) === null;
}

export function ajouterJours(iso: string, n: number): string | null {
  const t = jourUtc(iso);
  return t === null ? null : versIso(t + n * JOUR);
}

/** Le premier jour ouvrable à partir de ce jour (lui compris). */
export function jourOuvrableSuivant(iso: string): string | null {
  let j: string | null = iso;
  for (let i = 0; i < 10 && j; i++) {
    if (estJourOuvrable(j)) return j;
    j = ajouterJours(j, 1);
  }
  return j;
}

/** Le dernier jour ouvrable jusqu'à ce jour (lui compris). */
export function jourOuvrablePrecedent(iso: string): string | null {
  let j: string | null = iso;
  for (let i = 0; i < 10 && j; i++) {
    if (estJourOuvrable(j)) return j;
    j = ajouterJours(j, -1);
  }
  return j;
}

/** « samedi 21 mars 2026 », pour une trace de calcul lisible. */
export function dateLongue(iso: string): string {
  const t = jourUtc(iso);
  if (t === null) return iso;
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(t));
}
