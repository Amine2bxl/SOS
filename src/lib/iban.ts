/**
 * Validation d'un IBAN par sa clé de contrôle (ISO 13616).
 *
 * Elle sert deux fois dans le projet, pour la même raison : savoir si une
 * suite de caractères est un vrai numéro de compte ou une coquille.
 *
 * - À la **lecture d'un courrier**, l'OCR confond le 0 et le O, le 1 et le I.
 *   Un IBAN mal lu passe inaperçu — il a la bonne forme — et c'est seulement au
 *   moment du virement que la banque le refuse. La clé de contrôle le détecte
 *   tout de suite, ce qui permet d'afficher le champ comme « à vérifier » au
 *   lieu de le présenter comme sûr.
 * - À l'**affichage du compte de l'association**, pour ne jamais faire recopier
 *   un numéro invalide.
 *
 * Module pur, sans dépendance : il tourne dans le navigateur comme sur le
 * serveur, et il est testé directement.
 */

/**
 * Vrai si la clé de contrôle est correcte.
 *
 * Attention à ce que cette fonction ne dit pas : un IBAN valide au sens de la
 * clé peut parfaitement désigner un compte qui n'existe pas. La clé attrape les
 * fautes de recopie, pas les numéros inventés.
 */
export function ibanValide(brut: string): boolean {
  const compact = brut.replace(/[\s.-]/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(compact)) return false;

  // L'IBAN est réarrangé (les quatre premiers caractères passent à la fin),
  // chaque lettre devient sa position dans l'alphabet + 9, et le nombre obtenu
  // doit valoir 1 modulo 97. Le reste se calcule chiffre par chiffre : le
  // nombre dépasse de très loin ce qu'un entier JavaScript représente
  // exactement, et un calcul en flottant donnerait un faux verdict.
  const reorganise = compact.slice(4) + compact.slice(0, 4);
  let reste = 0;
  for (const caractere of reorganise) {
    const morceau = /\d/.test(caractere)
      ? caractere
      : String(caractere.charCodeAt(0) - 55); // 'A' → 10
    for (const chiffre of morceau) reste = (reste * 10 + Number(chiffre)) % 97;
  }
  return reste === 1;
}

/** Met un IBAN au format lisible, par groupes de quatre caractères. */
export function formaterIban(brut: string): string {
  return brut
    .replace(/[\s.-]/g, "")
    .toUpperCase()
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
