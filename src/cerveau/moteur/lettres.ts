/**
 * La rédaction des lettres.
 *
 * Cinq courriers, parce qu'un dossier n'en compte presque jamais qu'un :
 *
 *  - la CONTESTATION, au premier courrier ou au rappel ;
 *  - la RELANCE, quand la contestation reste sans réponse ;
 *  - la RÉPONSE À L'HUISSIER (ou à la contrainte) ;
 *  - la DEMANDE DES PHOTOS, au titre du droit d'accès du RGPD ;
 *  - la demande d'ARRÊT ET DE REMBOURSEMENT, quand on a déjà payé.
 *
 * Chaque lettre existe en français et en néerlandais : en Flandre,
 * l'administration travaille en néerlandais, et une lettre dans sa langue est
 * traitée plus vite. Les champs inconnus restent visibles entre crochets, à
 * compléter : une lettre ne part jamais avec un trou silencieux.
 */

import { MOYENS } from "../base/moyens";
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
};

export type LettreComposee = {
  titre: string;
  objet: string;
  texte: string;
  /** Pièces à joindre, telles qu'elles figurent en annexe. */
  annexes: string[];
};

const TITRES: Record<TypeLettre, T> = {
  contestation: { fr: "Lettre de contestation", nl: "Betwistingsbrief" },
  relance: { fr: "Relance après une contestation sans réponse", nl: "Herinnering na een onbeantwoorde betwisting" },
  reponse_huissier: { fr: "Réponse à l'huissier ou à la contrainte", nl: "Antwoord aan de gerechtsdeurwaarder" },
  demande_preuves: { fr: "Demande des photos du contrôle (RGPD)", nl: "Verzoek om de foto's van de controle (AVG)" },
  remboursement: { fr: "Demande d'arrêt et de remboursement", nl: "Verzoek tot stopzetting en terugbetaling" },
};

export function titreLettre(type: TypeLettre, langue: Langue): string {
  return t(langue, TITRES[type]);
}

export function composerLettre(o: OptionsLettre): LettreComposee {
  const { langue, faits, identite } = o;
  const L = (x: T) => t(langue, x);

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
      corps.push(
        L({
          fr: `Je soussigné(e) ${nomComplet} conteste par la présente cette redevance. ${identification}`,
          nl: `Ondergetekende, ${nomComplet}, betwist hierbij deze retributie. ${identification}`,
        }),
      );
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
      demandes.push(...DEMANDES[langue]);
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
    o.type === "demande_preuves"
      ? null
      : L({
          fr: "La présente ne constitue en aucune manière une reconnaissance de dette. Tous mes droits et moyens demeurent expressément réservés.",
          nl: "Deze brief houdt geenszins een erkenning van schuld in. Al mijn rechten en middelen blijven uitdrukkelijk voorbehouden.",
        }),
    "",
    L({
      fr: "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
      nl: "Met de meeste hoogachting,",
    }),
    "",
    "",
    nomComplet,
    "",
    L({ fr: "ANNEXES", nl: "BIJLAGEN" }),
    ...annexesUniques.map((p) => `— ${p}`),
  ];

  return {
    titre: titreLettre(o.type, langue),
    objet,
    texte: lignes.filter((l): l is string => l !== null).join("\n"),
    annexes: annexesUniques,
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
