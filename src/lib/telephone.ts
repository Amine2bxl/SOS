/**
 * Numéros de téléphone : saisie libre, format international en sortie.
 *
 * On tape un numéro comme on le dit (« 0470 12 34 56 », « +32 470… »,
 * « 0032 470… ») ; le serveur, Supabase et la passerelle SMS veulent le format
 * international E.164 (« +32470123456 »). Sans préfixe, le numéro est supposé
 * belge.
 *
 * Module pur, testé directement.
 */

/** Ramène une saisie au format E.164, ou `null` si ce n'est pas un numéro. */
export function normaliserTelephone(brut: string): string | null {
  const nettoye = brut.trim().replace(/[\s.\-/()]/g, "");
  let numero: string;
  if (nettoye.startsWith("+")) numero = nettoye;
  else if (nettoye.startsWith("00")) numero = `+${nettoye.slice(2)}`;
  else if (nettoye.startsWith("0")) numero = `+32${nettoye.slice(1)}`;
  else return null;
  if (!/^\+[1-9]\d{7,14}$/.test(numero)) return null;
  // Belgique : 8 chiffres après l'indicatif pour un fixe, 9 pour un GSM (04…).
  if (numero.startsWith("+32") && !/^\+32(4\d{8}|[1-9]\d{7})$/.test(numero)) return null;
  return numero;
}

/** Vrai pour un GSM belge : seuls eux reçoivent un SMS à coup sûr. */
export const gsmBelge = (e164: string) => /^\+324\d{8}$/.test(e164);

/** « +32 470 •• •• 56 » : assez pour se reconnaître, pas assez pour être lu par-dessus l'épaule. */
export function masquerTelephone(e164: string): string {
  const m = e164.match(/^\+32(4\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (m) return `+32 ${m[1]} •• •• ${m[4]}`;
  return `${e164.slice(0, 4)} •••• ${e164.slice(-2)}`;
}

/** « a•••@gmail.com ». */
export function masquerEmail(email: string): string {
  const [local, domaine] = email.split("@");
  if (!domaine) return email;
  return `${local.charAt(0)}${"•".repeat(Math.min(3, Math.max(1, local.length - 1)))}@${domaine}`;
}

/**
 * Les comptes ouverts par téléphone reçoivent une adresse technique, jamais
 * utilisée pour écrire : elle ne sert qu'à rouvrir la session sur un appareil
 * reconnu. Le domaine `.invalid` est réservé (RFC 2606) : aucun e-mail ne peut
 * y partir par erreur.
 */
export const DOMAINE_TECHNIQUE = "appareils.sos-citizens.invalid";

export const emailTechnique = (userId: string) => `${userId}@${DOMAINE_TECHNIQUE}`;

export const estEmailTechnique = (email: string | null | undefined) => !!email && email.endsWith(`@${DOMAINE_TECHNIQUE}`);

/** L'adresse à afficher : jamais l'adresse technique. */
export const emailAffichable = (email: string | null | undefined) => (estEmailTechnique(email) ? null : (email ?? null));
