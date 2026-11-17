/**
 * Données de référence du site, disponibles sans base de données.
 *
 * Les règles des communes vivent aussi en base (`communes`, `communes_regles`),
 * où l'association les tient à jour : la page « Communes » les y lit à chaque
 * visite. Les repères ci-dessous restent le filet quand la base ne répond pas,
 * et la référence du moteur d'analyse, qui doit tourner sans réseau.
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
  /** Numéro WhatsApp international, sans « + » ni espaces (pour wa.me). */
  whatsapp: "32470533514",
  email: "azmo007@protonmail.com",
  /** Compte TikTok de l'association. */
  tiktok: "soscitizens",
  /**
   * Compte de l'ASBL pour les dons et les adhésions. Repris du site
   * soscitizens.be, où il est publié au nom de « SOS CITIZENS asbl » avec le
   * même numéro d'entreprise (BCE 1012.534.203) ; clé de contrôle vérifiée le
   * 17/11/2026. La variable `IBAN_ASSOCIATION` le remplace si elle est définie.
   */
  iban: "BE39 0689 5382 9319",
  president: "Mohamed Azouzi",
  administrateurs: ["Mohamed Azouzi", "Mohamed Boutrika"],
} as const;

export const ADRESSE_COMPLETE = `${ASSO.rue}, ${ASSO.codePostal} ${ASSO.ville}`;

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
    titre: "1. La notification",
    cestQuoi: "Le premier courrier après le contrôle (ScanCar, agent, caméra) : référence, lieu, date, montant.",
    aFaire: "Le meilleur moment pour agir. Vous contestez ? Ne payez pas : payer vaut reconnaissance des faits.",
    gravite: "info",
  },
  {
    titre: "2. Le rappel",
    cestQuoi: "Ni payé, ni répondu. Des frais s'ajoutent parfois.",
    aFaire: "Répondez par écrit, avec preuve d'envoi. Déjà contesté ? Joignez votre premier courrier.",
    gravite: "attention",
  },
  {
    titre: "3. La mise en demeure",
    cestQuoi: "Paiement exigé dans un délai précis. Dernière étape avant le recouvrement forcé.",
    aFaire: "Répondez par écrit dans le délai. Demandez la suspension du recouvrement.",
    gravite: "attention",
  },
  {
    titre: "4. La contrainte",
    cestQuoi: "La dette devient exécutoire : l'administration peut la récupérer de force.",
    aFaire: "Des recours existent, avec des délais courts. Écrivez-nous vite.",
    gravite: "urgent",
  },
  {
    titre: "5. L'huissier",
    cestQuoi: "Il vient récupérer la somme. Les frais grimpent : saisie, citation.",
    aFaire: "Écrivez-nous. N'ignorez aucun courrier de l'huissier.",
    gravite: "urgent",
  },
];

/* -------------------------------------------------------------------------- */
/*  Comprendre : les notions de base                                          */
/* -------------------------------------------------------------------------- */

export const NOTIONS: { titre: string; texte: string }[] = [
  {
    titre: "Une redevance n'est pas une amende",
    texte: "Une dette administrative, réclamée par la commune ou son opérateur. Pas de tribunal, pas de casier. Ni PV de police, ni sanction communale (SAC).",
  },
  {
    titre: "La ScanCar",
    texte: "Une voiture à caméras : elle lit les plaques et les compare aux paiements. Chaque contrôle laisse une photo, une heure, une position. Vous pouvez les réclamer.",
  },
  {
    titre: "La zone compte",
    texte: "Rouge, verte, bleue : chaque zone a ses tarifs et ses horaires. Ce qui compte : le règlement de votre zone, le jour du contrôle.",
  },
  {
    titre: "Arrêt ou stationnement ?",
    texte: "Charger, déposer quelqu'un : pas toujours du stationnement. À prouver : durée, présence au volant, témoin, photo.",
  },
  {
    titre: "Vos données",
    texte: "Les photos et journaux du contrôle sont vos données personnelles. Le RGPD vous donne droit à une copie, à part de la contestation.",
  },
  {
    titre: "Payer, c'est reconnaître",
    texte: "Payer clôt le dossier. Revenir en arrière devient très difficile. Décidez avant de payer.",
  },
];

/** Les preuves qui pèsent le plus dans un dossier. */
export const PREUVES = [
  "Ticket horodaté (plaque, zone)",
  "Capture de l'appli : session active",
  "Relevé bancaire du paiement",
  "Photos du lieu, des panneaux, du marquage",
  "Carte riverain, professionnelle ou PMR",
  "Preuve que la plaque était enregistrée",
  "Copies et accusés de réception de vos courriers",
  "Acte de vente ou contrat de location, si le véhicule n'était plus à vous",
];

/* -------------------------------------------------------------------------- */
/*  Motifs de contestation utilisés par le générateur de courrier             */
/* -------------------------------------------------------------------------- */

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

/**
 * Note de prudence : le stationnement bruxellois est encadré par le règlement
 * communal de chaque commune, en vigueur à la date des faits. Les tarifs,
 * horaires et plages de gratuité changent régulièrement. Ce que le site affirme
 * ici repose sur le cadre général (zones rouge/verte/bleue, gestion par
 * parking.brussels) — jamais sur un tarif supposé exact. Chaque fiche renvoie
 * vers la source officielle à consulter pour le montant précis.
 */

export type Commune = {
  slug: string;
  nom: string;
  /** Nom néerlandais : les courriers, les panneaux et les plaques le portent aussi. */
  nl: string;
  /** Code INS (Statbel) : l'identifiant officiel de la commune, stable. */
  ins: string;
  /** Codes postaux principaux (bpost). */
  codesPostaux: string[];
  /** Nature des zones : rouge, verte, bleue. Repère stable, à confirmer. */
  zones: string;
  /** Plages horaires de paiement, par commune (à vérifier dans le règlement). */
  heures: string;
  /** Périodes où le stationnement est généralement libre. */
  gratuit: string;
  /** Moyens de paiement reconnus. */
  moyens: string;
  /** Régime des cartes de riverain. */
  riverain: string;
  /** Point de vigilance pour une contestation. */
  aSavoir: string;
  /** Site officiel de la commune (source du règlement). */
  siteOfficiel: string;
  /**
   * Page précise des tarifs/zones sur parking.brussels, validée en amont.
   * Les communes sans page dédiée renvoient vers la page « réglementations
   * par commune », la plus précise qui existe pour elles.
   */
  parking: string;
};

/** Page officielle des règlementations communales (toutes communes). */
const PARKING_REGLEMENTATIONS = "https://www.parking.brussels/fr/reglementations/par-commune";

export const COMMUNES: Commune[] = [
  {
    slug: "anderlecht",
    nom: "Anderlecht",
    nl: "Anderlecht",
    ins: "21001",
    codesPostaux: ["1070"],
    zones: "Zones vertes et rouges, avec des poches de stationnement mixte autour des marchés et des commerces.",
    heures: "Payant selon la zone, généralement en journée en semaine et le samedi ; grille exacte dans le règlement communal.",
    gratuit: "Souvent libre la nuit et le dimanche et les jours fériés, selon la zone.",
    moyens: "Application parking.brussels, SMS 4411 et horodateurs. Certaines zones sont en paiement uniquement numérique.",
    riverain: "Cartes de riverain délivrées par la commune, avec enregistrement de la plaque.",
    aSavoir: "Vérifiez les rues en zone mixte et les horaires de marché : le régime peut changer à quelques rues près.",
    siteOfficiel: "https://www.anderlecht.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/anderlecht",
  },
  {
    slug: "auderghem",
    nom: "Auderghem",
    nl: "Oudergem",
    ins: "21002",
    codesPostaux: ["1160"],
    zones: "Zones vertes, et zones rouges à proximité des gares et des métros (Herrmann-Debroux notamment).",
    heures: "Payant en journée en semaine ; le samedi peut être soumis à paiement près des pôles de transport.",
    gratuit: "Couramment libre la nuit, le dimanche et les jours fériés en zone verte.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de cartes de riverain propre à la commune, soumis à enregistrement de la plaque.",
    aSavoir: "Abords de métro : contrôles ScanCar fréquents. Conservez la preuve de votre session de paiement.",
    siteOfficiel: "https://auderghem.be",
    parking: PARKING_REGLEMENTATIONS,
  },
  {
    slug: "berchem-sainte-agathe",
    nom: "Berchem-Sainte-Agathe",
    nl: "Sint-Agatha-Berchem",
    ins: "21003",
    codesPostaux: ["1082"],
    zones: "Zones vertes majoritaires, avec des poches rouges le long des axes commerciaux.",
    heures: "Paiement en journée en semaine dans les zones concernées ; détail dans le règlement communal.",
    gratuit: "Souvent gratuit la nuit, le dimanche et les jours fériés hors zones rouges.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Cartes de riverain délivrées par la commune pour les résidents.",
    aSavoir: "Règlement communal propre : vérifiez toujours la version applicable à la date du constat.",
    siteOfficiel: "https://www.berchem-sainte-agathe.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/berchem-sainte-agathe",
  },
  {
    slug: "bruxelles-ville",
    nom: "Bruxelles-Ville",
    nl: "Brussel",
    ins: "21004",
    codesPostaux: ["1000", "1020", "1120", "1130"],
    zones: "Zones rouges, vertes et bleues ; le Pentagone est en zone rouge stricte et dense.",
    heures: "Stationnement payant sur de larges plages : en journée et souvent le samedi ; certaines zones en soirée.",
    gratuit: "La gratuité (nuit, dimanche, jours fériés) varie fort selon la zone — à vérifier impérativement.",
    moyens: "Application parking.brussels, SMS, horodateurs ; paiement numérique souvent seul accepté en zone rouge.",
    riverain: "Cartes riverains par secteur du Pentagone : la correspondance plaque/secteur doit être vérifiée.",
    aSavoir: "Centre-ville à forte pression : une session active mais mal enregistrée justifie souvent de contester avec la capture d'écran.",
    siteOfficiel: "https://www.bruxelles.be",
    parking: PARKING_REGLEMENTATIONS,
  },
  {
    slug: "etterbeek",
    nom: "Etterbeek",
    nl: "Etterbeek",
    ins: "21005",
    codesPostaux: ["1040"],
    zones: "Zones vertes et rouges, avec un régime particulier autour du quartier des institutions européennes.",
    heures: "Payant en journée en semaine et souvent le samedi dans les zones rouges.",
    gratuit: "Nuit, dimanche et jours fériés généralement libres en zones vertes.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Cartes de riverain communales, avec règles propres près des institutions européennes.",
    aSavoir: "Régimes particuliers près des institutions européennes : vérifiez le statut exact de la rue.",
    siteOfficiel: "https://etterbeek.be",
    parking: PARKING_REGLEMENTATIONS,
  },
  {
    slug: "evere",
    nom: "Evere",
    nl: "Evere",
    ins: "21006",
    codesPostaux: ["1140"],
    zones: "Zones vertes et rouges, concentrées autour des pôles commerciaux et des nœuds de transport.",
    heures: "Paiement en journée en semaine ; le samedi selon les zones.",
    gratuit: "Libre la nuit et le dimanche en général.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de riverain propre à la commune.",
    aSavoir: "Attention aux rues à la frontière avec Schaerbeek : la commune du constat peut être l'une ou l'autre.",
    siteOfficiel: "https://evere.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/evere",
  },
  {
    slug: "forest",
    nom: "Forest",
    nl: "Vorst",
    ins: "21007",
    codesPostaux: ["1190"],
    zones: "Zones vertes et rouges, renforcées autour de la gare de Forest-Midi.",
    heures: "Payant en journée en semaine et près de la gare.",
    gratuit: "Nuit, dimanche et jours fériés généralement libres.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Cartes de riverain délivrées par la commune.",
    aSavoir: "Contrôles renforcés autour des salles de spectacle (Forest National) lors des événements.",
    siteOfficiel: "https://forest.brussels",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/forest",
  },
  {
    slug: "ganshoren",
    nom: "Ganshoren",
    nl: "Ganshoren",
    ins: "21008",
    codesPostaux: ["1083"],
    zones: "Zones vertes, avec des poches rouges près de l'hôpital et du Basilix.",
    heures: "Paiement en journée en semaine dans les zones concernées.",
    gratuit: "Libre la nuit et le dimanche en général.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de riverain de la commune.",
    aSavoir: "Zones hospitalières à régime spécifique : vérifiez les panneaux et le règlement.",
    siteOfficiel: "https://www.ganshoren.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/ganshoren",
  },
  {
    slug: "ixelles",
    nom: "Ixelles",
    nl: "Elsene",
    ins: "21009",
    codesPostaux: ["1050"],
    zones: "Zones rouges et vertes denses, zones bleues résiduelles.",
    heures: "Payant sur de larges plages, en semaine et souvent le samedi ; proximité des campus et commerces.",
    gratuit: "Nuit, dimanche et jours fériés généralement libres, selon zone.",
    moyens: "Application parking.brussels, SMS, horodateurs ; paiement numérique souvent privilégié.",
    riverain: "Réseau dense de cartes de riverain, avec secteurs précis.",
    aSavoir: "Très forte densité de ScanCars : conservez vos preuves de session et demandez les photos du contrôle.",
    siteOfficiel: "https://www.ixelles.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/ixelles",
  },
  {
    slug: "jette",
    nom: "Jette",
    nl: "Jette",
    ins: "21010",
    codesPostaux: ["1090"],
    zones: "Zones vertes et rouges, avec un régime propre autour de l'hôpital universitaire.",
    heures: "Payant en journée en semaine ; le samedi selon les zones.",
    gratuit: "Libre la nuit, le dimanche et les jours fériés hors zones rouges.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de riverain communal.",
    aSavoir: "Zones hospitalières : vérifiez le statut particulier de la rue et des panneaux.",
    siteOfficiel: "https://www.jette.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/jette",
  },
  {
    slug: "koekelberg",
    nom: "Koekelberg",
    nl: "Koekelberg",
    ins: "21011",
    codesPostaux: ["1081"],
    zones: "Zones vertes, avec une poche rouge autour de la Basilique et du pôle touristique.",
    heures: "Payant en journée en semaine dans les zones concernées.",
    gratuit: "Libre la nuit et le dimanche en général.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Cartes de riverain délivrées par la commune.",
    aSavoir: "Signalisation ponctuelle lors des événements à la Basilique : photographiez le cadre du stationnement.",
    siteOfficiel: "https://www.koekelberg.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/koekelberg",
  },
  {
    slug: "molenbeek-saint-jean",
    nom: "Molenbeek-Saint-Jean",
    nl: "Sint-Jans-Molenbeek",
    ins: "21012",
    codesPostaux: ["1080"],
    zones: "Zones vertes et rouges, avec des zones denses autour des métros et axes commerçants.",
    heures: "Payant en journée en semaine et souvent le samedi dans les zones rouges.",
    gratuit: "Nuit, dimanche et jours fériés généralement libres.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de riverain propre à la commune.",
    aSavoir: "Vérifiez les rues en transition de zone : une frontière mal posée peut fonder une contestation.",
    siteOfficiel: "https://www.molenbeek.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/molenbeek-saint-jean",
  },
  {
    slug: "saint-gilles",
    nom: "Saint-Gilles",
    nl: "Sint-Gillis",
    ins: "21013",
    codesPostaux: ["1060"],
    zones: "Zones rouges et vertes denses ; le Quartier Louise est en zone rouge.",
    heures: "Payant sur de larges plages en semaine et le samedi.",
    gratuit: "Nuit, dimanche et jours fériés généralement libres, selon zone.",
    moyens: "Application parking.brussels, SMS, horodateurs.",
    riverain: "Cartes de riverain par secteur, avec enregistrement de plaque.",
    aSavoir: "Stationnement très tendu et contrôles fréquents. Siège de notre association.",
    siteOfficiel: "https://stgilles.brussels",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/saint-gilles",
  },
  {
    slug: "saint-josse-ten-noode",
    nom: "Saint-Josse-ten-Noode",
    nl: "Sint-Joost-ten-Node",
    ins: "21014",
    codesPostaux: ["1210"],
    zones: "Zone rouge quasi généralisée, très dense.",
    heures: "Paiement quasi permanent en journée, y compris souvent le samedi.",
    gratuit: "Plages de gratuité limitées : vérifiez impérativement le règlement.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de riverain strict dû à la densité.",
    aSavoir: "Zone rouge stricte : vérifiez les dérogations et cartes applicables avant de contester.",
    siteOfficiel: "https://www.saint-josse.irisnet.be",
    parking: PARKING_REGLEMENTATIONS,
  },
  {
    slug: "schaerbeek",
    nom: "Schaerbeek",
    nl: "Schaarbeek",
    ins: "21015",
    codesPostaux: ["1030"],
    zones: "Zones vertes, rouges et bleues sur un territoire étendu et hétérogène.",
    heures: "Payant en journée en semaine, selon la zone ; grand axe commerçant sous paiement élargi.",
    gratuit: "Nuit, dimanche et jours fériés généralement libres hors zones rouges.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de riverain avec secteurs précis.",
    aSavoir: "Commune très étendue : vérifiez précisément la zone de la rue exacte du constat.",
    siteOfficiel: "https://www.schaerbeek.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/schaerbeek",
  },
  {
    slug: "uccle",
    nom: "Uccle",
    nl: "Ukkel",
    ins: "21016",
    codesPostaux: ["1180"],
    zones: "Zones vertes majoritaires, poches rouges commerciales (Chaussée d'Alsemberg, place Saint-Job).",
    heures: "Payant en journée en semaine dans les zones concernées.",
    gratuit: "Libre la nuit et le dimanche en général.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Cartes de riverain selon secteurs.",
    aSavoir: "Certaines voiries sont régionales : le gestionnaire (commune ou Région) peut différer et importe pour la contestation.",
    siteOfficiel: "https://www.uccle.be",
    parking: PARKING_REGLEMENTATIONS,
  },
  {
    slug: "watermael-boitsfort",
    nom: "Watermael-Boitsfort",
    nl: "Watermaal-Bosvoorde",
    ins: "21017",
    codesPostaux: ["1170"],
    zones: "Zones vertes, et un régime particulier autour des étangs et des bois.",
    heures: "Payant en journée en semaine dans les zones concernées.",
    gratuit: "Régime spécifique le week-end près des étangs et des bois : à vérifier.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de riverain communal.",
    aSavoir: "Le week-end près des étangs change le régime : photographiez la signalisation du jour du constat.",
    siteOfficiel: "https://www.watermael-boitsfort.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/watermael-boitsfort",
  },
  {
    slug: "woluwe-saint-lambert",
    nom: "Woluwe-Saint-Lambert",
    nl: "Sint-Lambrechts-Woluwe",
    ins: "21018",
    codesPostaux: ["1200"],
    zones: "Zones vertes, poches rouges sur les pôles shopping et métro (Tomberg, Roodebeek).",
    heures: "Payant en journée en semaine et souvent le samedi dans les zones rouges.",
    gratuit: "Nuit, dimanche et jours fériés généralement libres.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de riverain par secteur.",
    aSavoir: "Zones commerciales à durée limitée : une session validée mais hors plage exacte mérite vérification.",
    siteOfficiel: "https://www.woluwe1200.be",
    parking: PARKING_REGLEMENTATIONS,
  },
  {
    slug: "woluwe-saint-pierre",
    nom: "Woluwe-Saint-Pierre",
    nl: "Sint-Pieters-Woluwe",
    ins: "21019",
    codesPostaux: ["1150"],
    zones: "Zones vertes, poches rouges sur les avenues commerçantes.",
    heures: "Payant en journée en semaine dans les zones concernées.",
    gratuit: "Libre la nuit, le dimanche et les jours fériés en général.",
    moyens: "Application parking.brussels, SMS et horodateurs.",
    riverain: "Régime de riverain communal.",
    aSavoir: "Vérifiez les avenues à régime mixte : la règle peut changer d'un côté à l'autre de la rue.",
    siteOfficiel: "https://www.woluwe1150.be",
    parking: "https://www.parking.brussels/fr/stationner-sa-voiture/woluwe-saint-pierre",
  },
];

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                        */
/* -------------------------------------------------------------------------- */

export type Faq = { question: string; reponse: string };

export const FAQS: Faq[] = [
  {
    question: "Contester me dispense-t-il de payer ?",
    reponse:
      "Non. Contester ne suspend pas le délai de paiement imprimé sur le courrier. Si vous gagnez, ce que vous avez payé est remboursé. Gardez une preuve de chaque envoi.",
  },
  {
    question: "Combien coûte votre aide ?",
    reponse:
      "L'aide écrite (WhatsApp, e-mail) : gratuite, sans limite. Sur le site : 2 dossiers offerts, puis l'adhésion. Aucune commission sur ce que vous récupérez.",
  },
  {
    question: "Je viens de recevoir un courrier. Je fais quoi ?",
    reponse:
      "Vous voulez contester ? Ne payez pas : payer clôt le dossier. Notez la date du constat, le délai, la commune. Réunissez vos preuves : ticket, capture de l'appli, photos. Puis vérifiez la lettre ici.",
  },
  {
    question: "Puis-je contester par e-mail auprès de parking.brussels ?",
    reponse:
      "Non. Depuis le 15 mars 2026 : formulaire en ligne uniquement. Collez-y votre lettre. Gardez une capture de l'envoi et du numéro de suivi.",
  },
  {
    question: "Quel est le délai pour contester ?",
    reponse:
      "parking.brussels : 10 jours calendrier après réception. Les communes : leur propre délai, parfois plus long. Le délai imprimé sur votre courrier fait foi. Dans le doute, agissez le jour même.",
  },
  {
    question: "Ma session d'appli était active, et j'ai reçu une redevance.",
    reponse:
      "Cas fréquent. Gardez la capture (date, heure, plaque, zone) et le relevé bancaire. Contestez avec ces pièces. Demandez les photos du contrôle pour comparer les heures.",
  },
  {
    question: "Puis-je demander les photos de la ScanCar ?",
    reponse:
      "Oui, souvent décisif : photos originales, métadonnées, journaux horodatés. Deux voies, complémentaires : dans la contestation, et au titre du RGPD.",
  },
  {
    question: "Que se passe-t-il si je ne réponds pas ?",
    reponse:
      "Les frais montent. Rappel au plus tôt 40 jours après : +15 €. Puis mise en demeure. Puis contrainte 30 jours plus tard, par huissier. Répondre par écrit stoppe cette mécanique et laisse une trace.",
  },
  {
    question: "Un huissier me contacte. Trop tard ?",
    reponse:
      "Pas forcément. Mais les délais sont courts : écrivez-nous vite. N'ignorez aucun courrier de l'huissier.",
  },
  {
    question: "Garantissez-vous l'annulation ?",
    reponse:
      "Non. Méfiez-vous de qui le promet. On vous aide à comprendre, réunir les preuves, contester à temps. L'administration décide, puis le juge.",
  },
  {
    question: "Êtes-vous des avocats ?",
    reponse:
      "Non. Une association d'information et d'accompagnement, pour vous défendre vous-même. Situation lourde : on vous oriente vers un professionnel.",
  },
];
