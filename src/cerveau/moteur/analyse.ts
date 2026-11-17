/**
 * Le moteur : des faits en entrée, une analyse en sortie.
 *
 * L'ordre du raisonnement est celui d'un juriste qui ouvre un dossier :
 *
 *  1. OÙ en est-on ? Le stade de la procédure.
 *  2. COMBIEN de temps reste-t-il ? Le délai — et l'urgence qui en découle.
 *  3. Qu'est-ce que ça COÛTE de ne rien faire ? L'étape suivante et son prix.
 *  4. Qu'a-t-on pour se DÉFENDRE ? Les moyens que les faits portent.
 *  5. Que FAIRE, concrètement ? La stratégie, les pièces, les étapes.
 *
 * Tout est déterministe : les mêmes faits donnent toujours la même analyse.
 * C'est ce qui la rend vérifiable — par l'utilisateur, par l'association,
 * par les tests.
 */

import { MOYENS, RANG_FORCE } from "../base/moyens";
import { QUESTIONS, questionsAPoser } from "../base/questions";
import { GRAVITE_STADE, LIBELLES_STADE, REGIONS } from "../base/regions";
import { dateLongue, estJourOuvrable, jourFerie, jourOuvrablePrecedent, nomDuJour } from "./calendrier";
import { verifierCourrier } from "./controle";
import type {
  Analyse,
  Delai,
  EtapeCalcul,
  Faits,
  Langue,
  MoyenRetenu,
  Stade,
  Strategie,
  Urgence,
} from "../types";

const JOUR = 86_400_000;

function jourUTC(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

function aujourdhuiUTC(faits: Faits): number {
  const ref = faits.aujourdhui ? jourUTC(faits.aujourdhui) : null;
  if (ref !== null) return ref;
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

const versISO = (t: number) => new Date(t).toISOString().slice(0, 10);

/* -------------------------------------------------------------------------- */
/*  2. Le délai                                                               */
/* -------------------------------------------------------------------------- */

/**
 * La date qui compte, et d'où elle vient.
 *
 * Au premier courrier, c'est le délai de CONTESTATION qui compte — et il est
 * souvent plus court que la date de paiement imprimée. On le calcule depuis
 * la date d'envoi quand on la connaît : le délai court depuis la réception,
 * qui est toujours postérieure, donc le calcul ne peut que vous faire agir un
 * peu tôt, jamais trop tard. Aux stades suivants, c'est la date imprimée qui
 * fait foi.
 */
export function calculerDelai(faits: Faits, stade: Stade): Delai {
  const auj = aujourdhuiUTC(faits);
  const region = faits.region ? REGIONS[faits.region] : null;
  const echeance = faits.dateEcheance ? jourUTC(faits.dateEcheance) : null;
  const envoi = faits.dateEnvoi ? jourUTC(faits.dateEnvoi) : null;
  const jours = (t: number) => Math.round((t - auj) / JOUR);
  const restants = (t: number): EtapeCalcul => {
    const n = jours(t);
    return {
      libelle: "Aujourd'hui",
      valeur: n < 0 ? `Dépassé de ${-n} jour${-n > 1 ? "s" : ""}` : n === 0 ? "C'est le dernier jour" : `${n} jour${n > 1 ? "s" : ""} restant${n > 1 ? "s" : ""}`,
    };
  };

  if (stade === "notification") {
    const delai = region?.delaiContestationJours ?? null;
    if (envoi !== null && delai !== null) {
      const limite = envoi + delai * JOUR;
      const trace: EtapeCalcul[] = [
        { libelle: "Courrier envoyé le", valeur: dateLongue(versISO(envoi)) },
        { libelle: "Délai de contestation", valeur: `${delai} jours calendrier, à compter de la réception` },
        { libelle: "Date limite retenue", valeur: dateLongue(versISO(limite)) },
        ...noteCalendrier(versISO(limite)),
        restants(limite),
      ];
      return {
        nature: "contestation",
        limite: versISO(limite),
        joursRestants: jours(limite),
        origine: "calcule",
        explication: `${delai} jours après réception, comptés depuis la date d'envoi pour ne jamais être en retard. Un autre délai sur le courrier ? C'est lui qui compte.`,
        trace,
      };
    }
    if (echeance !== null) {
      return {
        nature: "paiement",
        limite: versISO(echeance),
        joursRestants: jours(echeance),
        origine: "document",
        explication:
          "Date imprimée sur le courrier. Le délai pour contester peut être plus court : n'attendez pas.",
        trace: [
          { libelle: "Date imprimée sur le courrier", valeur: dateLongue(versISO(echeance)) },
          ...noteCalendrier(versISO(echeance)),
          {
            libelle: "Ce qui manque",
            valeur: "La date d'envoi du courrier : sans elle, pas de délai de contestation calculé.",
          },
          restants(echeance),
        ],
      };
    }
    return {
      nature: "contestation",
      limite: null,
      joursRestants: null,
      origine: "inconnu",
      explication: delai
        ? `Délai habituel : ${delai} jours après réception. Sans date sur le courrier, il court déjà.`
        : "Délai fixé par le règlement de la commune, imprimé sur votre courrier. Sans date lisible : agissez cette semaine.",
      trace: [],
    };
  }

  const traceDocument = (): EtapeCalcul[] =>
    echeance !== null
      ? [
          { libelle: "Date imprimée sur le courrier", valeur: dateLongue(versISO(echeance)) },
          ...noteCalendrier(versISO(echeance)),
          restants(echeance),
        ]
      : [];

  if (stade === "contrainte" || stade === "courrier_huissier") {
    return {
      nature: stade === "contrainte" ? "recours" : "reponse",
      limite: echeance !== null ? versISO(echeance) : null,
      joursRestants: echeance !== null ? jours(echeance) : null,
      origine: echeance !== null ? "document" : "inconnu",
      explication:
        stade === "contrainte"
          ? "Recours contre une contrainte : délai court, souvent 1 mois après signification. N'attendez pas."
          : "Huissier : répondez par écrit aujourd'hui, même sans date limite.",
      trace: traceDocument(),
    };
  }

  return {
    nature: "paiement",
    limite: echeance !== null ? versISO(echeance) : null,
    joursRestants: echeance !== null ? jours(echeance) : null,
    origine: echeance !== null ? "document" : "inconnu",
    explication:
      echeance !== null
        ? "Date imprimée sur le courrier. Répondre par écrit avant cette date arrête les frais."
        : "Pas de date lisible : répondez par écrit cette semaine.",
    trace: traceDocument(),
  };
}

/**
 * Ce que le calendrier dit du dernier jour.
 *
 * Quand il tombe un samedi, un dimanche ou un jour férié, la règle du report au
 * jour ouvrable suivant (art. 53 du Code judiciaire) vaut pour les délais de
 * procédure ; rien ne garantit qu'une administration l'applique à une
 * redevance. Le moteur ne déplace donc pas la date : il le signale, et
 * conseille d'envoyer avant.
 */
function noteCalendrier(iso: string): EtapeCalcul[] {
  if (estJourOuvrable(iso)) return [];
  const ferie = jourFerie(iso);
  const avant = jourOuvrablePrecedent(iso);
  return [
    {
      libelle: "Calendrier",
      valeur: `${ferie ? `Jour férié (${ferie})` : `C'est un ${nomDuJour(iso)}`}. Ne comptez pas sur un report : par la poste, envoyez au plus tard le ${avant ? dateLongue(avant) : "jour ouvrable précédent"}.`,
    },
  ];
}

export function niveauUrgence(delai: Delai, stade: Stade): Urgence {
  if (delai.joursRestants === null) {
    return stade === "contrainte" || stade === "courrier_huissier" ? "critique" : "inconnue";
  }
  if (delai.joursRestants < 0) return "depasse";
  if (delai.joursRestants <= 2) return "critique";
  if (delai.joursRestants <= 7) return "haute";
  return "normale";
}

/* -------------------------------------------------------------------------- */
/*  3. Le coût de l'inaction                                                  */
/* -------------------------------------------------------------------------- */

function coutInaction(faits: Faits, stade: Stade): Analyse["inaction"] {
  const region = REGIONS[faits.region ?? "bruxelles"];
  const procedure = region.procedure;
  // Le deuxième rappel n'a pas d'étape propre : il précède la mise en demeure.
  const index = procedure.findIndex((e) => e.stade === stade);
  const suivante =
    stade === "deuxieme_rappel"
      ? procedure.find((e) => e.stade === "mise_en_demeure")
      : index >= 0
        ? procedure[index + 1]
        : undefined;
  if (!suivante) return null;
  return { etape: suivante.titre, surcout: suivante.surcout, quand: suivante.quand };
}

/* -------------------------------------------------------------------------- */
/*  4. Les moyens                                                             */
/* -------------------------------------------------------------------------- */

export function evaluerMoyens(faits: Faits): MoyenRetenu[] {
  return MOYENS.filter((m) => m.applicable(faits))
    .sort((a, b) => RANG_FORCE[b.force] - RANG_FORCE[a.force])
    .map((m) => ({
      id: m.id,
      titre: m.titre,
      explication: m.explication,
      force: m.force,
      fiabilite: m.fiabilite,
      icone: m.icone,
      pieces: m.pieces,
      source: m.source,
    }));
}

/* -------------------------------------------------------------------------- */
/*  5. La stratégie                                                           */
/* -------------------------------------------------------------------------- */

function choisirStrategie(faits: Faits, stade: Stade, moyens: MoyenRetenu[]): Strategie {
  const reponses = faits.reponses ?? {};
  const meilleur = moyens.find((m) => m.id !== "frais_ajoutes");

  if (reponses.deja_paye === "oui") {
    return {
      code: "rembourser",
      titre: "Faire cesser le recouvrement",
      explication:
        "Déjà payé : on exige l'arrêt des poursuites et, si besoin, le remboursement du double paiement.",
    };
  }

  if (stade === "contrainte" || stade === "courrier_huissier") {
    return {
      code: "repondre_huissier",
      titre: "Répondre par écrit, aujourd'hui",
      explication: meilleur
        ? "Procédure avancée, mais vous avez un argument. On conteste la dette et chaque frais, et on demande la suspension du recouvrement."
        : "Procédure avancée. Sans argument sur le fond, on exige le détail et la base de chaque frais avant de payer.",
    };
  }

  if (meilleur) {
    return {
      code: "contester",
      titre: "Contester",
      explication:
        meilleur.force === "solide"
          ? "Argument solide. Avec la bonne pièce jointe, ce type de dossier aboutit le plus souvent."
          : "Argument recevable. Plus il est prouvé (photos, captures, témoin), mieux il tient.",
    };
  }

  if (stade !== "notification") {
    return {
      code: "contester_frais",
      titre: "Contester les frais ajoutés",
      explication:
        "Rien contre la redevance elle-même. Mais chaque frais ajouté doit reposer sur un texte : on les conteste et on demande le calcul.",
    };
  }

  // Aucun argument : on le dit. Un conseil honnête vaut mieux qu'une
  // contestation vouée à l'échec, qui laisserait passer le délai de paiement.
  return {
    code: "payer",
    titre: "Payer dans le délai — ou demander d'abord les photos",
    explication:
      "Rien ne fait tomber cette redevance. Payer à temps évite les frais de rappel. Un doute sur le constat ? Demandez d'abord les photos : erreur de plaque, d'heure ou de lieu possible.",
  };
}

function evaluerSolidite(
  moyens: MoyenRetenu[],
  urgence: Urgence,
): Analyse["solidite"] {
  const fond = moyens.filter((m) => m.id !== "frais_ajoutes");
  const meilleur = fond[0];

  if (!meilleur) {
    return {
      niveau: "fragile",
      explication: "Aucun argument sur le fond pour l'instant. Une réponse aux questions peut tout changer.",
    };
  }
  if (meilleur.force === "solide" && urgence !== "depasse") {
    return {
      niveau: "solide",
      explication: "Argument solide, dans les temps. Joignez la pièce qui le prouve : c'est elle qui décide.",
    };
  }
  if (meilleur.force === "solide" || meilleur.force === "serieux" || fond.length >= 2) {
    return {
      niveau: "defendable",
      explication:
        urgence === "depasse"
          ? "Bon argument, délai passé : contestez quand même, vite."
          : "Argument recevable. Plus il est prouvé, plus il pèse.",
    };
  }
  return {
    niveau: "fragile",
    explication: "Argument difficile à prouver. Réunissez tout ce qui l'appuie.",
  };
}

/* -------------------------------------------------------------------------- */

function langueProposee(faits: Faits): Langue {
  if (faits.region === "flandre") return "nl";
  if (faits.region === "wallonie") return "fr";
  return faits.langueDocument === "nl" ? "nl" : "fr";
}

export function analyser(faitsBruts: Faits): Analyse {
  const faits: Faits = { ...faitsBruts, reponses: faitsBruts.reponses ?? {} };
  const stade: Stade = faits.stade ?? "notification";
  const delai = calculerDelai(faits, stade);
  const urgence = niveauUrgence(delai, stade);
  const moyens = evaluerMoyens(faits);
  const strategie = choisirStrategie(faits, stade, moyens);
  const region = faits.region ?? null;
  const controles = verifierCourrier(faits);

  const pieces = Array.from(
    new Set([
      ...moyens.flatMap((m) => m.pieces),
      "Copie du courrier reçu",
    ]),
  );

  const etapes: string[] = [];
  if (strategie.code === "payer") {
    etapes.push("Payez avant la date limite, avec la communication structurée du courrier.");
    etapes.push("Gardez la preuve du paiement jusqu'à la clôture du dossier.");
    etapes.push("Un doute sur le constat ? Envoyez d'abord la demande de photos préparée.");
  } else {
    if (pieces.length > 1) etapes.push("Réunissez les pièces listées : elles font la force de la lettre.");
    etapes.push("Relisez la lettre, complétez-la si besoin.");
    etapes.push(
      faits.region === "bruxelles"
        ? "Envoyez-la par le canal du courrier : chez parking.brussels, le formulaire en ligne."
        : "Envoyez-la par le canal du courrier, de préférence en recommandé.",
    );
    etapes.push("Gardez la preuve d'envoi : capture ou récépissé.");
    etapes.push("Notez la date d'envoi ici : on vous dira quand relancer.");
  }

  const alertes: string[] = [];
  if (urgence === "depasse") {
    alertes.push(
      "Délai dépassé. Contestez quand même, aujourd'hui : une lettre tardive peut encore être examinée, et elle fixe votre position.",
    );
  } else if (urgence === "critique") {
    alertes.push("Il reste moins de trois jours : envoyez aujourd'hui.");
  }
  if (strategie.code !== "payer" && strategie.code !== "rembourser") {
    alertes.push(
      "Contester ne suspend pas le délai de paiement. Si la contestation aboutit, ce qui a été payé est remboursé.",
    );
  }
  if (!region) {
    alertes.push("Région du constat inconnue : confirmez-la pour un délai exact.");
  }

  return {
    region,
    regionCertaine: !!faits.region,
    stade,
    stadeLibelle: LIBELLES_STADE[stade] ?? stade,
    gravite: GRAVITE_STADE[stade] ?? 1,
    delai,
    urgence,
    inaction: coutInaction(faits, stade),
    strategie,
    moyens,
    solidite: evaluerSolidite(moyens, urgence),
    pieces,
    etapes,
    alertes,
    // Sans leur condition : l'analyse doit pouvoir voyager jusqu'au
    // navigateur, et une fonction ne se sérialise pas.
    questions: questionsAPoser(faits).map((q) => ({
      id: q.id,
      intitule: q.intitule,
      pourquoi: q.pourquoi,
      options: q.options,
    })),
    langueLettre: langueProposee(faits),
    // Le compte est réel : chaque moyen examiné, chaque question évaluée, et
    // les quatre contrôles fixes (stade, délai, urgence, coût de l'inaction),
    // et chaque point du courrier passé au contrôle.
    verifications: MOYENS.length + QUESTIONS.length + 4 + controles.length,
    controles,
  };
}
