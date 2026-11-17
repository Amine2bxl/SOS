/**
 * Le contrôle du courrier : chaque élément, un verdict.
 *
 * L'analyse dit QUOI FAIRE ; le contrôle dit CE QUI A ÉTÉ VÉRIFIÉ. Les deux
 * sont distincts à dessein. Quelqu'un qui hésite à payer veut savoir, point
 * par point, ce que le moteur a regardé et ce qu'il en a conclu — y compris ce
 * qu'il n'a pas pu trancher.
 *
 * Trois verdicts, jamais deux (voir `StatutControle`). Le troisième,
 * « indéterminé », est le plus important : c'est lui qui empêche le moteur de
 * présenter comme vérifié ce qu'il n'a pas pu lire.
 *
 * Aucun frais n'est jugé irrégulier sur son seul montant : le moteur demande
 * sa base et son décompte, il ne crie pas à l'abus.
 */

import { REGIONS } from "../base/regions";
import { dateLongue, estDimanche, jourFerie } from "./calendrier";
import type { Faits, LigneSolde, PointControle, SoldeReconstruit, Stade } from "../types";

const JOUR = 86_400_000;

function jourUtc(iso: string | null | undefined): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

const euros = (n: number) =>
  `${n.toLocaleString("fr-BE", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} €`;

/** Communication structurée belge : les dix premiers chiffres modulo 97 donnent les deux derniers. */
export function communicationValide(brute: string): boolean | null {
  const chiffres = brute.replace(/\D/g, "");
  if (chiffres.length !== 12) return null;
  let reste = 0;
  for (const c of chiffres.slice(0, 10)) reste = (reste * 10 + Number(c)) % 97;
  const cle = reste === 0 ? 97 : reste;
  return cle === Number(chiffres.slice(10));
}

/** Formats belges : 1-ABC-123 (depuis 2010), ABC-123 et 123-ABC (avant). */
export function plaqueBelge(brute: string): boolean {
  const p = brute.toUpperCase().replace(/[\s.-]/g, "");
  return /^\d[A-Z]{3}\d{3}$/.test(p) || /^[A-Z]{3}\d{3}$/.test(p) || /^\d{3}[A-Z]{3}$/.test(p);
}

function minutes(heure: string | null | undefined): number | null {
  const m = heure?.match(/^(\d{1,2})[:hH](\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const mn = Number(m[2]);
  return h > 23 || mn > 59 ? null : h * 60 + mn;
}

/* -------------------------------------------------------------------------- */
/*  Le solde reconstruit                                                      */
/* -------------------------------------------------------------------------- */

const STADES_RAPPEL: Stade[] = ["premier_rappel", "deuxieme_rappel"];

/**
 * Chaque euro expliqué : ce que le courrier réclame, comparé à ce que les
 * pièces justifient.
 *
 * Le solde se reconstruit à partir de la redevance d'origine, des frais dont
 * la base est connue et de ce qui a déjà été versé. Un écart est signalé,
 * jamais caché ; un frais dont la base n'est pas dans le moteur est isolé et
 * présenté comme « à justifier », pas comme abusif.
 */
export function reconstruireSolde(faits: Faits): SoldeReconstruit {
  const stade: Stade = faits.stade ?? "notification";
  const reclame = typeof faits.montant === "number" && faits.montant > 0 ? faits.montant : null;
  const initial =
    stade === "notification"
      ? reclame
      : typeof faits.montantInitial === "number" && faits.montantInitial > 0
        ? faits.montantInitial
        : null;
  const paye = typeof faits.dejaPaye === "number" && faits.dejaPaye > 0 ? faits.dejaPaye : 0;
  const parkingBrussels = faits.region === "bruxelles" && /parking\.?\s?brussels/i.test(faits.crediteur ?? "");

  const lignes: LigneSolde[] = [
    initial !== null
      ? { libelle: "Redevance d'origine", montant: initial, statut: "etabli", detail: stade === "notification" ? "Le montant de ce courrier." : "Le montant du premier courrier, que vous avez indiqué." }
      : {
          libelle: "Redevance d'origine",
          montant: null,
          statut: "indetermine",
          detail: "Indiquez le montant du tout premier courrier : c'est la base de tout le calcul.",
        },
  ];

  // Les frais : connus seulement là où la procédure publiée les chiffre.
  let frais: number | null = 0;
  if (STADES_RAPPEL.includes(stade)) {
    if (parkingBrussels) {
      frais = 15;
      lignes.push({
        libelle: "Frais de rappel",
        montant: 15,
        statut: "etabli",
        detail: "Frais administratifs publiés par parking.brussels pour le rappel.",
      });
    } else {
      frais = null;
    }
  } else if (stade !== "notification") {
    frais = null;
  }

  if (paye > 0) {
    lignes.push({ libelle: "Déjà payé", montant: -paye, statut: "etabli", detail: "La somme que vous avez déjà versée, à déduire." });
  }

  // Frais dont la base n'est pas connue : déduits de ce qui est réclamé, et
  // isolés pour qu'on en demande le décompte.
  if (frais === null && initial !== null && reclame !== null) {
    const implicites = Math.round((reclame - initial + paye) * 100) / 100;
    if (implicites <= 0) frais = 0;
    lignes.splice(1, 0, {
      libelle: stade === "courrier_huissier" ? "Frais, intérêts et frais d'huissier" : "Frais et majorations",
      montant: Math.max(0, implicites),
      statut: implicites > 0 ? "indetermine" : "etabli",
      detail:
        implicites > 0
          ? "Différence entre ce qui est réclamé et la redevance d'origine. Leur base et leur décompte doivent vous être communiqués sur demande."
          : "Aucun frais n'apparaît dans le montant réclamé.",
    });
  } else if (frais === null) {
    lignes.splice(1, 0, {
      libelle: "Frais et majorations",
      montant: null,
      statut: "indetermine",
      detail: "Leur montant dépend du stade et de l'organisme : ils doivent reposer sur un texte.",
    });
  }

  const reconstruit = initial !== null && frais !== null ? Math.round((initial + frais - paye) * 100) / 100 : null;
  const ecart = reconstruit !== null && reclame !== null ? Math.round((reclame - reconstruit) * 100) / 100 : null;

  if (reclame === null) {
    return {
      lignes,
      reclame,
      reconstruit,
      ecart: null,
      statut: "indetermine",
      conclusion: "Le montant réclamé n'a pas pu être lu : confirmez-le pour que le solde soit vérifié.",
    };
  }
  if (ecart === null) {
    const aJustifier = lignes.find((l) => l.statut === "indetermine" && l.montant !== null && l.montant > 0);
    return {
      lignes,
      reclame,
      reconstruit,
      ecart,
      statut: "indetermine",
      conclusion: aJustifier
        ? `${euros(aJustifier.montant as number)} s'ajoutent à la redevance d'origine. Le moteur ne les juge pas sur leur seul montant : demandez-en le décompte détaillé et la base légale.`
        : initial === null
          ? "Sans le montant du premier courrier, le solde ne peut pas être reconstruit."
          : "Les frais de ce stade ne sont pas chiffrés dans notre base : demandez le décompte détaillé.",
    };
  }
  if (Math.abs(ecart) < 0.01) {
    return {
      lignes,
      reclame,
      reconstruit,
      ecart: 0,
      statut: "etabli",
      conclusion: `Le montant réclamé (${euros(reclame)}) correspond au solde reconstruit à partir des pièces.`,
    };
  }
  if (ecart > 0) {
    return {
      lignes,
      reclame,
      reconstruit,
      ecart,
      statut: "anomalie",
      conclusion: `Le courrier réclame ${euros(ecart)} de plus que ce que les pièces justifient (${euros(reconstruit as number)}). Demandez le détail du calcul avant de payer.`,
    };
  }
  return {
    lignes,
    reclame,
    reconstruit,
    ecart,
    statut: "etabli",
    conclusion: `Le montant réclamé est inférieur de ${euros(-ecart)} au solde reconstruit : pas de surfacturation sur ce point.`,
  };
}

/* -------------------------------------------------------------------------- */
/*  Les points contrôlés                                                      */
/* -------------------------------------------------------------------------- */

export function verifierCourrier(faits: Faits): PointControle[] {
  const reponses = faits.reponses ?? {};
  const stade: Stade = faits.stade ?? "notification";
  const points: PointControle[] = [];

  /* --- la référence --------------------------------------------------- */
  points.push(
    faits.reference
      ? { id: "reference", titre: "Référence de la redevance", statut: "etabli", detail: `Lue sur le courrier : ${faits.reference}.` }
      : {
          id: "reference",
          titre: "Référence de la redevance",
          statut: "indetermine",
          detail: "Aucune référence lue. Vérifiez sur le courrier : c'est elle qui rattache votre réponse au bon dossier.",
        },
  );

  /* --- la plaque et le véhicule ---------------------------------------- */
  if (reponses.vehicule && reponses.vehicule !== "oui") {
    const motif =
      reponses.vehicule === "vendu"
        ? "vous aviez vendu ou cédé le véhicule"
        : reponses.vehicule === "vole"
          ? "le véhicule avait été volé"
          : "la plaque n'est pas la vôtre";
    points.push({
      id: "plaque",
      titre: "Plaque d'immatriculation",
      statut: "anomalie",
      detail: `Selon vous, ${motif} : la redevance ne devrait pas vous être adressée. Joignez la preuve.`,
    });
  } else if (faits.plaque) {
    points.push(
      plaqueBelge(faits.plaque)
        ? { id: "plaque", titre: "Plaque d'immatriculation", statut: "etabli", detail: `Format belge valide : ${faits.plaque.toUpperCase()}. Vérifiez que c'est bien la vôtre.` }
        : {
            id: "plaque",
            titre: "Plaque d'immatriculation",
            statut: "indetermine",
            detail: `« ${faits.plaque} » n'a pas un format belge courant : plaque étrangère, personnalisée, ou mal lue. Comparez avec votre certificat d'immatriculation.`,
          },
    );
  } else {
    points.push({
      id: "plaque",
      titre: "Plaque d'immatriculation",
      statut: "indetermine",
      detail: "Aucune plaque lue. Elle doit figurer sur le courrier : si elle manque vraiment, c'est un point à soulever.",
    });
  }

  /* --- le lieu ---------------------------------------------------------- */
  if (faits.commune && faits.lieu) {
    points.push({ id: "lieu", titre: "Lieu du constat", statut: "etabli", detail: `${faits.lieu}, ${faits.commune}.` });
  } else {
    points.push({
      id: "lieu",
      titre: "Lieu du constat",
      statut: "indetermine",
      detail: faits.commune
        ? `Commune identifiée (${faits.commune}), mais pas la rue. Sans lieu précis, la zone et son règlement ne peuvent pas être vérifiés.`
        : "Ni la commune ni la rue n'ont pu être lues. Le lieu exact décide de la zone et du règlement applicable.",
    });
  }

  /* --- le jour du constat ----------------------------------------------- */
  const constat = jourUtc(faits.dateConstat);
  if (constat === null) {
    points.push({
      id: "jour",
      titre: "Jour du constat",
      statut: "indetermine",
      detail: "La date du constat n'a pas pu être lue : elle doit figurer sur le courrier.",
    });
  } else {
    const iso = faits.dateConstat as string;
    const ferie = jourFerie(iso);
    if (ferie || estDimanche(iso)) {
      points.push({
        id: "jour",
        titre: "Jour du constat",
        statut: "anomalie",
        detail: `Le constat date du ${dateLongue(iso)}${ferie ? `, jour férié (${ferie})` : ""}. Dans la plupart des zones, le stationnement est libre ce jour-là : vérifiez le règlement de la zone.`,
        source: "Loi du 4 janvier 1974 relative aux jours fériés ; règlements communaux de stationnement.",
      });
    } else {
      points.push({ id: "jour", titre: "Jour du constat", statut: "etabli", detail: `Un ${dateLongue(iso)} : jour payant dans la plupart des zones.` });
    }
  }

  /* --- l'heure du constat ----------------------------------------------- */
  const mn = minutes(faits.heureConstat);
  if (mn === null) {
    points.push({
      id: "heure",
      titre: "Heure du constat",
      statut: "indetermine",
      detail: "L'heure n'a pas pu être lue. Sans elle, impossible de vérifier que le constat tombe dans les heures payantes.",
    });
  } else if (mn < 9 * 60 || mn >= 21 * 60) {
    points.push({
      id: "heure",
      titre: "Heure du constat",
      statut: "anomalie",
      detail: `${faits.heureConstat} : en dehors des heures payantes pratiquées en Région bruxelloise. Vérifiez les horaires de la zone, affichés sur l'horodateur.`,
    });
  } else if (mn >= 18 * 60) {
    points.push({
      id: "heure",
      titre: "Heure du constat",
      statut: "indetermine",
      detail: `${faits.heureConstat} : selon la zone, le stationnement est payant jusqu'à 18 h ou jusqu'à 21 h. Vérifiez l'horaire de votre zone.`,
    });
  } else {
    points.push({ id: "heure", titre: "Heure du constat", statut: "etabli", detail: `${faits.heureConstat} : dans les heures payantes habituelles.` });
  }

  /* --- la chronologie --------------------------------------------------- */
  const envoi = jourUtc(faits.dateEnvoi);
  const echeance = jourUtc(faits.dateEcheance);
  const incoherences: string[] = [];
  if (constat !== null && envoi !== null && envoi < constat) incoherences.push("le courrier est daté d'avant le constat");
  if (envoi !== null && echeance !== null && echeance < envoi) incoherences.push("la date limite précède l'envoi");
  if (constat !== null && echeance !== null && echeance < constat) incoherences.push("la date limite précède le constat");
  const datesConnues = [constat, envoi, echeance].filter((t) => t !== null).length;
  if (incoherences.length > 0) {
    points.push({
      id: "chronologie",
      titre: "Ordre des dates",
      statut: "anomalie",
      detail: `Incohérence : ${incoherences.join(" ; ")}. Relisez les dates ; si elles sont bien imprimées ainsi, signalez-le.`,
    });
  } else if (datesConnues >= 2) {
    points.push({ id: "chronologie", titre: "Ordre des dates", statut: "etabli", detail: "Constat, envoi et date limite se suivent dans le bon ordre." });
  } else {
    points.push({
      id: "chronologie",
      titre: "Ordre des dates",
      statut: "indetermine",
      detail: "Trop peu de dates lues pour vérifier leur ordre.",
    });
  }

  /* --- le délai laissé pour réagir -------------------------------------- */
  const delaiRegion = faits.region ? REGIONS[faits.region].delaiContestationJours : null;
  if (stade === "notification" && delaiRegion !== null) {
    if (envoi !== null && echeance !== null && echeance >= envoi) {
      const laisse = Math.round((echeance - envoi) / JOUR);
      points.push(
        laisse < delaiRegion
          ? {
              id: "delai",
              titre: "Délai laissé pour réagir",
              statut: "anomalie",
              detail: `Le courrier laisse ${laisse} jour${laisse > 1 ? "s" : ""} entre son envoi et la date limite, moins que les ${delaiRegion} jours de la procédure publiée.`,
              source: REGIONS[faits.region as keyof typeof REGIONS].sourceDelai,
            }
          : {
              id: "delai",
              titre: "Délai laissé pour réagir",
              statut: "etabli",
              detail: `${laisse} jours entre l'envoi et la date limite : au moins les ${delaiRegion} jours de la procédure publiée.`,
            },
      );
    } else {
      points.push({
        id: "delai",
        titre: "Délai laissé pour réagir",
        statut: "indetermine",
        detail: "Il faut la date d'envoi et la date limite pour vérifier le délai laissé.",
      });
    }
  }

  /* --- qui réclame ------------------------------------------------------ */
  points.push(
    faits.crediteur
      ? { id: "crediteur", titre: "Organisme qui réclame", statut: "etabli", detail: `${faits.crediteur}. C'est à lui que s'adresse la contestation.` }
      : {
          id: "crediteur",
          titre: "Organisme qui réclame",
          statut: "indetermine",
          detail: "Non identifié : commune, parking.brussels ou société concessionnaire ? Vérifiez l'en-tête avant d'envoyer quoi que ce soit.",
        },
  );

  /* --- la communication structurée -------------------------------------- */
  if (faits.communication) {
    const valide = communicationValide(faits.communication);
    points.push(
      valide === true
        ? { id: "communication", titre: "Communication structurée", statut: "etabli", detail: "La clé de contrôle est correcte." }
        : valide === false
          ? {
              id: "communication",
              titre: "Communication structurée",
              statut: "anomalie",
              detail: "La clé de contrôle ne correspond pas : erreur d'impression ou de lecture. Vérifiez-la avant tout paiement.",
            }
          : {
              id: "communication",
              titre: "Communication structurée",
              statut: "indetermine",
              detail: "Elle n'a pas les douze chiffres attendus : relisez-la sur le courrier.",
            },
    );
  }

  /* --- double paiement, doublon ----------------------------------------- */
  if (reponses.deja_paye === "oui") {
    points.push({
      id: "double",
      titre: "Paiement déjà effectué",
      statut: "anomalie",
      detail: "Vous avez déjà payé : la réclamation fait double emploi. Joignez la preuve du paiement.",
    });
  } else if (reponses.doublon === "oui") {
    points.push({
      id: "double",
      titre: "Redevance en double",
      statut: "anomalie",
      detail: "Deux redevances le même jour, au même endroit : une seule peut être due pour une même période.",
    });
  }

  /* --- le montant ------------------------------------------------------- */
  const solde = reconstruireSolde(faits);
  points.push({ id: "montant", titre: "Montant réclamé", statut: solde.statut, detail: solde.conclusion });

  return points;
}

/** Le décompte des verdicts, pour un résumé en une ligne. */
export function bilanControles(points: PointControle[]): Record<PointControle["statut"], number> {
  return points.reduce(
    (acc, p) => ({ ...acc, [p.statut]: acc[p.statut] + 1 }),
    { etabli: 0, anomalie: 0, indetermine: 0 } as Record<PointControle["statut"], number>,
  );
}
