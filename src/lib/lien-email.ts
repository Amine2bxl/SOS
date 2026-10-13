/**
 * Le retour d'un lien de connexion envoyé par Supabase.
 *
 * Le lien rapporte la session dans le fragment de l'adresse (après « # »), que
 * seul le navigateur voit : `#access_token=…&refresh_token=…&type=magiclink`.
 * Quand il a expiré ou déjà servi : `#error=access_denied&error_code=otp_expired…`.
 *
 * Ce module ne fait que lire ce fragment. Ouvrir la session revient au serveur,
 * qui fait vérifier le jeton par Supabase : un jeton inventé n'ouvre rien.
 */

export type RaisonEchecLien = "lien-expire" | "connexion-annulee";

export type RetourLien =
  | { type: "session"; accessToken: string; refreshToken: string }
  | { type: "erreur"; raison: RaisonEchecLien };

// Un jeton d'accès est un JWT : trois segments base64url. Le jeton de
// renouvellement est une courte chaîne opaque. Les bornes écartent le bruit.
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const OPAQUE = /^[A-Za-z0-9_-]{8,512}$/;

export function jetonsPlausibles(accessToken: unknown, refreshToken: unknown): boolean {
  return (
    typeof accessToken === "string" &&
    typeof refreshToken === "string" &&
    accessToken.length <= 8192 &&
    JWT.test(accessToken) &&
    OPAQUE.test(refreshToken)
  );
}

/** `null` quand le fragment n'est pas un retour de connexion (une ancre « #analyser »…). */
export function lireRetourLien(fragment: string): RetourLien | null {
  const brut = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  if (!brut.includes("=")) return null;
  const p = new URLSearchParams(brut);

  const erreur = p.get("error_description") ?? p.get("error_code") ?? p.get("error");
  if (erreur) {
    return { type: "erreur", raison: /expired|invalid|otp/i.test(erreur) ? "lien-expire" : "connexion-annulee" };
  }

  const accessToken = p.get("access_token");
  if (!accessToken) return null;
  const refreshToken = p.get("refresh_token");
  if (!jetonsPlausibles(accessToken, refreshToken)) return { type: "erreur", raison: "lien-expire" };
  return { type: "session", accessToken, refreshToken: refreshToken as string };
}
