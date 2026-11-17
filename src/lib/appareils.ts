import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Les appareils reconnus : « vérifié une fois, plus besoin de code ici ».
 *
 * Après une connexion vérifiée (code e-mail, code SMS, lien, Google),
 * l'appareil reçoit un jeton secret dans un cookie httpOnly. La base n'en garde
 * que l'empreinte. Au retour, une touche suffit : le serveur vérifie le jeton,
 * le remplace par un neuf, et rouvre la session.
 *
 * Ce module n'utilise que Web Crypto : il tourne dans le proxy comme dans les
 * actions serveur.
 */

export const COOKIE_APPAREIL = "sos_appareil";
/** Posé quand quelqu'un demande d'oublier cet appareil : on ne le retient plus. */
export const COOKIE_NE_PAS_RETENIR = "sos_appareil_non";

const UN_AN = 365 * 86_400;

export const optionsCookie = (maxAge = UN_AN) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

const hex = (octets: ArrayBuffer) =>
  Array.from(new Uint8Array(octets), (o) => o.toString(16).padStart(2, "0")).join("");

async function empreinte(secret: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)));
}

function secretAleatoire(): string {
  const octets = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Comparaison en temps constant de deux empreintes hexadécimales. */
function egales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** « iPhone · Safari », « Windows · Chrome » : de quoi reconnaître l'appareil dans la liste. */
export function libelleAppareil(ua: string | null): string {
  if (!ua) return "Appareil inconnu";
  const systeme = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Mac OS X/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows"
            : /Linux/.test(ua)
              ? "Linux"
              : "Appareil";
  const navigateur = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : "navigateur";
  return `${systeme} · ${navigateur}`;
}

/** Retient l'appareil ; renvoie la valeur du cookie à poser. */
export async function retenirAppareil(admin: SupabaseClient, userId: string, ua: string | null): Promise<string | null> {
  const secret = secretAleatoire();
  const { data, error } = await admin
    .from("appareils_reconnus")
    .insert({ user_id: userId, empreinte: await empreinte(secret), libelle: libelleAppareil(ua) })
    .select("id")
    .single();
  if (error || !data) return null;
  return `${data.id}.${secret}`;
}

export type AppareilReconnu = { id: string; userId: string };

/** L'appareil désigné par le cookie, s'il est valable. */
export async function lireAppareil(admin: SupabaseClient, valeur: string | undefined): Promise<AppareilReconnu | null> {
  const m = valeur?.match(/^([0-9a-f-]{36})\.([A-Za-z0-9_-]{40,})$/);
  if (!m) return null;
  const { data } = await admin
    .from("appareils_reconnus")
    .select("id, user_id, empreinte, expire_le, revoque_le")
    .eq("id", m[1])
    .maybeSingle();
  if (!data || data.revoque_le || Date.parse(data.expire_le) < Date.now()) return null;
  if (!egales(data.empreinte, await empreinte(m[2]))) return null;
  return { id: data.id, userId: data.user_id };
}

/** Remplace le jeton après usage : un cookie copié ne sert qu'une fois. */
export async function tournerJeton(admin: SupabaseClient, id: string): Promise<string | null> {
  const secret = secretAleatoire();
  const { error } = await admin
    .from("appareils_reconnus")
    .update({ empreinte: await empreinte(secret), utilise_le: new Date().toISOString() })
    .eq("id", id);
  return error ? null : `${id}.${secret}`;
}

export async function revoquerAppareil(admin: SupabaseClient, id: string) {
  await admin.from("appareils_reconnus").update({ revoque_le: new Date().toISOString() }).eq("id", id);
}
