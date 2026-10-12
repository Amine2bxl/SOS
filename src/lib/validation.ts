/**
 * Valeurs autorisées et petites vérifications d'entrée.
 *
 * Ces listes existent aussi comme contraintes en base (voir
 * `supabase/migrations/…_verrou_facturation_et_integrite.sql`), et c'est la
 * base qui fait foi : une Server Action est une route HTTP comme une autre, et
 * son corps est fabriqué par le client. Les vérifications d'ici servent à
 * transformer une valeur inattendue en message compréhensible plutôt qu'en
 * erreur de contrainte Postgres remontée à l'écran.
 *
 * Module volontairement sans dépendance : il est testé directement.
 */

export const STATUTS_DOSSIER = [
  "nouveau",
  "a_contester",
  "contestation_envoyee",
  "en_attente_reponse",
  "accepte",
  "rejete",
  "clos",
] as const;

export type StatutDossier = (typeof STATUTS_DOSSIER)[number];

export const TYPES_DOCUMENT = [
  "notification",
  "premier_rappel",
  "deuxieme_rappel",
  "mise_en_demeure",
  "contrainte",
  "courrier_huissier",
] as const;

export type TypeDocument = (typeof TYPES_DOCUMENT)[number];

export const FORMULES_PAYANTES = ["membre", "independant", "societe"] as const;

/**
 * Vrai pour un UUID de version quelconque.
 *
 * Les identifiants de dossier arrivent de l'URL ou d'un formulaire. Les filtrer
 * ici évite d'envoyer à Postgres une chaîne qu'il rejettera avec une erreur de
 * type — bruit dans les journaux, message incompréhensible pour l'utilisateur.
 */
export function estUuid(valeur: unknown): boolean {
  return (
    typeof valeur === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valeur)
  );
}

/**
 * Convertit une saisie en nombre, ou `null`.
 *
 * Accepte la virgule décimale (un formulaire belge en reçoit tout le temps) et
 * les espaces de milliers. Refuse ce qui sort des bornes plutôt que de le
 * ramener à la borne : un montant de 999 999 € lu de travers sur un courrier
 * doit rester vide et être ressaisi, pas devenir 100 000 €.
 */
export function nombreOuNull(
  valeur: string | number | null | undefined,
  bornes: { min?: number; max?: number } = {},
): number | null {
  if (valeur === null || valeur === undefined) return null;

  let brut: number;
  if (typeof valeur === "number") {
    brut = valeur;
  } else {
    const nettoye = valeur
      .trim()
      .replace(/\s/g, "")
      .replace(/\.(?=\d{3}\b)/g, "")
      .replace(",", ".");
    // `Number("")` vaut 0, et pas NaN. Sans ce contrôle, un champ « montant »
    // laissé vide s'enregistrait comme 0 € — ce qui, sur une redevance, se lit
    // « rien à payer ».
    if (nettoye === "") return null;
    brut = Number(nettoye);
  }

  if (!Number.isFinite(brut)) return null;
  if (bornes.min !== undefined && brut < bornes.min) return null;
  if (bornes.max !== undefined && brut > bornes.max) return null;
  return brut;
}
