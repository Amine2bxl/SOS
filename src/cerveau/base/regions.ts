/**
 * Les trois régions, et ce que la base sait de chacune.
 *
 * La Belgique n'a pas un régime de stationnement, elle en a des centaines :
 * chaque commune fixe le sien par règlement. Ce qui est commun aux trois
 * régions est solide — une redevance n'est pas une amende, elle se conteste
 * par écrit auprès de l'organisme qui la réclame. Ce qui varie (délais, frais,
 * exemptions) est rangé ici région par région, avec son degré de fiabilité.
 *
 * Bruxelles est couverte en détail : la procédure de parking.brussels est
 * publiée, et les 19 communes ont leur fiche. La Wallonie et la Flandre sont
 * couvertes par leur cadre général ; leurs communes s'ajoutent au fil des
 * dossiers — et c'est précisément ce que le corpus de l'association viendra
 * compléter.
 */

import type { InfoRegion, Region } from "../types";

export const REGIONS: Record<Region, InfoRegion> = {
  bruxelles: {
    id: "bruxelles",
    nom: "Région de Bruxelles-Capitale",
    court: "Bruxelles",
    langues: ["fr", "nl"],
    terme: { fr: "redevance de stationnement", nl: "parkeerretributie" },
    cadre:
      "Le stationnement réglementé est organisé à l'échelle régionale et appliqué commune par commune, le plus souvent par parking.brussels, l'agence régionale du stationnement. La redevance est une dette administrative, pas une amende pénale.",
    delaiContestationJours: 10,
    sourceDelai:
      "Procédure publiée par parking.brussels : dix jours calendrier à compter de la réception de l'invitation à payer. Certaines communes appliquent un délai différent ; la mention du courrier prime.",
    couverture: "detaillee",
    fiabilite: "etablie",
    procedure: [
      {
        stade: "notification",
        titre: "L'invitation à payer",
        quand: "Après le constat",
        surcout: "Le montant de la redevance",
        aFaire: "C'est le moment de contester : le délai court dès la réception.",
      },
      {
        stade: "premier_rappel",
        titre: "Le rappel",
        quand: "Au plus tôt 40 jours après le premier courrier",
        surcout: "+ 15 € de frais administratifs",
        aFaire: "Contester reste possible, mais la note a déjà augmenté.",
      },
      {
        stade: "mise_en_demeure",
        titre: "La mise en demeure",
        quand: "Si le rappel reste sans effet",
        surcout: "Frais supplémentaires",
        aFaire: "Dernier échange avant la voie forcée. Ne la laissez pas passer.",
      },
      {
        stade: "contrainte",
        titre: "La contrainte",
        quand: "30 jours après la mise en demeure",
        surcout: "Titre exécutoire : les frais s'alourdissent nettement",
        aFaire: "Un huissier peut désormais vous la signifier. Les délais de recours sont courts.",
      },
      {
        stade: "courrier_huissier",
        titre: "L'huissier de justice",
        quand: "Après signification de la contrainte",
        surcout: "Frais d'huissier, puis mesures d'exécution",
        aFaire: "Il reste des moyens, mais ils sont techniques : agissez le jour même.",
      },
    ],
    baseRecouvrement: {
      texte:
        "Recouvrement des créances non fiscales par voie de contrainte (nouvelle loi communale, art. 137bis, pour les communes).",
      fiabilite: "a_confirmer",
    },
  },

  wallonie: {
    id: "wallonie",
    nom: "Région wallonne",
    court: "Wallonie",
    langues: ["fr"],
    terme: { fr: "redevance de stationnement", nl: "parkeerretributie" },
    cadre:
      "Chaque commune fixe sa redevance par un règlement communal, et en confie souvent la gestion à une société concessionnaire. La contestation s'adresse à l'organisme indiqué sur le courrier, par écrit.",
    delaiContestationJours: null,
    sourceDelai:
      "Le délai est fixé par chaque règlement communal : c'est celui imprimé sur votre courrier qui s'applique.",
    couverture: "generale",
    fiabilite: "a_confirmer",
    procedure: [
      {
        stade: "notification",
        titre: "La demande de paiement",
        quand: "Après le constat",
        surcout: "Le montant de la redevance",
        aFaire: "Contestez par écrit dans le délai indiqué sur le courrier.",
      },
      {
        stade: "premier_rappel",
        titre: "Le rappel",
        quand: "Quelques semaines plus tard, selon la commune",
        surcout: "Des frais de rappel s'ajoutent souvent",
        aFaire: "Répondez par écrit ; joignez votre première contestation si vous en aviez envoyé une.",
      },
      {
        stade: "mise_en_demeure",
        titre: "La mise en demeure",
        quand: "Si le rappel reste sans effet",
        surcout: "Frais supplémentaires",
        aFaire: "Contestez par recommandé : une dette contestée ne devrait plus suivre la voie de la contrainte.",
      },
      {
        stade: "contrainte",
        titre: "La contrainte",
        quand: "Après la mise en demeure",
        surcout: "Frais d'huissier",
        aFaire: "Le recours est enfermé dans un délai court, souvent d'un mois après la signification.",
      },
      {
        stade: "courrier_huissier",
        titre: "L'huissier de justice",
        quand: "Après la contrainte",
        surcout: "Frais d'huissier, puis exécution",
        aFaire: "Agissez le jour même, et ne laissez aucun courrier sans réponse.",
      },
    ],
    baseRecouvrement: {
      texte:
        "Code de la démocratie locale et de la décentralisation, art. L1124-40 : contrainte du directeur financier pour les créances non fiscales.",
      fiabilite: "a_confirmer",
    },
  },

  flandre: {
    id: "flandre",
    nom: "Région flamande",
    court: "Flandre",
    langues: ["nl"],
    terme: { fr: "redevance de stationnement", nl: "parkeerretributie" },
    cadre:
      "Chaque ville ou commune fixe sa « parkeerretributie » par un règlement, souvent géré par une régie ou un parkeerbedrijf. Les échanges avec l'administration se font en néerlandais : la lettre est proposée dans cette langue.",
    delaiContestationJours: null,
    sourceDelai:
      "Le délai est fixé par chaque règlement communal (retributiereglement) : c'est celui imprimé sur votre courrier qui s'applique.",
    couverture: "generale",
    fiabilite: "a_confirmer",
    procedure: [
      {
        stade: "notification",
        titre: "Het betalingsverzoek — la demande de paiement",
        quand: "Après le constat",
        surcout: "Le montant de la retributie",
        aFaire: "Contestez par écrit, en néerlandais, dans le délai indiqué.",
      },
      {
        stade: "premier_rappel",
        titre: "De herinnering — le rappel",
        quand: "Quelques semaines plus tard",
        surcout: "Des frais de rappel s'ajoutent souvent",
        aFaire: "Répondez par écrit et joignez votre première contestation.",
      },
      {
        stade: "mise_en_demeure",
        titre: "De ingebrekestelling — la mise en demeure",
        quand: "Si le rappel reste sans effet",
        surcout: "Frais supplémentaires",
        aFaire: "Contestez par recommandé avant toute contrainte.",
      },
      {
        stade: "contrainte",
        titre: "Het dwangbevel — la contrainte",
        quand: "Après la mise en demeure",
        surcout: "Frais d'huissier",
        aFaire: "Le recours est enfermé dans un délai court : agissez immédiatement.",
      },
      {
        stade: "courrier_huissier",
        titre: "De gerechtsdeurwaarder — l'huissier",
        quand: "Après la contrainte",
        surcout: "Frais d'huissier, puis exécution",
        aFaire: "Agissez le jour même.",
      },
    ],
    baseRecouvrement: {
      texte:
        "Decreet over het lokaal bestuur : dwangbevel du directeur financier pour les créances non fiscales.",
      fiabilite: "a_confirmer",
    },
  },
};

export const LIBELLES_STADE: Record<string, string> = {
  notification: "Premier courrier",
  premier_rappel: "Premier rappel",
  deuxieme_rappel: "Deuxième rappel",
  mise_en_demeure: "Mise en demeure",
  contrainte: "Contrainte",
  courrier_huissier: "Courrier d'huissier",
};

/** Gravité croissante, pour trier et colorer. */
export const GRAVITE_STADE: Record<string, number> = {
  notification: 1,
  premier_rappel: 2,
  deuxieme_rappel: 3,
  mise_en_demeure: 4,
  contrainte: 5,
  courrier_huissier: 6,
};
