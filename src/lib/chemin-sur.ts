/**
 * L'adresse de retour après connexion (`?suite=…`) n'est suivie que si elle
 * reste sur ce site.
 *
 * Vérifier qu'elle commence par « / » ne suffit pas : pour un navigateur,
 * « //exemple.com » et « /\exemple.com » sont des adresses absolues vers un
 * autre site, et l'analyseur d'URL efface les tabulations et retours à la
 * ligne — « /<tab>/exemple.com » devient « //exemple.com ». Sans ces refus,
 * un lien de connexion piégé renverrait l'utilisateur, fraîchement connecté
 * et confiant, vers une copie du site.
 *
 * Module pur, partagé par le serveur et le navigateur.
 */
export function cheminSur(brut: unknown, defaut = "/tableau-de-bord"): string {
  const s = typeof brut === "string" ? brut.trim() : "";
  if (!s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return defaut;
  // Caractères de contrôle : effacés ou réinterprétés par l'analyseur d'URL.
  if (/[\u0000-\u001f\u007f]/.test(s)) return defaut;
  return s;
}
