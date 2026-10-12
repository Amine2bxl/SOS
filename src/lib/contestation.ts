/**
 * Deux repères partagés par le site et l'espace membre : la procédure de
 * recouvrement (ce qui arrive si l'on ne fait rien) et les coordonnées que
 * toute lettre réclame.
 *
 * Le reste — délais, arguments, lettres — vit dans le moteur (`src/cerveau`).
 * Les délais et frais cités ici proviennent de la procédure publiée par
 * parking.brussels. Ils varient d'une commune à l'autre : c'est toujours la
 * mention portée sur le courrier reçu qui fait foi, et l'interface le répète.
 */

export type Niveau = "bloquant" | "recommande";

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
