/**
 * Ce qu'une contestation doit contenir pour être recevable.
 *
 * Une contestation rejetée sur la forme, c'est un dossier perdu pour rien.
 * Ce module rassemble les exigences des formulaires officiels — celui de
 * parking.brussels et ceux des communes — et vérifie, champ par champ, qu'un
 * dossier est complet avant l'envoi.
 *
 * Deux niveaux, volontairement distincts :
 *  - `bloquant` : sans cette information, le service ne peut pas traiter la
 *    demande. Elle identifie le dossier, le véhicule ou le requérant.
 *  - `recommande` : la demande passe sans, mais elle est nettement plus solide
 *    avec. C'est là que se joue la différence entre « examiné » et « accepté ».
 *
 * Les délais et frais cités proviennent de la procédure publiée par
 * parking.brussels. Ils varient d'une commune à l'autre : c'est toujours la
 * mention portée sur le courrier reçu qui fait foi, et l'interface le répète.
 */

import { MOTIFS } from "./data";
import type { SaisieLettre } from "./lettre";

export type Niveau = "bloquant" | "recommande";

export type Exigence = {
  cle: keyof SaisieLettre;
  libelle: string;
  niveau: Niveau;
  /** Pourquoi l'administration la demande. Affiché tel quel à l'utilisateur. */
  pourquoi: string;
};

/**
 * Le tronc commun, exigé quel que soit le motif.
 *
 * L'ordre suit celui d'un formulaire officiel : qui vous êtes, quel véhicule,
 * quel constat, pourquoi vous contestez.
 */
export const EXIGENCES: Exigence[] = [
  {
    cle: "nom",
    libelle: "Votre nom",
    niveau: "bloquant",
    pourquoi: "Une contestation anonyme est écartée sans examen.",
  },
  {
    cle: "prenom",
    libelle: "Votre prénom",
    niveau: "bloquant",
    pourquoi: "Il figure avec le nom sur toute correspondance administrative.",
  },
  {
    cle: "adresse",
    libelle: "Votre rue et numéro",
    niveau: "bloquant",
    pourquoi: "La décision vous est notifiée par courrier à cette adresse.",
  },
  {
    cle: "codePostal",
    libelle: "Votre code postal",
    niveau: "bloquant",
    pourquoi: "Complète l'adresse de notification.",
  },
  {
    cle: "ville",
    libelle: "Votre commune",
    niveau: "bloquant",
    pourquoi: "Complète l'adresse de notification.",
  },
  {
    cle: "email",
    libelle: "Votre adresse e-mail",
    niveau: "recommande",
    pourquoi: "Le service s'en sert pour vous poser ses questions ; sans réponse rapide, le dossier se referme.",
  },
  {
    cle: "telephone",
    libelle: "Votre téléphone",
    niveau: "recommande",
    pourquoi: "Permet un contact direct quand un point demande à être éclairci.",
  },
  {
    cle: "plaque",
    libelle: "La plaque d'immatriculation",
    niveau: "bloquant",
    pourquoi: "C'est elle qui relie le constat à un véhicule : sans elle, rien n'est identifiable.",
  },
  {
    cle: "reference",
    libelle: "La référence du dossier",
    niveau: "bloquant",
    pourquoi: "Elle figure en haut de votre courrier et désigne le constat contesté.",
  },
  {
    cle: "dateConstat",
    libelle: "La date du constat",
    niveau: "bloquant",
    pourquoi: "Elle situe les faits et fait courir les délais.",
  },
  {
    cle: "heureConstat",
    libelle: "L'heure du constat",
    niveau: "recommande",
    pourquoi: "Décisive quand vous aviez payé : elle permet de comparer votre reçu au moment du contrôle.",
  },
  {
    cle: "lieuConstat",
    libelle: "Le lieu du constat (rue et numéro)",
    niveau: "recommande",
    pourquoi: "Détermine la zone tarifaire applicable, et donc la règle qu'on vous oppose.",
  },
  {
    cle: "communeConstat",
    libelle: "La commune du constat",
    niveau: "bloquant",
    pourquoi: "Chaque commune a son règlement et son service : c'est elle qui décide.",
  },
  {
    cle: "montant",
    libelle: "Le montant réclamé",
    niveau: "recommande",
    pourquoi: "Permet de vérifier le calcul et de repérer des frais ajoutés à tort.",
  },
  {
    cle: "communication",
    libelle: "La communication structurée",
    niveau: "recommande",
    pourquoi: "Identifie le dossier à coup sûr, mieux qu'une référence recopiée.",
  },
  {
    cle: "explication",
    libelle: "Votre explication des faits",
    niveau: "recommande",
    pourquoi: "Le motif type ne dit pas ce qui vous est arrivé. Votre récit, daté et horodaté, fait la différence.",
  },
];

export type Manque = Exigence & { valeurActuelle: string };

export type EvaluationDossier = {
  /** 0 à 100 : part des exigences satisfaites, les bloquantes comptant double. */
  score: number;
  bloquants: Manque[];
  recommandes: Manque[];
  /** Pièces justificatives attendues pour le motif retenu. */
  pieces: string[];
  /** Vrai quand plus rien de bloquant ne manque. */
  envoyable: boolean;
};

/** Vrai quand un champ est réellement renseigné. */
function rempli(saisie: SaisieLettre, cle: keyof SaisieLettre): boolean {
  const valeur = saisie[cle];
  if (typeof valeur === "boolean") return valeur;
  return String(valeur ?? "").trim().length > 0;
}

/**
 * Évalue un dossier de contestation.
 *
 * Les exigences bloquantes pèsent double dans le score : un dossier à qui il
 * ne manque qu'un « recommandé » doit se lire comme presque prêt, alors qu'un
 * dossier sans plaque ne l'est pas du tout.
 */
export function evaluerDossier(saisie: SaisieLettre): EvaluationDossier {
  const bloquants: Manque[] = [];
  const recommandes: Manque[] = [];

  let obtenu = 0;
  let total = 0;

  for (const exigence of EXIGENCES) {
    const poids = exigence.niveau === "bloquant" ? 2 : 1;
    total += poids;

    if (rempli(saisie, exigence.cle)) {
      obtenu += poids;
      continue;
    }

    const manque: Manque = { ...exigence, valeurActuelle: "" };
    if (exigence.niveau === "bloquant") bloquants.push(manque);
    else recommandes.push(manque);
  }

  const motif = MOTIFS.find((m) => m.value === saisie.motif) ?? MOTIFS[0];
  const pieces = [...motif.pieces, "Copie du courrier reçu"];
  if (saisie.dejaPaye) pieces.push("Preuve du paiement déjà effectué");

  return {
    score: total === 0 ? 100 : Math.round((obtenu / total) * 100),
    bloquants,
    recommandes,
    pieces,
    envoyable: bloquants.length === 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  Délais                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Délai de contestation applicable à parking.brussels : dix jours calendrier à
 * compter de la réception de l'invitation à payer. Plusieurs communes
 * appliquent le même délai, d'autres non — la mention du courrier prime
 * toujours, et l'interface le rappelle à chaque fois qu'elle affiche ce calcul.
 */
export const DELAI_CONTESTATION_JOURS = 10;

export type Echeance = {
  /** Date limite calculée, au format ISO. */
  limite: string;
  joursRestants: number;
  /** Vrai lorsque le délai est déjà dépassé. */
  depasse: boolean;
};

/** Date limite de contestation, calculée depuis la date d'envoi du courrier. */
export function echeanceContestation(
  dateEnvoiISO: string,
  aujourdhui = new Date(),
): Echeance | null {
  if (!dateEnvoiISO) return null;
  const depart = new Date(`${dateEnvoiISO}T00:00:00Z`);
  if (Number.isNaN(depart.getTime())) return null;

  const limite = new Date(depart);
  limite.setUTCDate(limite.getUTCDate() + DELAI_CONTESTATION_JOURS);

  const debutJour = Date.UTC(
    aujourdhui.getUTCFullYear(),
    aujourdhui.getUTCMonth(),
    aujourdhui.getUTCDate(),
  );
  const joursRestants = Math.round((limite.getTime() - debutJour) / 86_400_000);

  return {
    limite: limite.toISOString().slice(0, 10),
    joursRestants,
    depasse: joursRestants < 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  La procédure de recouvrement                                              */
/* -------------------------------------------------------------------------- */

export type EtapeRecouvrement = {
  titre: string;
  quand: string;
  cout: string;
  aFaire: string;
};

/**
 * Ce qui arrive si rien n'est fait, étape par étape.
 *
 * Savoir que la note grimpe de 15 € à chaque rappel, et qu'un huissier
 * intervient au bout de la chaîne, change la façon dont on traite un courrier
 * qu'on avait mis de côté. Source : procédure de recouvrement publiée par
 * parking.brussels ; les montants et délais communaux peuvent différer.
 */
export const PROCEDURE_RECOUVREMENT: EtapeRecouvrement[] = [
  {
    titre: "L'invitation à payer",
    quand: "Après le constat",
    cout: "Le montant de la redevance",
    aFaire: "C'est le moment de contester : le délai court dès la réception, et il est court.",
  },
  {
    titre: "Le rappel",
    quand: "Au plus tôt 40 jours après le premier courrier",
    cout: "+ 15 € de frais administratifs",
    aFaire: "Contester reste possible, mais la note a déjà augmenté.",
  },
  {
    titre: "La mise en demeure",
    quand: "Si le rappel reste sans effet",
    cout: "Frais supplémentaires",
    aFaire: "Dernier échange avant la voie judiciaire. Ne la laissez pas passer.",
  },
  {
    titre: "La contrainte",
    quand: "30 jours après la mise en demeure",
    cout: "Titre exécutoire : les frais s'alourdissent nettement",
    aFaire: "Un huissier peut désormais vous la signifier. Faites-vous accompagner.",
  },
  {
    titre: "L'huissier de justice",
    quand: "Après signification de la contrainte",
    cout: "Frais d'huissier, puis mesures d'exécution",
    aFaire: "Il reste des moyens, mais ils sont techniques : contactez-nous sans attendre.",
  },
];

/**
 * Point que le site doit répéter, parce qu'il surprend tout le monde :
 * contester ne suspend pas l'obligation de payer dans le délai indiqué. Si la
 * contestation aboutit, les sommes versées sont remboursées.
 */
export const CONTESTER_NE_SUSPEND_PAS_LE_PAIEMENT =
  "Introduire une contestation ne vous dispense pas de payer dans le délai indiqué sur votre courrier. Si votre contestation est acceptée, la procédure est annulée et les sommes déjà versées vous sont remboursées.";

/* -------------------------------------------------------------------------- */
/*  Le profil, rempli une fois pour toutes                                    */
/* -------------------------------------------------------------------------- */

export type ChampProfil = {
  cle: "prenom" | "nom" | "adresse" | "code_postal" | "commune" | "telephone";
  libelle: string;
  niveau: Niveau;
};

/**
 * Les coordonnées que toute contestation réclame.
 *
 * Les renseigner une fois dans le profil, c'est ne plus jamais les retaper :
 * chaque nouvelle lettre les reprend automatiquement. C'est le seul endroit du
 * site où l'on demande à l'utilisateur de saisir quelque chose deux fois — et
 * précisément ce que cette liste sert à éviter.
 */
export const CHAMPS_PROFIL: ChampProfil[] = [
  { cle: "prenom", libelle: "Prénom", niveau: "bloquant" },
  { cle: "nom", libelle: "Nom", niveau: "bloquant" },
  { cle: "adresse", libelle: "Rue et numéro", niveau: "bloquant" },
  { cle: "code_postal", libelle: "Code postal", niveau: "bloquant" },
  { cle: "commune", libelle: "Commune", niveau: "bloquant" },
  { cle: "telephone", libelle: "Téléphone", niveau: "recommande" },
];

export type CompletudeProfil = {
  score: number;
  manquants: ChampProfil[];
  complet: boolean;
};

/** Où en est le profil, pour le dire à l'utilisateur sans qu'il ait à chercher. */
export function completudeProfil(
  profil: Partial<Record<ChampProfil["cle"], string | null>> | null,
): CompletudeProfil {
  const manquants = CHAMPS_PROFIL.filter(
    (c) => !String(profil?.[c.cle] ?? "").trim(),
  );
  return {
    score: Math.round(((CHAMPS_PROFIL.length - manquants.length) / CHAMPS_PROFIL.length) * 100),
    manquants,
    complet: manquants.length === 0,
  };
}
