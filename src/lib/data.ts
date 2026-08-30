/**
 * Données statiques du site. Aucune base de données n'est nécessaire :
 * le site est entièrement rendu statiquement, ce qui garantit un
 * déploiement Vercel sans variable d'environnement.
 */

/** Informations officielles de l'association (sources publiques : BCE, presse). */
export const ASSO = {
  nom: "SOS Citizens ASBL",
  bce: "1012.534.203",
  tva: "BE 1012.534.203",
  formeJuridique: "Association sans but lucratif (ASBL)",
  constitution: "16 août 2024",
  rue: "Rue Émile Feron 153",
  codePostal: "1060",
  ville: "Saint-Gilles (Bruxelles)",
  pays: "Belgique",
  telephone: "+32 470 53 35 14",
  telephoneLien: "+32470533514",
  email: "azmo007@protonmail.com",
  president: "Mohamed Azouzi",
  administrateurs: ["Mohamed Azouzi", "Mohamed Boutrika"],
} as const;

export const ADRESSE_COMPLETE = `${ASSO.rue}, ${ASSO.codePostal} ${ASSO.ville}`;

/** Chiffres clés mis en avant sur la page d'accueil. */
export const CHIFFRES: { valeur: string; label: string; detail: string }[] = [
  {
    valeur: "220-250",
    label: "dossiers accompagnés",
    detail: "Depuis la création de l'association, en toute gratuité.",
  },
  {
    valeur: "19",
    label: "communes bruxelloises",
    detail: "Chaque commune a ses zones, ses tarifs et ses règles.",
  },
  {
    valeur: "0 €",
    label: "pour être aidé",
    detail: "L'accompagnement est gratuit. Les dons sont libres.",
  },
];

/** Les 3 étapes de l'accompagnement — volontairement courtes. */
export const ETAPES: { titre: string; texte: string }[] = [
  {
    titre: "Vous nous appelez ou nous écrivez",
    texte:
      "Un appel ou un e-mail suffit. Décrivez votre situation et envoyez une photo du courrier que vous avez reçu.",
  },
  {
    titre: "Nous lisons votre dossier avec vous",
    texte:
      "Nous vérifions la nature du document, la commune, les dates, les délais et les preuves dont vous disposez.",
  },
  {
    titre: "Vous envoyez une contestation solide",
    texte:
      "Nous préparons avec vous un courrier motivé et vous expliquons où l'envoyer et comment garder une preuve.",
  },
];

/** Ce que l'association fait — et ne fait pas. Cadre les attentes clairement. */
export const NOUS_FAISONS = [
  "Nous lisons votre courrier et vous expliquons ce qu'il signifie vraiment",
  "Nous vérifions les délais et le stade exact de la procédure",
  "Nous vous aidons à rassembler les bonnes preuves",
  "Nous rédigeons avec vous une contestation motivée",
  "Nous vous aidons à demander les photos et les pièces du dossier",
  "Nous vous orientons si le dossier part chez un huissier",
];

export const NOUS_NE_FAISONS_PAS = [
  "Nous ne sommes pas un cabinet d'avocats",
  "Nous ne promettons jamais l'annulation de votre redevance",
  "Nous ne demandons aucun paiement pour vous aider",
  "Nous ne payons pas votre redevance à votre place",
];

/** Alerte d'actualité affichée en haut du site. */
export const ALERTE = {
  titre: "Important depuis le 15 mars 2026",
  texte:
    "parking.brussels ne traite plus les contestations envoyées par e-mail : elles sont automatiquement rejetées. Vous devez désormais passer par le formulaire en ligne officiel. Gardez toujours une capture d'écran de votre envoi comme preuve.",
};

/* -------------------------------------------------------------------------- */
/*  Comprendre : les documents de la procédure                                */
/* -------------------------------------------------------------------------- */

export type EtapeDoc = {
  titre: string;
  cestQuoi: string;
  aFaire: string;
  gravite: "info" | "attention" | "urgent";
};

export const DOCUMENTS: EtapeDoc[] = [
  {
    titre: "1. La notification initiale",
    cestQuoi:
      "Le premier courrier qui vous réclame une redevance après un contrôle (ScanCar, agent ou caméra). Il indique la référence, le lieu, la date, le montant et la manière de contester.",
    aFaire:
      "C'est le meilleur moment pour agir. Ne payez pas si vous voulez contester : le paiement peut être compris comme une reconnaissance des faits.",
    gravite: "info",
  },
  {
    titre: "2. Le rappel",
    cestQuoi:
      "Envoyé si vous n'avez ni payé ni répondu. Le montant est parfois majoré de frais administratifs.",
    aFaire:
      "Répondez par écrit et gardez une preuve d'envoi. Si vous aviez déjà contesté, signalez-le et joignez votre premier courrier.",
    gravite: "attention",
  },
  {
    titre: "3. La mise en demeure",
    cestQuoi:
      "Un courrier formel qui exige le paiement dans un délai précis avant le recouvrement forcé. C'est le dernier stade à l'amiable.",
    aFaire:
      "Ne l'ignorez surtout pas. Réagissez par écrit dans le délai indiqué et demandez la suspension du recouvrement le temps de l'examen.",
    gravite: "attention",
  },
  {
    titre: "4. La contrainte",
    cestQuoi:
      "Un acte qui rend la dette exécutoire : l'administration peut désormais la récupérer de force.",
    aFaire:
      "Des recours existent, mais les délais sont courts. Contactez-nous rapidement pour vérifier ce qui est encore possible.",
    gravite: "urgent",
  },
  {
    titre: "5. L'huissier de justice",
    cestQuoi:
      "Un huissier intervient pour récupérer la somme, avec des frais supplémentaires importants (saisie, citation).",
    aFaire:
      "À ce stade, un accompagnement individualisé est nécessaire. Appelez-nous, et n'ignorez aucun courrier.",
    gravite: "urgent",
  },
];

/* -------------------------------------------------------------------------- */
/*  Comprendre : les notions de base                                          */
/* -------------------------------------------------------------------------- */

export const NOTIONS: { titre: string; texte: string }[] = [
  {
    titre: "Une redevance n'est pas une amende de police",
    texte:
      "Une redevance de stationnement est une dette administrative réclamée par la commune ou son opérateur. Elle ne vient pas d'un tribunal et ne donne pas de casier. Elle suit sa propre procédure, différente d'un PV de police ou d'une sanction administrative communale (SAC).",
  },
  {
    titre: "La ScanCar",
    texte:
      "Une voiture équipée de caméras qui lit les plaques et les compare aux paiements enregistrés. Chaque contrôle est associé à une heure et à une position. Ces photos et ces données existent : vous avez le droit de les demander.",
  },
  {
    titre: "La zone compte autant que la rue",
    texte:
      "Chaque commune découpe son territoire en zones (rouge, verte, bleue) avec des tarifs, des horaires et des durées différents. C'est le règlement de la zone exacte, à la date du contrôle, qui s'applique.",
  },
  {
    titre: "Arrêt ou stationnement ?",
    texte:
      "S'immobiliser le temps de faire monter ou descendre quelqu'un, ou de charger, n'est pas toujours du stationnement. Mais c'est à vous de prouver la situation : durée, présence au volant, témoin, photo.",
  },
  {
    titre: "Vous avez des droits sur vos données",
    texte:
      "Les photos et les journaux de contrôle sont des données personnelles vous concernant. Le RGPD vous permet d'en demander une copie, indépendamment de votre contestation.",
  },
  {
    titre: "Payer, c'est souvent reconnaître",
    texte:
      "Si vous payez, le dossier est en principe clôturé et il devient très difficile de revenir en arrière. Décidez donc avant de payer : contester ou non.",
  },
];

/** Les preuves qui pèsent le plus dans un dossier. */
export const PREUVES = [
  "Le reçu de paiement horodaté, avec la plaque et la zone",
  "La capture d'écran de l'application montrant la session active",
  "Le relevé bancaire correspondant",
  "Des photos du lieu, de la signalisation et du marquage au sol",
  "La copie de votre carte riverain, professionnelle ou PMR",
  "La preuve que votre plaque était bien enregistrée",
  "Les accusés de réception et copies de tous vos courriers",
  "L'acte de vente ou le contrat de location si le véhicule n'était plus à vous",
];

/* -------------------------------------------------------------------------- */
/*  Motifs de contestation utilisés par le générateur de courrier             */
/* -------------------------------------------------------------------------- */

export type Motif = {
  value: string;
  label: string;
  /** Paragraphe inséré dans le courrier. */
  argument: string;
  /** Pièces à joindre, propres à ce motif. */
  pieces: string[];
};

export const MOTIFS: Motif[] = [
  {
    value: "paiement",
    label: "J'avais payé mon stationnement",
    argument:
      "Le stationnement du véhicule était régulièrement couvert par un paiement au moment du contrôle. Le reçu horodaté joint à la présente mentionne la plaque, la zone et la plage horaire concernées, et démontre que le véhicule était en règle lors du constat.",
    pieces: [
      "Reçu de paiement horodaté (application ou horodateur)",
      "Relevé bancaire correspondant",
    ],
  },
  {
    value: "session",
    label: "Ma session d'application était active",
    argument:
      "Une session de stationnement était active dans l'application au moment précis du contrôle. La capture d'écran jointe indique la date, l'heure de début et de fin, la plaque encodée ainsi que la zone sélectionnée, et couvre l'heure du constat.",
    pieces: [
      "Capture d'écran datée de la session dans l'application",
      "Historique des sessions du compte utilisateur",
    ],
  },
  {
    value: "erreur_plaque",
    label: "La plaque relevée n'est pas la bonne",
    argument:
      "La plaque d'immatriculation mentionnée sur le document reçu ne correspond pas à celle du véhicule concerné. S'agissant d'un contrôle par lecture automatisée, une erreur de lecture ne peut être exclue. Je sollicite dès lors la communication des clichés originaux ayant permis l'identification du véhicule.",
    pieces: [
      "Copie du certificat d'immatriculation",
      "Photographie du véhicule et de sa plaque",
    ],
  },
  {
    value: "carte",
    label: "J'avais une carte valable (riverain, professionnelle, PMR)",
    argument:
      "Le véhicule bénéficiait, à la date du constat, d'une autorisation de stationnement valable pour le lieu concerné. La copie de cette carte est jointe à la présente. Le constat paraît dès lors résulter d'un défaut de prise en compte de cette autorisation dans les bases de données consultées lors du contrôle.",
    pieces: [
      "Copie recto-verso de la carte et de sa durée de validité",
      "Preuve de l'enregistrement de la plaque associée à la carte",
    ],
  },
  {
    value: "horodateur",
    label: "L'horodateur ou l'application ne fonctionnait pas",
    argument:
      "Le dispositif de paiement était indisponible au moment des faits, ce qui m'a placé dans l'impossibilité matérielle de m'acquitter de la redevance. Cette défaillance, indépendante de ma volonté, est documentée par les éléments joints à la présente.",
    pieces: [
      "Photographie de l'horodateur hors service ou capture du message d'erreur",
      "Preuve de la tentative de paiement",
    ],
  },
  {
    value: "signalisation",
    label: "La signalisation était absente ou illisible",
    argument:
      "La signalisation du régime de stationnement applicable n'était pas visible, lisible ou univoque à l'endroit du constat. Un usager normalement attentif ne pouvait raisonnablement identifier l'obligation de paiement. Les photographies jointes documentent l'état des lieux.",
    pieces: [
      "Photographies datées des panneaux et du marquage au sol",
      "Vue d'ensemble situant l'emplacement du véhicule",
    ],
  },
  {
    value: "arret",
    label: "J'étais à l'arrêt, pas en stationnement",
    argument:
      "Le véhicule n'était pas en stationnement mais momentanément à l'arrêt, le temps strictement nécessaire à l'embarquement, au débarquement ou au chargement. Cette immobilisation de courte durée ne constitue pas un stationnement au sens de la réglementation applicable.",
    pieces: [
      "Tout élément établissant la brièveté et l'objet de l'immobilisation",
      "Attestation ou témoignage éventuel",
    ],
  },
  {
    value: "vendu",
    label: "Le véhicule ne m'appartenait plus / était prêté",
    argument:
      "À la date du constat, je n'étais plus le détenteur du véhicule concerné. Les documents joints établissent la date de la cession ou de la mise à disposition du véhicule à un tiers. Je ne puis dès lors être tenu au paiement de la redevance réclamée.",
    pieces: [
      "Acte de vente, contrat de location ou de prêt daté",
      "Preuve de la radiation ou du transfert de la plaque (DIV)",
    ],
  },
  {
    value: "jamais_recu",
    label: "Je n'ai jamais reçu le courrier initial",
    argument:
      "Je n'ai jamais reçu la notification initiale de la redevance réclamée, et n'ai donc pas été mis en mesure de réagir en temps utile. Je sollicite la communication de la preuve de l'envoi de cette notification ainsi que de l'historique complet du dossier, et conteste les frais et majorations qui découleraient de ce défaut d'information.",
    pieces: ["Tout élément relatif à votre adresse officielle à la date des faits"],
  },
  {
    value: "autre",
    label: "Autre situation",
    argument:
      "Je conteste la redevance réclamée pour les motifs exposés ci-dessous, et sollicite un réexamen complet du dossier au vu des éléments que je porte à votre connaissance.",
    pieces: ["Toute pièce utile à l'appui de votre explication"],
  },
];

/** Demandes systématiquement formulées dans le courrier. */
export const DEMANDES_STANDARD = [
  "L'annulation de la redevance réclamée ;",
  "La communication de l'intégralité du dossier, en particulier des photographies originales du contrôle, de leurs métadonnées et des journaux horodatés ;",
  "La communication du règlement-redevance applicable à la date du constat ainsi que du fondement des frais et majorations éventuels ;",
  "La suspension de toute mesure de recouvrement et le gel des frais durant l'examen de la présente contestation ;",
  "Un accusé de réception de la présente, ainsi qu'une décision motivée, individualisée et signée par l'autorité compétente, mentionnant les voies et délais de recours.",
];

/* -------------------------------------------------------------------------- */
/*  Les 19 communes                                                           */
/* -------------------------------------------------------------------------- */

export type Commune = {
  slug: string;
  nom: string;
  zones: string;
  aSavoir: string;
};

export const COMMUNES: Commune[] = [
  { slug: "anderlecht", nom: "Anderlecht", zones: "Zones vertes et rouges, zones de marché ponctuelles.", aSavoir: "Vérifiez les rues en zone mixte et les horaires de marché." },
  { slug: "auderghem", nom: "Auderghem", zones: "Zones vertes, zones rouges près des gares et métros.", aSavoir: "Abords de métro : contrôles ScanCar fréquents." },
  { slug: "berchem-sainte-agathe", nom: "Berchem-Sainte-Agathe", zones: "Zones vertes majoritaires, poches rouges commerciales.", aSavoir: "Règlement communal propre : vérifiez la version applicable." },
  { slug: "bruxelles-ville", nom: "Bruxelles-Ville", zones: "Zones rouges, vertes et bleues ; le Pentagone est en zone rouge stricte.", aSavoir: "Cartes riverains par secteur : vérifiez la correspondance plaque/secteur." },
  { slug: "etterbeek", nom: "Etterbeek", zones: "Zones vertes et rouges, quartier des institutions européennes.", aSavoir: "Régimes particuliers près des institutions européennes." },
  { slug: "evere", nom: "Evere", zones: "Zones vertes et rouges.", aSavoir: "Attention aux rues à la frontière avec Schaerbeek." },
  { slug: "forest", nom: "Forest", zones: "Zones vertes et rouges, abords de la gare de Forest-Midi.", aSavoir: "Contrôles renforcés autour des salles de spectacle." },
  { slug: "ganshoren", nom: "Ganshoren", zones: "Zones vertes, poches rouges près de l'hôpital et du Basilix.", aSavoir: "Zones hospitalières à régime spécifique." },
  { slug: "ixelles", nom: "Ixelles", zones: "Zones rouges et vertes denses, zones bleues résiduelles.", aSavoir: "Très forte densité de ScanCars : conservez vos preuves de session." },
  { slug: "jette", nom: "Jette", zones: "Zones vertes et rouges, abords de l'hôpital universitaire.", aSavoir: "Zones hospitalières : vérifiez le statut particulier de la rue." },
  { slug: "koekelberg", nom: "Koekelberg", zones: "Zones vertes, poche rouge autour de la Basilique.", aSavoir: "Signalisation ponctuelle lors des événements à la Basilique." },
  { slug: "molenbeek-saint-jean", nom: "Molenbeek-Saint-Jean", zones: "Zones vertes et rouges, abords de métro.", aSavoir: "Vérifiez les rues en transition de zone." },
  { slug: "saint-gilles", nom: "Saint-Gilles", zones: "Zones rouges et vertes denses.", aSavoir: "Stationnement très tendu et contrôles fréquents. Siège de notre association." },
  { slug: "saint-josse-ten-noode", nom: "Saint-Josse-ten-Noode", zones: "Zone rouge quasi généralisée.", aSavoir: "Zone rouge stricte : vérifiez les dérogations applicables." },
  { slug: "schaerbeek", nom: "Schaerbeek", zones: "Zones vertes, rouges et bleues étendues.", aSavoir: "Commune très étendue : vérifiez précisément la zone de la rue." },
  { slug: "uccle", nom: "Uccle", zones: "Zones vertes majoritaires, poches rouges commerciales.", aSavoir: "Certaines voiries sont régionales : le gestionnaire peut différer." },
  { slug: "watermael-boitsfort", nom: "Watermael-Boitsfort", zones: "Zones vertes, zones étangs en régime particulier.", aSavoir: "Régime spécifique le week-end près des étangs et des bois." },
  { slug: "woluwe-saint-lambert", nom: "Woluwe-Saint-Lambert", zones: "Zones vertes, poches rouges shopping et métro.", aSavoir: "Zones commerciales à durée limitée." },
  { slug: "woluwe-saint-pierre", nom: "Woluwe-Saint-Pierre", zones: "Zones vertes, poches rouges sur les avenues commerçantes.", aSavoir: "Vérifiez les avenues à régime mixte." },
];

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                        */
/* -------------------------------------------------------------------------- */

export type Faq = { question: string; reponse: string };

export const FAQS: Faq[] = [
  {
    question: "Combien coûte votre aide ?",
    reponse:
      "Rien. L'accompagnement de SOS Citizens ASBL est entièrement gratuit. Nous sommes une ASBL, pas un cabinet. Si vous souhaitez soutenir notre travail, un don libre est possible, mais il n'est jamais une condition pour être aidé.",
  },
  {
    question: "Je viens de recevoir un courrier. Que dois-je faire en premier ?",
    reponse:
      "Ne payez pas tout de suite si vous pensez contester : le paiement clôture généralement le dossier. Regardez d'abord la date du constat, la date du courrier, le délai indiqué pour réagir et la commune concernée. Rassemblez ensuite vos preuves (reçu, capture d'application, photos). Puis contactez-nous ou utilisez notre outil de courrier.",
  },
  {
    question: "Puis-je encore contester par e-mail auprès de parking.brussels ?",
    reponse:
      "Non. Depuis le 15 mars 2026, parking.brussels rejette automatiquement les contestations envoyées par e-mail et impose son formulaire en ligne. Utilisez ce formulaire, collez-y votre courrier et conservez impérativement une capture d'écran de l'envoi et de l'éventuel numéro de suivi.",
  },
  {
    question: "Quel est le délai pour contester ?",
    reponse:
      "Le délai figure sur le document que vous avez reçu et varie selon la commune et le type de document (souvent entre 14 et 30 jours). C'est cette mention-là qui fait foi. En cas de doute, agissez le plus tôt possible : un courrier envoyé tôt est toujours plus solide qu'un courrier tardif.",
  },
  {
    question: "Ma session d'application était active, et j'ai quand même reçu une redevance.",
    reponse:
      "C'est l'un des cas les plus fréquents. Conservez la capture d'écran montrant la date, l'heure, la plaque et la zone, ainsi que le relevé bancaire. Contestez en joignant ces pièces et demandez les photographies du contrôle pour comparer les heures.",
  },
  {
    question: "Puis-je demander les photos prises par la ScanCar ?",
    reponse:
      "Oui, et c'est souvent décisif. Vous pouvez demander les photographies originales, leurs métadonnées et les journaux horodatés du contrôle : d'une part dans le cadre de votre contestation, d'autre part au titre du RGPD en tant que données personnelles. Ce sont deux démarches distinctes et complémentaires.",
  },
  {
    question: "Que se passe-t-il si je ne réponds pas ?",
    reponse:
      "Le dossier avance sans vous : rappel, mise en demeure, puis contrainte et enfin huissier, avec des frais qui s'ajoutent à chaque étape. Répondre par écrit, même pour contester, stoppe cette mécanique et laisse une trace.",
  },
  {
    question: "Un huissier me contacte déjà. Est-ce trop tard ?",
    reponse:
      "Ce n'est pas nécessairement trop tard, mais les délais sont courts et la situation demande un examen individuel. Appelez-nous rapidement et surtout, n'ignorez aucun courrier de l'huissier.",
  },
  {
    question: "Garantissez-vous que ma redevance sera annulée ?",
    reponse:
      "Non, et méfiez-vous de quiconque vous le promet. Nous vous aidons à comprendre votre dossier, à réunir les bonnes preuves et à envoyer une contestation solide dans les délais. La décision finale appartient à l'administration, puis le cas échéant au juge.",
  },
  {
    question: "Êtes-vous des avocats ?",
    reponse:
      "Non. SOS Citizens ASBL est une association citoyenne d'information et d'accompagnement. Beaucoup de personnes sont renvoyées vers un avocat sans en avoir les moyens : notre rôle est de leur permettre de se défendre elles-mêmes. Pour les situations les plus lourdes, nous vous orientons vers un professionnel.",
  },
];
