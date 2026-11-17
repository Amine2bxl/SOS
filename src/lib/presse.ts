/**
 * La revue de presse : uniquement de vrais articles, vérifiés.
 *
 * Chaque entrée renvoie à l'article publié en ligne, qui cite nommément
 * Mohamed Azouzi ou SOS Citizens. La photo est celle que le journal publie
 * lui-même pour l'aperçu de son article ; elle reste chez lui (elle n'est pas
 * copiée sur nos serveurs) et le crédit l'accompagne. Le résumé est le nôtre,
 * court, et s'en tient aux faits de l'article.
 *
 * Vérifié le 16 novembre 2026. Un article qu'on ne retrouve plus en ligne, ou
 * qui ne cite pas l'association, n'a pas sa place ici.
 */

export type Rubrique = "Redevances" | "Scan-cars" | "Horodateurs" | "L'association";

export type ArticlePresse = {
  slug: string;
  /** Date de parution en ligne (ISO). */
  date: string;
  rubrique: Rubrique;
  /** Le titre du journal, tel quel. */
  titre: string;
  /** Une phrase : ce qui s'est passé. */
  resume: string;
  /** Trois faits au plus, vérifiables dans l'article. */
  faits: string[];
  /** Le chiffre qui frappe, quand l'article en donne un. */
  chiffre?: { valeur: string; libelle: string };
  journal: string;
  journaliste?: string;
  /** L'article d'origine. */
  url: string;
  /** La photo publiée par le journal pour son article. */
  image: string;
  credit: string;
};

export const ARTICLES: ArticlePresse[] = [
  {
    slug: "2026-10-anderlecht-33-redevances-annulees",
    date: "2026-10-07",
    rubrique: "Redevances",
    titre: "« Merci à parking.brussels d'avoir effacé mes 33 amendes » : à Anderlecht, Malik devait 2.450 euros",
    resume: "33 redevances, 2.454,22 € réclamés par huissier. SOS Citizens demande les preuves. Résultat : tout est annulé.",
    faits: [
      "Après la demande de justificatifs, l'agence reconnaît des « erreurs de prise de vue » et annule 7 redevances.",
      "SOS Citizens réclame les photos, l'heure, la position et l'agent pour les 26 autres.",
      "Les preuves ne sont jamais fournies. En septembre, l'agence renonce aux 33.",
    ],
    chiffre: { valeur: "33", libelle: "redevances annulées" },
    journal: "La DH",
    journaliste: "Gilbert Dupont",
    url: "https://www.dhnet.be/regions/bruxelles/2026/10/07/merci-a-parkingbrussels-davoir-efface-mes-33-amendes-a-anderlecht-malik-devait-2450-euros-apres-une-incroyable-serie-de-redevances-V4O746XELZHN7MHB3SXSROSMO4/",
    image:
      "https://www.dhnet.be/resizer/v2/RPQKLL6NHZFSRM2SELT3VKOHT4.jpg?auth=39987f86a7a4abf43a84ef202981b7ed48347d7005f5428ca4ccef92b64bc3b3&width=1200&height=630&quality=85&focal=1500%2C1000",
    credit: "© La DH",
  },
  {
    slug: "2026-05-bladi-horodateurs-sans-pieces",
    date: "2026-05-07",
    rubrique: "Horodateurs",
    titre: "Belgique : Mohamed part en guerre contre les horodateurs sans pièces",
    resume: "Le site Bladi.net reprend l'enquête de Mohamed Azouzi sur la fin du paiement en pièces à Woluwe-Saint-Lambert.",
    faits: [
      "109 horodateurs adaptés pour plus de 204.000 €, plus 186.000 € de maintenance sur trois ans.",
      "La police locale n'a enregistré aucun vol dans un parcmètre depuis 2016.",
    ],
    journal: "Bladi.net",
    url: "https://www.bladi.net/belgique-mohamed-part-guerre-horodateurs-pieces,121113.html",
    image: "https://cdn.bladi.net/img/logo/mohamed-horodateurs-belgique.webp",
    credit: "© Bladi.net",
  },
  {
    slug: "2026-05-enquete-horodateurs-4590-euros",
    date: "2026-05-05",
    rubrique: "Horodateurs",
    titre: "En guerre contre les horodateurs, Mohamed mène son enquête : « chaque parcmètre a coûté 4 590 euros »",
    resume: "Mohamed Azouzi demande les documents à sa commune et découvre le prix de la fin du paiement en pièces.",
    faits: [
      "Le règlement de Woluwe-Saint-Lambert autorisait les pièces en 2020 ; une modification d'octobre 2021 les a supprimées.",
      "Par le droit d'accès aux documents administratifs (art. 32 de la Constitution), il obtient la facture : 204.153,81 €.",
    ],
    chiffre: { valeur: "4.590 €", libelle: "par parcmètre" },
    journal: "La DH",
    journaliste: "Gilbert Dupont",
    url: "https://www.dhnet.be/actu/faits/2026/05/05/en-guerre-contre-les-horodateurs-mohamed-mene-son-enquete-on-a-supprime-le-paiement-en-monnaie-et-chaque-parcmetre-a-coute-4-590-euros-HV7FDEZF2ZCHREXMCSD2DJ7G7U/",
    image:
      "https://www.dhnet.be/resizer/v2/UORDIKS7EBCEZKFYA2TU65HWGM.png?auth=22d8034e28d94f74f91ea82853aeff077f9467c3846c6d710a4b89d409ace350&width=1200&height=630&quality=85&focal=135%2C187",
    credit: "© La DH",
  },
  {
    slug: "2026-03-contestations-par-email",
    date: "2026-03-14",
    rubrique: "L'association",
    titre: "« Parking.brussels ne traitera plus les contestations par e-mail » : SOS Citizens évoque un problème d'accessibilité",
    resume: "Dans une lettre ouverte, SOS Citizens conteste la fin des contestations par e-mail chez parking.brussels.",
    faits: [
      "Depuis le 15 mars 2026, un e-mail de contestation reçoit une réponse automatique de refus.",
      "Pour l'association, l'ordonnance du 6 juillet 2022 n'oblige pas à passer par un formulaire en ligne.",
    ],
    journal: "Bruxelles Today",
    url: "https://www.bruxellestoday.be/actualite/parking-brussels-ignore-contestations-mail.html",
    image: "https://www.bruxellestoday.be/~media/horizontal-hi/38618491028190/parking-brussels-site.jpg",
    credit: "© Bruxelles Today / Facebook parking.brussels",
  },
  {
    slug: "2026-03-association-aide-redevances",
    date: "2026-03-08",
    rubrique: "L'association",
    titre: "« Les gens sont encore très mal informés » : une association vient en aide face aux redevances de parking.brussels",
    resume: "Portrait de SOS Citizens et des erreurs qui font annuler des redevances.",
    faits: [
      "Une redevance n'est pas une amende : un juge peut tout annuler.",
      "Les notifications arrivent par lettre simple, pas recommandée : rien ne prouve qu'elles ont été reçues.",
      "Les adresses des constats sont souvent incomplètes, sans numéro de rue.",
    ],
    journal: "Bruxelles Today",
    url: "https://www.bruxellestoday.be/actualite/sos-citizens-assication-aide-contestations-sanctions-redevances.html",
    image: "https://www.bruxellestoday.be/~media/horizontal-hi/36010858471172/parking-brussels-horodateur.jpg",
    credit: "© Bruxelles Today / Facebook parking.brussels",
  },
  {
    slug: "2026-03-evere-35-redevances-annulees",
    date: "2026-03-03",
    rubrique: "Redevances",
    titre: "« J'ai fait sauter 35 redevances de parking.brussels » : l'histoire de Hicham qui croulait sous les amendes",
    resume: "À Evere, la carte de riverain de Hicham avait expiré. 35 redevances en quelques semaines. SOS Citizens prend le dossier : tout est annulé.",
    faits: [
      "Une redevance presque chaque matin, 37 € chacune, plus les frais de rappel.",
      "SOS Citizens s'appuie sur l'ordonnance bruxelloise du 6 juillet 2022.",
    ],
    chiffre: { valeur: "35", libelle: "redevances annulées" },
    journal: "L'Avenir",
    journaliste: "Gilbert Dupont",
    url: "https://www.lavenir.net/regions/bruxelles/2026/03/03/jai-fait-sauter-35-redevances-de-parkingbrussels-lincroyable-histoire-de-hicham-qui-croulait-sous-les-amendes-YR2YPMJYFZCGZEUEECM3YVURP4/",
    image:
      "https://www.lavenir.net/resizer/v2/7PF5VPPQ5NG3BHD3SKTJUH2DVM.jpg?auth=4d4927fa7699ec8d230e45ca8997843526ef1eea712f5adfe2c046c400546c93&width=1200&height=630&quality=85&focal=1024%2C460",
    credit: "© L'Avenir",
  },
  {
    slug: "2024-11-woluwe-scan-car-sens-interdit",
    date: "2024-11-29",
    rubrique: "Scan-cars",
    titre: "Une scan-car filmée en train de prendre un sens interdit : « Elles ne sont pas au-dessus du code de la route »",
    resume: "Mohamed Azouzi filme une scan-car communale qui prend un sens interdit pour atteindre un parking payant.",
    faits: [
      "Les faits se passent près des Cliniques universitaires Saint-Luc, à Woluwe-Saint-Lambert.",
      "Il l'a filmée et photographiée à plusieurs reprises.",
    ],
    journal: "La DH",
    journaliste: "Gilbert Dupont",
    url: "https://www.dhnet.be/actu/belgique/2024/11/29/une-scan-car-filmee-occupee-de-prendre-un-sens-interdit-elles-ne-sont-pas-au-dessus-du-code-de-la-route-MR5QY7ZPLBBS7LERO6CUNCI57A/",
    image:
      "https://www.dhnet.be/resizer/v2/COATR655HZBVJBRUN3LWHWD2LY.jpg?auth=1ef483bc91ecd01737a8b0662e8ecfcdd254b1051da2b4a3d36ecb2a7e1053b8&width=1200&height=630&quality=85&focal=2152%2C1421",
    credit: "© La DH",
  },
  {
    slug: "2023-02-horodateurs-sans-monnayeur-justice-de-paix",
    date: "2023-02-08",
    rubrique: "Horodateurs",
    titre: "Mohamed, en guerre contre les parcmètres qui refusent le cash : le tribunal a tranché",
    resume: "Quatre ans de refus de payer sans monnayeur. La justice de paix donne tort à Mohamed Azouzi.",
    faits: [
      "Deux redevances en cause, à Ixelles et à Schaerbeek.",
      "La juge estime qu'il pouvait payer autrement. Condamnation : 545,39 €.",
    ],
    chiffre: { valeur: "545,39 €", libelle: "de condamnation" },
    journal: "La DH",
    journaliste: "Gilbert Dupont",
    url: "https://www.dhnet.be/actu/faits/2023/02/08/mohamed-en-guerre-contre-les-parcmetres-qui-refusent-le-cash-a-accumule-les-amendes-le-tribunal-a-tranche-sur-son-sort-7GC3ZUHMMBBTJIYDQP7C5MQVAY/",
    image:
      "https://www.dhnet.be/resizer/v2/YF7XPY733BGY5JMOPWX5Y3CWGE.jpeg?auth=45d8efe24ba788edc65d5c2e356e642eca454f74b552c1c9be33e8d6c983fc95&width=1200&height=630&quality=85&focal=621%2C435",
    credit: "© La DH",
  },
  {
    slug: "2021-09-woluwe-pas-de-cash-horodateur",
    date: "2021-09-22",
    rubrique: "Horodateurs",
    titre: "Pas de cash à l'horodateur alors que le règlement le prévoit : « la commune est dans l'illégalité »",
    resume: "Mohamed lit le règlement de sa commune : il prévoit le paiement en pièces, mais les horodateurs le refusent.",
    faits: [
      "Le règlement de Woluwe-Saint-Lambert de décembre 2020 autorisait les pièces.",
      "Le bourgmestre reconnaît un décalage et promet de modifier le règlement.",
    ],
    journal: "La DH",
    journaliste: "Romain Masquelier",
    url: "https://dhnet.be/regions/bruxelles/pas-de-cash-a-l-horodateur-alors-que-le-reglement-le-prevoit-la-commune-est-dans-l-illegalite-614a2a617b50a62340012543",
    image:
      "https://www.dhnet.be/resizer/v2/YLTR7VEGEBFONFVRRIKDB3MIHE.jpg?auth=20c84bf2301d9e07eb6401c4c7640f298a640dc9ff731cfa70f63fddfdda3f2a&width=1200&height=630&quality=85&focal=954%2C1404",
    credit: "© La DH",
  },
];

/** Du plus récent au plus ancien. */
export const ARTICLES_TRIES = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));

export const articleParSlug = (slug: string) => ARTICLES.find((a) => a.slug === slug) ?? null;

export const RUBRIQUES: Rubrique[] = ["Redevances", "Scan-cars", "Horodateurs", "L'association"];

export const dateParution = (iso: string) =>
  new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/** « La DH · Gilbert Dupont · 7 octobre 2026 ». */
export function referenceSource(a: ArticlePresse): string {
  return [a.journal, a.journaliste, dateParution(a.date)].filter(Boolean).join(" · ");
}

/** Le domaine du journal, pour le lien : « dhnet.be ». */
export const domaineSource = (a: ArticlePresse) => new URL(a.url).hostname.replace(/^www\./, "");
