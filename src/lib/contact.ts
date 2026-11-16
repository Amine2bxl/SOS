/**
 * Le formulaire de contact : ses sujets, et la validation de ce qu'il reçoit.
 *
 * Module pur, partagé par le formulaire (navigateur) et l'action serveur, et
 * testé directement. Le serveur revalide tout : ce que le navigateur vérifie
 * n'est qu'une politesse envers la personne qui écrit.
 */

export const SUJETS_CONTACT = [
  { id: "redevance", libelle: "Une redevance de stationnement" },
  { id: "amende", libelle: "Une amende routière" },
  { id: "sac", libelle: "Une sanction administrative communale" },
  { id: "administration", libelle: "Un litige avec une administration" },
  { id: "mediation", libelle: "Une médiation" },
  { id: "adhesion", libelle: "L'adhésion à l'association" },
  { id: "presse", libelle: "Presse et médias" },
  { id: "autre", libelle: "Autre chose" },
] as const;

export type IdSujet = (typeof SUJETS_CONTACT)[number]["id"];

export const sujetValide = (v: unknown): v is IdSujet =>
  typeof v === "string" && SUJETS_CONTACT.some((s) => s.id === v);

export const libelleSujet = (id: IdSujet) => SUJETS_CONTACT.find((s) => s.id === id)?.libelle ?? id;

/** Les messages sont effacés au bout de douze mois (tâche planifiée en base). */
export const CONSERVATION_MOIS = 12;

export const LONGUEUR_MESSAGE = { min: 20, max: 4000 } as const;

/** Un humain met plus de trois secondes à remplir un formulaire. */
export const DUREE_MINIMALE_MS = 3000;

export type MessageContact = {
  nom: string;
  email: string;
  sujet: IdSujet;
  message: string;
};

export type ResultatValidation = { ok: true; valeur: MessageContact } | { ok: false; erreur: string; champ?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valide un envoi. Les champs pièges (`site_web`, rempli seulement par les
 * robots, et l'horodatage d'ouverture du formulaire) font échouer en silence :
 * l'appelant affiche un succès sans rien envoyer, pour ne rien apprendre au
 * robot.
 */
export function validerMessage(
  brut: Record<string, unknown>,
  maintenant = Date.now(),
): ResultatValidation | { ok: false; robot: true } {
  if (typeof brut.site_web === "string" && brut.site_web.trim() !== "") return { ok: false, robot: true };
  const ouvert = Number(brut.ouvert_le);
  if (Number.isFinite(ouvert) && ouvert > 0 && maintenant - ouvert < DUREE_MINIMALE_MS) return { ok: false, robot: true };

  const nom = typeof brut.nom === "string" ? brut.nom.trim().replace(/\s+/g, " ") : "";
  const email = typeof brut.email === "string" ? brut.email.trim().toLowerCase() : "";
  const message = typeof brut.message === "string" ? brut.message.trim() : "";

  if (nom.length < 2 || nom.length > 120) return { ok: false, erreur: "Indiquez votre nom.", champ: "nom" };
  if (!EMAIL.test(email) || email.length > 254)
    return { ok: false, erreur: "Cette adresse e-mail ne semble pas valide : c'est là que nous vous répondrons.", champ: "email" };
  if (!sujetValide(brut.sujet)) return { ok: false, erreur: "Choisissez le sujet de votre message.", champ: "sujet" };
  if (message.length < LONGUEUR_MESSAGE.min)
    return { ok: false, erreur: "Votre message est un peu court : décrivez votre situation en quelques lignes.", champ: "message" };
  if (message.length > LONGUEUR_MESSAGE.max)
    return { ok: false, erreur: `Votre message dépasse ${LONGUEUR_MESSAGE.max} caractères : résumez l'essentiel.`, champ: "message" };
  if (brut.consentement !== "on" && brut.consentement !== true)
    return {
      ok: false,
      erreur: "Cochez la case qui nous autorise à utiliser ces données pour vous répondre.",
      champ: "consentement",
    };

  return { ok: true, valeur: { nom, email, sujet: brut.sujet, message } };
}
