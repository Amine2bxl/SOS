/**
 * Les rappels automatiques : la plateforme qui travaille quand on l'oublie.
 *
 * Chaque matin, une tâche planifiée passe les dossiers en revue et écrit à
 * ceux qui risquent de laisser filer quelque chose :
 *
 *  - une échéance qui approche (trois jours, puis la veille) ;
 *  - une contestation restée sans réponse depuis un mois — il faut relancer.
 *
 * Ce module décide QUOI envoyer, sans rien envoyer : il est pur, et testé.
 * L'envoi vit dans `app/api/cron/rappels/route.ts`. Chaque rappel envoyé est
 * consigné dans l'historique du dossier ; c'est aussi ce qui empêche de
 * l'envoyer deux fois.
 */

import { JOURS_AVANT_RELANCE, joursDepuis, type Dossier } from "./dossiers-format";

export type CleRappel = "echeance-3" | "echeance-1" | "relance";

export type Rappel = {
  cle: CleRappel;
  /** Titre consigné dans l'historique du dossier — et clé de déduplication. */
  titre: string;
  sujet: string;
  message: string;
  libelleLien: string;
  /** Onglet de la fiche dossier vers lequel mène le lien. */
  ancre: "lettre" | "suivi";
};

export const TITRES_RAPPEL: Record<CleRappel, string> = {
  "echeance-3": "Rappel envoyé : plus que 3 jours",
  "echeance-1": "Rappel envoyé : dernier jour",
  relance: "Rappel envoyé : relancer l'administration",
};

const ACTIFS = ["nouveau", "a_contester"];
const ENVOYES = ["contestation_envoyee", "en_attente_reponse"];

/**
 * Le rappel à envoyer aujourd'hui pour un dossier, s'il y en a un.
 *
 * Des fenêtres plutôt que des jours exacts : si la tâche du matin a sauté un
 * jour, le rappel part le lendemain au lieu de ne jamais partir. La
 * déduplication par l'historique garantit qu'il ne part qu'une fois.
 */
export function rappelDu(
  dossier: Pick<Dossier, "statut" | "date_envoi_contestation">,
  joursRestants: number | null,
  dejaEnvoyes: ReadonlySet<string>,
): Rappel | null {
  const pasEncore = (cle: CleRappel) => !dejaEnvoyes.has(TITRES_RAPPEL[cle]);

  if (ACTIFS.includes(dossier.statut) && joursRestants !== null) {
    if (joursRestants >= 0 && joursRestants <= 1 && pasEncore("echeance-1")) {
      return {
        cle: "echeance-1",
        titre: TITRES_RAPPEL["echeance-1"],
        sujet: joursRestants === 0 ? "Dernier jour pour contester" : "Demain, dernier jour pour contester",
        message:
          joursRestants === 0
            ? "C'est aujourd'hui le dernier jour du délai. Votre lettre est prête dans votre dossier : il ne reste qu'à l'envoyer, et à garder la preuve de l'envoi."
            : "Le délai se termine demain. Votre lettre est prête dans votre dossier : envoyez-la aujourd'hui, et gardez la preuve de l'envoi.",
        libelleLien: "Envoyer ma lettre",
        ancre: "lettre",
      };
    }
    // Trois jours avant — sauf si le rappel de la veille est déjà parti.
    if (joursRestants >= 2 && joursRestants <= 3 && pasEncore("echeance-3") && pasEncore("echeance-1")) {
      return {
        cle: "echeance-3",
        titre: TITRES_RAPPEL["echeance-3"],
        sujet: `Plus que ${joursRestants} jours pour contester`,
        message: `Il reste ${joursRestants} jours pour contester. Votre lettre est prête dans votre dossier : relisez-la, complétez ce qui est surligné, et envoyez-la.`,
        libelleLien: "Voir ma lettre",
        ancre: "lettre",
      };
    }
    return null;
  }

  if (ENVOYES.includes(dossier.statut)) {
    const depuis = joursDepuis(dossier.date_envoi_contestation);
    if (depuis !== null && depuis >= JOURS_AVANT_RELANCE && pasEncore("relance")) {
      return {
        cle: "relance",
        titre: TITRES_RAPPEL.relance,
        sujet: "Toujours pas de réponse ? Il est temps de relancer",
        message: `Votre contestation est partie il y a ${depuis} jours, sans réponse. Une relance écrite fige votre position avant que la procédure n'avance : nous l'avons préparée dans votre dossier.`,
        libelleLien: "Préparer la relance",
        ancre: "lettre",
      };
    }
  }

  return null;
}
