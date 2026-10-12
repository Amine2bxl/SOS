/**
 * Une adresse e-mail, une personne.
 *
 * Trois choses à vérifier avant d'ouvrir un compte :
 *
 *  1. L'adresse a la forme d'une adresse (on refuse ce qui ne peut pas
 *     recevoir de courrier, sans chercher la perfection : seul l'envoi du
 *     code prouve vraiment qu'elle existe).
 *  2. Ce n'est pas une boîte jetable — ces services qui fournissent une
 *     adresse valable dix minutes, faite pour ouvrir des comptes en série.
 *  3. Ce n'est pas une VARIANTE d'une adresse déjà inscrite :
 *     « jean.dupont@gmail.com », « jeandupont@gmail.com » et
 *     « jean.dupont+sos@gmail.com » arrivent dans la même boîte. La forme
 *     canonique les ramène à une seule.
 *
 * La même règle de canonisation existe en base (`public.canoniser_email`),
 * avec un index unique : même si ce module était contourné, la base refuserait
 * le doublon. Les deux doivent rester identiques — le test le vérifie.
 */

/** Forme canonique : minuscules, sans suffixe « +… », sans points chez Gmail. */
export function canoniserEmail(email: string): string {
  const propre = email.trim().toLowerCase();
  const arobase = propre.lastIndexOf("@");
  if (arobase < 1) return propre;
  const local = propre.slice(0, arobase).split("+")[0];
  const domaine = propre.slice(arobase + 1);
  if (domaine === "gmail.com" || domaine === "googlemail.com") {
    return `${local.replace(/\./g, "")}@gmail.com`;
  }
  return `${local}@${domaine}`;
}

/** Forme d'adresse acceptable : volontairement permissive, mais pas naïve. */
export function emailValide(email: string): boolean {
  const e = email.trim();
  if (e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && !/\.\./.test(e);
}

/**
 * Services de boîtes jetables les plus répandus en Belgique et en France.
 *
 * La liste n'a pas l'ambition d'être exhaustive — il en naît chaque semaine.
 * Elle arrête les plus courants, ce qui suffit à décourager l'ouverture de
 * comptes en série pour cumuler les contestations gratuites.
 */
const DOMAINES_JETABLES = new Set([
  "yopmail.com", "yopmail.fr", "yopmail.net", "cool.fr.nf", "jetable.fr.nf", "courriel.fr.nf",
  "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf", "nospam.ze.tc", "nomail.xl.cx",
  "mega.zik.dj", "speed.1s.fr", "jetable.org", "jetable.com", "mailinator.com", "mailinator.net",
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "sharklasers.com", "grr.la",
  "10minutemail.com", "10minutemail.net", "temp-mail.org", "tempmail.com", "tempmail.net",
  "tempmailo.com", "trashmail.com", "trashmail.de", "trash-mail.com", "getnada.com", "nada.email",
  "dispostable.com", "maildrop.cc", "throwawaymail.com", "mohmal.com", "emailondeck.com",
  "fakeinbox.com", "mintemail.com", "mytemp.email", "tempr.email", "spamgourmet.com",
  "mailnesia.com", "mailcatch.com", "discard.email", "burnermail.io", "inboxkitten.com",
  "spambox.us", "33mail.com", "anonaddy.me", "luxusmail.org", "emailfake.com", "fakemail.net",
  "minuteinbox.com", "tmail.ws", "tmpmail.org", "tmpmail.net", "1secmail.com", "1secmail.net",
]);

export function domaineJetable(email: string): boolean {
  const domaine = email.trim().toLowerCase().split("@")[1] ?? "";
  return DOMAINES_JETABLES.has(domaine);
}
