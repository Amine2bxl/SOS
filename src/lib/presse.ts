/**
 * La revue de presse de l'association.
 *
 * Ce que les journaux ont écrit sur l'action de SOS Citizens et de son
 * président. Chaque entrée est un résumé rédigé par l'association, avec la
 * référence complète de l'article d'origine — titre, journal, date, page,
 * journaliste — pour qu'on puisse le retrouver. Les articles eux-mêmes, leurs
 * photos et leurs unes appartiennent à leurs éditeurs : ils ne sont pas
 * reproduits ici.
 *
 * Un résultat obtenu dans un dossier ne garantit pas l'issue d'un autre : la
 * page le dit, et les résumés s'en tiennent aux faits rapportés.
 */

export type Rubrique = "Stationnement" | "Scan-cars" | "Voirie" | "Horodateurs";

export type ArticlePresse = {
  slug: string;
  /** Date de parution (ISO). */
  date: string;
  rubrique: Rubrique;
  /** Notre titre, factuel. */
  titre: string;
  /** Une phrase : ce qu'il faut retenir. */
  chapo: string;
  /** Le résumé, paragraphe par paragraphe. */
  resume: string[];
  /** Ce que le dossier enseigne à quelqu'un dans la même situation. */
  aRetenir?: string;
  /** En chiffres, quand l'article en donne. */
  chiffre?: { valeur: string; libelle: string };
  source: {
    titre: string;
    journal: string;
    edition?: string;
    page?: number;
    uneLe?: boolean;
    journaliste?: string;
  };
};

export const ARTICLES: ArticlePresse[] = [
  {
    slug: "2026-10-anderlecht-33-redevances-annulees",
    date: "2026-10-07",
    rubrique: "Stationnement",
    titre: "Anderlecht : les 33 redevances d'un fils qui conduisait sa mère sont annulées",
    chapo:
      "Plus de 2.450 € réclamés par huissier pour des stationnements avec une carte pour personne handicapée. Après l'intervention de l'association, l'agence a tout annulé.",
    resume: [
      "Un habitant d'Anderlecht conduit régulièrement sa mère, titulaire d'une carte de stationnement pour personne handicapée. En un an, il reçoit 33 redevances. Avec les rappels et les frais, l'étude d'huissiers chargée du recouvrement lui réclame 2.454,22 €.",
      "SOS Citizens demande à l'agence du stationnement, pour chaque constat, les données d'horodatage et de géolocalisation, les photos et l'identité de l'agent. L'agence reconnaît d'abord des erreurs de prise de vue et annule 7 redevances, puis, en septembre, les 33.",
      "Le porte-parole de l'agence rappelle dans l'article qu'il faut enregistrer le véhicule dans l'application prévue pour les cartes de stationnement pour personne handicapée, et réagir avant que les redevances ne s'accumulent.",
    ],
    aRetenir:
      "Demander les preuves de chaque constat (photos, heure, position, agent) est un droit. C'est souvent là que les erreurs apparaissent.",
    chiffre: { valeur: "33", libelle: "redevances annulées" },
    source: {
      titre: "« Merci à parking.brussels d'avoir effacé 33 amendes »",
      journal: "La DH Les Sports+",
      edition: "Bruxelles-Brabant",
      page: 6,
      uneLe: true,
      journaliste: "Gilbert Dupont",
    },
  },
  {
    slug: "2026-03-evere-35-redevances-annulees",
    date: "2026-03-03",
    rubrique: "Stationnement",
    titre: "Evere : 35 redevances annulées pour un riverain dont la carte avait expiré",
    chapo:
      "Parfois deux redevances par jour, pour plus de 2.500 € au total. Cinq mois après l'intervention de l'association, toutes sont annulées et le recouvrement est clôturé.",
    resume: [
      "Entre septembre et octobre 2025, un habitant d'Evere reçoit 35 redevances de stationnement. Sa carte de riverain était arrivée à échéance sans qu'il s'en aperçoive. Avec les rappels, la note dépasse 2.000 €.",
      "SOS Citizens relève des erreurs dans les références de plusieurs redevances, fait valoir la bonne foi du riverain — aucun rappel de renouvellement ne lui avait été adressé — et conteste les redevances envoyées après sa première contestation. L'association demande aussi la preuve du bon fonctionnement de la scan-car et un réexamen individualisé de chaque redevance.",
      "Le 10 février 2026, l'agence du stationnement confirme l'annulation des 35 redevances et la fin du recouvrement, sans dire quel argument l'a emporté.",
    ],
    aRetenir:
      "Une carte de riverain expirée ne fait pas tout perdre : la bonne foi, les erreurs de référence et les redevances envoyées après une contestation se discutent.",
    chiffre: { valeur: "2.532,23 €", libelle: "qui ne seront pas payés" },
    source: {
      titre: "« J'ai fait sauter 35 redevances de parking.brussels »",
      journal: "La DH Les Sports+",
      page: 10,
      uneLe: true,
      journaliste: "Gilbert Dupont",
    },
  },
  {
    slug: "2024-11-woluwe-scan-car-sens-interdit",
    date: "2024-11-29",
    rubrique: "Scan-cars",
    titre: "Woluwe-Saint-Lambert : une scan-car filmée en sens interdit",
    chapo:
      "Le président de l'association a filmé à plusieurs reprises une scan-car communale qui empruntait un sens interdit. La commune annonce une enquête.",
    resume: [
      "Près des cliniques universitaires Saint-Luc, Mohamed Azouzi constate qu'une scan-car communale prend régulièrement une branche en sens interdit pour rejoindre directement un petit parking. Il la photographie et la filme à plusieurs dates en septembre 2024.",
      "Interrogé par le journal, le bourgmestre annonce une enquête et des rappels à l'ordre, et précise qu'une éventuelle amende serait à charge de l'agent. Les redevances établies lors de ces passages restent toutefois dues, selon lui.",
    ],
    aRetenir: "Les véhicules de contrôle sont soumis au code de la route comme tout le monde.",
    source: {
      titre: "« Les scan-cars ne sont pas au-dessus du code de la route »",
      journal: "La DH Les Sports+",
      edition: "Bruxelles",
      page: 7,
      uneLe: true,
      journaliste: "Gilbert Dupont",
    },
  },
  {
    slug: "2024-11-saint-gilles-places-trop-etroites",
    date: "2024-11-26",
    rubrique: "Voirie",
    titre: "Saint-Gilles : des places de 1,59 m pour des voitures de 1,80 m",
    chapo:
      "Avenue du Roi, les emplacements sont trop étroits pour les véhicules actuels. Les voitures garées y sont régulièrement accrochées.",
    resume: [
      "Un riverain de l'avenue du Roi, à Saint-Gilles, voit ses véhicules régulièrement abîmés. Les emplacements mesurent 1,59 m de large, alors que la plupart des voitures récentes dépassent 1,80 m. Le journal a vérifié la mesure sur place.",
      "Bruxelles Mobilité, gestionnaire de cette voirie régionale, juge la situation regrettable, mais n'envisage à ce stade ni de modifier l'aménagement ni d'indemniser les riverains.",
    ],
    chiffre: { valeur: "1,59 m", libelle: "de large, mesurés sur place" },
    source: {
      titre: "« Qui va payer la facture ? »",
      journal: "La DH Les Sports+",
      page: 7,
      journaliste: "Gilbert Dupont",
    },
  },
  {
    slug: "2023-02-horodateurs-sans-monnayeur-justice-de-paix",
    date: "2023-02-08",
    rubrique: "Horodateurs",
    titre: "Horodateurs sans pièces : la justice de paix donne tort au président de l'association",
    chapo:
      "Après quatre ans de bras de fer pour défendre le paiement en espèces, la justice de paix de Woluwe-Saint-Pierre tranche contre lui. Il envisage de faire appel.",
    resume: [
      "Mohamed Azouzi refusait de payer son stationnement là où l'horodateur n'acceptait pas les pièces. L'agence du stationnement l'a cité en justice de paix pour deux redevances, à Ixelles et à Schaerbeek.",
      "Selon le journal, la juge a estimé que l'acceptation des espèces n'est pas une obligation absolue, en s'appuyant notamment sur un arrêt de la Cour de justice de l'Union européenne du 26 janvier 2021, et que les conditions de paiement étaient affichées. Elle n'a pas retenu de discrimination. Frais compris, la condamnation s'élève à 545,39 €.",
    ],
    aRetenir:
      "Toutes les batailles ne se gagnent pas : l'association publie aussi ses défaites. Un moyen écarté par un juge n'est plus présenté comme solide.",
    source: {
      titre: "« Illégaux, les horodateurs sans monnayeur ? »",
      journal: "La DH Les Sports+",
      edition: "Bruxelles",
      page: 7,
      uneLe: true,
      journaliste: "Gilbert Dupont",
    },
  },
  {
    slug: "2022-07-horodateurs-plainte-spf-economie",
    date: "2022-07-20",
    rubrique: "Horodateurs",
    titre: "Fin des espèces aux horodateurs : une plainte au SPF Économie",
    chapo:
      "Le journal relaie la plainte du président de l'association contre les horodateurs qui n'acceptent plus que le paiement électronique.",
    resume: [
      "Mohamed Azouzi porte plainte auprès du SPF Économie, en invoquant une recommandation européenne selon laquelle billets et pièces devraient être acceptés pour les paiements. Le SPF répond que la redevance de stationnement rémunère l'usage de l'espace public, qu'elle ne relève pas du Code de droit économique, et que les communes en fixent les modalités.",
      "L'article évoque aussi la disparition progressive des horodateurs à pièces et les pistes d'un contrôle encore plus automatisé, avec les questions de vie privée qu'elles soulèvent.",
    ],
    source: {
      titre: "« Horodateurs : le pire est à venir ! »",
      journal: "Vlan",
      page: 6,
      journaliste: "Julien Semninckx",
    },
  },
  {
    slug: "2021-09-woluwe-pas-de-cash-horodateur",
    date: "2021-09-22",
    rubrique: "Horodateurs",
    titre: "Woluwe-Saint-Lambert : le règlement prévoyait les pièces, les horodateurs les refusaient",
    chapo:
      "En relisant le règlement communal après un procès-verbal, le président de l'association découvre un décalage entre le texte et les appareils. Le bourgmestre promet une mise à jour.",
    resume: [
      "Le règlement de stationnement de Woluwe-Saint-Lambert, en vigueur jusqu'au 31 décembre 2021, prévoyait le paiement à l'horodateur en pièces ou par carte bancaire. Les appareils, eux, n'acceptaient plus les pièces. Mohamed Azouzi dénonce la situation, en pensant notamment aux personnes âgées.",
      "Interrogé par le journal, le bourgmestre reconnaît le décalage — les horodateurs ont été modifiés plus vite que prévu — et annonce l'adaptation du règlement.",
    ],
    aRetenir: "Le règlement communal fait foi. Le lire, c'est parfois trouver l'argument.",
    source: {
      titre: "« Pas de cash à l'horodateur alors que le règlement le prévoit »",
      journal: "La DH Les Sports+",
      page: 15,
      journaliste: "Romain Masquelier",
    },
  },
];

/** Du plus récent au plus ancien. */
export const ARTICLES_TRIES = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));

export const articleParSlug = (slug: string) => ARTICLES.find((a) => a.slug === slug) ?? null;

export const RUBRIQUES: Rubrique[] = ["Stationnement", "Scan-cars", "Voirie", "Horodateurs"];

export const dateParution = (iso: string) =>
  new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/** La ligne de référence d'un article : « La DH Les Sports+, 7 octobre 2026, p. 6 ». */
export function referenceSource(a: ArticlePresse): string {
  const s = a.source;
  return [
    s.journal + (s.edition ? ` (édition ${s.edition})` : ""),
    dateParution(a.date),
    s.page ? `p. ${s.page}${s.uneLe ? ", annoncé en une" : ""}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}
