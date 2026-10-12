/**
 * L'adresse publique du site : celle des liens de connexion, des e-mails et
 * des aperçus.
 *
 * Elle dépend de l'endroit où tourne le code, et c'est tout le point :
 *
 *  - sur une prévisualisation Vercel, l'adresse de la prévisualisation
 *    elle-même. Un lien de connexion demandé depuis une prévisualisation doit
 *    y ramener — pas sur le site de production, qui peut encore porter
 *    l'ancienne version ;
 *  - en production, `NEXT_PUBLIC_SITE_URL` si elle est définie (un domaine
 *    personnalisé), sinon le domaine de production que Vercel fournit de
 *    lui-même (`VERCEL_PROJECT_PRODUCTION_URL`) ;
 *  - en local, http://localhost:3000.
 *
 * Sans ce choix, une variable oubliée envoyait les liens vers « localhost »,
 * que Supabase refusait en renvoyant… vers l'ancienne production.
 *
 * Module pur : lu côté serveur à chaque appel, il suit l'environnement réel.
 */
export function urlDuSite(env: Record<string, string | undefined> = process.env): string {
  const sansBarre = (u: string) => u.trim().replace(/\/+$/, "");

  if (env.VERCEL_ENV === "preview") {
    const hote = env.VERCEL_BRANCH_URL || env.VERCEL_URL;
    if (hote) return `https://${sansBarre(hote)}`;
  }
  if (env.NEXT_PUBLIC_SITE_URL?.trim()) return sansBarre(env.NEXT_PUBLIC_SITE_URL);
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${sansBarre(env.VERCEL_PROJECT_PRODUCTION_URL)}`;
  return "http://localhost:3000";
}
