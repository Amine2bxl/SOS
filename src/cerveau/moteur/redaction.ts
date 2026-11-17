/**
 * La plume : deux lettres ne sortent jamais pareilles.
 *
 * Un service qui reçoit cent contestations identiques au mot près les lit
 * comme un formulaire, pas comme cent personnes. Ce module fait deux choses :
 *
 * 1. **Les embranchements.** Chaque réponse aux questions du moteur apporte sa
 *    phrase au récit des faits, et les réponses se combinent : « pas payé » +
 *    « signalisation illisible » devient une cause (« je n'ai pas payé faute
 *    de savoir que la zone était payante »), alors que « payé » +
 *    « signalisation illisible » devient un argument subsidiaire (« quand bien
 *    même ce paiement ne serait pas retenu… »). Le chemin des réponses fixe la
 *    posture de la lettre (hors de cause, déjà payé, dispensé, empêché…), qui
 *    décide de sa conclusion et de sa demande principale. Deux chemins
 *    différents donnent deux lettres différentes, sur le fond.
 *
 * 2. **La variation.** Ouverture, transitions, intitulés, demande, réserve et
 *    formule finale ont chacun plusieurs rédactions équivalentes. Le choix est
 *    tiré d'une empreinte du dossier (référence, plaque, date, type de lettre,
 *    chemin des réponses) : la même lettre se régénère à l'identique, deux
 *    dossiers différents ne se ressemblent pas.
 *
 * Toutes les variantes disent la même chose, avec la même prudence : la
 * variation touche la forme, jamais la portée de ce qui est affirmé.
 */

import type { Faits, IdQuestion, Reponses, Stade } from "../types";

export type Bilingue = { fr: string; nl: string };

/** Empreinte FNV-1a sur 32 bits : rapide, stable d'une machine à l'autre. */
export function empreinte(texte: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const ORDRE: IdQuestion[] = [
  "vehicule",
  "carte",
  "paiement",
  "tentative_paiement",
  "duree",
  "signalisation",
  "doublon",
  "courrier_initial",
  "deja_conteste",
  "deja_paye",
];

/** Le chemin des réponses, dans l'ordre du récit : « paiement=non;signalisation=illisible ». */
export function cheminDesReponses(r?: Reponses): string {
  return ORDRE.filter((q) => r?.[q]).map((q) => `${q}=${r?.[q]}`).join(";");
}

const LIBELLES: Record<string, string> = {
  "vehicule=vendu": "véhicule vendu",
  "vehicule=vole": "véhicule volé",
  "vehicule=pas_ma_plaque": "pas ma plaque",
  "carte=riverain": "carte de riverain",
  "carte=pmr": "carte PMR",
  "carte=pro": "carte professionnelle",
  "paiement=app": "payé par application",
  "paiement=horodateur": "payé à l'horodateur",
  "paiement=non": "pas payé",
  "paiement=incertain": "paiement incertain",
  "tentative_paiement=horodateur_panne": "horodateur en panne",
  "tentative_paiement=app_panne": "application en panne",
  "duree=arret": "simple arrêt",
  "signalisation=illisible": "signalisation illisible",
  "signalisation=incertain": "signalisation douteuse",
  "doublon=oui": "redevance en double",
  "courrier_initial=non": "premier courrier jamais reçu",
  "deja_conteste=sans_reponse": "contestation sans réponse",
  "deja_conteste=rejete": "contestation rejetée",
  "deja_paye=oui": "déjà payé",
};

/** Le chemin, en mots courts, pour le montrer à la personne. */
export function etapesDuChemin(r?: Reponses): string[] {
  return cheminDesReponses(r)
    .split(";")
    .map((e) => LIBELLES[e])
    .filter((e): e is string => !!e);
}

export type Plume = {
  chemin: string;
  /** Une rédaction parmi plusieurs, toujours la même pour ce dossier et cette place. */
  choisir: <V>(place: string, variantes: readonly V[]) => V;
};

export function plumePour(faits: Faits, type: string): Plume {
  const chemin = cheminDesReponses(faits.reponses);
  const base = [faits.reference ?? "", faits.plaque ?? "", faits.dateConstat ?? "", type, chemin].join("|");
  return {
    chemin,
    choisir: (place, variantes) => variantes[empreinte(`${base}#${place}`) % variantes.length],
  };
}

/* -------------------------------------------------------------------------- */
/*  La posture                                                                */
/* -------------------------------------------------------------------------- */

export type Posture = "hors_cause" | "paye" | "exempte" | "empeche" | "arret" | "irregulier" | "doute" | "clemence" | "neutre";

/** Ce que la lettre soutient, au fond, selon le chemin des réponses. */
export function lirePosture(r: Reponses = {}): Posture {
  if (r.vehicule && r.vehicule !== "oui") return "hors_cause";
  if (r.paiement === "app" || r.paiement === "horodateur") return "paye";
  if (r.carte && r.carte !== "non") return "exempte";
  if (r.tentative_paiement === "horodateur_panne" || r.tentative_paiement === "app_panne") return "empeche";
  if (r.duree === "arret") return "arret";
  if (r.signalisation === "illisible" || r.doublon === "oui" || r.courrier_initial === "non") return "irregulier";
  if (r.paiement === "incertain" || r.signalisation === "incertain") return "doute";
  if (r.paiement === "non") return "clemence";
  return "neutre";
}

/* -------------------------------------------------------------------------- */
/*  Le récit des faits                                                        */
/* -------------------------------------------------------------------------- */

type Phrase = { famille: "personne" | "droit" | "paiement" | "lieu" | "procedure"; texte: Bilingue };

const V = (fr: string, nl: string): Bilingue => ({ fr, nl });

const PHRASES: Record<string, Bilingue[]> = {
  "vehicule=vendu": [
    V(
      "À la date du constat, je n'étais plus propriétaire de ce véhicule : je l'avais vendu, et il était déjà sous la responsabilité de son nouveau détenteur.",
      "Op de datum van de vaststelling was ik niet langer eigenaar van dit voertuig: ik had het verkocht en het viel al onder de verantwoordelijkheid van de nieuwe houder.",
    ),
    V(
      "Le véhicule visé ne m'appartenait plus au moment du constat : il avait été vendu, et je n'en avais plus l'usage.",
      "Het betrokken voertuig was op het ogenblik van de vaststelling niet meer van mij: het was verkocht en ik had er geen gebruik meer van.",
    ),
  ],
  "vehicule=vole": [
    V(
      "Le véhicule m'avait été volé avant le constat, et le vol a été déclaré à la police.",
      "Het voertuig was vóór de vaststelling gestolen, en de diefstal werd bij de politie aangegeven.",
    ),
    V(
      "Au moment du constat, je n'avais plus le véhicule : il avait été volé, et une plainte a été déposée.",
      "Op het ogenblik van de vaststelling had ik het voertuig niet meer: het was gestolen en er werd klacht ingediend.",
    ),
  ],
  "vehicule=pas_ma_plaque": [
    V(
      "La plaque mentionnée sur votre courrier n'est pas celle de mon véhicule.",
      "De nummerplaat op uw brief is niet die van mijn voertuig.",
    ),
    V(
      "La plaque relevée lors du contrôle ne correspond pas à mon véhicule : ce constat ne me concerne pas.",
      "De bij de controle genoteerde nummerplaat stemt niet overeen met mijn voertuig: deze vaststelling betreft mij niet.",
    ),
  ],
  "carte=riverain": [
    V(
      "Le véhicule disposait d'une carte de riverain valable pour ce secteur.",
      "Het voertuig beschikte over een geldige bewonerskaart voor deze sector.",
    ),
    V(
      "Ma carte de riverain couvrait ce secteur à la date du constat.",
      "Mijn bewonerskaart dekte deze sector op de datum van de vaststelling.",
    ),
  ],
  "carte=pmr": [
    V(
      "Le véhicule transportait une personne titulaire d'une carte de stationnement pour personne handicapée.",
      "Het voertuig vervoerde een houder van een parkeerkaart voor personen met een handicap.",
    ),
    V(
      "Une personne handicapée, titulaire de sa carte de stationnement, se trouvait à bord du véhicule.",
      "Een persoon met een handicap, houder van een parkeerkaart, bevond zich aan boord van het voertuig.",
    ),
  ],
  "carte=pro": [
    V(
      "Le véhicule bénéficiait d'une carte professionnelle ou d'une dérogation valable à cet endroit.",
      "Het voertuig beschikte over een beroepskaart of een afwijking die op die plaats geldig was.",
    ),
    V(
      "Une dérogation professionnelle couvrait le stationnement du véhicule à cet endroit.",
      "Een beroepsafwijking dekte het parkeren van het voertuig op die plaats.",
    ),
  ],
  "paiement=app": [
    V(
      "J'avais payé mon stationnement par l'application dès mon arrivée.",
      "Ik had mijn parkeren bij aankomst meteen via de app betaald.",
    ),
    V(
      "Dès que je me suis garé(e), j'ai lancé une session de stationnement dans l'application.",
      "Zodra ik geparkeerd stond, heb ik een parkeersessie in de app gestart.",
    ),
  ],
  "paiement=horodateur": [
    V(
      "J'avais payé à l'horodateur, et le ticket couvrait l'heure du contrôle.",
      "Ik had aan de parkeerautomaat betaald, en het ticket dekte het tijdstip van de controle.",
    ),
    V(
      "J'ai pris un ticket à l'horodateur en arrivant ; il était encore valable lors du contrôle.",
      "Bij aankomst heb ik een ticket genomen aan de parkeerautomaat; het was bij de controle nog geldig.",
    ),
  ],
  "paiement=incertain": [
    V(
      "Je ne retrouve plus avec certitude la trace de mon paiement.",
      "Ik vind het bewijs van mijn betaling niet meer met zekerheid terug.",
    ),
    V(
      "Je ne parviens plus à établir si j'avais payé ce jour-là.",
      "Ik kan niet meer met zekerheid nagaan of ik die dag had betaald.",
    ),
  ],
  "tentative_paiement=horodateur_panne": [
    V(
      "J'ai voulu payer, mais l'horodateur le plus proche était hors service.",
      "Ik wilde betalen, maar de dichtstbijzijnde parkeerautomaat was buiten werking.",
    ),
    V(
      "J'ai tenté de prendre un ticket : l'horodateur ne fonctionnait pas, et aucun autre n'était à proximité immédiate.",
      "Ik heb geprobeerd een ticket te nemen: de parkeerautomaat werkte niet, en er stond geen andere in de onmiddellijke omgeving.",
    ),
  ],
  "tentative_paiement=app_panne": [
    V(
      "J'ai tenté de payer par l'application, mais le paiement a échoué.",
      "Ik heb geprobeerd via de app te betalen, maar de betaling is mislukt.",
    ),
    V(
      "Le paiement par l'application n'a pas abouti, malgré plusieurs tentatives.",
      "De betaling via de app is ondanks meerdere pogingen niet gelukt.",
    ),
  ],
  "duree=arret": [
    V(
      "Le véhicule ne s'est arrêté que quelques minutes, le temps de charger ou de déposer une personne.",
      "Het voertuig stond slechts enkele minuten stil, de tijd om te laden of iemand af te zetten.",
    ),
    V(
      "Il s'agissait d'un arrêt bref, pour un chargement ou une dépose, et non d'un stationnement.",
      "Het ging om een korte stilstand om te laden of iemand af te zetten, niet om parkeren.",
    ),
  ],
  "signalisation=illisible": [
    V(
      "La signalisation de la zone était absente, masquée ou illisible.",
      "De signalisatie van de zone was afwezig, verborgen of onleesbaar.",
    ),
    V(
      "Rien, sur place, n'indiquait clairement que la zone était payante : la signalisation était cachée ou illisible.",
      "Ter plaatse gaf niets duidelijk aan dat de zone betalend was: de signalisatie was verborgen of onleesbaar.",
    ),
  ],
  "signalisation=incertain": [
    V(
      "Je ne suis pas certain(e) que la zone était correctement signalée.",
      "Ik ben er niet zeker van dat de zone correct was aangeduid.",
    ),
    V(
      "J'ai un doute sur la signalisation de la zone ce jour-là.",
      "Ik twijfel aan de signalisatie van de zone op die dag.",
    ),
  ],
  "doublon=oui": [
    V(
      "J'ai reçu une autre redevance pour le même stationnement, le même jour et au même endroit.",
      "Ik ontving een andere retributie voor hetzelfde parkeren, op dezelfde dag en op dezelfde plaats.",
    ),
    V(
      "Ce stationnement m'est déjà réclamé par une autre redevance, pour le même jour et le même lieu.",
      "Dit parkeren wordt mij al aangerekend via een andere retributie, voor dezelfde dag en dezelfde plaats.",
    ),
  ],
  "courrier_initial=non": [
    V(
      "Je n'ai jamais reçu le premier courrier : ce rappel est le premier document qui me parvient.",
      "Ik heb de eerste brief nooit ontvangen: deze herinnering is het eerste document dat mij bereikt.",
    ),
    V(
      "Votre rappel est le premier courrier que je reçois à ce sujet ; le courrier initial ne m'est jamais parvenu.",
      "Uw herinnering is de eerste brief die ik hierover ontvang; de oorspronkelijke brief heeft mij nooit bereikt.",
    ),
  ],
  "deja_conteste=sans_reponse": [
    V("J'ai déjà contesté cette redevance, sans recevoir de réponse.", "Ik heb deze retributie al betwist, zonder antwoord te ontvangen."),
    V("Ma première contestation est restée sans réponse.", "Mijn eerste betwisting bleef onbeantwoord."),
  ],
  "deja_conteste=rejete": [
    V(
      "Ma première contestation a été rejetée ; je la maintiens, pour les raisons qui suivent.",
      "Mijn eerste betwisting werd afgewezen; ik handhaaf ze, om de volgende redenen.",
    ),
    V(
      "Le rejet de ma première contestation ne m'a pas convaincu(e), et je la maintiens.",
      "De afwijzing van mijn eerste betwisting heeft mij niet overtuigd, en ik handhaaf ze.",
    ),
  ],
  "deja_paye=oui": [
    V(
      "J'ai réglé la somme réclamée pour éviter des frais supplémentaires, sous toutes réserves.",
      "Ik heb het gevorderde bedrag onder alle voorbehoud betaald, om bijkomende kosten te vermijden.",
    ),
    V(
      "J'ai payé la somme réclamée, sans que ce paiement vaille reconnaissance du bien-fondé de la redevance.",
      "Ik heb het gevorderde bedrag betaald, zonder dat die betaling een erkenning van de gegrondheid van de retributie inhoudt.",
    ),
  ],
};

/** Les phrases que seules certaines combinaisons produisent : le lien de cause entre deux réponses. */
const LIENS: Record<string, Bilingue[]> = {
  "non+carte": [
    V("Je n'ai donc pas pris de ticket : je n'avais pas à le faire.", "Ik heb dus geen ticket genomen: dat hoefde ook niet."),
    V("Je n'avais dès lors aucun ticket à prendre.", "Ik hoefde dus geen ticket te nemen."),
  ],
  "non+arret": [
    V(
      "Je n'ai pas payé, car le véhicule ne s'est arrêté que quelques minutes, le temps de charger ou de déposer une personne.",
      "Ik heb niet betaald, omdat het voertuig slechts enkele minuten stilstond, de tijd om te laden of iemand af te zetten.",
    ),
    V(
      "Je n'ai pas payé : il ne s'agissait que d'un arrêt de quelques minutes, pour un chargement ou une dépose.",
      "Ik heb niet betaald: het ging slechts om een stilstand van enkele minuten, om te laden of iemand af te zetten.",
    ),
  ],
  "non+illisible": [
    V(
      "Je n'ai pas payé, faute d'avoir pu comprendre que la zone était payante : la signalisation était absente ou illisible.",
      "Ik heb niet betaald omdat ik niet kon weten dat de zone betalend was: de signalisatie was afwezig of onleesbaar.",
    ),
    V(
      "Rien ne signalait clairement que la zone était payante, et c'est la raison pour laquelle je n'ai pas payé.",
      "Niets gaf duidelijk aan dat de zone betalend was, en daarom heb ik niet betaald.",
    ),
  ],
  "non+incertain": [
    V(
      "Je n'ai pas payé : rien ne m'a paru indiquer que la zone était payante.",
      "Ik heb niet betaald: niets leek erop te wijzen dat de zone betalend was.",
    ),
    V(
      "Je n'ai pas payé, n'ayant pas vu d'indication claire que la zone était payante.",
      "Ik heb niet betaald, omdat ik geen duidelijke aanwijzing zag dat de zone betalend was.",
    ),
  ],
  "non+seul": [
    V("Je reconnais ne pas avoir payé ce stationnement.", "Ik erken dat ik dit parkeren niet heb betaald."),
    V("Je n'ai effectivement pas payé ce stationnement.", "Ik heb dit parkeren inderdaad niet betaald."),
  ],
};

const SUBSIDIAIRE: Bilingue[] = [
  V("À titre subsidiaire, ", "Ondergeschikt: "),
  V("Quand bien même ce point ne serait pas retenu, ", "Zelfs indien dat punt niet zou worden aanvaard, geldt nog het volgende: "),
  V("À supposer même le contraire, ", "Mocht u daar anders over oordelen, dan geldt nog: "),
];
const ADDITIF: Bilingue[] = [
  V("En outre, ", "Daarnaast: "),
  V("Par ailleurs, ", "Bovendien geldt het volgende: "),
  V("De plus, ", "Verder: "),
];
const PROCEDURE: Bilingue[] = [
  V("Enfin, ", "Tot slot: "),
  V("Je précise enfin que ", "Ik wijs er tot slot op: "),
  V("J'ajoute que ", "Ik voeg eraan toe: "),
];

/** « Le véhicule… » → « le véhicule… », sans toucher aux sigles (« PMR », « BE… »). */
export function minusculeInitiale(s: string): string {
  return /^[A-ZÀ-Ý][a-zà-ÿ'’ ]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

function relier(connecteur: Bilingue, phrase: Bilingue): Bilingue {
  return { fr: connecteur.fr + minusculeInitiale(phrase.fr), nl: connecteur.nl + minusculeInitiale(phrase.nl) };
}

/** Les phrases du récit, dans l'ordre des faits, avant leurs liaisons. */
function phrasesBrutes(faits: Faits, plume: Plume, posture: Posture): Phrase[] {
  const r = faits.reponses ?? {};
  const prendre = (cle: string): Bilingue | null => (PHRASES[cle] ? plume.choisir(`recit:${cle}`, PHRASES[cle]) : null);
  const lien = (cle: string) => plume.choisir(`lien:${cle}`, LIENS[cle]);
  const sortie: Phrase[] = [];
  const ajouter = (famille: Phrase["famille"], texte: Bilingue | null) => {
    if (texte) sortie.push({ famille, texte });
  };

  // Hors de cause : le reste du récit ne me concerne pas.
  if (posture === "hors_cause") {
    ajouter("personne", prendre(`vehicule=${r.vehicule}`));
    if (r.courrier_initial === "non" && faits.stade && faits.stade !== "notification") ajouter("procedure", prendre("courrier_initial=non"));
    return sortie;
  }

  const carte = r.carte && r.carte !== "non";
  if (carte) ajouter("droit", prendre(`carte=${r.carte}`));

  // Le paiement, et ce qui l'explique : c'est là que les réponses se croisent.
  let arretDit = false;
  let signalisationDite = false;
  if (r.paiement === "app" || r.paiement === "horodateur" || r.paiement === "incertain") {
    ajouter("paiement", prendre(`paiement=${r.paiement}`));
  } else if (r.paiement === "non") {
    if (carte) ajouter("droit", lien("non+carte"));
    else if (r.tentative_paiement === "horodateur_panne" || r.tentative_paiement === "app_panne") {
      // La tentative dit tout : « j'ai voulu payer, mais… ».
    } else if (r.duree === "arret") {
      ajouter("paiement", lien("non+arret"));
      arretDit = true;
    } else if (r.signalisation === "illisible") {
      ajouter("paiement", lien("non+illisible"));
      signalisationDite = true;
    } else if (r.signalisation === "incertain") {
      ajouter("paiement", lien("non+incertain"));
      signalisationDite = true;
    } else ajouter("paiement", lien("non+seul"));
  }
  if (r.tentative_paiement === "horodateur_panne" || r.tentative_paiement === "app_panne") {
    ajouter("paiement", prendre(`tentative_paiement=${r.tentative_paiement}`));
  }
  if (r.duree === "arret" && !arretDit) ajouter("lieu", prendre("duree=arret"));
  if ((r.signalisation === "illisible" || r.signalisation === "incertain") && !signalisationDite) {
    ajouter("lieu", prendre(`signalisation=${r.signalisation}`));
  }
  if (r.doublon === "oui") ajouter("lieu", prendre("doublon=oui"));
  if (r.courrier_initial === "non" && faits.stade && faits.stade !== "notification") ajouter("procedure", prendre("courrier_initial=non"));
  if (r.deja_conteste === "sans_reponse" || r.deja_conteste === "rejete") ajouter("procedure", prendre(`deja_conteste=${r.deja_conteste}`));
  if (r.deja_paye === "oui") ajouter("procedure", prendre("deja_paye=oui"));
  return sortie;
}

/**
 * Le récit des faits, lié : la première phrase pose le fait principal ; les
 * suivantes s'y rattachent en subsidiaire (quand la lettre tient déjà un
 * argument fort), en complément, ou en précision de procédure.
 */
export function recitDesFaits(faits: Faits, plume: Plume, posture: Posture = lirePosture(faits.reponses)): Bilingue[] {
  const phrases = phrasesBrutes(faits, plume, posture);
  const fort = posture === "paye" || posture === "exempte" || posture === "empeche";
  let subsidiaireDit = false;
  let procedureDite = false;
  return phrases.map((p, i) => {
    if (i === 0) return p.texte;
    const precedente = phrases[i - 1];
    if (p.famille === "procedure") {
      if (procedureDite) return p.texte;
      procedureDite = true;
      return relier(plume.choisir(`liaison:procedure`, PROCEDURE), p.texte);
    }
    if (fort && !subsidiaireDit && p.famille === "lieu" && precedente.famille !== "lieu") {
      subsidiaireDit = true;
      return relier(plume.choisir(`liaison:subsidiaire`, SUBSIDIAIRE), p.texte);
    }
    if (p.famille === precedente.famille) return p.texte;
    return relier(plume.choisir(`liaison:${i}`, ADDITIF), p.texte);
  });
}

/* -------------------------------------------------------------------------- */
/*  Ce que la posture change                                                  */
/* -------------------------------------------------------------------------- */

const CONCLUSIONS: Partial<Record<Posture, Bilingue[]>> = {
  hors_cause: [
    V("Je ne suis donc pas redevable de cette somme.", "Ik ben dit bedrag dan ook niet verschuldigd."),
    V("Cette redevance ne peut dès lors m'être réclamée.", "Deze retributie kan mij dan ook niet worden aangerekend."),
  ],
  paye: [
    V("Le stationnement était donc payé : il ne peut l'être une seconde fois.", "Het parkeren was dus betaald: het kan geen tweede keer worden aangerekend."),
    V("La redevance fait donc double emploi avec un paiement déjà effectué.", "De retributie overlapt dus met een reeds uitgevoerde betaling."),
  ],
  exempte: [
    V("Le véhicule était donc dispensé de payer à cet endroit.", "Het voertuig was op die plaats dus vrijgesteld van betaling."),
    V("Aucune redevance n'était dès lors due.", "Er was dan ook geen retributie verschuldigd."),
  ],
  empeche: [
    V("Je n'ai donc commis aucune faute : j'ai voulu payer, et ne l'ai pas pu.", "Ik heb dus geen fout begaan: ik wilde betalen, maar dat was niet mogelijk."),
    V("L'absence de paiement ne m'est donc pas imputable.", "Het uitblijven van de betaling is mij dus niet toe te rekenen."),
  ],
  arret: [
    V("Un arrêt aussi bref ne constitue pas un stationnement soumis à redevance.", "Een dergelijke korte stilstand is geen parkeren waarvoor een retributie verschuldigd is."),
    V("Ce simple arrêt ne pouvait donner lieu à une redevance de stationnement.", "Deze loutere stilstand kon geen aanleiding geven tot een parkeerretributie."),
  ],
  irregulier: [
    V("Dans ces conditions, la redevance ne peut être maintenue.", "In die omstandigheden kan de retributie niet worden gehandhaafd."),
    V("Ces éléments privent la redevance de fondement.", "Deze elementen ontnemen de retributie haar grondslag."),
  ],
  doute: [
    V("Avant toute chose, je souhaite donc pouvoir vérifier les éléments du constat.", "Ik wens dus eerst de elementen van de vaststelling te kunnen nagaan."),
    V("C'est pourquoi je sollicite d'abord la communication des éléments du constat.", "Daarom verzoek ik eerst om de mededeling van de elementen van de vaststelling."),
  ],
  clemence: [
    V(
      "S'agissant d'un manquement isolé et de bonne foi, je sollicite votre compréhension.",
      "Aangezien het om een alleenstaande tekortkoming te goeder trouw gaat, verzoek ik om uw begrip.",
    ),
    V(
      "Il s'agit d'un manquement isolé, et je vous saurais gré d'en tenir compte.",
      "Het gaat om een alleenstaande tekortkoming, en ik verzoek u daarmee rekening te houden.",
    ),
  ],
};

export function conclusionDuRecit(posture: Posture, plume: Plume): Bilingue | null {
  const pool = CONCLUSIONS[posture];
  return pool ? plume.choisir(`conclusion:${posture}`, pool) : null;
}

/** La demande principale, dans les mots de la posture. */
export function demandePrincipale(posture: Posture): Bilingue {
  switch (posture) {
    case "hors_cause":
      return V("l'annulation de la redevance, qui ne me concerne pas ;", "de annulering van de retributie, die mij niet betreft;");
    case "paye":
      return V("l'annulation de la redevance, le stationnement ayant été payé ;", "de annulering van de retributie, aangezien het parkeren betaald was;");
    case "exempte":
      return V("l'annulation de la redevance, le véhicule étant dispensé de paiement ;", "de annulering van de retributie, aangezien het voertuig vrijgesteld was;");
    case "empeche":
      return V("l'annulation de la redevance, le paiement ayant été rendu impossible ;", "de annulering van de retributie, aangezien betalen onmogelijk was;");
    case "arret":
      return V("l'annulation de la redevance, s'agissant d'un simple arrêt ;", "de annulering van de retributie, aangezien het om een loutere stilstand ging;");
    case "clemence":
      return V(
        "l'annulation de la redevance ou, à défaut, sa réduction au montant initial, sans frais ;",
        "de annulering van de retributie of, zo niet, de vermindering ervan tot het oorspronkelijke bedrag, zonder kosten;",
      );
    default:
      return V("l'annulation de la redevance réclamée ;", "de annulering van de gevorderde retributie;");
  }
}

/* -------------------------------------------------------------------------- */
/*  Les formules qui changent d'une lettre à l'autre                          */
/* -------------------------------------------------------------------------- */

export const INTITULES_FAITS: Bilingue[] = [
  V("LES FAITS", "DE FEITEN"),
  V("RAPPEL DES FAITS", "OVERZICHT VAN DE FEITEN"),
  V("EXPOSÉ DES FAITS", "UITEENZETTING VAN DE FEITEN"),
];
export const INTITULES_MOYENS: Bilingue[] = [
  V("MOTIFS DE LA CONTESTATION", "REDENEN VAN DE BETWISTING"),
  V("MOYENS", "MIDDELEN"),
  V("POURQUOI LA REDEVANCE N'EST PAS DUE", "WAAROM DE RETRIBUTIE NIET VERSCHULDIGD IS"),
];
export const INTITULES_FAITS_ET_MOYENS: Bilingue[] = [
  V("EXPOSÉ DES FAITS ET MOYENS", "FEITEN EN MIDDELEN"),
  V("FAITS ET MOTIFS", "FEITEN EN REDENEN"),
];
export const INTRO_DEMANDES: Bilingue[] = [
  V("Je sollicite dès lors :", "Ik verzoek u dan ook om:"),
  V("Je vous demande par conséquent :", "Bijgevolg verzoek ik om:"),
  V("En conséquence, je sollicite :", "Ik vraag u daarom:"),
];
export const RESERVES: Bilingue[] = [
  V(
    "La présente ne constitue en aucune manière une reconnaissance de dette. Tous mes droits et moyens demeurent expressément réservés.",
    "Deze brief houdt geenszins een erkenning van schuld in. Al mijn rechten en middelen blijven uitdrukkelijk voorbehouden.",
  ),
  V(
    "Je précise que la présente ne constitue en aucune manière une reconnaissance de dette, et je réserve l'ensemble de mes droits.",
    "Ik verduidelijk dat deze brief geenszins een erkenning van schuld inhoudt, en ik behoud mij al mijn rechten voor.",
  ),
  V(
    "Sous réserve de tous mes droits, la présente ne constitue en aucune manière une reconnaissance de dette.",
    "Onder voorbehoud van al mijn rechten houdt deze brief geenszins een erkenning van schuld in.",
  ),
];

/** Les mots qui ouvrent chaque motif, quand il y en a plusieurs. */
const RANGS: Bilingue[][] = [
  [V("En premier lieu, ", "Ten eerste: "), V("D'abord, ", "In de eerste plaats: "), V("Premièrement, ", "Allereerst: ")],
  [V("En deuxième lieu, ", "Ten tweede: "), V("Ensuite, ", "Vervolgens: "), V("Deuxièmement, ", "In de tweede plaats: ")],
  [V("En outre, ", "Daarnaast: "), V("Par ailleurs, ", "Verder: "), V("De plus, ", "Bovendien geldt: ")],
];
const DERNIER_RANG: Bilingue[] = [V("Enfin, ", "Tot slot: "), V("En dernier lieu, ", "Ten slotte: ")];

export function ouvrirMotif(paragraphe: Bilingue, rang: number, total: number, plume: Plume): Bilingue {
  if (total < 2) return paragraphe;
  // Un motif qui porte déjà sa liaison (« Je conteste en outre… »,
  // « Daarnaast betwist ik… ») la perd : le rang la remplace.
  paragraphe = {
    fr: paragraphe.fr.replace(/^(\S+ \S+) en outre /, "$1 "),
    nl: paragraphe.nl.replace(/^Daarnaast (\S+) (\S+) /, (_, verbe: string, sujet: string) => `${sujet[0].toUpperCase()}${sujet.slice(1)} ${verbe} `),
  };
  const pool = rang === total - 1 && total >= 3 ? DERNIER_RANG : RANGS[Math.min(rang, 2)];
  return relier(plume.choisir(`motif:${rang}`, pool), paragraphe);
}

/** Les variantes d'ouverture d'une contestation, selon le stade et le ton. */
export function ouvertures(stade: Stade, ton: "courtois" | "ferme" | "pressant", nom: string, nombre: number): Bilingue[] {
  const pluriel = nombre > 1;
  const laRedevance = pluriel ? "les redevances concernées" : "la redevance concernée";
  const deRetributie = pluriel ? "de betrokken retributies" : "de betrokken retributie";
  switch (stade) {
    case "premier_rappel":
    case "deuxieme_rappel":
      return [
        V(
          `Je soussigné(e) ${nom} accuse réception de votre rappel et conteste ${laRedevance}.`,
          `Ondergetekende, ${nom}, bevestigt de ontvangst van uw herinnering en betwist ${deRetributie}.`,
        ),
        V(
          `Je soussigné(e) ${nom} fais suite à votre rappel : je conteste ${laRedevance}.`,
          `Ondergetekende, ${nom}, reageert op uw herinnering en betwist ${deRetributie}.`,
        ),
        V(
          `Votre rappel m'est bien parvenu. Je soussigné(e) ${nom} conteste ${laRedevance}.`,
          `Uw herinnering is goed aangekomen. Ondergetekende, ${nom}, betwist ${deRetributie}.`,
        ),
      ];
    case "mise_en_demeure":
      return [
        V(
          `Je soussigné(e) ${nom} réponds à votre mise en demeure dans le délai imparti et conteste formellement la somme réclamée.`,
          `Ondergetekende, ${nom}, antwoordt binnen de gestelde termijn op uw ingebrekestelling en betwist formeel het gevorderde bedrag.`,
        ),
        V(
          `Je soussigné(e) ${nom} réponds à votre mise en demeure, dans le délai qu'elle fixe : je conteste formellement la somme réclamée.`,
          `Ondergetekende, ${nom}, antwoordt op uw ingebrekestelling binnen de daarin bepaalde termijn: ik betwist formeel het gevorderde bedrag.`,
        ),
      ];
    default:
      return ton === "courtois"
        ? [
            V(
              `Je soussigné(e) ${nom} me permets de contester la redevance mentionnée ci-dessous.`,
              `Ondergetekende, ${nom}, betwist hierbij de hieronder vermelde retributie.`,
            ),
            V(
              `Je soussigné(e) ${nom} vous écris pour contester la redevance mentionnée ci-dessous.`,
              `Ondergetekende, ${nom}, schrijft u om de hieronder vermelde retributie te betwisten.`,
            ),
            V(
              `Je soussigné(e) ${nom} souhaite contester la redevance mentionnée ci-dessous.`,
              `Ondergetekende, ${nom}, wenst de hieronder vermelde retributie te betwisten.`,
            ),
          ]
        : [
            V(
              `Je soussigné(e) ${nom} conteste par la présente ${pluriel ? `les ${nombre} redevances visées` : "la redevance visée"} ci-dessous.`,
              `Ondergetekende, ${nom}, betwist hierbij ${pluriel ? `de ${nombre} retributies` : "de retributie"} hieronder vermeld.`,
            ),
            V(
              `Je soussigné(e) ${nom} conteste formellement ${pluriel ? `les ${nombre} redevances visées` : "la redevance visée"} ci-dessous.`,
              `Ondergetekende, ${nom}, betwist formeel ${pluriel ? `de ${nombre} retributies` : "de retributie"} hieronder vermeld.`,
            ),
          ];
  }
}

/** La formule finale, selon le ton, en plusieurs rédactions. */
export function formulesFinales(ton: "courtois" | "ferme" | "pressant"): Bilingue[] {
  if (ton === "pressant") {
    return [
      V(
        "Dans l'attente de votre réponse écrite et de la suspension effective du recouvrement, je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.",
        "In afwachting van uw schriftelijk antwoord en de effectieve opschorting van de invordering, verblijf ik met de meeste hoogachting,",
      ),
      V(
        "Je reste dans l'attente de votre réponse écrite et de la suspension du recouvrement. Veuillez agréer, Madame, Monsieur, mes salutations distinguées.",
        "Ik kijk uit naar uw schriftelijk antwoord en de opschorting van de invordering. Met de meeste hoogachting,",
      ),
    ];
  }
  if (ton === "ferme") {
    return [
      V(
        "Dans l'attente d'une décision motivée, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
        "In afwachting van een gemotiveerde beslissing verblijf ik met de meeste hoogachting,",
      ),
      V(
        "Je reste dans l'attente d'une décision motivée et vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.",
        "Ik kijk uit naar een gemotiveerde beslissing. Met de meeste hoogachting,",
      ),
    ];
  }
  return [
    V(
      "En vous remerciant de l'attention portée à la présente, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
      "Met dank voor uw aandacht verblijf ik met de meeste hoogachting,",
    ),
    V(
      "Je vous remercie par avance de l'examen de ma demande. Veuillez agréer, Madame, Monsieur, mes salutations distinguées.",
      "Alvast bedankt voor het onderzoek van mijn verzoek. Met vriendelijke groeten,",
    ),
    V(
      "Avec mes remerciements pour votre attention, je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.",
      "Met dank voor uw aandacht en met vriendelijke groeten,",
    ),
  ];
}
