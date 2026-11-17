/**
 * Réparer une lecture grâce à sa clé de contrôle.
 *
 * Une communication structurée et un IBAN portent une clé (modulo 97). L'OCR
 * confond des caractères qui se ressemblent : O et 0, I et 1, S et 5, B et 8.
 * Quand la clé ne tombe pas juste, on essaie les confusions connues ; si UNE
 * seule correction rend la clé valable, c'est la bonne lecture. S'il y en a
 * plusieurs, on ne choisit pas : le champ reste « à vérifier ».
 *
 * Module pur, testé directement.
 */

/** Une lettre lue à la place d'un chiffre. */
const LETTRE_VERS_CHIFFRE: Record<string, string> = {
  O: "0", o: "0", Q: "0", D: "0",
  I: "1", l: "1", "|": "1", i: "1",
  Z: "2", z: "2",
  S: "5", s: "5",
  G: "6", b: "6",
  B: "8",
  g: "9", q: "9",
};

/** Les chiffres que l'OCR prend l'un pour l'autre. */
const CHIFFRES_VOISINS: Record<string, string[]> = {
  "0": ["8", "6", "9"],
  "1": ["7", "4"],
  "2": ["7"],
  "3": ["8", "9"],
  "4": ["1", "9"],
  "5": ["6", "3"],
  "6": ["5", "8", "0"],
  "7": ["1", "2"],
  "8": ["3", "0", "6"],
  "9": ["4", "3", "0"],
};

const versChiffres = (brut: string) =>
  [...brut.replace(/[\s./+\-]/g, "")].map((c) => (/\d/.test(c) ? c : (LETTRE_VERS_CHIFFRE[c] ?? "?"))).join("");

function cleOgmValide(douze: string): boolean {
  if (!/^\d{12}$/.test(douze)) return false;
  let reste = 0;
  for (const c of douze.slice(0, 10)) reste = (reste * 10 + Number(c)) % 97;
  return (reste || 97) === Number(douze.slice(10));
}

function mod97(chiffres: string): number {
  let reste = 0;
  for (const c of chiffres) reste = (reste * 10 + Number(c)) % 97;
  return reste;
}

/** IBAN belge : BE + 2 chiffres de clé + 12 chiffres. */
function ibanBelgeValide(quatorze: string): boolean {
  if (!/^\d{14}$/.test(quatorze)) return false;
  // Réarrangé : compte (12) + « BE » en chiffres (1114) + clé (2).
  return mod97(quatorze.slice(2) + "1114" + quatorze.slice(0, 2)) === 1;
}

export type Reparation = { valeur: string; repare: boolean } | null;

/** Les corrections à un caractère qui rendent la clé valable. */
function corrections(chiffres: string, valide: (s: string) => boolean): string[] {
  const trouvees = new Set<string>();
  for (let i = 0; i < chiffres.length; i++) {
    for (const autre of CHIFFRES_VOISINS[chiffres[i]] ?? []) {
      const essai = chiffres.slice(0, i) + autre + chiffres.slice(i + 1);
      if (valide(essai)) trouvees.add(essai);
    }
  }
  return [...trouvees];
}

/**
 * Communication structurée : rend les douze chiffres, corrigés si une seule
 * correction est possible. `null` si rien de sûr n'en sort.
 */
export function reparerCommunication(brut: string): Reparation {
  const chiffres = versChiffres(brut);
  if (chiffres.length !== 12 || chiffres.includes("?")) return null;
  const lettresConverties = chiffres !== brut.replace(/[\s./+\-]/g, "");
  if (cleOgmValide(chiffres)) return { valeur: chiffres, repare: lettresConverties };
  const pistes = corrections(chiffres, cleOgmValide);
  return pistes.length === 1 ? { valeur: pistes[0], repare: true } : null;
}

/**
 * Numéro de compte belge (les douze chiffres après la clé IBAN) : il porte sa
 * propre clé, les deux derniers chiffres valant les dix premiers modulo 97.
 */
function compteBelgeValide(douze: string): boolean {
  if (!/^\d{12}$/.test(douze)) return false;
  return (mod97(douze.slice(0, 10)) || 97) === Number(douze.slice(10));
}

/** La clé IBAN qui revient à un numéro de compte belge. */
function cleIbanBelge(compte: string): string {
  return String(98 - mod97(compte + "111400")).padStart(2, "0");
}

/**
 * IBAN belge : rend « BE » + quatorze chiffres, corrigés si une seule
 * correction est possible.
 *
 * Deux clés se contrôlent l'une l'autre. Si le numéro de compte passe sa clé
 * nationale, il est juste à une chance sur cent près ; la clé IBAN, elle, se
 * déduit du compte : quand c'est elle que l'OCR a mal lue (« BESS » pour
 * « BE68 »), on la recalcule.
 */
export function reparerIbanBelge(brut: string): Reparation {
  const compact = brut.replace(/[\s.\-]/g, "");
  // « B » se lit aussi « 8 » ou « G », « E » se lit « 3 ».
  if (!/^[B8G][E3]/i.test(compact)) return null;
  const chiffres = versChiffres(compact.slice(2));
  if (chiffres.length !== 14) return null;
  const converti = chiffres !== compact.slice(2) || !/^BE/i.test(compact);
  if (!chiffres.includes("?") && ibanBelgeValide(chiffres)) return { valeur: `BE${chiffres}`, repare: converti };
  const compte = chiffres.slice(2);
  if (compteBelgeValide(compte)) return { valeur: `BE${cleIbanBelge(compte)}${compte}`, repare: true };
  if (chiffres.includes("?")) return null;
  const pistes = corrections(chiffres, ibanBelgeValide);
  return pistes.length === 1 ? { valeur: `BE${pistes[0]}`, repare: true } : null;
}
