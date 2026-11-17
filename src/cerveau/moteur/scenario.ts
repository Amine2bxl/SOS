/**
 * Le scénario d'une lettre : lire la situation avant d'écrire.
 *
 * Deux personnes qui contestent n'écrivent pas la même lettre. Une première
 * redevance de 37 € se conteste en quelques lignes courtoises ; trente-trois
 * redevances poursuivies par huissier appellent une lettre ferme, chiffrée,
 * qui exige un examen dossier par dossier. Ce module lit tout ce que le moteur
 * sait — stade, montant, délai, réponses, points relevés sur le courrier — et
 * en tire le ton, l'enjeu et les paragraphes propres au cas.
 *
 * Tout reste prudent : une anomalie potentielle devient une demande de
 * vérification, jamais une accusation.
 */

import { calculerDelai } from "./analyse";
import { reconstruireSolde, verifierCourrier } from "./controle";
import type { Faits, Langue, Stade } from "../types";

export type Ton = "courtois" | "ferme" | "pressant";
export type Enjeu = "faible" | "moyen" | "eleve";

export type Scenario = {
  stade: Stade;
  ton: Ton;
  enjeu: Enjeu;
  /** Le délai de contestation est dépassé. */
  tardif: boolean;
  /** Nombre de redevances visées, quand la personne l'a indiqué. */
  nombre: number;
  /** Paragraphes tirés des anomalies relevées sur le courrier. */
  pointsReleves: { fr: string; nl: string }[];
  /** Écart chiffré entre réclamé et justifié, quand il existe. */
  ecart: number | null;
};

const euros = (n: number, langue: Langue) =>
  langue === "nl" ? `€ ${n.toFixed(2).replace(".", ",")}` : `${n.toFixed(2).replace(".", ",")} €`;

export function lireScenario(faits: Faits, nombre = 1): Scenario {
  const stade: Stade = faits.stade ?? "notification";
  const montant = faits.montant ?? 0;
  const total = montant * Math.max(1, nombre);
  const enjeu: Enjeu = total >= 250 || nombre >= 5 ? "eleve" : total >= 80 || nombre >= 2 ? "moyen" : "faible";

  const delai = calculerDelai(faits, stade);
  const tardif = delai.joursRestants !== null && delai.joursRestants < 0;

  const ton: Ton =
    stade === "contrainte" || stade === "courrier_huissier"
      ? "pressant"
      : stade === "mise_en_demeure" || stade === "deuxieme_rappel" || enjeu === "eleve"
        ? "ferme"
        : "courtois";

  const points: { fr: string; nl: string }[] = [];
  const controles = verifierCourrier(faits);
  const anomalie = (id: string) => controles.find((c) => c.id === id && c.statut === "anomalie");

  if (anomalie("jour")) {
    points.push({
      fr: "Le constat a été dressé un dimanche ou un jour férié légal. Dans la plupart des zones, le stationnement n'est pas payant ces jours-là : je vous saurais gré de vérifier le règlement applicable à la zone concernée, et d'annuler la redevance s'il ne prévoit pas de paiement ce jour-là.",
      nl: "De vaststelling gebeurde op een zondag of een wettelijke feestdag. In de meeste zones is parkeren die dagen niet betalend: ik verzoek u het reglement van de betrokken zone na te gaan en de retributie te annuleren indien dat reglement die dag geen betaling voorziet.",
    });
  }
  if (anomalie("heure")) {
    points.push({
      fr: `Le constat est daté de ${faits.heureConstat ?? "[heure]"}, en dehors des plages horaires payantes pratiquées en Région bruxelloise. Je vous remercie de vérifier les horaires de la zone à cette date.`,
      nl: `De vaststelling dateert van ${faits.heureConstat ?? "[uur]"}, buiten de betalende uren die in het Brussels Gewest gelden. Gelieve de uren van de zone op die datum na te gaan.`,
    });
  }
  if (anomalie("delai")) {
    points.push({
      fr: "Le courrier laisse un délai plus court que celui prévu par la procédure publiée pour contester. Ce délai ne peut m'être opposé.",
      nl: "De brief laat een kortere termijn dan die van de gepubliceerde procedure om te betwisten. Die termijn kan mij niet worden tegengeworpen.",
    });
  }
  if (anomalie("chronologie")) {
    points.push({
      fr: "Les dates figurant sur le courrier ne se suivent pas dans un ordre cohérent, ce qui jette un doute sur la régularité de la procédure.",
      nl: "De data op de brief volgen elkaar niet in een samenhangende volgorde op, wat twijfel doet rijzen over de regelmatigheid van de procedure.",
    });
  }
  if (anomalie("communication")) {
    points.push({
      fr: "La communication structurée indiquée ne passe pas le contrôle de cohérence bancaire : je ne puis effectuer aucun paiement sur cette base sans confirmation.",
      nl: "De vermelde gestructureerde mededeling doorstaat de bancaire controle niet: ik kan op die basis geen betaling uitvoeren zonder bevestiging.",
    });
  }

  const solde = reconstruireSolde(faits);
  const ecart = solde.statut === "anomalie" && solde.ecart && solde.ecart > 0 ? solde.ecart : null;
  if (ecart !== null && solde.reconstruit !== null && solde.reclame !== null) {
    const r = solde.reconstruit;
    const c = solde.reclame;
    points.push({
      fr: `Le montant réclamé (${euros(c, "fr")}) excède de ${euros(ecart, "fr")} ce qui résulte de la redevance d'origine et des frais publiés (${euros(r, "fr")}). Je sollicite le décompte détaillé et la base de chaque frais.`,
      nl: `Het gevorderde bedrag (${euros(c, "nl")}) overschrijdt met ${euros(ecart, "nl")} wat volgt uit de oorspronkelijke retributie en de gepubliceerde kosten (${euros(r, "nl")}). Ik verzoek om een gedetailleerde afrekening en de grondslag van elke kost.`,
    });
  }

  return { stade, ton, enjeu, tardif, nombre: Math.max(1, nombre), pointsReleves: points, ecart };
}

/** L'ouverture de la lettre, selon le stade et le ton. */
export function ouverture(s: Scenario, nomComplet: string, identification: string): { fr: string; nl: string } {
  const pluriel = s.nombre > 1;
  switch (s.stade) {
    case "premier_rappel":
    case "deuxieme_rappel":
      return {
        fr: `Je soussigné(e) ${nomComplet} accuse réception de votre rappel et conteste ${pluriel ? "les redevances" : "la redevance"} concernée${pluriel ? "s" : ""}. ${identification}`,
        nl: `Ondergetekende, ${nomComplet}, bevestigt de ontvangst van uw herinnering en betwist de betrokken ${pluriel ? "retributies" : "retributie"}. ${identification}`,
      };
    case "mise_en_demeure":
      return {
        fr: `Je soussigné(e) ${nomComplet} réponds à votre mise en demeure dans le délai imparti et conteste formellement la somme réclamée. ${identification}`,
        nl: `Ondergetekende, ${nomComplet}, antwoordt binnen de gestelde termijn op uw ingebrekestelling en betwist formeel het gevorderde bedrag. ${identification}`,
      };
    default:
      return s.ton === "courtois"
        ? {
            fr: `Je soussigné(e) ${nomComplet} me permets de contester la redevance mentionnée ci-dessous. ${identification}`,
            nl: `Ondergetekende, ${nomComplet}, betwist hierbij de hieronder vermelde retributie. ${identification}`,
          }
        : {
            fr: `Je soussigné(e) ${nomComplet} conteste par la présente ${pluriel ? `les ${s.nombre} redevances` : "la redevance"} visée${pluriel ? "s" : ""} ci-dessous. ${identification}`,
            nl: `Ondergetekende, ${nomComplet}, betwist hierbij ${pluriel ? `de ${s.nombre} retributies` : "de retributie"} hieronder vermeld. ${identification}`,
          };
  }
}

/** Le paragraphe d'une contestation tardive : reconnaître, expliquer, demander l'examen. */
export const PARAGRAPHE_TARDIF = {
  fr: "Je suis conscient(e) que le délai indiqué pour contester est dépassé. Je vous saurais gré d'examiner néanmoins la présente au fond : les éléments exposés ci-dessous établissent que la redevance n'est pas due, et une contestation tardive n'en rend pas pour autant la dette certaine.",
  nl: "Ik besef dat de termijn om te betwisten verstreken is. Ik verzoek u deze brief toch ten gronde te onderzoeken: de hieronder uiteengezette elementen tonen aan dat de retributie niet verschuldigd is, en een laattijdige betwisting maakt de schuld daarom nog niet zeker.",
};

/** La formule finale, selon le ton. */
export function formuleFinale(ton: Ton): { fr: string; nl: string } {
  if (ton === "pressant") {
    return {
      fr: "Dans l'attente de votre réponse écrite et de la suspension effective du recouvrement, je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.",
      nl: "In afwachting van uw schriftelijk antwoord en de effectieve opschorting van de invordering, verblijf ik met de meeste hoogachting,",
    };
  }
  if (ton === "ferme") {
    return {
      fr: "Dans l'attente d'une décision motivée, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
      nl: "In afwachting van een gemotiveerde beslissing verblijf ik met de meeste hoogachting,",
    };
  }
  return {
    fr: "En vous remerciant de l'attention portée à la présente, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    nl: "Met dank voor uw aandacht verblijf ik met de meeste hoogachting,",
  };
}
