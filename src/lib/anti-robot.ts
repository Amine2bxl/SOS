import "server-only";

/**
 * Vérification « êtes-vous un humain ? » par Cloudflare Turnstile.
 *
 * Turnstile est gratuit, respecte la vie privée (pas de puzzle d'images, pas
 * de pistage publicitaire) et reste invisible pour la grande majorité des
 * visiteurs : il ne demande un geste qu'en cas de doute. Il protège l'envoi
 * des codes de connexion — sans lui, un script peut faire partir des milliers
 * d'e-mails depuis notre domaine vers des inconnus.
 *
 * Il s'active en renseignant deux variables : `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
 * (publique) et `TURNSTILE_SECRET_KEY` (secrète), obtenues gratuitement sur
 * dash.cloudflare.com → Turnstile. Sans elles, la vérification est sautée et
 * seule la limitation de débit protège l'envoi.
 */

export function antiRobotActif(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

/**
 * Vrai si le jeton prouve un humain.
 *
 * Une panne de Cloudflare ne doit pas empêcher tout le monde de se connecter :
 * en cas d'erreur réseau, on laisse passer (la limitation de débit reste en
 * place). Un refus explicite de Cloudflare, lui, est respecté.
 */
export async function verifierHumain(jeton: string | null | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!jeton) return false;

  try {
    const corps = new URLSearchParams({ secret, response: jeton });
    if (ip && ip !== "inconnue") corps.set("remoteip", ip);
    const reponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: corps,
      signal: AbortSignal.timeout(5000),
    });
    if (!reponse.ok) return true;
    const resultat = (await reponse.json()) as { success?: boolean };
    return resultat.success === true;
  } catch {
    return true;
  }
}
