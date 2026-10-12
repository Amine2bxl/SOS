/**
 * Refus des mots de passe manifestement cassables.
 *
 * Huit caractères, c'est la règle légale minimale, et « 12345678 » les a. Les
 * comptes du site contiennent l'adresse du domicile, la plaque et le courrier
 * officiel de leurs titulaires : un compte repris, c'est une fuite de données
 * personnelles, pas un désagrément.
 *
 * Supabase sait refuser les mots de passe apparus dans des fuites connues
 * (vérification HaveIBeenPwned), mais l'option est désactivée sur ce projet et
 * ne s'active que depuis le tableau de bord. Ce module couvre, en attendant, ce
 * qui constitue l'écrasante majorité des mots de passe devinés : les suites
 * triviales, les classiques universels, et le mot de passe qui reprend l'adresse
 * e-mail ou le nom de la personne.
 *
 * Volontairement sans contrainte de composition (« une majuscule, un chiffre,
 * un caractère spécial ») : elle produit `Azerty1!` et une note collée sous le
 * clavier. Une phrase longue vaut mieux, et c'est ce que le message suggère.
 */

/**
 * Les mots de passe les plus utilisés au monde, et leurs variantes locales.
 *
 * La liste est courte à dessein : elle n'est pas un pare-feu, elle attrape ce
 * qu'on tape quand on n'a pas envie de choisir. La vraie protection contre les
 * fuites connues est l'option Supabase, à activer dans le tableau de bord.
 */
const COURANTS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "password123",
  "motdepasse",
  "motdepasse1",
  "azertyuiop",
  "qwertyuiop",
  "azerty123",
  "qwerty123",
  "iloveyou",
  "princess",
  "sunshine",
  "football",
  "baseball",
  "superman",
  "starwars",
  "bruxelles",
  "belgique",
  "anderlecht",
  "chocolat",
  "bonjour1",
  "soscitizens",
  "abcd1234",
  "admin123",
  "aaaaaaaa",
  "11111111",
  "00000000",
]);

/** Suite croissante ou décroissante de chiffres, ou même caractère répété. */
function suiteTriviale(mot: string): boolean {
  if (/^(.)\1+$/.test(mot)) return true;

  const chiffres = /^\d+$/.test(mot);
  if (!chiffres) return false;

  let croissante = true;
  let decroissante = true;
  for (let i = 1; i < mot.length; i++) {
    const ecart = mot.charCodeAt(i) - mot.charCodeAt(i - 1);
    if (ecart !== 1) croissante = false;
    if (ecart !== -1) decroissante = false;
  }
  return croissante || decroissante;
}

/** Retire les substitutions de caractères les plus connues (@→a, 0→o, 3→e…). */
function deleet(mot: string): string {
  return mot
    .replace(/[@4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t");
}

/** Morceaux du contexte personnel qu'un mot de passe ne doit pas reprendre. */
function morceauxPersonnels({
  email,
  prenom,
  nom,
}: {
  email?: string;
  prenom?: string;
  nom?: string;
}): string[] {
  const avantArobase = (email ?? "").split("@")[0] ?? "";
  return [avantArobase, prenom ?? "", nom ?? ""]
    .map((m) => m.toLowerCase().replace(/[^a-z0-9]/g, ""))
    // En dessous de quatre lettres, la coïncidence est trop probable pour
    // qu'on refuse un mot de passe à cause d'elle.
    .filter((m) => m.length >= 4);
}

/**
 * Renvoie le message à afficher si le mot de passe est à refuser, sinon `null`.
 *
 * Chaque message dit ce qui ne va pas **et** quoi faire : « trop faible » tout
 * seul n'aide personne.
 */
export function motDePasseTropFaible(
  motDePasse: string,
  contexte: { email?: string; prenom?: string; nom?: string } = {},
): string | null {
  const mot = motDePasse.trim();

  if (mot.length < 8) {
    return "Choisissez un mot de passe d'au moins 8 caractères.";
  }

  const minuscule = mot.toLowerCase();

  if (COURANTS.has(minuscule) || COURANTS.has(deleet(minuscule))) {
    return "Ce mot de passe figure parmi les plus utilisés au monde : il est testé en premier. Prenez plutôt une phrase qui n'a de sens que pour vous.";
  }

  if (suiteTriviale(mot)) {
    return "Une suite de chiffres ou un caractère répété se devine immédiatement. Prenez plutôt une phrase qui n'a de sens que pour vous.";
  }

  for (const morceau of morceauxPersonnels(contexte)) {
    if (minuscule.includes(morceau)) {
      return "Votre mot de passe reprend votre nom ou votre adresse e-mail : c'est la première chose qu'on essaie. Choisissez autre chose.";
    }
  }

  // Un mot de passe long est solide même sans caractère exotique : on arrête
  // les contrôles là plutôt que d'imposer une recette.
  if (mot.length >= 16) return null;

  if (new Set(minuscule).size < 5) {
    return "Ce mot de passe compte trop peu de caractères différents. Allongez-le, ou prenez une phrase.";
  }

  return null;
}
