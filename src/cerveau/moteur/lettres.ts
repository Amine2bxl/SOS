/**
 * La rédaction des lettres.
 *
 * Sept courriers, parce qu'un dossier n'en compte presque jamais qu'un :
 *
 *  - la CONTESTATION, au premier courrier ou au rappel ;
 *  - la RELANCE, quand la contestation reste sans réponse ;
 *  - la RÉPONSE À L'HUISSIER (ou à la contrainte) ;
 *  - la DEMANDE DES PHOTOS, au titre du droit d'accès du RGPD ;
 *  - la demande d'ARRÊT ET DE REMBOURSEMENT, quand on a déjà payé ;
 *  - le PLAN DE PAIEMENT, quand on doit mais ne peut pas tout payer d'un coup ;
 *  - l'ANNULATION À TITRE GRACIEUX, quand la faute est réelle mais de bonne foi.
 *
 * Le ton, l'enjeu et les paragraphes propres au cas viennent du scénario
 * (`scenario.ts`) : stade, montant, nombre de redevances, délai dépassé,
 * points relevés sur le courrier.
 *
 * Chaque lettre existe en français et en néerlandais : en Flandre,
 * l'administration travaille en néerlandais, et une lettre dans sa langue est
 * traitée plus vite. Les champs inconnus restent visibles entre crochets, à
 * compléter : une lettre ne part jamais avec un trou silencieux.
 */

import { MOYENS } from "../base/moyens";
import { formuleFinale, lireScenario, ouverture, PARAGRAPHE_TARDIF } from "./scenario";
import type { Faits, Identite, Langue, TypeLettre } from "../types";

type T = { fr: string; nl: string };
const t = (langue: Langue, texte: T) => texte[langue];

const ou = (valeur: string | null | undefined, repere: T, langue: Langue) =>
  valeur && valeur.trim() ? valeur.trim() : `[${repere[langue]}]`;

function dateLongue(iso: string | null | undefined, langue: Langue): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(langue === "nl" ? "nl-BE" : "fr-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const DEMANDES: Record<Langue, string[]> = {
  fr: [
    "l'annulation de la redevance réclamée ;",
    "la communication de l'intégralité du dossier, en particulier des photographies originales du contrôle, de leurs métadonnées et des journaux horodatés ;",
    "la communication du règlement-redevance applicable à la date du constat, ainsi que du fondement des frais et majorations éventuels ;",
    "la suspension de toute mesure de recouvrement durant l'examen de la présente contestation ;",
    "un accusé de réception de la présente, ainsi qu'une décision motivée et signée par l'autorité compétente, mentionnant les voies et délais de recours.",
  ],
  nl: [
    "de annulering van de gevorderde retributie;",
    "de mededeling van het volledige dossier, in het bijzonder de originele foto's van de controle, hun metagegevens en de tijdgestempelde logbestanden;",
    "de mededeling van het retributiereglement dat van toepassing was op de datum van de vaststelling, evenals de grondslag van eventuele kosten en verhogingen;",
    "de opschorting van elke invorderingsmaatregel tijdens het onderzoek van deze betwisting;",
    "een ontvangstbevestiging van deze brief, evenals een gemotiveerde en ondertekende beslissing van de bevoegde overheid, met vermelding van de beroepsmogelijkheden en -termijnen.",
  ],
};

export type OptionsLettre = {
  type: TypeLettre;
  langue: Langue;
  faits: Faits;
  identite: Identite;
  /** Moyens retenus par l'utilisateur ; à défaut, tous ceux qui s'appliquent. */
  moyens?: string[];
  /** Le récit de l'utilisateur, en ses propres mots. */
  explication?: string;
  /** Date de la première contestation (relance, réponse à l'huissier). */
  datePremiereContestation?: string | null;
  /** IBAN pour un remboursement. */
  ibanRemboursement?: string | null;
  /** Date de la lettre ; aujourd'hui par défaut. */
  date?: string;
  /** Nombre de redevances visées par la lettre (1 par défaut). */
  nombre?: number;
};

export type LettreComposee = {
  titre: string;
  objet: string;
  texte: string;
  /** Pièces à joindre, telles qu'elles figurent en annexe. */
  annexes: string[];
  /** Version courte, pour un formulaire en ligne ou un e-mail. */
  texteCourt: string;
  /** Le ton retenu, pour l'afficher à l'utilisateur. */
  ton: "courtois" | "ferme" | "pressant";
};

const TITRES: Record<TypeLettre, T> = {
  contestation: { fr: "Lettre de contestation", nl: "Betwistingsbrief" },
  relance: { fr: "Relance après une contestation sans réponse", nl: "Herinnering na een onbeantwoorde betwisting" },
  reponse_huissier: { fr: "Réponse à l'huissier ou à la contrainte", nl: "Antwoord aan de gerechtsdeurwaarder" },
  demande_preuves: { fr: "Demande des photos du contrôle (RGPD)", nl: "Verzoek om de foto's van de controle (AVG)" },
  remboursement: { fr: "Demande d'arrêt et de remboursement", nl: "Verzoek tot stopzetting en terugbetaling" },
  echelonnement: { fr: "Demande de plan de paiement", nl: "Verzoek om een afbetalingsplan" },
  bonne_foi: { fr: "Demande d'annulation à titre gracieux", nl: "Verzoek tot kwijtschelding uit coulance" },
};

export function titreLettre(type: TypeLettre, langue: Langue): string {
  return t(langue, TITRES[type]);
}

export function composerLettre(o: OptionsLettre): LettreComposee {
  const { langue, faits, identite } = o;
  const L = (x: T) => t(langue, x);
  const scenario = lireScenario(faits, o.nombre ?? 1);

  const nomComplet = `${ou(identite.prenom, { fr: "Prénom", nl: "Voornaam" }, langue)} ${ou(identite.nom, { fr: "Nom", nl: "Naam" }, langue)}`;
  const reference = ou(faits.reference, { fr: "référence figurant sur votre courrier", nl: "referentie op uw brief" }, langue);
  const dateLettre = dateLongue(o.date ?? new Date().toISOString().slice(0, 10), langue);
  const ville = identite.ville?.trim() || "";

  const moyensChoisis = MOYENS.filter((m) =>
    o.moyens ? o.moyens.includes(m.id) : m.applicable(faits),
  );
  const piecesMoyens = moyensChoisis.flatMap((m) => m.pieces);

  /* ------------------------------------------------------- en-tête commun */
  const expediteur = [
    nomComplet,
    ou(identite.adresse, { fr: "Rue et numéro", nl: "Straat en nummer" }, langue),
    `${ou(identite.codePostal, { fr: "Code postal", nl: "Postcode" }, langue)} ${ou(identite.ville, { fr: "Commune", nl: "Gemeente" }, langue)}`,
    identite.email?.trim() ? `${L({ fr: "Courriel", nl: "E-mail" })} : ${identite.email.trim()}` : null,
    identite.telephone?.trim() ? `${L({ fr: "Téléphone", nl: "Telefoon" })} : ${identite.telephone.trim()}` : null,
  ];

  const destinataire = [
    faits.crediteur?.trim() || L({ fr: "[Organisme indiqué sur votre courrier]", nl: "[Organisatie vermeld op uw brief]" }),
    L({ fr: "[Adresse indiquée sur votre courrier]", nl: "[Adres vermeld op uw brief]" }),
  ];

  const lieuDate = ville
    ? L({ fr: `${ville}, le ${dateLettre}`, nl: `${ville}, ${dateLettre}` })
    : L({ fr: `Le ${dateLettre}`, nl: dateLettre });

  const objets: Record<TypeLettre, T> = {
    contestation: {
      fr: `Objet : contestation de la redevance de stationnement — référence ${reference}`,
      nl: `Betreft: betwisting van de parkeerretributie — referentie ${reference}`,
    },
    relance: {
      fr: `Objet : contestation restée sans réponse — référence ${reference}`,
      nl: `Betreft: onbeantwoorde betwisting — referentie ${reference}`,
    },
    reponse_huissier: {
      fr: `Objet : contestation de la dette et des frais réclamés — référence ${reference}`,
      nl: `Betreft: betwisting van de schuld en de gevorderde kosten — referentie ${reference}`,
    },
    demande_preuves: {
      fr: `Objet : demande d'accès aux données personnelles (article 15 du RGPD) — référence ${reference}`,
      nl: `Betreft: verzoek om inzage in persoonsgegevens (artikel 15 AVG) — referentie ${reference}`,
    },
    remboursement: {
      fr: `Objet : redevance déjà acquittée — arrêt du recouvrement — référence ${reference}`,
      nl: `Betreft: reeds betaalde retributie — stopzetting van de invordering — referentie ${reference}`,
    },
    echelonnement: {
      fr: `Objet : demande de plan de paiement — référence ${reference}`,
      nl: `Betreft: verzoek om een afbetalingsplan — referentie ${reference}`,
    },
    bonne_foi: {
      fr: `Objet : demande d'annulation à titre gracieux — référence ${reference}`,
      nl: `Betreft: verzoek tot kwijtschelding uit coulance — referentie ${reference}`,
    },
  };
  const objet = L(objets[o.type]);

  const references = [
    faits.communication?.trim()
      ? `${L({ fr: "Communication structurée", nl: "Gestructureerde mededeling" })} : ${faits.communication.trim()}`
      : null,
    faits.plaque?.trim()
      ? `${L({ fr: "Plaque d'immatriculation", nl: "Nummerplaat" })} : ${faits.plaque.trim().toUpperCase()}`
      : null,
  ];

  /* ----------------------------------------------- phrase d'identification */
  const moment = [
    faits.dateConstat ? L({ fr: `le ${dateLongue(faits.dateConstat, langue)}`, nl: `op ${dateLongue(faits.dateConstat, langue)}` }) : null,
    faits.heureConstat ? L({ fr: `à ${faits.heureConstat.replace(":", "h")}`, nl: `om ${faits.heureConstat.replace(":", ".")} uur` }) : null,
  ]
    .filter(Boolean)
    .join(" ");
  const lieu = [
    faits.lieu?.trim() || null,
    faits.commune?.trim() ? L({ fr: `à ${faits.commune.trim()}`, nl: `te ${faits.commune.trim()}` }) : null,
  ]
    .filter(Boolean)
    .join(" ");
  const montant =
    faits.montant != null
      ? L({
          fr: `, d'un montant de ${faits.montant.toFixed(2).replace(".", ",")} €`,
          nl: `, voor een bedrag van € ${faits.montant.toFixed(2).replace(".", ",")}`,
        })
      : "";

  const identification = L({
    fr: `La présente concerne la redevance de stationnement référencée ${reference}${moment ? `, relative à un constat dressé ${moment}` : ""}${lieu ? `, ${lieu}` : ""}${montant}.`,
    nl: `Deze brief betreft de parkeerretributie met referentie ${reference}${moment ? `, met betrekking tot een vaststelling ${moment}` : ""}${lieu ? `, ${lieu}` : ""}${montant}.`,
  });

  /* --------------------------------------------------------------- corps */
  const corps: (string | null)[] = [];
  const demandes: string[] = [];
  const annexes: string[] = [];

  const recitUtilisateur = o.explication?.trim() ? o.explication.trim() : null;

  switch (o.type) {
    case "contestation": {
      corps.push(L(ouverture(scenario, nomComplet, identification)));
      if (scenario.tardif) {
        corps.push("");
        corps.push(L(PARAGRAPHE_TARDIF));
      }
      corps.push("");
      corps.push(L({ fr: "EXPOSÉ DES FAITS ET MOYENS", nl: "FEITEN EN MIDDELEN" }));
      if (moyensChoisis.length === 0) {
        corps.push(
          L({
            fr: "Je conteste la redevance réclamée pour les motifs exposés ci-dessous, et sollicite un réexamen complet du dossier au vu des éléments que je porte à votre connaissance.",
            nl: "Ik betwist de gevorderde retributie om de hieronder uiteengezette redenen en verzoek om een volledig nieuw onderzoek van het dossier in het licht van de elementen die ik u meedeel.",
          }),
        );
      }
      moyensChoisis.forEach((m, i) => {
        if (i > 0) corps.push("");
        corps.push(m.paragraphe(faits)[langue]);
      });
      if (recitUtilisateur) {
        corps.push("");
        corps.push(recitUtilisateur);
      }
      if (scenario.pointsReleves.length > 0) {
        corps.push("");
        corps.push(L({ fr: "POINTS RELEVÉS SUR LE COURRIER", nl: "OPMERKINGEN OVER DE BRIEF" }));
        scenario.pointsReleves.forEach((p, i) => {
          if (i > 0) corps.push("");
          corps.push(L(p));
        });
      }
      // Une petite redevance : trois demandes, l'essentiel. Un dossier lourd :
      // tout, et un examen redevance par redevance.
      demandes.push(...(scenario.enjeu === "faible" ? [DEMANDES[langue][0], DEMANDES[langue][1], DEMANDES[langue][4]] : DEMANDES[langue]));
      if (scenario.enjeu === "eleve") {
        demandes.push(
          L({
            fr: `un examen individualisé de chacune des redevances${scenario.nombre > 1 ? ` (${scenario.nombre} au total)` : ""}, accompagné d'un décompte détaillé par redevance.`,
            nl: `een individueel onderzoek van elke retributie${scenario.nombre > 1 ? ` (${scenario.nombre} in totaal)` : ""}, samen met een gedetailleerde afrekening per retributie.`,
          }),
        );
      }
      if (faits.reponses?.deja_paye === "oui" || o.ibanRemboursement) {
        demandes.push(
          L({
            fr: `le remboursement de la somme déjà acquittée${o.ibanRemboursement ? `, sur le compte ${o.ibanRemboursement}` : ""}.`,
            nl: `de terugbetaling van het reeds betaalde bedrag${o.ibanRemboursement ? `, op rekening ${o.ibanRemboursement}` : ""}.`,
          }),
        );
      }
      annexes.push(...piecesMoyens);
      break;
    }

    case "relance": {
      const datePremiere = o.datePremiereContestation
        ? dateLongue(o.datePremiereContestation, langue)
        : L({ fr: "[date de votre première contestation]", nl: "[datum van uw eerste betwisting]" });
      corps.push(identification);
      corps.push("");
      corps.push(
        L({
          fr: `Par courrier du ${datePremiere}, j'ai contesté cette redevance de manière circonstanciée. Je n'ai reçu à ce jour ni accusé de réception, ni décision.`,
          nl: `Bij brief van ${datePremiere} heb ik deze retributie omstandig betwist. Tot op heden ontving ik noch een ontvangstbevestiging, noch een beslissing.`,
        }),
      );
      corps.push("");
      corps.push(
        L({
          fr: "Je réitère intégralement les termes de cette contestation, dont copie est jointe.",
          nl: "Ik herhaal integraal de inhoud van deze betwisting, waarvan een kopie bijgevoegd is.",
        }),
      );
      if (recitUtilisateur) {
        corps.push("");
        corps.push(recitUtilisateur);
      }
      demandes.push(
        L({
          fr: "une décision motivée sur ma contestation, dans les meilleurs délais ;",
          nl: "een gemotiveerde beslissing over mijn betwisting, zo spoedig mogelijk;",
        }),
        L({
          fr: "la suspension de toute mesure de recouvrement et l'absence de tout frais supplémentaire aussi longtemps que cette décision ne m'a pas été notifiée.",
          nl: "de opschorting van elke invorderingsmaatregel en het uitblijven van bijkomende kosten zolang mij deze beslissing niet werd betekend.",
        }),
      );
      annexes.push(
        L({ fr: "Copie de ma contestation initiale", nl: "Kopie van mijn oorspronkelijke betwisting" }),
        L({ fr: "Preuve de son envoi", nl: "Bewijs van verzending ervan" }),
      );
      break;
    }

    case "reponse_huissier": {
      corps.push(
        L({
          fr: `J'accuse réception de votre courrier relatif au dossier ci-dessus. ${identification}`,
          nl: `Ik heb uw brief met betrekking tot het bovenvermelde dossier goed ontvangen. ${identification}`,
        }),
      );
      corps.push("");
      corps.push(
        L({
          fr: "Je conteste formellement la dette dont le recouvrement est poursuivi, ainsi que l'ensemble des frais qui y ont été ajoutés.",
          nl: "Ik betwist formeel de schuld waarvan de invordering wordt nagestreefd, evenals alle kosten die eraan werden toegevoegd.",
        }),
      );
      if (o.datePremiereContestation) {
        corps.push(
          L({
            fr: `Cette redevance a fait l'objet d'une contestation écrite le ${dateLongue(o.datePremiereContestation, langue)}, dont copie est jointe. Une dette ainsi contestée ne présente pas le caractère certain que requiert son recouvrement forcé.`,
            nl: `Deze retributie werd schriftelijk betwist op ${dateLongue(o.datePremiereContestation, langue)}, waarvan een kopie bijgevoegd is. Een aldus betwiste schuld heeft niet het zekere karakter dat vereist is voor de gedwongen invordering ervan.`,
          }),
        );
      }
      if (moyensChoisis.length > 0) {
        corps.push("");
        corps.push(L({ fr: "Les motifs de cette contestation sont les suivants.", nl: "De redenen van deze betwisting zijn de volgende." }));
        for (const m of moyensChoisis) {
          corps.push("");
          corps.push(m.paragraphe(faits)[langue]);
        }
      }
      if (recitUtilisateur) {
        corps.push("");
        corps.push(recitUtilisateur);
      }
      demandes.push(
        L({
          fr: "la suspension immédiate de toute mesure de recouvrement ;",
          nl: "de onmiddellijke opschorting van elke invorderingsmaatregel;",
        }),
        L({
          fr: "la communication du titre sur lequel se fonde votre intervention ;",
          nl: "de mededeling van de titel waarop uw optreden gebaseerd is;",
        }),
        L({
          fr: "un décompte détaillé des sommes réclamées, distinguant le principal, les intérêts et chaque frais, avec le fondement légal ou réglementaire de chacun.",
          nl: "een gedetailleerde afrekening van de gevorderde bedragen, met onderscheid tussen hoofdsom, intresten en elke kost, met de wettelijke of reglementaire grondslag van elk ervan.",
        }),
      );
      annexes.push(...piecesMoyens);
      if (o.datePremiereContestation) {
        annexes.push(L({ fr: "Copie de ma contestation et preuve de son envoi", nl: "Kopie van mijn betwisting en bewijs van verzending" }));
      }
      break;
    }

    case "demande_preuves": {
      corps.push(identification);
      corps.push("");
      corps.push(
        L({
          fr: "En application de l'article 15 du règlement (UE) 2016/679 (RGPD), je sollicite la communication de l'ensemble des données à caractère personnel me concernant, traitées dans le cadre de ce dossier.",
          nl: "Met toepassing van artikel 15 van Verordening (EU) 2016/679 (AVG) verzoek ik om de mededeling van alle persoonsgegevens die mij betreffen en die in het kader van dit dossier worden verwerkt.",
        }),
      );
      demandes.push(
        L({
          fr: "les photographies prises lors du contrôle, en qualité originale ;",
          nl: "de foto's die tijdens de controle werden genomen, in originele kwaliteit;",
        }),
        L({
          fr: "leurs métadonnées : date, heure et géolocalisation du constat ;",
          nl: "hun metagegevens: datum, tijdstip en geolocatie van de vaststelling;",
        }),
        L({
          fr: "l'identification du dispositif ou de l'agent ayant procédé au constat ;",
          nl: "de identificatie van het toestel of de ambtenaar die de vaststelling heeft verricht;",
        }),
        L({
          fr: "le résultat des vérifications effectuées lors du contrôle (paiements, autorisations de stationnement).",
          nl: "het resultaat van de controles die werden uitgevoerd (betalingen, parkeervergunningen).",
        }),
      );
      corps.push("");
      corps.push(
        L({
          fr: "Conformément à l'article 12 du même règlement, je vous remercie de me répondre dans le délai d'un mois à compter de la réception de la présente.",
          nl: "Overeenkomstig artikel 12 van dezelfde verordening dank ik u om mij te antwoorden binnen een termijn van één maand na ontvangst van deze brief.",
        }),
      );
      annexes.push(
        L({ fr: "Copie de ma carte d'identité (recto)", nl: "Kopie van mijn identiteitskaart (voorzijde)" }),
      );
      break;
    }

    case "remboursement": {
      corps.push(identification);
      corps.push("");
      corps.push(
        L({
          fr: "J'ai acquitté la somme réclamée, comme l'atteste la preuve de paiement jointe. Toute procédure de recouvrement est dès lors sans objet.",
          nl: "Ik heb het gevorderde bedrag betaald, zoals blijkt uit het bijgevoegde betalingsbewijs. Elke invorderingsprocedure is dan ook zonder voorwerp.",
        }),
      );
      if (recitUtilisateur) {
        corps.push("");
        corps.push(recitUtilisateur);
      }
      demandes.push(
        L({
          fr: "l'arrêt immédiat de toute mesure de recouvrement ;",
          nl: "de onmiddellijke stopzetting van elke invorderingsmaatregel;",
        }),
        L({
          fr: `le remboursement de toute somme perçue en double${o.ibanRemboursement ? `, sur le compte ${o.ibanRemboursement}` : ""} ;`,
          nl: `de terugbetaling van elk dubbel geïnd bedrag${o.ibanRemboursement ? `, op rekening ${o.ibanRemboursement}` : ""};`,
        }),
        L({
          fr: "la confirmation écrite de la clôture du dossier.",
          nl: "de schriftelijke bevestiging van de afsluiting van het dossier.",
        }),
      );
      annexes.push(L({ fr: "Preuve du paiement", nl: "Betalingsbewijs" }));
      break;
    }

    case "echelonnement": {
      // Le nombre de mensualités suit le montant : trois pour une petite somme,
      // jusqu'à dix pour une dette lourde. La mensualité est arrondie à l'euro.
      const total = (faits.montant ?? 0) * Math.max(1, o.nombre ?? 1);
      const n = total <= 100 ? 3 : total <= 500 ? 6 : 10;
      const mensualite = total > 0 ? Math.ceil(total / n) : null;
      corps.push(identification);
      corps.push("");
      corps.push(
        L({
          fr: `Ma situation financière ne me permet pas de régler en une seule fois la somme réclamée${total > 0 ? `, soit ${total.toFixed(2).replace(".", ",")} €` : ""}. Je souhaite néanmoins m'acquitter de mes obligations.`,
          nl: `Mijn financiële situatie laat mij niet toe het gevorderde bedrag${total > 0 ? ` van € ${total.toFixed(2).replace(".", ",")}` : ""} in één keer te betalen. Ik wens niettemin mijn verplichtingen na te komen.`,
        }),
      );
      if (recitUtilisateur) {
        corps.push("");
        corps.push(recitUtilisateur);
      }
      demandes.push(
        L({
          fr: mensualite
            ? `un plan de paiement en ${n} mensualités de ${mensualite} € environ, à compter du mois prochain ;`
            : `un plan de paiement en ${n} mensualités, à compter du mois prochain ;`,
          nl: mensualite
            ? `een afbetalingsplan in ${n} maandelijkse termijnen van ongeveer € ${mensualite}, vanaf volgende maand;`
            : `een afbetalingsplan in ${n} maandelijkse termijnen, vanaf volgende maand;`,
        }),
        L({
          fr: "l'absence de tout frais, intérêt ou mesure de recouvrement supplémentaire pendant la durée du plan ;",
          nl: "het uitblijven van bijkomende kosten, intresten of invorderingsmaatregelen tijdens de duur van het plan;",
        }),
        L({
          fr: "la confirmation écrite du plan, avec le numéro de compte et la communication à utiliser.",
          nl: "de schriftelijke bevestiging van het plan, met het rekeningnummer en de te gebruiken mededeling.",
        }),
      );
      break;
    }

    case "bonne_foi": {
      corps.push(
        L({
          fr: `Je soussigné(e) ${nomComplet} sollicite, par la présente, l'annulation à titre gracieux de la redevance mentionnée ci-dessous. ${identification}`,
          nl: `Ondergetekende, ${nomComplet}, verzoekt hierbij om de kwijtschelding uit coulance van de hieronder vermelde retributie. ${identification}`,
        }),
      );
      corps.push("");
      const circonstance =
        faits.reponses?.carte === "riverain"
          ? L({
              fr: "Je suis titulaire d'une carte de riverain pour ce quartier. Son renouvellement m'a échappé, sans aucune intention de me soustraire au paiement : j'ai régularisé ma situation dès que je m'en suis aperçu(e).",
              nl: "Ik ben houder van een bewonerskaart voor deze wijk. De vernieuwing ervan is mij ontgaan, zonder enige bedoeling om de betaling te ontlopen: ik heb mijn situatie geregulariseerd zodra ik het merkte.",
            })
          : faits.reponses?.carte === "pmr"
            ? L({
                fr: "Le véhicule transportait une personne titulaire d'une carte de stationnement pour personne handicapée. L'enregistrement du véhicule a fait défaut, par méconnaissance de la procédure et non par négligence.",
                nl: "Het voertuig vervoerde een houder van een parkeerkaart voor personen met een handicap. De registratie van het voertuig ontbrak, uit onwetendheid over de procedure en niet uit nalatigheid.",
              })
            : L({
                fr: "Il s'agit d'un manquement isolé, commis de bonne foi. Je m'acquitte habituellement de mes obligations de stationnement sans difficulté.",
                nl: "Het gaat om een alleenstaande tekortkoming, te goeder trouw begaan. Ik kom mijn parkeerverplichtingen gewoonlijk zonder problemen na.",
              });
      corps.push(circonstance);
      if (recitUtilisateur) {
        corps.push("");
        corps.push(recitUtilisateur);
      }
      demandes.push(
        L({ fr: "l'annulation de la redevance à titre gracieux ;", nl: "de kwijtschelding van de retributie uit coulance;" }),
        L({
          fr: "à défaut, sa réduction au montant initial, sans frais de rappel ni majoration ;",
          nl: "zo niet, de vermindering ervan tot het oorspronkelijke bedrag, zonder herinneringskosten of verhogingen;",
        }),
        L({ fr: "une réponse écrite et motivée.", nl: "een schriftelijk en gemotiveerd antwoord." }),
      );
      annexes.push(L({ fr: "Justificatif de ma situation (carte, attestation)", nl: "Bewijs van mijn situatie (kaart, attest)" }));
      break;
    }
  }

  annexes.push(L({ fr: "Copie du courrier reçu", nl: "Kopie van de ontvangen brief" }));
  const annexesUniques = Array.from(new Set(annexes));

  /* ------------------------------------------------------------ assemblage */
  const lignes: (string | null)[] = [
    ...expediteur,
    "",
    ...destinataire,
    "",
    lieuDate,
    "",
    objet,
    ...references,
    "",
    L({ fr: "Madame, Monsieur,", nl: "Geachte mevrouw, geachte heer," }),
    "",
    ...corps,
    "",
    L({
      fr: o.type === "demande_preuves" ? "Je sollicite en particulier :" : "Je sollicite dès lors :",
      nl: o.type === "demande_preuves" ? "Ik verzoek in het bijzonder om:" : "Ik verzoek u dan ook om:",
    }),
    ...demandes.map((d, i) => `${i + 1}. ${d}`),
    "",
    o.type === "demande_preuves" || o.type === "echelonnement" || o.type === "bonne_foi"
      ? null
      : L({
          fr: "La présente ne constitue en aucune manière une reconnaissance de dette. Tous mes droits et moyens demeurent expressément réservés.",
          nl: "Deze brief houdt geenszins een erkenning van schuld in. Al mijn rechten en middelen blijven uitdrukkelijk voorbehouden.",
        }),
    "",
    L(formuleFinale(o.type === "bonne_foi" || o.type === "echelonnement" ? "courtois" : scenario.ton)),
    "",
    "",
    nomComplet,
    "",
    L({ fr: "ANNEXES", nl: "BIJLAGEN" }),
    ...annexesUniques.map((p) => `— ${p}`),
  ];

  // La version courte : un formulaire en ligne n'accepte souvent que quelques
  // centaines de mots. L'essentiel, dans l'ordre : qui, quoi, pourquoi, quoi demander.
  const motifs = moyensChoisis.slice(0, 3).map((m) => `- ${m.titre}`);
  const court = [
    objet,
    "",
    identification,
    "",
    ...(o.type === "contestation" || o.type === "reponse_huissier" || o.type === "relance"
      ? [
          L({ fr: "Je conteste cette redevance pour les motifs suivants :", nl: "Ik betwist deze retributie om de volgende redenen:" }),
          ...(motifs.length ? motifs : [L({ fr: "- voir ma lettre jointe", nl: "- zie mijn bijgevoegde brief" })]),
          ...scenario.pointsReleves.slice(0, 1).map((p) => `- ${L(p)}`),
          "",
        ]
      : []),
    L({ fr: "Je sollicite :", nl: "Ik verzoek om:" }),
    ...demandes.slice(0, 3).map((d) => `- ${d.replace(/[;.]$/, "")}`),
    "",
    nomComplet,
  ].join("\n");

  return {
    titre: titreLettre(o.type, langue),
    objet,
    texte: lignes.filter((l): l is string => l !== null).join("\n"),
    annexes: annexesUniques,
    texteCourt: court,
    ton: scenario.ton,
  };
}

/** La lettre qui correspond au stade et à la stratégie. */
export function typeLettreConseille(faits: Faits, codeStrategie: string): TypeLettre {
  if (codeStrategie === "rembourser") return "remboursement";
  if (codeStrategie === "repondre_huissier") return "reponse_huissier";
  if (codeStrategie === "payer") return "demande_preuves";
  if (faits.reponses?.deja_conteste === "sans_reponse") return "relance";
  return "contestation";
}
