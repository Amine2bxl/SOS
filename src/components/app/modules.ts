/**
 * Les modules de l'espace membre.
 *
 * Une seule source de vérité : la barre latérale, le menu mobile et les cartes
 * du tableau de bord lisent cette liste. Chaque module porte une phrase qui dit
 * ce qu'il fait — c'est ce qui permet de comprendre, sans cliquer, la
 * différence entre « scanner un courrier » et « rédiger une lettre ».
 */

export type Module = {
  href: string;
  titre: string;
  /** Une phrase, à la deuxième personne, qui dit à quoi sert le module. */
  phrase: string;
  icone: "boussole" | "scan" | "lettre" | "livre" | "carte" | "reglages";
};

export const MODULES_DOSSIERS: Module[] = [
  {
    href: "/tableau-de-bord",
    titre: "Tableau de bord",
    phrase: "Vos dossiers, vos échéances et la prochaine chose à faire.",
    icone: "boussole",
  },
  {
    href: "/tableau-de-bord/nouveau",
    titre: "Scanner un courrier",
    phrase: "Photographiez votre document : on en extrait la référence, le montant et la date limite.",
    icone: "scan",
  },
];

export const MODULES_OUTILS: Module[] = [
  {
    href: "/tableau-de-bord/lettre",
    titre: "Rédiger ma lettre",
    phrase: "Votre contestation écrite avec les bons arguments, prête à envoyer.",
    icone: "lettre",
  },
  {
    href: "/tableau-de-bord/regles",
    titre: "Règles de ma commune",
    phrase: "Zones, tarifs et voie de contestation, commune par commune.",
    icone: "carte",
  },
  {
    href: "/comprendre",
    titre: "Guides",
    phrase: "Décoder votre courrier, connaître vos délais et les preuves qui comptent.",
    icone: "livre",
  },
];

export const MODULES_COMPTE: Module[] = [
  {
    href: "/tableau-de-bord/abonnement",
    titre: "Mon abonnement",
    phrase: "Votre formule, votre quota et votre adhésion.",
    icone: "reglages",
  },
  {
    href: "/tableau-de-bord/compte",
    titre: "Mes paramètres",
    phrase: "Vos coordonnées, votre mot de passe, vos données.",
    icone: "reglages",
  },
];

export const TOUS_LES_MODULES = [...MODULES_DOSSIERS, ...MODULES_OUTILS, ...MODULES_COMPTE];

/**
 * Module correspondant au chemin courant, pour le titre et l'état actif.
 *
 * Le chemin le plus long gagne : `/tableau-de-bord/nouveau` désigne « Scanner
 * un courrier », tandis qu'une fiche de dossier `/tableau-de-bord/<id>` reste
 * rattachée au tableau de bord — on n'est jamais nulle part.
 */
export function moduleActif(chemin: string): Module | undefined {
  return TOUS_LES_MODULES.filter(
    (m) => chemin === m.href || chemin.startsWith(m.href + "/"),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}
