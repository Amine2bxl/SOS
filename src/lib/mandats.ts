/**
 * Le mandat : l'autorisation donnée à l'association d'accéder à UN dossier.
 *
 * Module pur (navigateur et serveur), testé directement. La base applique les
 * mêmes règles (voir la migration `…_mandats_preuves_consentements.sql`) :
 * ce module sert à les dire clairement et à refuser tôt ce qu'elle refuserait.
 */

export const PORTEES = [
  {
    id: "consulter",
    libelle: "Consulter ce dossier",
    detail: "Le courrier tel que vous l'avez confirmé, l'analyse, les lettres et le suivi. Rien d'autre de votre compte.",
    obligatoire: true,
  },
  {
    id: "correspondre",
    libelle: "Écrire en mon nom à l'organisme",
    detail: "L'association peut adresser une lettre ou une demande de preuves à l'organisme qui réclame, pour ce dossier seulement.",
    obligatoire: false,
  },
] as const;

export type Portee = (typeof PORTEES)[number]["id"];

export const DUREES = [
  { jours: 30, libelle: "30 jours" },
  { jours: 90, libelle: "3 mois" },
  { jours: 365, libelle: "1 an" },
] as const;

export type Mandat = {
  id: string;
  dossier_id: string;
  portee: Portee[];
  message: string | null;
  accorde_le: string;
  expire_le: string;
  revoque_le: string | null;
};

export type EtatMandat = "aucun" | "actif" | "expire" | "revoque";

export function etatMandat(m: Mandat | null, maintenant = Date.now()): EtatMandat {
  if (!m) return "aucun";
  if (m.revoque_le) return "revoque";
  return Date.parse(m.expire_le) > maintenant ? "actif" : "expire";
}

export type SaisieMandat = { portee: Portee[]; jours: number; message: string | null };

/** Valide une demande de mandat. La consultation est toujours comprise. */
export function validerMandat(brut: {
  portee?: unknown;
  jours?: unknown;
  message?: unknown;
  accord?: unknown;
}): { ok: true; valeur: SaisieMandat } | { ok: false; erreur: string } {
  if (brut.accord !== true && brut.accord !== "on") {
    return { ok: false, erreur: "Cochez la case d'autorisation : sans elle, l'association ne peut rien voir." };
  }
  const demandees = Array.isArray(brut.portee) ? brut.portee : [];
  const portee: Portee[] = ["consulter"];
  if (demandees.includes("correspondre")) portee.push("correspondre");

  const jours = Number(brut.jours);
  if (!DUREES.some((d) => d.jours === jours)) return { ok: false, erreur: "Choisissez la durée du mandat." };

  const message = typeof brut.message === "string" && brut.message.trim() ? brut.message.trim().slice(0, 2000) : null;
  return { ok: true, valeur: { portee, jours, message } };
}

export const libellePortee = (p: Portee) => PORTEES.find((x) => x.id === p)?.libelle ?? p;
