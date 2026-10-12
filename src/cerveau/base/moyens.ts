/**
 * Les moyens de défense.
 *
 * Un moyen, c'est un argument qui peut faire tomber une redevance — à
 * condition que les faits le portent et que les pièces le prouvent. Chaque
 * entrée dit trois choses : QUAND il s'applique (une règle sur les faits),
 * COMBIEN il pèse (l'expérience des dossiers), et COMMENT il s'écrit (le
 * paragraphe de la lettre, en français et en néerlandais).
 *
 * Les paragraphes français reprennent ceux de la version précédente du site,
 * relus par l'association. Rien n'est affirmé à l'administration qui ne soit
 * établi : quand une règle varie d'une commune à l'autre, la lettre demande à
 * l'administration de vérifier, elle n'assène pas.
 *
 * Pour ajouter un moyen : une entrée ici, un test dans
 * tests/cerveau.test.js. Le moteur le prend en compte sans autre changement.
 */

import type { Faits, Moyen } from "../types";

const r = (f: Faits) => f.reponses ?? {};
const apresPremierCourrier = (f: Faits) => !!f.stade && f.stade !== "notification";

export const MOYENS: Moyen[] = [
  /* ---------------------------------------------------------------- payé */
  {
    id: "paiement_app",
    titre: "Ma session de stationnement était active",
    explication:
      "Votre application a enregistré un paiement couvrant l'heure du contrôle. C'est l'argument le plus fréquent qui aboutit, à condition de joindre la capture de la session.",
    force: "solide",
    fiabilite: "etablie",
    icone: "app-mobile",
    applicable: (f) => r(f).paiement === "app",
    pieces: [
      "Capture d'écran de la session (date, heures, plaque, zone)",
      "Historique des sessions de votre compte",
      "Relevé bancaire du paiement",
    ],
    paragraphe: () => ({
      fr: "Une session de stationnement était active dans l'application au moment précis du contrôle. La capture d'écran jointe indique la date, l'heure de début et de fin, la plaque encodée ainsi que la zone sélectionnée, et couvre l'heure du constat.",
      nl: "Op het ogenblik van de controle was er een actieve parkeersessie in de parkeerapp. De bijgevoegde schermafbeelding toont de datum, het begin- en einduur, de ingegeven nummerplaat en de gekozen zone, en dekt het tijdstip van de vaststelling.",
    }),
  },
  {
    id: "paiement_horodateur",
    titre: "J'avais payé à l'horodateur",
    explication:
      "Un ticket horodaté qui couvre l'heure du constat prouve que le stationnement était payé. Gardez l'original, envoyez une copie.",
    force: "solide",
    fiabilite: "etablie",
    icone: "horodateur",
    applicable: (f) => r(f).paiement === "horodateur",
    pieces: ["Copie du ticket horodaté", "Relevé bancaire si vous avez payé par carte"],
    paragraphe: () => ({
      fr: "Le stationnement du véhicule était régulièrement couvert par un paiement au moment du contrôle. Le reçu horodaté joint à la présente mentionne la plaque, la zone et la plage horaire concernées, et démontre que le véhicule était en règle lors du constat.",
      nl: "Het parkeren van het voertuig was op het ogenblik van de controle correct betaald. Het bijgevoegde betaalbewijs vermeldt de nummerplaat, de zone en het betrokken tijdvak, en toont aan dat het voertuig op het ogenblik van de vaststelling in orde was.",
    }),
  },

  /* -------------------------------------------------------------- cartes */
  {
    id: "carte_riverain",
    titre: "J'avais une carte de riverain valable",
    explication:
      "La carte dispense de payer dans son secteur. Le contrôle automatique ne la reconnaît pas toujours, surtout si la plaque a changé ou si le secteur est mal encodé.",
    force: "solide",
    fiabilite: "etablie",
    icone: "carte-riverain",
    applicable: (f) => r(f).carte === "riverain" || r(f).carte === "pro",
    pieces: [
      "Copie recto-verso de la carte et de sa période de validité",
      "Preuve que la plaque est bien associée à la carte",
    ],
    paragraphe: () => ({
      fr: "Le véhicule bénéficiait, à la date du constat, d'une autorisation de stationnement valable pour le lieu concerné. La copie de cette carte est jointe à la présente. Le constat paraît dès lors résulter d'un défaut de prise en compte de cette autorisation dans les bases de données consultées lors du contrôle.",
      nl: "Het voertuig beschikte op de datum van de vaststelling over een geldige parkeervergunning voor de betrokken plaats. Een kopie van deze vergunning is bijgevoegd. De vaststelling lijkt dan ook het gevolg van het feit dat deze vergunning niet werd herkend in de databanken die bij de controle werden geraadpleegd.",
    }),
  },
  {
    id: "carte_pmr",
    titre: "J'avais une carte pour personne handicapée",
    explication:
      "Les titulaires de la carte de stationnement pour personnes handicapées bénéficient d'une exemption dans la plupart des communes. La ScanCar ne voit pas la carte posée derrière le pare-brise : c'est une erreur fréquente.",
    force: "solide",
    fiabilite: "a_confirmer",
    icone: "carte-pmr",
    applicable: (f) => r(f).carte === "pmr",
    pieces: ["Copie recto-verso de la carte de stationnement pour personnes handicapées"],
    source:
      "Exemption prévue par la réglementation régionale bruxelloise et par la plupart des règlements communaux wallons et flamands.",
    paragraphe: () => ({
      fr: "Le véhicule affichait, au moment du constat, une carte de stationnement pour personnes handicapées en cours de validité, dont la copie est jointe. Les titulaires de cette carte bénéficiant d'une exemption de la redevance, je vous saurais gré de vérifier l'application de cette exemption à mon dossier et d'annuler la redevance réclamée.",
      nl: "Op het ogenblik van de vaststelling lag er achter de voorruit van het voertuig een geldige parkeerkaart voor personen met een handicap, waarvan een kopie bijgevoegd is. Aangezien houders van deze kaart vrijgesteld zijn van de retributie, verzoek ik u de toepassing van deze vrijstelling op mijn dossier na te gaan en de gevorderde retributie te annuleren.",
    }),
  },

  /* ------------------------------------------------------------ véhicule */
  {
    id: "erreur_plaque",
    titre: "La plaque relevée n'est pas la mienne",
    explication:
      "La lecture automatique des plaques se trompe : un 8 lu B, un 0 lu O. Vous n'avez rien à payer pour un véhicule qui n'est pas le vôtre, et vous pouvez exiger les photos du contrôle.",
    force: "solide",
    fiabilite: "etablie",
    icone: "plaque",
    applicable: (f) => r(f).vehicule === "pas_ma_plaque",
    pieces: ["Copie du certificat d'immatriculation", "Photo de votre véhicule et de sa plaque"],
    paragraphe: () => ({
      fr: "La plaque d'immatriculation mentionnée sur le document reçu ne correspond pas à celle du véhicule concerné. S'agissant d'un contrôle par lecture automatisée, une erreur de lecture ne peut être exclue. Je sollicite dès lors la communication des clichés originaux ayant permis l'identification du véhicule.",
      nl: "De nummerplaat die op het ontvangen document vermeld staat, stemt niet overeen met die van het betrokken voertuig. Aangezien het om een geautomatiseerde nummerplaatherkenning gaat, kan een leesfout niet worden uitgesloten. Ik verzoek u daarom mij de originele foto's te bezorgen op basis waarvan het voertuig werd geïdentificeerd.",
    }),
  },
  {
    id: "vehicule_vendu",
    titre: "Le véhicule ne m'appartenait plus",
    explication:
      "Si la voiture était vendue, cédée ou louée à quelqu'un d'autre à la date du constat, la redevance ne vous concerne pas. La date de la vente et celle du transfert de plaque font foi.",
    force: "solide",
    fiabilite: "etablie",
    icone: "cle-vendue",
    applicable: (f) => r(f).vehicule === "vendu",
    pieces: [
      "Acte de vente, contrat de location ou de prêt daté",
      "Preuve de la radiation ou du transfert de la plaque (DIV)",
    ],
    paragraphe: () => ({
      fr: "À la date du constat, je n'étais plus le détenteur du véhicule concerné. Les documents joints établissent la date de la cession ou de la mise à disposition du véhicule à un tiers. Je ne puis dès lors être tenu au paiement de la redevance réclamée.",
      nl: "Op de datum van de vaststelling was ik niet langer houder van het betrokken voertuig. De bijgevoegde documenten tonen de datum van de verkoop of van de terbeschikkingstelling van het voertuig aan een derde aan. Ik kan dan ook niet gehouden zijn tot betaling van de gevorderde retributie.",
    }),
  },
  {
    id: "vehicule_vole",
    titre: "Le véhicule avait été volé",
    explication:
      "Un véhicule volé ne vous engage plus. Le procès-verbal de plainte, daté d'avant le constat, suffit en général à clore le dossier.",
    force: "solide",
    fiabilite: "etablie",
    icone: "pv-police",
    applicable: (f) => r(f).vehicule === "vole",
    pieces: ["Copie du procès-verbal de plainte pour vol, daté"],
    paragraphe: () => ({
      fr: "Le véhicule m'avait été dérobé avant la date du constat, comme l'atteste le procès-verbal de plainte joint à la présente. Je ne puis être tenu au paiement d'une redevance relative à l'usage d'un véhicule dont j'avais été privé.",
      nl: "Het voertuig was vóór de datum van de vaststelling gestolen, zoals blijkt uit het bijgevoegde proces-verbaal van klacht. Ik kan niet gehouden zijn tot betaling van een retributie voor het gebruik van een voertuig dat mij ontnomen was.",
    }),
  },

  /* ------------------------------------------------------------- terrain */
  {
    id: "paiement_impossible",
    titre: "Je n'ai pas pu payer : le système était en panne",
    explication:
      "Un horodateur hors service ou une application qui refuse le paiement vous mettait dans l'impossibilité de payer. L'argument tient si vous en gardez une trace : photo, capture du message d'erreur.",
    force: "serieux",
    fiabilite: "etablie",
    icone: "horodateur-panne",
    applicable: (f) =>
      r(f).tentative_paiement === "horodateur_panne" || r(f).tentative_paiement === "app_panne",
    pieces: [
      "Photo de l'horodateur hors service ou capture du message d'erreur",
      "Toute preuve de la tentative de paiement",
    ],
    paragraphe: () => ({
      fr: "Le dispositif de paiement était indisponible au moment des faits, ce qui m'a placé dans l'impossibilité matérielle de m'acquitter de la redevance. Cette défaillance, indépendante de ma volonté, est documentée par les éléments joints à la présente.",
      nl: "Het betaalmiddel was op het ogenblik van de feiten buiten werking, waardoor ik in de materiële onmogelijkheid verkeerde om de retributie te betalen. Deze storing, die buiten mijn wil lag, wordt gestaafd door de bijgevoegde elementen.",
    }),
  },
  {
    id: "signalisation",
    titre: "La signalisation était absente ou illisible",
    explication:
      "Une obligation de payer doit être annoncée par une signalisation visible. Un panneau caché par un arbre, effacé ou absent fragilise la redevance — à condition de le photographier.",
    force: "serieux",
    fiabilite: "etablie",
    icone: "panneau-illisible",
    applicable: (f) => r(f).signalisation === "illisible",
    pieces: [
      "Photos datées des panneaux et du marquage au sol",
      "Vue d'ensemble situant l'emplacement du véhicule",
    ],
    paragraphe: () => ({
      fr: "La signalisation du régime de stationnement applicable n'était pas visible, lisible ou univoque à l'endroit du constat. Un usager normalement attentif ne pouvait raisonnablement identifier l'obligation de paiement. Les photographies jointes documentent l'état des lieux.",
      nl: "De signalisatie van de geldende parkeerregeling was op de plaats van de vaststelling niet zichtbaar, niet leesbaar of niet eenduidig. Een normaal oplettende weggebruiker kon de betalingsplicht redelijkerwijs niet vaststellen. De bijgevoegde foto's tonen de toestand ter plaatse.",
    }),
  },
  {
    id: "arret",
    titre: "J'étais à l'arrêt, pas garé",
    explication:
      "S'arrêter le temps de déposer quelqu'un ou de charger un colis n'est pas stationner. L'argument est recevable, mais il se prouve difficilement : un témoin ou un horodatage aide beaucoup.",
    force: "possible",
    fiabilite: "etablie",
    icone: "arret",
    applicable: (f) => r(f).duree === "arret",
    pieces: [
      "Tout élément établissant la brièveté et l'objet de l'arrêt",
      "Attestation ou témoignage éventuel",
    ],
    paragraphe: () => ({
      fr: "Le véhicule n'était pas en stationnement mais momentanément à l'arrêt, le temps strictement nécessaire à l'embarquement, au débarquement ou au chargement. Cette immobilisation de courte durée ne constitue pas un stationnement au sens de la réglementation applicable.",
      nl: "Het voertuig stond niet geparkeerd maar stond slechts kortstondig stil, gedurende de tijd die strikt noodzakelijk was voor het in- of uitstappen van personen of het laden en lossen. Deze kortstondige stilstand vormt geen parkeren in de zin van de toepasselijke reglementering.",
    }),
  },
  {
    id: "doublon",
    titre: "On me réclame deux fois le même stationnement",
    explication:
      "Une redevance forfaitaire couvre une période. Deux redevances pour le même stationnement, au même endroit, pendant cette période, c'est une de trop.",
    force: "serieux",
    fiabilite: "a_confirmer",
    icone: "doublon",
    applicable: (f) => r(f).doublon === "oui",
    pieces: ["Copie des deux courriers reçus"],
    paragraphe: () => ({
      fr: "Une seconde redevance m'est réclamée pour le même véhicule, au même endroit et au cours de la même période de stationnement qu'une redevance déjà notifiée, dont copie est jointe. Dans la mesure où la redevance forfaitaire couvre une période de stationnement déterminée, je vous saurais gré de vérifier ce double emploi et d'annuler la redevance qui en résulte.",
      nl: "Er wordt mij een tweede retributie gevorderd voor hetzelfde voertuig, op dezelfde plaats en tijdens dezelfde parkeerperiode als een reeds betekende retributie, waarvan een kopie bijgevoegd is. Aangezien de forfaitaire retributie een bepaalde parkeerperiode dekt, verzoek ik u deze dubbele aanrekening na te gaan en de retributie die eruit voortvloeit te annuleren.",
    }),
  },

  /* ----------------------------------------------------------- procédure */
  {
    id: "jamais_recu",
    titre: "Je n'ai jamais reçu le premier courrier",
    explication:
      "Sans la notification initiale, vous n'avez pas pu réagir à temps. Les frais de rappel qui en découlent se contestent, et l'organisme doit prouver l'envoi.",
    force: "serieux",
    fiabilite: "etablie",
    icone: "boite-lettres",
    applicable: (f) => apresPremierCourrier(f) && r(f).courrier_initial === "non",
    pieces: ["Tout élément relatif à votre adresse officielle à la date des faits"],
    paragraphe: () => ({
      fr: "Je n'ai jamais reçu la notification initiale de la redevance réclamée, et n'ai donc pas été mis en mesure de réagir en temps utile. Je sollicite la communication de la preuve de l'envoi de cette notification ainsi que de l'historique complet du dossier, et conteste les frais et majorations qui découleraient de ce défaut d'information.",
      nl: "Ik heb de oorspronkelijke kennisgeving van de gevorderde retributie nooit ontvangen en was dus niet in staat om tijdig te reageren. Ik verzoek u mij het bewijs van verzending van deze kennisgeving en het volledige dossier te bezorgen, en ik betwist de kosten en verhogingen die uit dit gebrek aan informatie zouden voortvloeien.",
    }),
  },
  {
    id: "deja_conteste",
    titre: "J'avais déjà contesté, sans réponse",
    explication:
      "Une contestation restée sans réponse doit être tranchée avant tout recouvrement. On la réitère, copie à l'appui, et on demande la suspension des poursuites.",
    force: "serieux",
    fiabilite: "etablie",
    icone: "recommande",
    applicable: (f) => apresPremierCourrier(f) && r(f).deja_conteste === "sans_reponse",
    pieces: ["Copie de votre première contestation", "Preuve de son envoi (récépissé, capture)"],
    paragraphe: () => ({
      fr: "J'ai contesté cette redevance par un premier courrier, resté à ce jour sans réponse. Je réitère intégralement les termes de cette contestation, dont copie est jointe, et sollicite la suspension de toute mesure de recouvrement aussi longtemps qu'une décision motivée ne m'a pas été notifiée.",
      nl: "Ik heb deze retributie betwist met een eerste brief, die tot op heden onbeantwoord bleef. Ik herhaal integraal de inhoud van deze betwisting, waarvan een kopie bijgevoegd is, en verzoek om de opschorting van elke invorderingsmaatregel zolang mij geen gemotiveerde beslissing werd betekend.",
    }),
  },
  {
    id: "frais_ajoutes",
    titre: "Des frais ont été ajoutés au montant de départ",
    explication:
      "Chaque frais de rappel ou de recouvrement doit reposer sur un texte. On demande lequel, et la preuve des courriers qui l'auraient justifié.",
    force: "possible",
    fiabilite: "etablie",
    icone: "euros",
    applicable: (f) => apresPremierCourrier(f) && r(f).deja_paye !== "oui",
    pieces: ["Copie de chaque courrier reçu, dans l'ordre"],
    paragraphe: () => ({
      fr: "Je conteste en outre les frais et majorations ajoutés au montant initial. Je vous prie de me communiquer le fondement réglementaire de chacun d'eux, ainsi que la preuve de l'envoi des courriers qui les auraient justifiés.",
      nl: "Daarnaast betwist ik de kosten en verhogingen die aan het oorspronkelijke bedrag werden toegevoegd. Ik verzoek u mij de reglementaire grondslag van elk ervan te bezorgen, evenals het bewijs van verzending van de brieven die ze zouden rechtvaardigen.",
    }),
  },
  {
    id: "deja_paye",
    titre: "J'ai déjà payé",
    explication:
      "Si vous avez payé, toute poursuite doit cesser — et une somme payée en double se rembourse. La preuve du paiement suffit.",
    force: "solide",
    fiabilite: "etablie",
    icone: "euro",
    applicable: (f) => r(f).deja_paye === "oui",
    pieces: ["Preuve du paiement (extrait de compte, reçu)"],
    paragraphe: () => ({
      fr: "J'ai acquitté la somme réclamée, comme l'atteste la preuve de paiement jointe. Je sollicite dès lors l'arrêt de toute procédure de recouvrement et, le cas échéant, le remboursement de toute somme perçue en double.",
      nl: "Ik heb het gevorderde bedrag betaald, zoals blijkt uit het bijgevoegde betalingsbewijs. Ik verzoek dan ook om de stopzetting van elke invorderingsprocedure en, in voorkomend geval, de terugbetaling van elk dubbel geïnd bedrag.",
    }),
  },
];

/** Classement des forces, pour trier les moyens du plus au moins solide. */
export const RANG_FORCE = { solide: 3, serieux: 2, possible: 1 } as const;
