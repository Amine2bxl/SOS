import { db } from "@/db";
import { communes, articles, faqs } from "@/db/schema";
import { count } from "drizzle-orm";

type CommuneSeed = {
  slug: string;
  nom: string;
  gestionnaire: string;
  zones: string;
  paiement: string;
  cartes: string;
  contestation: string;
  recouvrement: string;
  coordonnees: string;
  documents: string;
  reglements: string;
  derniereVerification: string;
  alertes: string;
};

const GESTION = "parking.brussels (opérateur régional) pour le compte de la commune — à vérifier selon la convention en vigueur à la date des faits.";
const PAIEMENT = "Application parking.brussels, horodateurs, et applications tierces compatibles (4411, PayByPhone). Conservez toujours le reçu horodaté.";
const REC = "Notification initiale, puis rappels, mise en demeure, et transmission éventuelle au recouvrement. Chaque stade doit être daté et conservé.";

const C = (
  slug: string,
  nom: string,
  zones: string,
  cartes: string,
  alertes: string
): CommuneSeed => ({
  slug,
  nom,
  gestionnaire: GESTION,
  zones,
  paiement: PAIEMENT,
  cartes,
  contestation:
    "Contestation à introduire auprès de l'opérateur ou de la commune selon les instructions figurant sur le document reçu. Conservez la preuve d'envoi et l'accusé de réception.",
  recouvrement: REC,
  coordonnees: "Coordonnées officielles à insérer après vérification sur le site communal (aucune coordonnée non confirmée n'est publiée).",
  documents:
    "Notification, rappels, preuve de paiement ou de carte, photographies du lieu et de la signalisation, échanges avec l'administration.",
  reglements: "Règlement-redevance communal et ordonnance régionale applicables à la date du constat — version à vérifier.",
  derniereVerification: "Janvier 2026",
  alertes,
});

const COMMUNES_SEED: CommuneSeed[] = [
  C("anderlecht", "Anderlecht", "Zones vertes et rouges, zones de marché ponctuelles.", "Carte riverain, carte commerçant, carte visiteur selon quartiers.", "Vérifier les rues en zone mixte et les horaires de marché."),
  C("auderghem", "Auderghem", "Zones vertes, zones rouges près des gares et métros.", "Carte riverain, dérogations visiteurs.", "Attention aux abords de métro : contrôles fréquents par ScanCar."),
  C("berchem-sainte-agathe", "Berchem-Sainte-Agathe", "Zones vertes majoritaires, poches rouges commerciales.", "Carte riverain, carte visiteurs.", "Règlement propre à vérifier : commune à gestion partiellement autonome."),
  C("bruxelles-ville", "Bruxelles-Ville", "Zones rouges, vertes et bleues ; pentagone en zone rouge stricte.", "Carte riverain par secteur, carte professionnelle, carte PMR.", "Secteurs de carte riverain stricts : vérifier la correspondance plaque/secteur."),
  C("etterbeek", "Etterbeek", "Zones vertes et rouges, zones institutions européennes.", "Carte riverain, carte institutions, carte visiteurs.", "Zones à régime particulier près des institutions européennes."),
  C("evere", "Evere", "Zones vertes et rouges, zones aéroportuaires ponctuelles.", "Carte riverain, carte visiteurs.", "Vérifier les rues proches de la frontière communale avec Schaerbeek."),
  C("forest", "Forest", "Zones vertes et rouges, abords de la gare de Forest-Midi.", "Carte riverain, carte visiteurs.", "Contrôles renforcés aux abords des salles de spectacle."),
  C("ganshoren", "Ganshoren", "Zones vertes, poches rouges près de l'hôpital et du Basilix.", "Carte riverain, carte visiteurs.", "Zones hospitalières à régime spécifique."),
  C("ixelles", "Ixelles", "Zones rouges et vertes denses ; zones bleues résiduelles.", "Carte riverain, carte visiteur, carte professionnelle.", "Forte densité de ScanCars : conserver les preuves de session active."),
  C("jette", "Jette", "Zones vertes et rouges, abords de l'hôpital universitaire.", "Carte riverain, carte visiteurs, dérogations hospitalières.", "Zones hospitalières : vérifiez le statut particulier de la rue."),
  C("koekelberg", "Koekelberg", "Zones vertes, poche rouge autour de la Basilique.", "Carte riverain, carte visiteurs.", "Événements autour de la Basilique : signalisation ponctuelle."),
  C("molenbeek-saint-jean", "Molenbeek-Saint-Jean", "Zones vertes et rouges, abords de métro.", "Carte riverain, carte visiteurs.", "Vérifier les rues en transition de zone."),
  C("saint-gilles", "Saint-Gilles", "Zones rouges et vertes denses.", "Carte riverain, carte visiteurs.", "Stationnement très tendu : contrôles fréquents."),
  C("saint-josse-ten-noode", "Saint-Josse-ten-Noode", "Zone rouge quasi généralisée.", "Carte riverain limitée, carte visiteurs.", "Régime de zone rouge stricte : vérifier les dérogations applicables."),
  C("schaerbeek", "Schaerbeek", "Zones vertes, rouges et bleues étendues.", "Carte riverain, carte visiteurs, carte professionnelle.", "Grande étendue : vérifier précisément la zone de la rue du constat."),
  C("uccle", "Uccle", "Zones vertes majoritaires, poches rouges commerciales.", "Carte riverain, carte visiteurs.", "Certaines voies régionales : vérifier le gestionnaire compétent."),
  C("watermael-boitsfort", "Watermael-Boitsfort", "Zones vertes, zones étangs en régime particulier.", "Carte riverain, carte visiteurs.", "Zones boisées et étangs : régime de stationnement spécifique le week-end."),
  C("woluwe-saint-lambert", "Woluwe-Saint-Lambert", "Zones vertes, poches rouges shopping et métro.", "Carte riverain, carte visiteurs.", "Zones commerciales à durée limitée."),
  C("woluwe-saint-pierre", "Woluwe-Saint-Pierre", "Zones vertes, poches rouges autour des avenues commerçantes.", "Carte riverain, carte visiteurs.", "Vérifier les avenues à régime mixte."),
];

const ARTICLES_SEED = [
  {
    titre: "ScanCars à Bruxelles : comment fonctionnent les contrôles automatisés du stationnement",
    auteurMedia: "Analyse SOS Citizens ASBL",
    datePub: "2026",
    resume:
      "Fonctionnement des véhicules de contrôle automatisé, lecture de plaque, horodatage, et points à vérifier lorsqu'un constat ScanCar est contesté.",
    theme: "Contrôles automatisés",
    type: "Analyses SOS Citizens ASBL",
    sourceUrl: "",
    dateVerification: "Janvier 2026",
  },
  {
    titre: "Redevance de stationnement : notification, rappel, mise en demeure, quelles différences ?",
    auteurMedia: "Guide SOS Citizens ASBL",
    datePub: "2026",
    resume:
      "Les stades de la procédure expliqués simplement : nature juridique, délais, conséquences d'un paiement ou d'une contestation à chaque étape.",
    theme: "Procédure",
    type: "Analyses SOS Citizens ASBL",
    sourceUrl: "",
    dateVerification: "Janvier 2026",
  },
  {
    titre: "Stationnement payant en Région de Bruxelles-Capitale : cadre ordonnanciel",
    auteurMedia: "Région de Bruxelles-Capitale",
    datePub: "Cadre légal régional",
    resume:
      "Le cadre régional et communal des redevances de stationnement : compétences, délégations, et règlements-redevances des 19 communes.",
    theme: "Réglementation",
    type: "Communications institutionnelles",
    sourceUrl: "",
    dateVerification: "Janvier 2026",
  },
  {
    titre: "Paiement par application : que faire quand la session est active mais le PV arrive ?",
    auteurMedia: "Retour d'expérience anonymisé",
    datePub: "2025",
    resume:
      "Un usager démontre, captures et relevé bancaire à l'appui, qu'une session était active au moment du contrôle. Analyse de la démarche suivie.",
    theme: "Preuves",
    type: "Retours d'expérience anonymisés",
    sourceUrl: "",
    dateVerification: "Décembre 2025",
  },
  {
    titre: "Accès aux données personnelles des dossiers de stationnement (RGPD)",
    auteurMedia: "Analyse SOS Citizens ASBL",
    datePub: "2025",
    resume:
      "Comment exercer son droit d'accès aux photographies, métadonnées et journaux de contrôle, et articuler cette demande avec la contestation.",
    theme: "Données personnelles",
    type: "Analyses SOS Citizens ASBL",
    sourceUrl: "",
    dateVerification: "Décembre 2025",
  },
  {
    titre: "Recouvrement et huissiers : comprendre la contrainte et ses recours",
    auteurMedia: "Presse",
    datePub: "2025",
    resume:
      "Panorama des pratiques de recouvrement des redevances de stationnement et des recours possibles au stade de la contrainte.",
    theme: "Recouvrement",
    type: "Presse",
    sourceUrl: "",
    dateVerification: "Novembre 2025",
  },
  {
    titre: "Rapport sur le stationnement en voirie : chiffres et évolution des contrôles",
    auteurMedia: "Rapport public",
    datePub: "2025",
    resume:
      "Données publiques sur les contrôles, les redevances émises et les contestations : lecture critique et points de vigilance pour les usagers.",
    theme: "Statistiques",
    type: "Rapports publics",
    sourceUrl: "",
    dateVerification: "Novembre 2025",
  },
  {
    titre: "Carte PMR et stationnement : droits, enregistrement de plaque et limites",
    auteurMedia: "Guide SOS Citizens ASBL",
    datePub: "2025",
    resume:
      "Conditions d'utilisation de la carte de stationnement pour personnes handicapées, enregistrement de plaque, et preuves à conserver.",
    theme: "Autorisations",
    type: "Guides",
    sourceUrl: "",
    dateVerification: "Octobre 2025",
  },
];

const FAQ_SEED = [
  {
    question: "Une redevance de stationnement est-elle une amende pénale ?",
    reponse:
      "Non. La redevance de stationnement est une dette administrative ou fiscale selon le fondement retenu par la commune. Elle suit une procédure administrative propre, distincte du procès-verbal routier ou de la sanction administrative communale (SAC). C'est pour cela que la première étape de la plateforme consiste à identifier la nature exacte du document reçu.",
    categorie: "Comprendre",
    ordre: 1,
  },
  {
    question: "Que faire en premier lorsque je reçois un courrier de stationnement ?",
    reponse:
      "Ne payez pas immédiatement si vous entendez contester, car le paiement peut être interprété comme une reconnaissance des faits. Identifiez la nature du document, la commune, la date du constat, le stade de la procédure et le délai pour réagir, puis rassemblez vos preuves. La plateforme vous guide étape par étape.",
    categorie: "Procédure",
    ordre: 2,
  },
  {
    question: "Quelle est la différence entre notification, rappel et mise en demeure ?",
    reponse:
      "La notification initiale est le premier document réclamant la redevance. Le rappel intervient en l'absence de paiement ou de réponse. La mise en demeure est un acte formel précédant le recouvrement forcé. La contrainte et l'intervention d'un huissier sont des stades ultérieurs. Chaque stade a ses propres délais et conséquences.",
    categorie: "Procédure",
    ordre: 3,
  },
  {
    question: "Ma session d'application était active mais j'ai reçu une redevance. Que faire ?",
    reponse:
      "Conservez la capture d'application montrant la date, l'heure, la plaque et la zone, ainsi que le reçu de paiement ou le relevé bancaire. Introduisez une contestation motivée en joignant ces pièces et demandez les photographies du contrôle pour vérifier la concordance des horaires.",
    categorie: "Preuves",
    ordre: 4,
  },
  {
    question: "Le paiement par carte bancaire prouve-t-il mon stationnement régulier ?",
    reponse:
      "Pas automatiquement. Un relevé bancaire prouve un débit, mais pas toujours la plaque, la zone ou la plage horaire. Il doit être complété par un reçu d'application ou d'horodateur identifiant le véhicule et le lieu.",
    categorie: "Preuves",
    ordre: 5,
  },
  {
    question: "Puis-je demander les photographies prises par la ScanCar ?",
    reponse:
      "Oui. Vous pouvez demander la communication des photographies originales, des métadonnées et des journaux horodatés du contrôle, d'une part dans le cadre de la contestation, d'autre part au titre de l'accès aux données personnelles. Ce sont deux démarches distinctes et complémentaires.",
    categorie: "Données",
    ordre: 6,
  },
  {
    question: "Que risque-t-on si l'on ne répond pas à une mise en demeure ?",
    reponse:
      "L'absence de réponse peut conduire à une contrainte puis à un recouvrement par huissier, avec des frais supplémentaires. Si vous contestez, faites-le par écrit avec preuve d'envoi, et demandez la suspension du recouvrement pendant l'examen.",
    categorie: "Recouvrement",
    ordre: 7,
  },
  {
    question: "La plateforme garantit-elle l'annulation de ma redevance ?",
    reponse:
      "Non. La plateforme ne promet aucune annulation. Elle vous aide à comprendre la procédure, à vérifier votre dossier, à identifier les pièces manquantes et à préparer une démarche documentée. Chaque dossier reste soumis à l'examen des faits, des pièces et du droit applicable.",
    categorie: "Plateforme",
    ordre: 8,
  },
  {
    question: "SOS Citizens ASBL est-il un cabinet d'avocats ?",
    reponse:
      "Non. SOS Citizens ASBL est une association sans but lucratif d'information, de préparation documentaire et d'orientation citoyenne. Elle ne remplace pas un conseil juridique personnalisé lorsque la situation l'exige.",
    categorie: "Plateforme",
    ordre: 9,
  },
  {
    question: "Mes données sont-elles partagées ?",
    reponse:
      "Les informations saisies servent uniquement à préparer votre dossier. Aucune donnée n'est partagée avec des tiers sans votre accord. Vous pouvez demander la suppression de vos données à tout moment via la page Contact.",
    categorie: "Données",
    ordre: 10,
  },
];

let seeding: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (seeding) return seeding;
  seeding = (async () => {
    const [n] = await db.select({ c: count() }).from(communes);
    if ((n?.c ?? 0) === 0) {
      await db.insert(communes).values(COMMUNES_SEED);
    }
    const [na] = await db.select({ c: count() }).from(articles);
    if ((na?.c ?? 0) === 0) {
      await db.insert(articles).values(ARTICLES_SEED);
    }
    const [nf] = await db.select({ c: count() }).from(faqs);
    if ((nf?.c ?? 0) === 0) {
      await db.insert(faqs).values(FAQ_SEED);
    }
  })().catch((e) => {
    seeding = null;
    throw e;
  });
  return seeding;
}
