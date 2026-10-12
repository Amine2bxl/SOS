import { cheminSur } from "./chemin-sur";
import { emailValide } from "./email-canonique";

/** Seulement l'adresse et l'étape : aucun code ou jeton n'est stocké ici. */
export type AttenteAuth = {
  email: string;
  suite: string;
  mode: "code" | "lien";
  envoyeLe: number;
};

export const CLE_ATTENTE_AUTH = "sos:connexion-en-attente";
export const DELAI_RENVOI = 60;

export function lireAttenteAuth(brut: string | null, suite: string, maintenant = Date.now()): AttenteAuth | null {
  if (!brut) return null;
  try {
    const a = JSON.parse(brut) as Partial<AttenteAuth>;
    if (typeof a.email !== "string" || !emailValide(a.email)) return null;
    if (a.mode !== "code" && a.mode !== "lien") return null;
    if (typeof a.envoyeLe !== "number" || !Number.isFinite(a.envoyeLe)) return null;
    if (a.envoyeLe > maintenant || maintenant - a.envoyeLe > 3600_000) return null;
    if (typeof a.suite !== "string" || cheminSur(a.suite) !== suite || a.suite !== suite) return null;
    return a as AttenteAuth;
  } catch {
    return null;
  }
}

export function secondesAvantRenvoi(envoyeLe: number, maintenant = Date.now()): number {
  return Math.max(0, Math.ceil((envoyeLe + DELAI_RENVOI * 1000 - maintenant) / 1000));
}
