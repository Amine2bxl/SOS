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
import type {
  Analyse,
  Delai,
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

  if (stade === "notification") {
    const delai = region?.delaiContestationJours ?? null;
    if (envoi !== null && delai !== null) {
      const limite = envoi + delai * JOUR;
      return {
        nature: "contestation",
        limite: versISO(limite),
        joursRestants: jours(limite),
        origine: "calcule",
        explication: `${delai} jours à compter de la réception du courrier. Calculé depuis sa date d'envoi, pour ne jamais vous faire agir trop tard. Si votre courrier indique un autre délai, c'est lui qui compte.`,
      };
    }
    if (echeance !== null) {
      return {
        nature: "paiement",
        limite: versISO(echeance),
        joursRestants: jours(echeance),
        origine: "document",
        explication:
          "Date limite imprimée sur votre courrier. Le délai pour contester peut être plus court : agissez sans attendre cette date.",
      };
    }
    return {
      nature: "contestation",
      limite: null,
      joursRestants: null,
      origine: "inconnu",
      explication: delai
        ? `Le délai habituel est de ${delai} jours après réception. Sans date sur le courrier, considérez qu'il court déjà.`
        : "Le délai est fixé par le règlement de la commune et figure sur votre courrier. Sans date lisible, agissez cette semaine.",
    };
  }

  if (stade === "contrainte" || stade === "courrier_huissier") {
    return {
      nature: stade === "contrainte" ? "recours" : "reponse",
      limite: echeance !== null ? versISO(echeance) : null,
      joursRestants: echeance !== null ? jours(echeance) : null,
      origine: echeance !== null ? "document" : "inconnu",
      explication:
        stade === "contrainte"
          ? "Le recours contre une contrainte est enfermé dans un délai court, souvent d'un mois après sa signification. N'attendez pas."
          : "Un huissier n'attend pas : répondez par écrit le jour même, même sans date limite affichée.",
    };
  }

  return {
    nature: "paiement",
    limite: echeance !== null ? versISO(echeance) : null,
    joursRestants: echeance !== null ? jours(echeance) : null,
    origine: echeance !== null ? "document" : "inconnu",
    explication:
      echeance !== null
        ? "Date limite imprimée sur votre courrier. Répondre par écrit avant cette date arrête la montée des frais."
        : "Aucune date lisible sur le courrier : répondez cette semaine, par écrit.",
  };
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
        "Vous avez déjà payé : on ne conteste plus la redevance, on exige l'arrêt des poursuites et, si besoin, le remboursement de ce qui a été payé en double.",
    };
  }

  if (stade === "contrainte" || stade === "courrier_huissier") {
    return {
      code: "repondre_huissier",
      titre: "Répondre par écrit, aujourd'hui",
      explication: meilleur
        ? "La procédure est avancée, mais vous avez un argument. On conteste la dette et chaque frais, on rappelle vos démarches antérieures, et on demande la suspension du recouvrement."
        : "La procédure est avancée. Même sans argument sur le fond, on exige le décompte détaillé et le fondement de chaque frais avant tout paiement.",
    };
  }

  if (meilleur) {
    return {
      code: "contester",
      titre: "Contester",
      explication:
        meilleur.force === "solide"
          ? "Vous avez un argument solide. Avec la bonne pièce jointe, c'est le type de dossier qui aboutit le plus souvent."
          : "Vous avez un argument recevable. Il tient d'autant mieux que vous le documentez : photos, captures, témoignage.",
    };
  }

  if (stade !== "notification") {
    return {
      code: "contester_frais",
      titre: "Contester les frais ajoutés",
      explication:
        "Aucun argument ne porte sur la redevance elle-même, mais les frais ajoutés depuis le premier courrier doivent reposer sur un texte. On les conteste, et on demande le détail du calcul.",
    };
  }

  // Aucun argument : on le dit. Un conseil honnête vaut mieux qu'une
  // contestation vouée à l'échec, qui laisserait passer le délai de paiement.
  return {
    code: "payer",
    titre: "Payer dans le délai — ou demander d'abord les photos",
    explication:
      "Rien dans vos réponses ne fait tomber cette redevance. Payer dans le délai vous évite les frais de rappel. Si le constat vous paraît malgré tout injuste, demandez d'abord les photos du contrôle : elles peuvent révéler une erreur de plaque, d'heure ou de lieu.",
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
      explication: "Un argument solide, à temps. Joignez la pièce qui le prouve : c'est elle qui emporte la décision.",
    };
  }
  if (meilleur.force === "solide" || meilleur.force === "serieux" || fond.length >= 2) {
    return {
      niveau: "defendable",
      explication:
        urgence === "depasse"
          ? "Un bon argument, mais le délai est passé : contestez quand même, sans tarder."
          : "Un argument recevable. Plus il est documenté, plus il pèse.",
    };
  }
  return {
    niveau: "fragile",
    explication: "L'argument existe mais se prouve difficilement. Rassemblez tout ce qui peut l'étayer.",
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

  const pieces = Array.from(
    new Set([
      ...moyens.flatMap((m) => m.pieces),
      "Copie du courrier reçu",
    ]),
  );

  const etapes: string[] = [];
  if (strategie.code === "payer") {
    etapes.push("Payez avec la communication structurée indiquée sur le courrier, avant la date limite.");
    etapes.push("Gardez la preuve du paiement jusqu'à la clôture du dossier.");
    etapes.push("Si vous voulez vérifier le constat, envoyez d'abord la demande de photos que nous préparons.");
  } else {
    if (pieces.length > 1) etapes.push("Rassemblez les pièces listées : elles font la force de la lettre.");
    etapes.push("Relisez la lettre préparée par le moteur, complétez-la si besoin.");
    etapes.push(
      faits.region === "bruxelles"
        ? "Envoyez-la par le canal indiqué sur le courrier — chez parking.brussels, le formulaire en ligne."
        : "Envoyez-la par le canal indiqué sur le courrier, de préférence en recommandé.",
    );
    etapes.push("Gardez la preuve de l'envoi : capture de confirmation ou récépissé.");
    etapes.push("Notez la date d'envoi ici : nous vous dirons quand relancer.");
  }

  const alertes: string[] = [];
  if (urgence === "depasse") {
    alertes.push(
      "Le délai est dépassé. Contestez quand même, aujourd'hui : un courrier tardif peut encore être examiné, et il fige votre position avant le recouvrement.",
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
    alertes.push("Nous n'avons pas pu déterminer la région du constat : confirmez-la pour un délai exact.");
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
    questions: questionsAPoser(faits),
    langueLettre: langueProposee(faits),
    // Le compte est réel : chaque moyen examiné, chaque question évaluée, et
    // les quatre contrôles fixes (stade, délai, urgence, coût de l'inaction).
    verifications: MOYENS.length + QUESTIONS.length + 4,
  };
}
