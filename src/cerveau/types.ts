/**
 * Le vocabulaire du moteur SOS.
 *
 * Le moteur ne « devine » rien et n'invente rien : il applique des règles
 * écrites, à des faits établis. C'est un choix, pas une limite. Pour une
 * démarche juridique, un modèle qui génère du texte librement peut citer un
 * article de loi qui n'existe pas ; un moteur de règles ne peut citer que ce
 * que sa base contient, et chacune de ses conclusions se relit et se vérifie.
 * Il tourne sur nos serveurs, sans service extérieur ni clé d'API, en
 * quelques millisecondes.
 *
 * Trois couches :
 *  - les FAITS : ce qu'on sait du dossier (lu sur le courrier, ou répondu par
 *    l'utilisateur) ;
 *  - la BASE : ce qu'on sait du droit et de la pratique (régions, procédure,
 *    moyens de défense, fiches de savoir) ;
 *  - l'ANALYSE : ce que le moteur conclut en confrontant les deux.
 */

export type Region = "bruxelles" | "wallonie" | "flandre";
export type Langue = "fr" | "nl";

/** Le stade de la procédure : il dicte l'urgence et la stratégie. */
export type Stade =
  | "notification"
  | "premier_rappel"
  | "deuxieme_rappel"
  | "mise_en_demeure"
  | "contrainte"
  | "courrier_huissier";

/**
 * La fiabilité d'une connaissance.
 *
 * - `etablie` : reprise de la procédure publiée par l'organisme, ou d'un
 *   principe général sans débat. Le moteur peut l'affirmer.
 * - `a_confirmer` : solide en pratique mais variable d'une commune à l'autre,
 *   ou pas encore validée par l'association. Le moteur s'en sert, mais la
 *   lettre la formule avec prudence (« je vous saurais gré de vérifier »)
 *   plutôt que de l'affirmer. Rien de ce qui est à confirmer n'est présenté à
 *   l'administration comme une certitude.
 */
export type Fiabilite = "etablie" | "a_confirmer";

/** Force d'un moyen de défense, telle que l'expérience la mesure. */
export type Force = "solide" | "serieux" | "possible";

/* -------------------------------------------------------------------------- */
/*  Les faits                                                                 */
/* -------------------------------------------------------------------------- */

export type IdQuestion =
  | "paiement"
  | "carte"
  | "vehicule"
  | "signalisation"
  | "tentative_paiement"
  | "duree"
  | "courrier_initial"
  | "deja_conteste"
  | "deja_paye"
  | "doublon";

export type Reponses = Partial<Record<IdQuestion, string>>;

export type Faits = {
  region?: Region | null;
  commune?: string | null;
  /** Organisme qui réclame : parking.brussels, une commune, un concessionnaire… */
  crediteur?: string | null;
  stade?: Stade | null;
  montant?: number | null;
  dateConstat?: string | null;
  heureConstat?: string | null;
  /** Date d'envoi du courrier : c'est d'elle que court le délai de contestation. */
  dateEnvoi?: string | null;
  /** Date limite imprimée sur le courrier (souvent celle du paiement). */
  dateEcheance?: string | null;
  plaque?: string | null;
  lieu?: string | null;
  zone?: string | null;
  reference?: string | null;
  communication?: string | null;
  /** Langue du courrier reçu : elle propose celle de la réponse. */
  langueDocument?: Langue | null;
  /** Réponses aux questions du moteur. */
  reponses?: Reponses;
  /** Date de référence (ISO) : « aujourd'hui », injectable pour les tests. */
  aujourdhui?: string;
};

/* -------------------------------------------------------------------------- */
/*  La base                                                                   */
/* -------------------------------------------------------------------------- */

export type OptionQuestion = {
  id: string;
  libelle: string;
  /** Icône du jeu SOS (voir src/components/icones.tsx). */
  icone?: string;
};

export type Question = {
  id: IdQuestion;
  intitule: string;
  /** Une ligne qui dit pourquoi on pose la question. */
  pourquoi: string;
  options: OptionQuestion[];
  /** Poser la question seulement si elle peut changer l'analyse. */
  quand: (f: Faits) => boolean;
};

export type TexteBilingue = { fr: string; nl: string };

export type Moyen = {
  id: string;
  /** Titre court, à la première personne, tel que l'utilisateur le dirait. */
  titre: string;
  /** Pourquoi cet argument porte, en langage clair. */
  explication: string;
  force: Force;
  fiabilite: Fiabilite;
  icone: string;
  /** Le moyen s'applique-t-il à ces faits ? */
  applicable: (f: Faits) => boolean;
  /** Pièces à joindre pour qu'il tienne. */
  pieces: string[];
  /** Paragraphe de la lettre, en français et en néerlandais. */
  paragraphe: (f: Faits) => TexteBilingue;
  /** Fondement, quand il existe : texte, procédure, principe. */
  source?: string;
};

export type EtapeProcedure = {
  stade: Stade;
  titre: string;
  quand: string;
  surcout: string;
  aFaire: string;
};

export type InfoRegion = {
  id: Region;
  nom: string;
  court: string;
  langues: Langue[];
  /** Le mot qu'on emploie sur place pour la redevance. */
  terme: TexteBilingue;
  /** Le cadre, en deux phrases. */
  cadre: string;
  /** Délai de contestation par défaut, en jours, s'il est connu. */
  delaiContestationJours: number | null;
  sourceDelai?: string;
  /** Profondeur de ce que la base sait de la région. */
  couverture: "detaillee" | "generale";
  procedure: EtapeProcedure[];
  fiabilite: Fiabilite;
  /** Le texte qui organise le recouvrement, quand on le connaît. */
  baseRecouvrement?: { texte: string; fiabilite: Fiabilite };
};

/* -------------------------------------------------------------------------- */
/*  L'analyse                                                                 */
/* -------------------------------------------------------------------------- */

export type Urgence = "depasse" | "critique" | "haute" | "normale" | "inconnue";

export type Delai = {
  /** Ce que la date représente. */
  nature: "contestation" | "paiement" | "recours" | "reponse";
  limite: string | null;
  joursRestants: number | null;
  /** D'où vient la date : lue sur le courrier, calculée, ou inconnue. */
  origine: "document" | "calcule" | "inconnu";
  explication: string;
};

export type CodeStrategie =
  | "contester"
  | "contester_frais"
  | "repondre_huissier"
  | "demander_preuves"
  | "payer"
  | "rembourser";

export type Strategie = {
  code: CodeStrategie;
  titre: string;
  explication: string;
};

export type MoyenRetenu = {
  id: string;
  titre: string;
  explication: string;
  force: Force;
  fiabilite: Fiabilite;
  icone: string;
  pieces: string[];
  source?: string;
};

export type NiveauSolidite = "solide" | "defendable" | "fragile";

export type Analyse = {
  region: Region | null;
  /** Vrai si la région a été lue sur le courrier ; faux si elle est supposée. */
  regionCertaine: boolean;
  stade: Stade;
  stadeLibelle: string;
  /** 1 (premier courrier) à 6 (huissier). */
  gravite: number;
  delai: Delai;
  urgence: Urgence;
  /** Ce qui arrive si rien n'est fait. */
  inaction: { etape: string; surcout: string; quand: string } | null;
  strategie: Strategie;
  moyens: MoyenRetenu[];
  solidite: { niveau: NiveauSolidite; explication: string };
  /** Pièces à rassembler, sans doublon, dans l'ordre d'importance. */
  pieces: string[];
  /** Ce que l'utilisateur doit faire, dans l'ordre. */
  etapes: string[];
  /** Points de vigilance à afficher en évidence. */
  alertes: string[];
  /** Questions encore utiles pour affiner l'analyse. */
  questions: Question[];
  /** Langue proposée pour la lettre. */
  langueLettre: Langue;
  /** Combien de vérifications le moteur a effectuées. */
  verifications: number;
};

export type TypeLettre =
  | "contestation"
  | "relance"
  | "reponse_huissier"
  | "demande_preuves"
  | "remboursement";

export type Identite = {
  prenom: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email?: string;
  telephone?: string;
};
