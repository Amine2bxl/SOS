/**
 * Les questions que le moteur pose — et surtout celles qu'il ne pose pas.
 *
 * Le courrier dit déjà beaucoup : la date, le lieu, le montant, le stade. Ce
 * qu'il ne dit jamais, c'est ce que vous seul savez : aviez-vous payé ? la
 * voiture était-elle à vous ? Ce sont ces quelques réponses qui font basculer
 * un dossier d'« à payer » à « à contester ».
 *
 * Chaque question n'est posée que si sa réponse peut changer l'analyse
 * (`quand`). Quelqu'un qui a payé par application ne se verra pas demander
 * combien de temps il est resté garé. En pratique : trois à cinq questions,
 * une réponse en un geste.
 */

import type { Question } from "../types";

const apresLePremierCourrier = (stade?: string | null) =>
  !!stade && stade !== "notification";

export const QUESTIONS: Question[] = [
  {
    id: "paiement",
    intitule: "Aviez-vous payé ce stationnement ?",
    pourquoi: "Un paiement prouvé est l'argument le plus solide qui existe.",
    options: [
      { id: "app", libelle: "Oui, par application ou SMS", icone: "app-mobile" },
      { id: "horodateur", libelle: "Oui, à l'horodateur", icone: "horodateur" },
      { id: "non", libelle: "Non", icone: "ticket" },
      { id: "incertain", libelle: "Je ne sais plus", icone: "loupe" },
    ],
    quand: () => true,
  },
  {
    id: "carte",
    intitule: "Le véhicule avait-il une carte de stationnement ?",
    pourquoi: "Certaines cartes dispensent de payer, et la ScanCar ne les voit pas toujours.",
    options: [
      { id: "riverain", libelle: "Carte de riverain", icone: "carte-riverain" },
      { id: "pmr", libelle: "Carte pour personne handicapée", icone: "carte-pmr" },
      { id: "pro", libelle: "Carte professionnelle ou dérogation", icone: "carte-riverain" },
      { id: "non", libelle: "Aucune carte", icone: "panneau-p" },
    ],
    quand: (f) => f.reponses?.paiement !== "app" && f.reponses?.paiement !== "horodateur",
  },
  {
    id: "vehicule",
    intitule: "Ce jour-là, le véhicule était-il bien le vôtre ?",
    pourquoi: "Vous ne devez rien pour un véhicule vendu, volé, ou qui n'est pas le vôtre.",
    options: [
      { id: "oui", libelle: "Oui", icone: "volant" },
      { id: "vendu", libelle: "Je l'avais vendu ou cédé", icone: "cle-vendue" },
      { id: "vole", libelle: "Il avait été volé", icone: "pv-police" },
      { id: "pas_ma_plaque", libelle: "Ce n'est pas ma plaque", icone: "plaque" },
    ],
    quand: () => true,
  },
  {
    id: "tentative_paiement",
    intitule: "Avez-vous essayé de payer ?",
    pourquoi: "Un horodateur ou une application en panne peut justifier l'absence de paiement.",
    options: [
      { id: "horodateur_panne", libelle: "L'horodateur ne fonctionnait pas", icone: "horodateur-panne" },
      { id: "app_panne", libelle: "L'application a échoué", icone: "app-mobile" },
      { id: "non", libelle: "Non", icone: "ticket" },
    ],
    quand: (f) =>
      (f.reponses?.paiement === "non" || f.reponses?.paiement === "incertain") &&
      (f.reponses?.carte === undefined || f.reponses?.carte === "non") &&
      (f.reponses?.vehicule === undefined || f.reponses?.vehicule === "oui"),
  },
  {
    id: "duree",
    intitule: "Combien de temps le véhicule est-il resté là ?",
    pourquoi: "Un arrêt bref pour charger ou déposer quelqu'un n'est pas un stationnement.",
    options: [
      { id: "arret", libelle: "Quelques minutes, pour charger ou déposer quelqu'un", icone: "arret" },
      { id: "long", libelle: "Plus longtemps", icone: "chrono" },
    ],
    quand: (f) =>
      f.reponses?.paiement === "non" &&
      (f.reponses?.carte === undefined || f.reponses?.carte === "non") &&
      (f.reponses?.vehicule === undefined || f.reponses?.vehicule === "oui") &&
      (f.reponses?.tentative_paiement === undefined || f.reponses?.tentative_paiement === "non"),
  },
  {
    id: "signalisation",
    intitule: "La signalisation était-elle claire ?",
    pourquoi: "On ne peut pas vous reprocher une règle qu'aucun panneau visible n'annonçait.",
    options: [
      { id: "claire", libelle: "Oui, claire", icone: "panneau-p" },
      { id: "illisible", libelle: "Absente, cachée ou illisible", icone: "panneau-illisible" },
      { id: "incertain", libelle: "Je ne sais pas", icone: "loupe" },
    ],
    quand: (f) =>
      f.reponses?.paiement === "non" &&
      (f.reponses?.carte === undefined || f.reponses?.carte === "non") &&
      (f.reponses?.vehicule === undefined || f.reponses?.vehicule === "oui"),
  },
  {
    id: "doublon",
    intitule: "Avez-vous reçu une autre redevance pour le même stationnement ?",
    pourquoi: "Un même stationnement ne se paie pas deux fois pour la même période.",
    options: [
      { id: "oui", libelle: "Oui, le même jour au même endroit", icone: "doublon" },
      { id: "non", libelle: "Non", icone: "ticket" },
    ],
    quand: (f) => !apresLePremierCourrier(f.stade),
  },
  {
    id: "courrier_initial",
    intitule: "Aviez-vous reçu le tout premier courrier ?",
    pourquoi: "Sans premier courrier, les frais de rappel se contestent.",
    options: [
      { id: "oui", libelle: "Oui", icone: "boite-lettres" },
      { id: "non", libelle: "Non, jamais", icone: "mail" },
    ],
    quand: (f) => apresLePremierCourrier(f.stade),
  },
  {
    id: "deja_conteste",
    intitule: "Aviez-vous déjà contesté ?",
    pourquoi: "Une contestation restée sans réponse change la suite de la procédure.",
    options: [
      { id: "sans_reponse", libelle: "Oui, sans réponse", icone: "recommande" },
      { id: "rejete", libelle: "Oui, et elle a été rejetée", icone: "mise-en-demeure" },
      { id: "non", libelle: "Non", icone: "lettre" },
    ],
    quand: (f) => apresLePremierCourrier(f.stade),
  },
  {
    id: "deja_paye",
    intitule: "Avez-vous déjà payé cette somme ?",
    pourquoi: "Si oui, on ne conteste plus : on demande l'arrêt du recouvrement ou le remboursement.",
    options: [
      { id: "oui", libelle: "Oui", icone: "euro" },
      { id: "non", libelle: "Non", icone: "ticket" },
    ],
    quand: (f) => apresLePremierCourrier(f.stade),
  },
];

/** Les questions encore utiles, dans l'ordre, pour des faits donnés. */
export function questionsAPoser(faits: Parameters<Question["quand"]>[0]): Question[] {
  return QUESTIONS.filter((q) => faits.reponses?.[q.id] === undefined && q.quand(faits));
}
