/**
 * Carte schématique des 19 communes de la Région de Bruxelles-Capitale.
 *
 * Fichier GÉNÉRÉ : ne pas modifier à la main. Les formes viennent d'une
 * tessellation calculée à partir de positions approximatives des communes,
 * découpée par un contour simplifié de la Région. C'est une carte de repérage :
 * les voisinages et les proportions sont respectés à peu près, les frontières
 * exactes non (le Bois de la Cambre, rattaché à Bruxelles-Ville, n'y figure pas).
 */

export type FormeCommune = {
  /** Tracé SVG, dans le repère 1000 × 998. */
  d: string;
  /** Position de l'étiquette. */
  x: number;
  y: number;
  etiquette: string;
  /** Taille de l'étiquette, ajustée à la place disponible. */
  taille: number;
};

export const CARTE_BRUXELLES = {
  largeur: 1000,
  hauteur: 998,
  contour: "M634.5 0.0 L760.5 53.2 L823.5 133.1 L844.5 252.8 L886.6 319.4 L928.6 365.9 L949.6 419.2 L1000.0 452.4 L974.8 565.6 L949.6 652.1 L886.6 751.9 L844.5 851.7 L739.5 918.2 L634.5 964.8 L529.4 998.0 L445.4 984.7 L361.3 938.2 L298.3 884.9 L256.3 818.4 L193.3 751.9 L25.2 618.8 L0.0 519.0 L46.2 419.2 L109.2 385.9 L130.3 319.4 L214.3 186.3 L277.3 153.0 L361.3 119.8 L445.4 53.2 L529.4 20.0 Z",
  communes: {
  "anderlecht": { d: "M330.1 575.5 L350.5 489.4 L341.3 482.5 L178.5 445.8 L155.5 423.7 L71.9 405.6 L46.2 419.2 L0.0 519.0 L25.2 618.8 L193.3 751.9 L236.3 797.2 L268.6 599.8 Z", x: 164.8, y: 566.8, etiquette: "Anderlecht", taille: 30 },
  "auderghem": { d: "M733.0 541.6 L694.9 580.5 L665.0 674.9 L773.6 735.8 L784.1 734.2 L875.7 777.6 L886.6 751.9 L949.6 652.1 L956.5 628.2 L917.5 610.2 L829.9 612.7 Z", x: 805.0, y: 660.6, etiquette: "Auderghem", taille: 30 },
  "berchem-sainte-agathe": { d: "M155.5 423.7 L274.3 344.0 L276.0 332.2 L192.7 220.5 L130.3 319.4 L109.2 385.9 L71.9 405.6 Z", x: 199.5, y: 336.0, etiquette: "Berchem", taille: 30 },
  "bruxelles-ville": { d: "M529.4 20.0 L445.4 53.2 L415.2 77.1 L443.4 162.6 L393.1 212.1 L389.5 269.6 L443.8 316.0 L414.9 367.4 L412.5 391.8 L369.6 479.8 L474.5 508.8 L521.4 468.6 L514.5 456.2 L501.0 336.8 L468.9 311.5 L540.3 206.3 L578.3 189.7 L596.2 192.1 L619.6 181.0 L815.9 243.0 L840.7 230.9 L823.5 133.1 L760.5 53.2 L634.5 0.0 Z", x: 466.4, y: 432.5, etiquette: "Bruxelles", taille: 30 },
  "etterbeek": { d: "M560.9 469.8 L584.6 548.4 L694.9 580.5 L733.0 541.6 L670.1 425.8 L620.1 425.8 Z", x: 645.2, y: 502.8, etiquette: "Etterbeek", taille: 28 },
  "evere": { d: "M620.5 278.0 L715.4 354.3 L744.0 339.1 L815.9 243.0 L619.6 181.0 L596.2 192.1 Z", x: 698.4, y: 261.8, etiquette: "Evere", taille: 30 },
  "forest": { d: "M268.6 599.8 L236.3 797.2 L243.1 804.4 L420.6 654.9 L330.1 575.5 Z", x: 313.4, y: 675.1, etiquette: "Forest", taille: 30 },
  "ganshoren": { d: "M276.0 332.2 L336.3 273.4 L255.8 164.4 L214.3 186.3 L192.7 220.5 Z", x: 263.3, y: 245.4, etiquette: "Ganshoren", taille: 23 },
  "ixelles": { d: "M491.3 646.6 L485.7 667.3 L505.4 694.2 L574.5 727.6 L665.0 674.9 L694.9 580.5 L584.6 548.4 L560.9 469.8 L521.4 468.6 L474.5 508.8 Z", x: 585.9, y: 613.6, etiquette: "Ixelles", taille: 30 },
  "jette": { d: "M443.4 162.6 L415.2 77.1 L361.3 119.8 L255.8 164.4 L336.3 273.4 L389.5 269.6 L393.1 212.1 Z", x: 358.1, y: 180.3, etiquette: "Jette", taille: 30 },
  "koekelberg": { d: "M389.5 269.6 L336.3 273.4 L276.0 332.2 L274.3 344.0 L292.3 358.8 L414.9 367.4 L443.8 316.0 Z", x: 361.6, y: 322.4, etiquette: "Koekelberg", taille: 25 },
  "molenbeek-saint-jean": { d: "M178.5 445.8 L341.3 482.5 L350.5 489.4 L369.6 479.8 L412.5 391.8 L414.9 367.4 L292.3 358.8 L274.3 344.0 L155.5 423.7 Z", x: 298.1, y: 415.6, etiquette: "Molenbeek", taille: 30 },
  "saint-gilles": { d: "M350.5 489.4 L330.1 575.5 L420.6 654.9 L485.7 667.3 L491.3 646.6 L474.5 508.8 L369.6 479.8 Z", x: 416.5, y: 570.0, etiquette: "St-Gilles", taille: 26 },
  "saint-josse-ten-noode": { d: "M514.5 456.2 L521.4 468.6 L560.9 469.8 L620.1 425.8 L568.9 354.0 L501.0 336.8 Z", x: 551.3, y: 407.2, etiquette: "St-Josse", taille: 22 },
  "schaerbeek": { d: "M596.2 192.1 L578.3 189.7 L540.3 206.3 L468.9 311.5 L501.0 336.8 L568.9 354.0 L620.1 425.8 L670.1 425.8 L715.4 354.3 L620.5 278.0 Z", x: 592.4, y: 314.3, etiquette: "Schaerbeek", taille: 30 },
  "uccle": { d: "M243.1 804.4 L256.3 818.4 L298.3 884.9 L361.3 938.2 L445.4 984.7 L529.4 998.0 L634.5 964.8 L711.3 930.7 L696.6 888.6 L588.3 782.3 L574.5 727.6 L505.4 694.2 L485.7 667.3 L420.6 654.9 Z", x: 473.2, y: 840.2, etiquette: "Uccle", taille: 30 },
  "watermael-boitsfort": { d: "M574.5 727.6 L588.3 782.3 L696.6 888.6 L711.3 930.7 L739.5 918.2 L844.5 851.7 L875.7 777.6 L784.1 734.2 L773.6 735.8 L665.0 674.9 Z", x: 721.3, y: 794.7, etiquette: "Boitsfort", taille: 30 },
  "woluwe-saint-lambert": { d: "M744.0 339.1 L715.4 354.3 L670.1 425.8 L733.0 541.6 L845.0 458.6 L868.7 456.1 L942.2 400.5 L928.6 365.9 L886.6 319.4 L844.5 252.8 L840.7 230.9 L815.9 243.0 Z", x: 801.2, y: 392.7, etiquette: "Woluwe-St-L.", taille: 30 },
  "woluwe-saint-pierre": { d: "M974.8 565.6 L1000.0 452.4 L949.6 419.2 L942.2 400.5 L868.7 456.1 L845.0 458.6 L734.2 541.6 L829.9 612.7 L917.5 610.2 L956.5 628.2 Z", x: 851.3, y: 524.8, etiquette: "Woluwe-St-P.", taille: 30 },
  } as Record<string, FormeCommune>,
};
