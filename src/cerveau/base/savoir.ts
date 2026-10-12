/**
 * Les fiches de savoir : ce que le moteur répond quand on lui pose une question.
 *
 * Chaque fiche porte une RÉPONSE COURTE (ce qu'on lit en premier) et un texte
 * plus complet. La recherche (`moteur/recherche.ts`) les classe par
 * pertinence ; la meilleure fiche fournit la réponse directe.
 *
 * Une bonne partie des fiches est dérivée du contenu déjà publié sur le site
 * (notions, étapes de la procédure, questions fréquentes) : une seule source,
 * jamais de copie qui diverge. Les fiches propres au moteur (les erreurs à
 * éviter, l'envoi, le droit d'accès aux photos…) sont écrites ici.
 *
 * Le corpus de l'association — dix ans de recherche sur le stationnement —
 * s'ajoute à ces fiches par `scripts/ingerer-savoir.mjs`, sans toucher au code.
 */

import { DOCUMENTS, FAQS, NOTIONS, PREUVES } from "../../lib/data";
import { MOYENS } from "./moyens";
import { REGIONS } from "./regions";

export type Fiche = {
  id: string;
  titre: string;
  /** Une ou deux phrases : la réponse qu'on lit en premier. */
  reponse: string;
  /** Le développement, facultatif. */
  texte?: string;
  categorie: "procedure" | "droits" | "preuves" | "moyens" | "regions" | "pratique" | "corpus";
  /** Mots qui n'apparaissent pas forcément dans le texte, mais qu'on tape. */
  motsCles?: string[];
  /** Origine de la fiche (pour le corpus importé : le document source). */
  source?: string;
};

/** Première phrase d'un texte : sert de réponse courte aux fiches dérivées. */
function premierePhrase(texte: string): string {
  const m = texte.match(/^(.+?[.!?])(\s|$)/);
  return m ? m[1] : texte;
}

const FICHES_PROPRES: Fiche[] = [
  {
    id: "erreurs-a-eviter",
    titre: "Les erreurs qui font perdre un dossier",
    reponse:
      "Payer avant d'avoir décidé de contester, laisser passer le délai, et envoyer une contestation sans en garder la preuve : ce sont les trois erreurs qui font perdre le plus de dossiers.",
    texte:
      "Payer vaut souvent reconnaissance : une fois payé, revenir en arrière est très difficile. Le délai pour contester est court — dix jours à Bruxelles chez parking.brussels — et il court dès la réception. Une contestation sans preuve d'envoi (récépissé de recommandé, capture du formulaire en ligne) n'existe pas aux yeux de l'administration. Enfin, ignorer un rappel ou un courrier d'huissier fait grimper les frais à chaque étape.",
    categorie: "pratique",
    motsCles: ["erreur", "piège", "éviter", "conseil", "ne pas faire"],
  },
  {
    id: "envoyer-sa-contestation",
    titre: "Comment envoyer sa contestation",
    reponse:
      "Par le canal indiqué sur votre courrier — formulaire en ligne, recommandé ou e-mail — et toujours en gardant une preuve datée de l'envoi.",
    texte:
      "Le courrier reçu précise comment contester : c'est ce canal qu'il faut utiliser. En ligne, faites une capture d'écran de la page de confirmation et notez le numéro de suivi. Par la poste, préférez le recommandé et gardez le récépissé. Joignez toujours une copie du courrier reçu et les pièces qui prouvent ce que vous avancez. Gardez une copie de tout ce que vous envoyez.",
    categorie: "pratique",
    motsCles: ["envoyer", "recommandé", "formulaire", "poste", "adresse", "où envoyer"],
  },
  {
    id: "photos-du-controle",
    titre: "Obtenir les photos du contrôle",
    reponse:
      "Les photos prises lors du contrôle sont des données personnelles : le RGPD (article 15) vous donne le droit d'en obtenir une copie, et l'organisme doit répondre dans un délai d'un mois.",
    texte:
      "La ScanCar ou l'agent qui a constaté le stationnement a pris des photos, horodatées et géolocalisées. Elles permettent de vérifier la plaque, l'heure et le lieu. Vous pouvez les demander dans votre contestation, et séparément au titre du droit d'accès prévu par l'article 15 du RGPD. L'organisme dispose en principe d'un mois pour répondre (article 12). Le moteur peut rédiger cette demande pour vous.",
    categorie: "droits",
    motsCles: ["photo", "photos", "preuve", "scancar", "rgpd", "données", "accès", "caméra"],
  },
  {
    id: "payer-ou-contester",
    titre: "Payer ou contester ?",
    reponse:
      "Contestez si vous avez un argument et la pièce qui le prouve. Sans argument solide, payer dans le délai évite les frais de rappel — et c'est un conseil que nous donnons aussi.",
    texte:
      "Une contestation sans fondement retarde le dossier et peut faire grimper la note si le délai de paiement passe. À l'inverse, payer clôture le dossier et rend tout retour en arrière très difficile. Le moteur vous dit franchement de quel côté penche votre situation.",
    categorie: "pratique",
    motsCles: ["payer", "contester", "choisir", "décider", "vaut-il"],
  },
  {
    id: "contestation-rejetee",
    titre: "Ma contestation a été rejetée",
    reponse:
      "Lisez les motifs du rejet : s'ils ne répondent pas à vos arguments, vous pouvez le faire valoir par écrit. Une décision doit être motivée.",
    texte:
      "Un rejet n'est pas toujours la fin. S'il ne répond pas à vos arguments ou s'il est purement stéréotypé, répondez par écrit en le soulignant et en joignant à nouveau vos pièces. Si un élément nouveau apparaît (photo, attestation), transmettez-le. En dernier recours, la contestation d'une dette se tranche devant le juge de paix.",
    categorie: "procedure",
    motsCles: ["rejet", "rejetée", "refus", "refusée", "réponse négative", "recours"],
  },
  {
    id: "contrainte-que-faire",
    titre: "J'ai reçu une contrainte",
    reponse:
      "Une contrainte rend la dette exécutoire. Les délais pour s'y opposer sont courts — souvent un mois après la signification : agissez immédiatement.",
    texte:
      "La contrainte est l'acte par lequel l'administration se donne un titre pour récupérer la somme par voie d'huissier. Elle suppose une dette certaine. Si vous aviez contesté la redevance par écrit, rappelez-le immédiatement, copie à l'appui : une dette sérieusement contestée n'est plus « certaine » au sens où l'entend une partie de la jurisprudence. Faites-vous accompagner.",
    categorie: "procedure",
    motsCles: ["contrainte", "dwangbevel", "titre exécutoire", "exécutoire", "signification"],
  },
  {
    id: "huissier-que-faire",
    titre: "Un huissier me réclame la somme",
    reponse:
      "Ne l'ignorez pas. Vérifiez s'il agit sur une contrainte ou à l'amiable, contestez par écrit si la dette l'est, et demandez le détail de chaque frais.",
    texte:
      "Au stade amiable, l'huissier relance pour le compte de l'organisme : aucun titre ne l'autorise encore à saisir. Après une contrainte signifiée, il peut passer à l'exécution. Dans les deux cas, répondez par écrit, joignez vos contestations antérieures, et exigez le décompte détaillé et le fondement de chaque frais. Le moteur prépare cette réponse.",
    categorie: "procedure",
    motsCles: ["huissier", "deurwaarder", "gerechtsdeurwaarder", "saisie", "recouvrement"],
  },
  {
    id: "redevance-ou-amende",
    titre: "Redevance, amende, SAC : quelle différence ?",
    reponse:
      "La redevance est une dette administrative réclamée par la commune ou son opérateur. L'amende relève de la police et du parquet ; la SAC est une sanction communale. Les trois se contestent différemment.",
    texte:
      "Le stationnement payant non payé donne lieu à une redevance : ce n'est pas une infraction pénale et il n'y a pas de casier. Le stationnement dangereux ou interdit (trottoir, place handicapée…) relève de l'amende de police ou de la sanction administrative communale. SOS Citizens traite aujourd'hui les redevances de stationnement.",
    categorie: "droits",
    motsCles: ["amende", "pv", "procès-verbal", "sac", "sanction", "police", "boete"],
  },
  {
    id: "contester-suspend-il",
    titre: "Contester suspend-il le paiement ?",
    reponse:
      "Non. Introduire une contestation ne dispense pas de payer dans le délai indiqué. Si la contestation aboutit, les sommes versées sont remboursées.",
    categorie: "procedure",
    motsCles: ["suspendre", "suspension", "délai de paiement", "payer quand même"],
  },
  {
    id: "flandre-langue",
    titre: "Contester en Flandre : dans quelle langue ?",
    reponse:
      "En néerlandais. Les administrations flamandes travaillent en néerlandais ; le moteur rédige votre lettre dans cette langue.",
    categorie: "regions",
    motsCles: ["néerlandais", "flamand", "nederlands", "langue", "vlaanderen", "traduire"],
  },
];

/** Les fiches dérivées du contenu publié : une seule source de vérité. */
function fichesDerivees(): Fiche[] {
  const notions: Fiche[] = NOTIONS.map((n, i) => ({
    id: `notion-${i}`,
    titre: n.titre,
    reponse: premierePhrase(n.texte),
    texte: n.texte,
    categorie: "droits",
  }));

  const etapes: Fiche[] = DOCUMENTS.map((d, i) => ({
    id: `etape-${i}`,
    titre: d.titre.replace(/^\d+\.\s*/, ""),
    reponse: d.aFaire,
    texte: `${d.cestQuoi} ${d.aFaire}`,
    categorie: "procedure",
  }));

  const faq: Fiche[] = FAQS.map((q, i) => ({
    id: `faq-${i}`,
    titre: q.question,
    reponse: premierePhrase(q.reponse),
    texte: q.reponse,
    categorie: "pratique",
  }));

  const preuves: Fiche = {
    id: "preuves",
    titre: "Les preuves qui pèsent le plus",
    reponse: PREUVES.slice(0, 3).join(" ; ") + ".",
    texte: PREUVES.join(". ") + ".",
    categorie: "preuves",
    motsCles: ["preuve", "pièce", "justificatif", "joindre", "annexe"],
  };

  const moyens: Fiche[] = MOYENS.map((m) => ({
    id: `moyen-${m.id}`,
    titre: m.titre,
    reponse: m.explication,
    texte: `${m.explication} Pièces utiles : ${m.pieces.join(", ")}.`,
    categorie: "moyens",
  }));

  const regions: Fiche[] = Object.values(REGIONS).map((reg) => ({
    id: `region-${reg.id}`,
    titre: `Les redevances de stationnement en ${reg.court === "Bruxelles" ? "Région bruxelloise" : reg.court}`,
    reponse: reg.cadre,
    texte: `${reg.cadre} ${reg.sourceDelai ?? ""}`,
    categorie: "regions",
    motsCles: [reg.court, reg.terme.fr, reg.terme.nl],
  }));

  return [...notions, ...etapes, ...faq, preuves, ...moyens, ...regions];
}

export const FICHES: Fiche[] = [...FICHES_PROPRES, ...fichesDerivees()];
