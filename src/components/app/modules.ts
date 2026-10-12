/**
 * La navigation de l'espace membre.
 *
 * Cinq entrées, pas une de plus. L'ancienne version en comptait sept, dont
 * trois qui faisaient presque la même chose (« Contester », « Rédiger ma
 * lettre », « Règles de ma commune »). Tout ce qui concerne un dossier vit
 * maintenant DANS le dossier : sa lettre, son analyse, son suivi. La
 * navigation ne sert plus qu'à aller d'un lieu à un autre.
 *
 * Une seule source de vérité : la barre latérale, la barre d'onglets mobile
 * et le titre de page lisent cette liste.
 */

export type Module = {
  href: string;
  titre: string;
  /** Titre court, pour la barre d'onglets du téléphone. */
  court: string;
  /** Une phrase, à la deuxième personne, qui dit à quoi sert l'entrée. */
  phrase: string;
  icone: "maison" | "dossiers" | "scan-doc" | "bouee" | "personne";
  /** L'action principale : mise en avant (bouton jaune, onglet central). */
  principal?: boolean;
  /** Autres chemins qui appartiennent à cette entrée. */
  alias?: string[];
};

export const MODULES: Module[] = [
  {
    href: "/tableau-de-bord",
    titre: "Accueil",
    court: "Accueil",
    phrase: "Ce qui demande votre attention aujourd'hui, en un coup d'œil.",
    icone: "maison",
  },
  {
    href: "/tableau-de-bord/dossiers",
    titre: "Mes dossiers",
    court: "Dossiers",
    phrase: "Chaque courrier reçu, sa lettre, son échéance et son suivi.",
    icone: "dossiers",
  },
  {
    href: "/tableau-de-bord/nouveau",
    titre: "Nouveau courrier",
    court: "Scanner",
    phrase: "Une photo ou un PDF : le moteur lit tout et prépare votre défense.",
    icone: "scan-doc",
    principal: true,
  },
  {
    href: "/tableau-de-bord/aide",
    titre: "Aide",
    court: "Aide",
    phrase: "Posez votre question : la réponse vient de notre base de savoir.",
    icone: "bouee",
  },
  {
    href: "/tableau-de-bord/compte",
    titre: "Mon compte",
    court: "Compte",
    phrase: "Vos coordonnées, votre adhésion, vos données.",
    icone: "personne",
    alias: ["/adherer"],
  },
];

/**
 * L'entrée correspondant au chemin courant, pour l'état actif et le titre.
 *
 * Un alias l'emporte, puis le chemin le plus long : une fiche de dossier
 * `/tableau-de-bord/<id>` reste rattachée à « Mes dossiers » — on n'est
 * jamais nulle part.
 */
export function moduleActif(chemin: string): Module | undefined {
  const correspond = (base: string) => chemin === base || chemin.startsWith(base + "/");

  const parAlias = MODULES.find((m) => m.alias?.some(correspond));
  if (parAlias) return parAlias;

  const exact = MODULES.filter((m) => m.href !== "/tableau-de-bord" && correspond(m.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  if (exact) return exact;

  // Une fiche de dossier (/tableau-de-bord/<identifiant>) appartient à la
  // liste des dossiers ; la racine, à l'accueil.
  if (chemin === "/tableau-de-bord") return MODULES[0];
  if (correspond("/tableau-de-bord")) return MODULES[1];
  return undefined;
}
