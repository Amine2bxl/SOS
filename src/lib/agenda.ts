/**
 * L'agenda : tout ce qui a une date, au même endroit.
 *
 * Les échéances des dossiers, les relances, les envois et accusés de
 * réception, la fin d'un mandat ou d'une adhésion, les changements de règles
 * des communes, et les jours fériés — ces jours-là, le stationnement est
 * souvent gratuit, et un constat mérite un second regard.
 *
 * Module pur : il construit les événements et la grille du mois. Les lectures
 * en base vivent dans `agenda-donnees.ts`. Testé directement.
 */

import { joursFeries } from "../cerveau/moteur/calendrier";

export type TypeEvenement =
  | "echeance"
  | "relance"
  | "envoi"
  | "accuse"
  | "constat"
  | "mandat"
  | "regle"
  | "ferie"
  | "adhesion";

export type EvenementCalendrier = {
  id: string;
  /** Jour (AAAA-MM-JJ). */
  date: string;
  type: TypeEvenement;
  titre: string;
  detail?: string;
  /** Page du site où agir. */
  lien?: string;
};

/** Libellé et couleur de chaque type ; les couleurs viennent de la palette du site. */
export const TYPES_EVENEMENT: Record<TypeEvenement, { libelle: string; pastille: string; point: string }> = {
  echeance: { libelle: "Date limite", pastille: "bg-danger-100 text-danger-700", point: "bg-danger-600" },
  relance: { libelle: "Relance", pastille: "bg-warn-100 text-warn-700", point: "bg-warn-600" },
  envoi: { libelle: "Envoi", pastille: "bg-azur-100 text-azur-700", point: "bg-azur-600" },
  accuse: { libelle: "Accusé de réception", pastille: "bg-ok-100 text-ok-700", point: "bg-ok-600" },
  constat: { libelle: "Constat", pastille: "bg-navy-50 text-navy-700", point: "bg-navy-600" },
  mandat: { libelle: "Mandat", pastille: "bg-gold-100 text-gold-700", point: "bg-gold-500" },
  regle: { libelle: "Règle communale", pastille: "bg-navy-900 text-white", point: "bg-navy-900" },
  ferie: { libelle: "Jour férié", pastille: "bg-ok-50 text-ok-700", point: "bg-ok-600/60" },
  adhesion: { libelle: "Adhésion", pastille: "bg-gold-100 text-gold-700", point: "bg-gold-600" },
};

const JOUR = 86_400_000;
const versIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const jourUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const ajouterJours = (iso: string, n: number) => versIso(jourUtc(iso) + n * JOUR);

/** Ce dont l'agenda a besoin d'un dossier. */
export type DossierAgenda = {
  id: string;
  nom: string;
  statut: string;
  date_constat: string | null;
  date_echeance: string | null;
  date_envoi_contestation: string | null;
  accuse_reception_le?: string | null;
};

const TERMINES = ["accepte", "rejete", "clos"];
const ENVOYES = ["contestation_envoyee", "en_attente_reponse"];

/** Les dates d'un dossier. `limite` : la date qui compte, calculée par le moteur. */
export function evenementsDuDossier(
  d: DossierAgenda,
  limite: { date: string | null; nature: string } | null,
  joursAvantRelance = 30,
): EvenementCalendrier[] {
  const lien = `/tableau-de-bord/${d.id}`;
  const evs: EvenementCalendrier[] = [];
  const termine = TERMINES.includes(d.statut);
  const envoye = ENVOYES.includes(d.statut);

  if (d.date_constat) {
    evs.push({ id: `${d.id}-constat`, date: d.date_constat, type: "constat", titre: `Constat — ${d.nom}`, lien });
  }
  if (!termine && !envoye && limite?.date) {
    const verbe = limite.nature === "contestation" ? "Contester" : limite.nature === "reponse" ? "Répondre" : limite.nature === "recours" ? "Introduire le recours" : "Agir";
    evs.push({
      id: `${d.id}-limite`,
      date: limite.date,
      type: "echeance",
      titre: `${verbe} avant ce soir — ${d.nom}`,
      detail: "Dernier jour. Envoyez votre lettre aujourd'hui au plus tard.",
      lien: `${lien}#lettre`,
    });
  }
  if (!termine && d.date_echeance && d.date_echeance !== limite?.date) {
    evs.push({
      id: `${d.id}-echeance`,
      date: d.date_echeance,
      type: "echeance",
      titre: `Date imprimée sur le courrier — ${d.nom}`,
      lien,
    });
  }
  if (d.date_envoi_contestation) {
    evs.push({ id: `${d.id}-envoi`, date: d.date_envoi_contestation, type: "envoi", titre: `Contestation envoyée — ${d.nom}`, lien: `${lien}#suivi` });
    if (envoye) {
      evs.push({
        id: `${d.id}-relance`,
        date: ajouterJours(d.date_envoi_contestation, joursAvantRelance),
        type: "relance",
        titre: `Relancer si pas de réponse — ${d.nom}`,
        detail: "Un mois sans réponse : la lettre de relance est prête dans le dossier.",
        lien: `${lien}#lettre`,
      });
    }
  }
  if (d.accuse_reception_le) {
    evs.push({ id: `${d.id}-accuse`, date: d.accuse_reception_le, type: "accuse", titre: `Accusé de réception — ${d.nom}`, lien: `${lien}#suivi` });
  }
  return evs;
}

/** Les jours fériés légaux de l'année. */
export function evenementsFeries(annee: number): EvenementCalendrier[] {
  return joursFeries(annee).map((j) => ({
    id: `ferie-${j.date}`,
    date: j.date,
    type: "ferie" as const,
    titre: j.nom,
    detail: "Jour férié : le stationnement est souvent gratuit. Un constat ce jour-là mérite d'être vérifié.",
  }));
}

/** Tri par date, puis par importance. */
const ORDRE: TypeEvenement[] = ["echeance", "relance", "accuse", "envoi", "mandat", "adhesion", "regle", "constat", "ferie"];
export function trier(evs: EvenementCalendrier[]): EvenementCalendrier[] {
  return [...evs].sort((a, b) => a.date.localeCompare(b.date) || ORDRE.indexOf(a.type) - ORDRE.indexOf(b.type));
}

export type JourGrille = { iso: string; jour: number; dansMois: boolean };

/** La grille d'un mois, semaines du lundi au dimanche, jours voisins compris. */
export function grilleMois(annee: number, mois0: number): JourGrille[][] {
  const premier = Date.UTC(annee, mois0, 1);
  const decalage = (new Date(premier).getUTCDay() + 6) % 7; // lundi = 0
  const debut = premier - decalage * JOUR;
  const semaines: JourGrille[][] = [];
  for (let s = 0; s < 6; s++) {
    const semaine: JourGrille[] = [];
    for (let j = 0; j < 7; j++) {
      const t = debut + (s * 7 + j) * JOUR;
      const d = new Date(t);
      semaine.push({ iso: versIso(t), jour: d.getUTCDate(), dansMois: d.getUTCMonth() === mois0 });
    }
    // Une dernière semaine entièrement hors du mois n'apporte rien.
    if (s >= 4 && semaine.every((j) => !j.dansMois)) break;
    semaines.push(semaine);
  }
  return semaines;
}

/** « 2026-11 » → { annee, mois0 } ; une valeur invalide donne le mois de `defaut`. */
export function lireMois(valeur: string | undefined, defaut: Date): { annee: number; mois0: number } {
  const m = valeur?.match(/^(\d{4})-(\d{2})$/);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { annee: Number(m[1]), mois0: Number(m[2]) - 1 };
  return { annee: defaut.getUTCFullYear(), mois0: defaut.getUTCMonth() };
}

export const cleMois = (annee: number, mois0: number) => `${annee}-${String(mois0 + 1).padStart(2, "0")}`;
export function decalerMois(annee: number, mois0: number, n: number) {
  const t = new Date(Date.UTC(annee, mois0 + n, 1));
  return { annee: t.getUTCFullYear(), mois0: t.getUTCMonth() };
}

/* ------------------------------------------- ajouter à l'agenda de l'appareil */

const compact = (iso: string) => iso.replace(/-/g, "");

/** Google Agenda : un lien qui ouvre l'événement prérempli, sur n'importe quel appareil. */
export function lienGoogle(ev: EvenementCalendrier, site: string): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.titre,
    dates: `${compact(ev.date)}/${compact(ajouterJours(ev.date, 1))}`,
    details: [ev.detail, ev.lien ? `${site}${ev.lien}` : null].filter(Boolean).join("\n\n"),
    ctz: "Europe/Brussels",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/** Outlook (compte Microsoft) : même principe. */
export function lienOutlook(ev: EvenementCalendrier, site: string): string {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.titre,
    startdt: ev.date,
    enddt: ajouterJours(ev.date, 1),
    allday: "true",
    body: [ev.detail, ev.lien ? `${site}${ev.lien}` : null].filter(Boolean).join("\n\n"),
  });
  return `https://outlook.live.com/calendar/0/action/compose?${p.toString()}`;
}

/** S'abonner au calendrier depuis Google Agenda (adresse webcal encodée). */
export function lienAbonnementGoogle(urlIcs: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(urlIcs.replace(/^https:/, "webcal:"))}`;
}
