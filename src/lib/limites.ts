import "server-only";
import { creerClientAdmin } from "@/lib/supabase/admin";

/**
 * Limitation de débit des Server Actions.
 *
 * Le compte à rebours de 60 secondes sur « renvoyer le code » vit dans le
 * navigateur : une ligne de console l'enlève. Sans compteur côté serveur, une
 * boucle sur l'inscription épuise le quota d'envoi d'e-mails de l'association
 * en quelques minutes — et fait partir des messages non sollicités vers des
 * adresses qui ne nous ont rien demandé. C'est le genre d'incident qui fait
 * blacklister un domaine d'expédition, et un domaine blacklisté, ce sont tous
 * les codes de confirmation qui ne partent plus.
 *
 * Deux implémentations, dans cet ordre :
 *
 * 1. **En base** (`consommer_jeton`), dès que la clé `service_role` est
 *    configurée. C'est la seule qui compte vraiment : le site tourne sur des
 *    fonctions sans état, et deux appels successifs n'atterrissent presque
 *    jamais sur la même instance.
 * 2. **En mémoire**, à défaut. Elle ne voit qu'une instance, donc un attaquant
 *    réparti sur plusieurs la contourne. Elle arrête quand même la boucle
 *    naïve, qui est le cas courant, et ne coûte rien.
 *
 * Ce module ne jette jamais : une panne du compteur ne doit pas empêcher
 * quelqu'un de créer son compte. En cas de doute, on laisse passer.
 */

export type Quota = {
  /** Nombre d'appels autorisés par fenêtre. */
  max: number;
  /** Durée de la fenêtre, en secondes. */
  fenetreSecondes: number;
};

/**
 * Les quotas, réunis ici pour qu'on puisse les relire d'un coup d'œil.
 *
 * Ils sont volontairement larges : l'objectif est d'arrêter l'abus, pas de
 * gêner quelqu'un qui se trompe trois fois de mot de passe. Les actions qui
 * envoient un e-mail sont les plus serrées, parce que ce sont les seules dont
 * l'abus coûte de l'argent et de la réputation d'expéditeur.
 */
export const QUOTAS = {
  /** Création de compte : un e-mail part à chaque appel. */
  inscription: { max: 5, fenetreSecondes: 3600 },
  /** Renvoi de code : même e-mail, même coût. */
  renvoiCode: { max: 5, fenetreSecondes: 3600 },
  /** Vérification du code : serré, sinon les 10⁶ combinaisons sont testables. */
  verificationCode: { max: 10, fenetreSecondes: 900 },
  /** Création de dossier : protège la base d'un remplissage automatique. */
  creationDossier: { max: 20, fenetreSecondes: 3600 },
  /** Demande d'adhésion : rien ne justifie d'en faire plus. */
  adhesion: { max: 5, fenetreSecondes: 3600 },
  /** Analyse par le moteur (ouverte aux visiteurs, comptée par adresse IP). */
  analyse: { max: 60, fenetreSecondes: 3600 },
  /** Rédaction d'une lettre (membres connectés). */
  lettre: { max: 60, fenetreSecondes: 3600 },
  /** « Demandez à SOS » (ouvert aux visiteurs, compté par adresse IP). */
  question: { max: 120, fenetreSecondes: 3600 },
  /** Envoi d'un code de connexion : un e-mail part à chaque appel. */
  codeConnexion: { max: 6, fenetreSecondes: 3600 },
} satisfies Record<string, Quota>;

/**
 * La connexion n'est pas dans cette liste, et c'est volontaire : elle se fait
 * directement du navigateur vers l'API d'authentification de Supabase, sans
 * passer par notre serveur. Nous ne pouvons donc pas la compter. Supabase
 * applique son propre plafond par adresse IP sur cette route ; c'est la
 * plateforme qui protège là, pas nous.
 */

export type NomQuota = keyof typeof QUOTAS;

/* -------------------------------------------------------------------------- */
/*  Repli en mémoire                                                          */
/* -------------------------------------------------------------------------- */

type Compteur = { compte: number; expire: number };

/**
 * Le compteur local survit entre deux requêtes d'une même instance, le temps
 * qu'elle reste chaude. On le range sur `globalThis` pour qu'un rechargement de
 * module en développement ne le remette pas à zéro.
 */
const memoire: Map<string, Compteur> = ((
  globalThis as { __limitesSos?: Map<string, Compteur> }
).__limitesSos ??= new Map());

/** Plafond de l'empreinte mémoire : au-delà, on vide les entrées périmées. */
const ENTREES_MAX = 10_000;

function consommerEnMemoire(cle: string, quota: Quota): boolean {
  const maintenant = Date.now();

  if (memoire.size > ENTREES_MAX) {
    for (const [k, v] of memoire) if (v.expire <= maintenant) memoire.delete(k);
  }

  const courant = memoire.get(cle);
  if (!courant || courant.expire <= maintenant) {
    memoire.set(cle, { compte: 1, expire: maintenant + quota.fenetreSecondes * 1000 });
    return true;
  }

  courant.compte += 1;
  return courant.compte <= quota.max;
}

/* -------------------------------------------------------------------------- */

/**
 * Consomme un jeton. Renvoie `false` quand l'appel doit être refusé.
 *
 * `sujet` identifie qui est compté : une adresse e-mail, un identifiant
 * d'utilisateur. Il est mis en minuscules pour qu'une majuscule ne crée pas un
 * second quota.
 */
export async function consommerJeton(nom: NomQuota, sujet: string): Promise<boolean> {
  const quota = QUOTAS[nom];
  const cle = `${nom}:${sujet.trim().toLowerCase()}`;

  const admin = creerClientAdmin();
  if (admin) {
    try {
      const { data, error } = await admin.rpc("consommer_jeton", {
        p_cle: cle,
        p_max: quota.max,
        p_fenetre_secondes: quota.fenetreSecondes,
      });
      if (!error && typeof data === "boolean") return data;
    } catch {
      // Base injoignable : on retombe sur le compteur local plutôt que de
      // bloquer tout le monde.
    }
  }

  return consommerEnMemoire(cle, quota);
}

/**
 * Message affiché quand le quota est atteint.
 *
 * Il dit ce qui se passe et quoi faire, sans jamais révéler si l'adresse
 * existe — la limitation s'applique de la même façon à une adresse inconnue.
 */
export function messageQuotaAtteint(nom: NomQuota): string {
  const minutes = Math.round(QUOTAS[nom].fenetreSecondes / 60);
  const attente = minutes >= 60 ? "une heure" : `${minutes} minutes`;
  return `Trop de tentatives. Réessayez dans ${attente}. Si vous êtes bloqué, écrivez-nous : nous débloquons votre compte à la main.`;
}
