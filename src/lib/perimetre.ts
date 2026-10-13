/**
 * Le périmètre couvert par la plateforme.
 *
 * SOS Citizens avance région par région : Bruxelles-Capitale d'abord, la
 * Flandre ensuite, la Wallonie après. Chaque région s'ouvre comme un module,
 * quand ses règles ont été vérifiées commune par commune. Le moteur sait déjà
 * raisonner sur les trois ; c'est ici, et seulement ici, qu'on décide de ce
 * qui est proposé au public.
 *
 * Import relatif volontaire : ce fichier est compilé par les tests, sans le
 * résolveur d'alias de Next.
 */

import type { Region } from "../cerveau/types";

/** Les régions ouvertes au public. Ajouter « flandre » ici ouvre la Flandre. */
export const REGIONS_OUVERTES: readonly Region[] = ["bruxelles"];

/** Les régions annoncées, dans l'ordre du plan. */
export const REGIONS_A_VENIR: readonly { id: Region; nom: string }[] = [
  { id: "flandre", nom: "Flandre" },
  { id: "wallonie", nom: "Wallonie" },
];

export function regionOuverte(region: string | null | undefined): boolean {
  return !!region && (REGIONS_OUVERTES as readonly string[]).includes(region);
}

/** Ce qu'on répond à quelqu'un dont le courrier vient d'une région pas encore ouverte. */
export function messageHorsPerimetre(region: string): string {
  const aVenir = REGIONS_A_VENIR.filter((r) => !regionOuverte(r.id));
  const rang = aVenir.findIndex((r) => r.id === region);
  const nom = region === "flandre" ? "La Flandre" : region === "wallonie" ? "La Wallonie" : "Cette région";
  const quand = rang > 0 ? `arrivera après la ${aVenir[rang - 1].nom}` : "arrive bientôt";
  return `SOS Citizens couvre pour l'instant les 19 communes de la Région de Bruxelles-Capitale. ${nom} ${quand}. En attendant, écrivez-nous : l'association vous orientera.`;
}
