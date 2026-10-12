/**
 * Le jeu d'icônes SOS Citizens.
 *
 * Dessiné pour le métier, pas emprunté à une bibliothèque : un ticket qui a
 * ses crans, un horodateur, une plaque belge aux caractères rouges, la ScanCar
 * et sa caméra de toit, un recommandé marqué « R ». Une icône générique dit
 * « document » ; celles-ci disent « votre redevance ».
 *
 * Le style est unique et se reconnaît : un trait encre de 1,75, et un aplat
 * jaune légèrement décalé derrière le dessin, comme une impression mal calée.
 * Le jaune se règle par la variable CSS `--icone-accent` : on peut l'éteindre
 * sur un fond déjà jaune, ou le passer en blanc sur l'encre.
 *
 * Grille : 32 × 32. Le trait suit `currentColor`, donc la couleur du texte.
 */

import type { ReactNode } from "react";

export type PropsIcone = { className?: string; titre?: string };

const A = "var(--icone-accent, #ffc629)";
const ROUGE_PLAQUE = "#c8102e";
const BLEU_EUROPE = "#1f5bd6";

function Svg({
  className = "h-6 w-6",
  titre,
  children,
}: PropsIcone & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={titre ? "img" : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
    >
      {titre && <title>{titre}</title>}
      {children}
    </svg>
  );
}

/** Aplat d'accent : jamais de contour, toujours derrière le trait. */
const aplat = { fill: A, stroke: "none" } as const;

/* ========================================================================== */
/*  Le courrier et la procédure                                               */
/* ========================================================================== */

/** La redevance : un ticket cranté, avec son montant encadré. */
export function IconeTicket(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="8.2" y="7" width="18.3" height="20" rx="2" {...aplat} />
      <path d="M7 4.5h16.5a1 1 0 0 1 1 1V26l-2.31-1.4-2.31 1.4-2.32-1.4-2.31 1.4-2.31-1.4-2.31 1.4-2.32-1.4L6 26V5.5a1 1 0 0 1 1-1Z" />
      <path d="M10 9.5h5.5" strokeWidth="2.2" />
      <path d="M10 13.2h10.5M10 16.6h6.5" />
      <rect x="15.6" y="18.8" width="5.6" height="3.4" rx="1" />
    </Svg>
  );
}

/** Le courrier glissé sous l'essuie-glace. */
export function IconePareBrise(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M7.5 15 9.6 9a2 2 0 0 1 1.9-1.4h9a2 2 0 0 1 1.9 1.4l2.1 6" />
      <path d="M5.6 15h20.8a1.6 1.6 0 0 1 1.6 1.6V22a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5.4A1.6 1.6 0 0 1 5.6 15Z" />
      <path d="M8 23v2.6M24 23v2.6" />
      <circle cx="8.6" cy="19" r="1.3" />
      <circle cx="23.4" cy="19" r="1.3" />
      <path d="M12.5 19h7" />
      <g transform="rotate(-14 16.5 11.6)">
        <rect x="13.4" y="9.2" width="6.4" height="4.8" rx=".7" {...aplat} />
        <rect x="13.4" y="9.2" width="6.4" height="4.8" rx=".7" />
      </g>
      <path d="M10.4 14.6 17.6 10" strokeWidth="1.5" />
    </Svg>
  );
}

/** L'horodateur, sur son pied. */
export function IconeHorodateur(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="10.6" y="5.6" width="13" height="15" rx="2" {...aplat} />
      <rect x="9" y="4" width="13" height="15" rx="2" />
      <rect x="11.5" y="6.6" width="8" height="4.2" rx=".8" />
      <path d="M12.5 14h4" />
      <circle cx="19" cy="14.2" r="1" />
      <path d="M15.5 19v8M11.5 27.6h8" />
    </Svg>
  );
}

/** L'horodateur hors service : l'écran barré. */
export function IconeHorodateurPanne(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="10.6" y="5.6" width="13" height="15" rx="2" {...aplat} />
      <rect x="9" y="4" width="13" height="15" rx="2" />
      <rect x="11.5" y="6.6" width="8" height="4.2" rx=".8" />
      <path d="m13.6 7.6 3.8 2.2M17.4 7.6l-3.8 2.2" />
      <path d="M15.5 19v8M11.5 27.6h8" />
      <path d="M24.5 13.5l3-3M25 17.5h3" strokeWidth="1.6" />
    </Svg>
  );
}

/** Le panneau de stationnement. */
export function IconePanneauP(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="9.6" y="4.6" width="15" height="15" rx="3" {...aplat} />
      <rect x="8" y="3" width="15" height="15" rx="3" />
      <path d="M13.2 14.6V7h3.1a2.6 2.6 0 0 1 0 5.2h-3.1" strokeWidth="2.1" />
      <path d="M15.5 18v10M12.5 28.5h6" />
    </Svg>
  );
}

/** Le panneau caché par une branche : la signalisation illisible. */
export function IconePanneauIllisible(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="5" y="3.5" width="14" height="14" rx="2.6" />
      <path d="M9.6 13.6V7.4h2.4a2 2 0 0 1 0 4H9.6" strokeWidth="1.9" />
      <path d="M12 17.5V28M9 28.5h6" />
      <path d="M13 14.2c3.4-4.4 9.6-5.6 14-3.4-2.3 4.4-8.6 6.4-14 3.4Z" {...aplat} />
      <path d="M13 14.2c3.4-4.4 9.6-5.6 14-3.4-2.3 4.4-8.6 6.4-14 3.4Z" />
      <path d="M11.2 16c4.6-1.6 10-3.8 16-5.4" />
    </Svg>
  );
}

/** La ScanCar : la voiture et sa caméra de toit qui lit les plaques. */
export function IconeScanCar(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M4.5 21.5V18a2 2 0 0 1 1.5-1.9L9 15.3l2.5-3.6a2 2 0 0 1 1.6-.9h6.3a2 2 0 0 1 1.6.8l2.8 3.7 2.7.7a2 2 0 0 1 1.5 1.9v3.5" />
      <path d="M10.6 21.5h10.8M4.5 21.5h1.1M26.4 21.5h1.1" />
      <circle cx="8.1" cy="21.5" r="2.5" />
      <circle cx="23.9" cy="21.5" r="2.5" />
      <path d="M14.5 10.8v-1.6" />
      <rect x="12.4" y="5.8" width="6.2" height="3.4" rx=".9" {...aplat} />
      <rect x="12.4" y="5.8" width="6.2" height="3.4" rx=".9" />
      <path d="m19.6 6.6 4.6-2.4M19.6 8.4l4.6 1.4" strokeWidth="1.4" strokeDasharray="1.6 1.4" />
    </Svg>
  );
}

/** La plaque belge : caractères rouges, bande européenne bleue. */
export function IconePlaque(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="10" width="25" height="12" rx="2.2" />
      <path d="M5.7 10.9h1.6a.8.8 0 0 1 .8.8v8.6a.8.8 0 0 1-.8.8H5.7a.8.8 0 0 1-.8-.8v-8.6a.8.8 0 0 1 .8-.8Z" fill={BLEU_EUROPE} stroke="none" />
      <g stroke={ROUGE_PLAQUE} strokeWidth="1.45">
        <path d="M10.6 13.4v5.2" />
        <path d="M12.3 16h1.4" />
        <path d="m15 18.6 1.4-5.2 1.4 5.2M15.5 17h1.8" />
        <path d="M19.4 18.6v-5.2h1.4a1.3 1.3 0 0 1 0 2.6h-1.4 1.6a1.3 1.3 0 0 1 0 2.6h-1.6" />
        <path d="M26.2 14.1a2.3 2.3 0 1 0 0 3.8" />
      </g>
    </Svg>
  );
}

/** Le recommandé : l'enveloppe et son étiquette « R ». */
export function IconeRecommande(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="7.5" width="22" height="15" rx="2" />
      <path d="m4.2 8.6 10.3 7.6 10.3-7.6" />
      <circle cx="24.4" cy="21.6" r="5" {...aplat} />
      <circle cx="24.4" cy="21.6" r="5" />
      <path d="M22.9 24v-4.7h1.7a1.4 1.4 0 0 1 0 2.8h-1.7M24.6 22.1l1.5 1.9" strokeWidth="1.5" />
    </Svg>
  );
}

/** La lettre de contestation : la page, le texte, la signature. */
export function IconeLettre(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="9" y="5.6" width="17" height="22.4" rx="2" {...aplat} />
      <path d="M8 3.5h11l5 5V26a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 26V5A1.5 1.5 0 0 1 8 3.5Z" />
      <path d="M19 3.5v5h5" />
      <path d="M10 12h7.5M10 15.5h10M10 19h6" />
      <path d="M10 23.6c1.1-1.7 1.9-1.7 2.3 0 .4 1.5 1.2 1.3 2.2-.4.7-1 1.4-.9 2 .5" strokeWidth="1.5" />
    </Svg>
  );
}

/** Le délai : le calendrier et le sablier qui s'écoule. */
export function IconeDelai(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="6" width="18.5" height="17" rx="2.2" />
      <path d="M8.6 4v4M17 4v4M3.5 11h18.5" />
      <path d="M7.5 15h3M7.5 18.5h3M13 15h3" />
      <circle cx="23.2" cy="22.2" r="6.2" {...aplat} />
      <circle cx="23.2" cy="22.2" r="6.2" />
      <path d="M20.9 18.9h4.6M20.9 25.5h4.6M21.5 18.9c0 2.2 3.4 2.5 3.4 3.3s-3.4 1.1-3.4 3.3M24.9 18.9c0 2.2-3.4 2.5-3.4 3.3s3.4 1.1 3.4 3.3" strokeWidth="1.4" />
    </Svg>
  );
}

/** Le chronomètre : ce qui presse. */
export function IconeChrono(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M16 18v-8.2a8.2 8.2 0 0 1 7.4 4.7Z" {...aplat} />
      <circle cx="16" cy="18" r="9" />
      <path d="M13.4 4.5h5.2M16 4.5V9M23.6 9.6l1.7-1.7" />
      <path d="m16 18 3.6-3.6" strokeWidth="2" />
    </Svg>
  );
}

/** L'huissier : la porte, et l'avis épinglé dessus. */
export function IconeHuissier(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M8 28V5.5A1.5 1.5 0 0 1 9.5 4h13A1.5 1.5 0 0 1 24 5.5V28M5 28h22" />
      <circle cx="20.6" cy="17.6" r="1" />
      <rect x="10.9" y="8" width="8.2" height="10.2" rx="1" {...aplat} />
      <rect x="10.9" y="8" width="8.2" height="10.2" rx="1" />
      <path d="M12.8 11.2h4.4M12.8 13.7h4.4M12.8 16.2h2.6" strokeWidth="1.4" />
      <circle cx="15" cy="8" r=".9" fill="currentColor" />
    </Svg>
  );
}

/** La mise en demeure : le document frappé d'un tampon rouge-jaune. */
export function IconeMiseEnDemeure(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M7 3.5h12l5 5V27a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 27V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M19 3.5v5h5M9 11h7M9 14.5h10" />
      <g transform="rotate(-12 17 21)">
        <rect x="10.5" y="17.6" width="13" height="6.8" rx="1.4" {...aplat} />
        <rect x="10.5" y="17.6" width="13" height="6.8" rx="1.4" />
        <path d="M13 21h8" strokeWidth="1.9" />
      </g>
    </Svg>
  );
}

/** La balance de la justice. */
export function IconeBalance(p: PropsIcone) {
  return (
    <Svg {...p}>
      <circle cx="16" cy="5" r="1.4" />
      <path d="M16 6.4V26M10.5 27h11M6 9.5h20" />
      <path d="M6 9.5 3.2 18.5M6 9.5l2.8 9M26 9.5l-2.8 9M26 9.5l2.8 9" strokeWidth="1.4" />
      <path d="M2.8 18.5h6.4a3.2 3.2 0 0 1-6.4 0Z" {...aplat} />
      <path d="M2.8 18.5h6.4a3.2 3.2 0 0 1-6.4 0Z" />
      <path d="M22.8 18.5h6.4a3.2 3.2 0 0 1-6.4 0Z" />
    </Svg>
  );
}

/** Le bouclier et son P : la protection. */
export function IconeBouclier(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M17.6 5.1 27.6 8.6v8c0 6.7-4.3 11.4-10 13.5-5.7-2.1-10-6.8-10-13.5v-8l10-3.5Z" {...aplat} />
      <path d="M16 3.5 26 7v8c0 6.7-4.3 11.4-10 13.5C10.3 26.4 6 21.7 6 15V7l10-3.5Z" />
      <path d="M13.6 20.4v-9.2h3.1a2.7 2.7 0 0 1 0 5.4h-3.1" strokeWidth="2.1" />
    </Svg>
  );
}

/** La loupe sur le document : l'analyse. */
export function IconeLoupe(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="4.5" y="3.5" width="15" height="20.5" rx="1.6" />
      <path d="M8 8.6h8M8 12.2h5.5" />
      <circle cx="19.2" cy="19.2" r="5.6" {...aplat} />
      <circle cx="19.2" cy="19.2" r="5.6" />
      <path d="m23.3 23.3 4.4 4.4" strokeWidth="2.6" />
      <path d="M16.7 19.2h5" strokeWidth="1.5" />
    </Svg>
  );
}

/** Le téléphone qui cadre le courrier : le scan. */
export function IconeScanDoc(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="8" y="3" width="16" height="26" rx="3.2" />
      <path d="M14 5.8h4" />
      <rect x="11.3" y="9.2" width="9.4" height="12.6" rx="1" {...aplat} />
      <path d="M13.2 13h5.6M13.2 15.8h5.6M13.2 18.6h3.6" strokeWidth="1.4" />
      <path d="M10.2 10.8V8.4h2.4M21.8 10.8V8.4h-2.4M10.2 20.4v2.4h2.4M21.8 20.4v2.4h-2.4" strokeWidth="1.4" />
      <path d="M14.4 25.8h3.2" />
    </Svg>
  );
}

/** Les frais qui grimpent : la pile de pièces et la flèche. */
export function IconeEuros(p: PropsIcone) {
  return (
    <Svg {...p}>
      <ellipse cx="11" cy="14.8" rx="6" ry="2.2" {...aplat} />
      <ellipse cx="11" cy="14.8" rx="6" ry="2.2" />
      <path d="M5 14.8v9c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v-9" />
      <path d="M5 17.8c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2M5 20.8c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2" />
      <path d="m19.6 15.6 3.6-4.2 2.6 2.6 3.4-5" />
      <path d="M26.4 9h2.8v2.8" />
    </Svg>
  );
}

/** Deux redevances pour le même stationnement. */
export function IconeDoublon(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M11 3.5h13.5a1 1 0 0 1 1 1V21l-2.1-1.3-2.1 1.3-2.1-1.3-2.1 1.3-2.1-1.3-2.1 1.3V4.5a1 1 0 0 1 1-1Z" {...aplat} />
      <path d="M11 3.5h13.5a1 1 0 0 1 1 1V21l-2.1-1.3-2.1 1.3-2.1-1.3-2.1 1.3-2.1-1.3-2.1 1.3V4.5a1 1 0 0 1 1-1Z" />
      <path d="M7.5 8.5h-1a1 1 0 0 0-1 1V28l2.1-1.3 2.1 1.3 2.1-1.3 2.1 1.3 2.1-1.3 2.1 1.3V25" />
      <path d="M14 8.5h7.5M14 12h5" />
    </Svg>
  );
}

/* ========================================================================== */
/*  Les situations de l'automobiliste                                         */
/* ========================================================================== */

/** La carte de riverain. */
export function IconeCarteRiverain(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="5.6" y="9" width="23" height="15" rx="2.2" {...aplat} />
      <rect x="4" y="7.5" width="23" height="15" rx="2.2" />
      <path d="m7.8 15.4 3.6-3.1 3.6 3.1M8.9 14.5v4.3h5v-4.3" />
      <path d="M18 12.6h6M18 15.6h6M18 18.6h3.6" />
    </Svg>
  );
}

/** La carte de stationnement pour personnes handicapées. */
export function IconeCartePmr(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="5.6" y="9" width="23" height="15" rx="2.2" {...aplat} />
      <rect x="4" y="7.5" width="23" height="15" rx="2.2" />
      <circle cx="11.4" cy="11.4" r="1.2" fill="currentColor" stroke="none" />
      <path d="M11.4 13.4v3.4h3l1.4 2.9" />
      <path d="M9.9 15.2a3.6 3.6 0 1 0 4.6 4.2" />
      <path d="M19 13h5M19 16h5M19 19h3" />
    </Svg>
  );
}

/** L'application de stationnement et sa session en cours. */
export function IconeAppMobile(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="8" y="3" width="16" height="26" rx="3.2" />
      <path d="M14 5.8h4" />
      <circle cx="16" cy="15" r="5.6" {...aplat} />
      <path d="M16 9.4a5.6 5.6 0 1 1-5.3 3.8" />
      <path d="M14.7 17.6v-5.1h1.8a1.55 1.55 0 0 1 0 3.1h-1.8" strokeWidth="1.6" />
      <path d="M12.5 24.4h7" />
    </Svg>
  );
}

/** La clé et son étiquette : le véhicule vendu ou cédé. */
export function IconeCleVendue(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="13" width="9.5" height="13" rx="3.6" />
      <circle cx="8.25" cy="17.6" r="1.3" />
      <path d="M8.25 21.4v1.6" />
      <path d="M13 19.5h9.6l1.4 1.4 1.4-1.4h1.2" />
      <path d="M17.3 3.6h7.2a1 1 0 0 1 1 1v6.2l-4.8 4.8-6.4-6.4 3-5.6Z" {...aplat} />
      <path d="M17.3 3.6h7.2a1 1 0 0 1 1 1v6.2l-4.8 4.8-6.4-6.4 3-5.6Z" />
      <circle cx="22.2" cy="7" r="1.1" />
      <path d="M14.3 9.2c-2 1-3.4 2.4-4.2 3.8" strokeWidth="1.3" strokeDasharray="1.4 1.3" />
    </Svg>
  );
}

/** Le procès-verbal de police : véhicule volé, plainte déposée. */
export function IconePvPolice(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M7 3.5h18a1.5 1.5 0 0 1 1.5 1.5v22A1.5 1.5 0 0 1 25 28.5H7A1.5 1.5 0 0 1 5.5 27V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M16 7.6 20.4 9v3.4c0 2.8-1.8 4.8-4.4 5.7-2.6-.9-4.4-2.9-4.4-5.7V9L16 7.6Z" {...aplat} />
      <path d="M16 7.6 20.4 9v3.4c0 2.8-1.8 4.8-4.4 5.7-2.6-.9-4.4-2.9-4.4-5.7V9L16 7.6Z" />
      <path d="M9.5 21.6h13M9.5 24.6h8" />
    </Svg>
  );
}

/** À l'arrêt, feux de détresse : déposer quelqu'un, charger un colis. */
export function IconeArret(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M4.5 23.5V20a2 2 0 0 1 1.5-1.9L9 17.3l2.5-3.6a2 2 0 0 1 1.6-.9h6.3a2 2 0 0 1 1.6.8l2.8 3.7 2.7.7a2 2 0 0 1 1.5 1.9v3.5" />
      <path d="M10.6 23.5h10.8M4.5 23.5h1.1M26.4 23.5h1.1" />
      <circle cx="8.1" cy="23.5" r="2.5" />
      <circle cx="23.9" cy="23.5" r="2.5" />
      <path d="M16 3.4 21.8 13H10.2L16 3.4Z" {...aplat} />
      <path d="M16 3.4 21.8 13H10.2L16 3.4Z" />
      <path d="M16 6.9v2.6M16 11.2v.1" strokeWidth="1.8" />
    </Svg>
  );
}

/** Le volant : le conducteur. */
export function IconeVolant(p: PropsIcone) {
  return (
    <Svg {...p}>
      <circle cx="16" cy="16" r="11.5" />
      <circle cx="16" cy="16" r="3.2" {...aplat} />
      <circle cx="16" cy="16" r="3.2" />
      <path d="M4.8 14.4c3.6-1 7.2-1.4 8-1.4M27.2 14.4c-3.6-1-7.2-1.4-8-1.4M16 19.2v8.3" />
    </Svg>
  );
}

/* ========================================================================== */
/*  Les lieux et les institutions                                             */
/* ========================================================================== */

/** L'hôtel de ville : la commune. */
export function IconeHotelDeVille(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M16 4.5v4" />
      <path d="M16 4.5h4.4l-1 1.5 1 1.5H16" {...aplat} />
      <path d="M16 4.5h4.4l-1 1.5 1 1.5H16" />
      <path d="M5 13.5 16 8.5l11 5" />
      <path d="M6.5 13.5h19" />
      <path d="M8.5 16v8M13 16v8M19 16v8M23.5 16v8" />
      <path d="M4.5 26.5h23M6 24h20" />
    </Svg>
  );
}

/**
 * La Belgique et ses trois régions.
 *
 * Contour simplifié tiré des coordonnées réelles des frontières (côte, poche
 * de Givet, pointe de la province de Luxembourg) : il doit se reconnaître, pas
 * seulement « faire carte ». La frontière linguistique est en pointillé, et
 * Bruxelles est le point juste au-dessus.
 */
export function IconeBelgique(p: PropsIcone) {
  const contour =
    "M3.3 9.9 8.8 7.1l5.7-.1 3.3-1.1 2.3.5 4.9 2.9-1.1 4.1h2.3l2.5 4.5-1.8 1.9-2.1 4.7-2.2 1.8-4.1-3-.2-3.9-.9 1.9-3 .3-3.5-3.5-3-4.4H5.3Z";
  return (
    <Svg {...p}>
      <path d={contour} {...aplat} />
      <path d={contour} />
      <path d="M5.6 13.7c4.4-.2 12.4-.3 18.8-.3" strokeDasharray="1.7 1.5" strokeWidth="1.4" />
      <circle cx="15.2" cy="12.2" r="1.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** La boîte aux lettres, drapeau levé : un courrier est arrivé. */
export function IconeBoiteLettres(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M8.5 10.5h13a5 5 0 0 1 5 5V23h-23v-7.5a5 5 0 0 1 5-5Z" />
      <path d="M8.5 10.5a5 5 0 0 1 5 5V23" />
      <path d="M16 28v-5" />
      <path d="M20 15.5V6.5h4.6l-1.2 1.8 1.2 1.8H20" {...aplat} />
      <path d="M20 15.5V6.5h4.6l-1.2 1.8 1.2 1.8H20" />
      <path d="M5.8 15.5h5.4" />
    </Svg>
  );
}

/* ========================================================================== */
/*  Le moteur, l'aide, la confiance                                           */
/* ========================================================================== */

/** Le moteur SOS : un cerveau dont les plis sont des routes. */
export function IconeCerveau(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M16 6.3c-1-1.6-3.6-2.3-5.5-1.1-1.5.9-2.1 2.4-1.9 3.8-2.3.4-3.9 2.4-3.6 4.9-1.6 1.2-2.1 3.6-.8 5.6.4.7 1 1.2 1.8 1.5-.2 2.4 1.6 4.6 4.1 4.8 1.2 1.6 3.6 2.1 5.4 1.1.2-.1.4-.3.5-.4" {...aplat} />
      <path d="M16 6.3c-1-1.6-3.6-2.3-5.5-1.1-1.5.9-2.1 2.4-1.9 3.8-2.3.4-3.9 2.4-3.6 4.9-1.6 1.2-2.1 3.6-.8 5.6.4.7 1 1.2 1.8 1.5-.2 2.4 1.6 4.6 4.1 4.8 1.2 1.6 3.6 2.1 5.4 1.1.2-.1.4-.3.5-.4V6.3Z" />
      <path d="M16 6.3c1-1.6 3.6-2.3 5.5-1.1 1.5.9 2.1 2.4 1.9 3.8 2.3.4 3.9 2.4 3.6 4.9 1.6 1.2 2.1 3.6.8 5.6-.4.7-1 1.2-1.8 1.5.2 2.4-1.6 4.6-4.1 4.8-1.2 1.6-3.6 2.1-5.4 1.1-.2-.1-.4-.3-.5-.4" />
      <path d="M16 12.5h4.5l2 2.5M16 18.5h3l2.4-2" strokeDasharray="1.8 1.4" strokeWidth="1.45" />
      <circle cx="22.6" cy="15.1" r="1" fill="currentColor" stroke="none" />
      <path d="M9.4 12.6c1.2 0 2.2.8 2.4 2M8.6 18.6c1.4-.2 2.6.6 3 1.8" strokeWidth="1.45" />
    </Svg>
  );
}

/** La bouée : l'aide, le SOS. */
export function IconeBouee(p: PropsIcone) {
  return (
    <Svg {...p}>
      <circle cx="16" cy="16" r="11.5" />
      <circle cx="16" cy="16" r="5" />
      <path d="M8 8a11.3 11.3 0 0 1 4.5-2.9L13.9 11A5.1 5.1 0 0 0 11 13.9L5.1 12.5A11.3 11.3 0 0 1 8 8Z" {...aplat} />
      <path d="M24 24a11.3 11.3 0 0 1-4.5 2.9L18.1 21a5.1 5.1 0 0 0 2.9-2.9l5.9 1.4A11.3 11.3 0 0 1 24 24Z" {...aplat} />
      <path d="M24 8a11.3 11.3 0 0 0-4.5-2.9" opacity="0" />
      <path d="m12.5 5.1 1.4 5.9M5.1 12.5l5.9 1.4M19.5 26.9 18.1 21M26.9 19.5 21 18.1M19.5 5.1 18.1 11M26.9 12.5 21 13.9M12.5 26.9 13.9 21M5.1 19.5l5.9-1.4" strokeWidth="1.4" />
    </Svg>
  );
}

/** La preuve : la photo épinglée. */
export function IconePreuve(p: PropsIcone) {
  return (
    <Svg {...p}>
      <g transform="rotate(-6 16 16)">
        <rect x="6" y="5" width="20" height="22" rx="1.6" />
        <rect x="8.6" y="7.6" width="14.8" height="12.4" rx=".8" {...aplat} />
        <rect x="8.6" y="7.6" width="14.8" height="12.4" rx=".8" />
        <path d="m10 18 3.6-4 2.6 2.6 2.2-2 3.4 3.4" strokeWidth="1.4" />
        <path d="M10.5 23.4h7" strokeWidth="1.4" />
      </g>
      <circle cx="16.4" cy="5.2" r="1.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Le cadenas : vos documents restent chez vous. */
export function IconeCadenas(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M10.5 14V10a5.5 5.5 0 0 1 11 0v4" />
      <rect x="8" y="15.6" width="18" height="13" rx="2.6" {...aplat} />
      <rect x="6.5" y="14" width="19" height="13.5" rx="2.6" />
      <circle cx="16" cy="19.8" r="1.6" />
      <path d="M16 21.4v2.4" />
    </Svg>
  );
}

/** Le droit d'accès à vos données (RGPD) : le document et l'œil. */
export function IconeDonnees(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M7 3.5h11l5 5V14M7 3.5A1.5 1.5 0 0 0 5.5 5v21A1.5 1.5 0 0 0 7 27.5h6" />
      <path d="M18 3.5v5h5M9 10h5M9 13.5h7" />
      <path d="M13.5 22.5c2.1-3.4 4.8-5 7.7-5s5.6 1.6 7.6 5c-2 3.4-4.7 5-7.6 5s-5.6-1.6-7.7-5Z" {...aplat} />
      <path d="M13.5 22.5c2.1-3.4 4.8-5 7.7-5s5.6 1.6 7.6 5c-2 3.4-4.7 5-7.6 5s-5.6-1.6-7.7-5Z" />
      <circle cx="21.2" cy="22.5" r="2" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Le tampon : c'est fait, c'est envoyé, c'est validé. */
export function IconeTampon(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M12.5 12.4c-1.3-1.2-2-2.8-2-4.4a5.5 5.5 0 0 1 11 0c0 1.6-.7 3.2-2 4.4V15h-7v-2.6Z" />
      <path d="M6 17.6A2.6 2.6 0 0 1 8.6 15h14.8a2.6 2.6 0 0 1 2.6 2.6V21H6v-3.4Z" {...aplat} />
      <path d="M6 17.6A2.6 2.6 0 0 1 8.6 15h14.8a2.6 2.6 0 0 1 2.6 2.6V21H6v-3.4Z" />
      <path d="M8 21v2.4h16V21" />
      <path d="M8.5 27.5h15" strokeDasharray="2.4 1.8" />
    </Svg>
  );
}

/** L'ampoule : le conseil. */
export function IconeAmpoule(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M11.2 19.4c-1.8-1.5-3-3.6-3-6.1a7.8 7.8 0 0 1 15.6 0c0 2.5-1.2 4.6-3 6.1-.7.6-1.1 1.4-1.1 2.3v.8h-7.4v-.8c0-.9-.4-1.7-1.1-2.3Z" {...aplat} />
      <path d="M11.2 19.4c-1.8-1.5-3-3.6-3-6.1a7.8 7.8 0 0 1 15.6 0c0 2.5-1.2 4.6-3 6.1-.7.6-1.1 1.4-1.1 2.3v.8h-7.4v-.8c0-.9-.4-1.7-1.1-2.3Z" />
      <path d="M12.6 25.4h6.8M13.8 28.4h4.4" />
      <path d="M14.2 15.4 16 17.2l1.8-1.8" strokeWidth="1.4" />
    </Svg>
  );
}

/** La main tendue : l'adhésion, la solidarité de l'association. */
export function IconeMainTendue(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M16 13.6c-1.6-2.6-6.4-2.4-6.4 1.2 0 3 4 5.4 6.4 7.2 2.4-1.8 6.4-4.2 6.4-7.2 0-3.6-4.8-3.8-6.4-1.2Z" {...aplat} />
      <path d="M16 13.6c-1.6-2.6-6.4-2.4-6.4 1.2 0 3 4 5.4 6.4 7.2 2.4-1.8 6.4-4.2 6.4-7.2 0-3.6-4.8-3.8-6.4-1.2Z" />
      <path d="M3.5 24.5h4.6l5.2 1.8c1.1.4 2.3.3 3.3-.3l8.6-5.2a1.8 1.8 0 0 0-1.8-3.1l-5.2 2.6" />
      <path d="M3.5 21h3.4c1.5 0 2.9.5 4.1 1.3l1 .7h4.6a1.6 1.6 0 0 1 0 3.2" />
    </Svg>
  );
}

/** L'agenda et sa cloche : le rappel. */
export function IconeAgenda(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="6" width="19" height="18" rx="2.2" />
      <path d="M8.6 4v4M17.4 4v4M3.5 11h19" />
      <path d="M23.4 15.8a4 4 0 0 1 4 4v3.2l1.2 1.6h-10.4l1.2-1.6v-3.2a4 4 0 0 1 4-4Z" {...aplat} />
      <path d="M23.4 15.8a4 4 0 0 1 4 4v3.2l1.2 1.6h-10.4l1.2-1.6v-3.2a4 4 0 0 1 4-4Z" />
      <path d="M22 27.2a1.6 1.6 0 0 0 2.8 0" />
    </Svg>
  );
}

/** Les dossiers : la pile de chemises. */
export function IconeDossiers(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M6.6 9.5H11l1.8 2h12a1.6 1.6 0 0 1 1.6 1.6v12.3a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 25.4V11.1a1.6 1.6 0 0 1 1.6-1.6Z" {...aplat} />
      <path d="M5 8.5V7.1A1.6 1.6 0 0 1 6.6 5.5H11l1.8 2h12" opacity=".55" />
      <path d="M5.1 10.9a1.6 1.6 0 0 1 1.6-1.4H11l1.8 2h12a1.6 1.6 0 0 1 1.6 1.6v12.3a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 25.4V11.1Z" />
      <path d="M5 15.5h21.5" />
    </Svg>
  );
}

/** La maison : l'accueil de l'espace membre. */
export function IconeMaison(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M12.6 27v-7.4h6.8V27" {...aplat} />
      <path d="M4.5 14.6 16 5l11.5 9.6" />
      <path d="M7.4 12.3V25a2 2 0 0 0 2 2h13.2a2 2 0 0 0 2-2V12.3" />
      <path d="M12.6 27v-7.4h6.8V27" />
    </Svg>
  );
}

/** La personne : le compte. */
export function IconePersonne(p: PropsIcone) {
  return (
    <Svg {...p}>
      <circle cx="16" cy="11" r="5" {...aplat} />
      <circle cx="16" cy="11" r="5" />
      <path d="M6 27c.8-5.2 4.8-8.4 10-8.4s9.2 3.2 10 8.4" />
    </Svg>
  );
}

/** La bulle de conversation. */
export function IconeBulle(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M6 6.5h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H14l-6 4.6v-4.6H6a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2Z" {...aplat} />
      <path d="M6 6.5h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H14l-6 4.6v-4.6H6a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2Z" />
      <path d="M10 12.5h12M10 16.5h7" />
    </Svg>
  );
}

/** L'enveloppe : l'e-mail. */
export function IconeMail(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="7" width="25" height="18" rx="2.4" />
      <path d="m4.4 8.4 11.6 8.6 11.6-8.6" />
    </Svg>
  );
}

/** Le combiné : le téléphone. */
export function IconeTelephone(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M8.8 4.5h3.1l1.6 5.2-2.4 1.8a14.4 14.4 0 0 0 9.4 9.4l1.8-2.4 5.2 1.6v3.1a2.6 2.6 0 0 1-2.8 2.6C13.9 25.1 6.9 18.1 6.2 7.3a2.6 2.6 0 0 1 2.6-2.8Z" />
    </Svg>
  );
}

/** La pièce d'euro : le tarif. */
export function IconeEuro(p: PropsIcone) {
  return (
    <Svg {...p}>
      <circle cx="17.4" cy="17.4" r="10.5" {...aplat} />
      <circle cx="16" cy="16" r="10.5" />
      <path d="M19.6 11.3a5.6 5.6 0 1 0 0 9.4M10 14.4h6.6M10 17.6h6.6" />
    </Svg>
  );
}

/** L'étoile de l'Europe… non : le sceau officiel, pour « source officielle ». */
export function IconeSceau(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M16 3.6 18.4 6l3.3-.6.8 3.2 3.1 1.3-.9 3.2L26.6 16l-1.9 2.8.9 3.2-3.1 1.3-.8 3.2-3.3-.6L16 28.4 13.6 26l-3.3.6-.8-3.2-3.1-1.3.9-3.2L5.4 16l1.9-2.9-.9-3.2 3.1-1.3.8-3.2 3.3.6L16 3.6Z" {...aplat} />
      <path d="M16 3.6 18.4 6l3.3-.6.8 3.2 3.1 1.3-.9 3.2L26.6 16l-1.9 2.8.9 3.2-3.1 1.3-.8 3.2-3.3-.6L16 28.4 13.6 26l-3.3.6-.8-3.2-3.1-1.3.9-3.2L5.4 16l1.9-2.9-.9-3.2 3.1-1.3.8-3.2 3.3.6L16 3.6Z" />
      <circle cx="16" cy="16" r="5" />
    </Svg>
  );
}

/* ========================================================================== */
/*  Icônes d'interface (simples, même trait)                                  */
/* ========================================================================== */

export function IconeFleche(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M6 16h19M18 9l7 7-7 7" strokeWidth="2" />
    </Svg>
  );
}

export function IconeFlecheGauche(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M26 16H7M14 9l-7 7 7 7" strokeWidth="2" />
    </Svg>
  );
}

export function IconeChevron(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="m9 12.5 7 7 7-7" strokeWidth="2" />
    </Svg>
  );
}

export function IconeFermer(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M8.5 8.5l15 15M23.5 8.5l-15 15" strokeWidth="2" />
    </Svg>
  );
}

export function IconeMenu(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M5 9.5h22M5 16h22M5 22.5h14" strokeWidth="2" />
    </Svg>
  );
}

export function IconePlus(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M16 6.5v19M6.5 16h19" strokeWidth="2.2" />
    </Svg>
  );
}

export function IconeTelecharger(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M16 4.5v15M9.5 13.5l6.5 6.5 6.5-6.5" strokeWidth="2" />
      <path d="M5.5 21.5v3a2 2 0 0 0 2 2h17a2 2 0 0 0 2-2v-3" />
    </Svg>
  );
}

export function IconeCopier(p: PropsIcone) {
  return (
    <Svg {...p}>
      <rect x="10.5" y="10.5" width="16" height="16" rx="2.4" />
      <path d="M21.5 10.5V7.5a2 2 0 0 0-2-2h-12a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    </Svg>
  );
}

export function IconeImprimer(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M9.5 11V4.5h13V11" />
      <rect x="4.5" y="11" width="23" height="11" rx="2.2" />
      <rect x="9.5" y="18" width="13" height="9.5" rx="1" />
      <path d="M23 15h.1" strokeWidth="2.4" />
    </Svg>
  );
}

export function IconeEnvoyer(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M27.5 4.5 4.5 14l9.4 3.6 3.6 9.4 10-22.5Z" />
      <path d="m13.9 17.6 6.3-6.3" />
    </Svg>
  );
}

export function IconeRecherche(p: PropsIcone) {
  return (
    <Svg {...p}>
      <circle cx="14" cy="14" r="8.5" />
      <path d="m20.2 20.2 6.3 6.3" strokeWidth="2.2" />
    </Svg>
  );
}

export function IconeSortie(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M13 5.5H8a2 2 0 0 0-2 2v17a2 2 0 0 0 2 2h5" />
      <path d="M19 10.5l5.5 5.5-5.5 5.5M24.5 16H12.5" strokeWidth="2" />
    </Svg>
  );
}

export function IconeAttention(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M14.1 5.4a2.2 2.2 0 0 1 3.8 0l10.4 18a2.2 2.2 0 0 1-1.9 3.3H5.6a2.2 2.2 0 0 1-1.9-3.3l10.4-18Z" />
      <path d="M16 12v6M16 22.2v.1" strokeWidth="2.2" />
    </Svg>
  );
}

export function IconeInfo(p: PropsIcone) {
  return (
    <Svg {...p}>
      <circle cx="16" cy="16" r="11.5" />
      <path d="M16 14.5v8M16 9.8v.1" strokeWidth="2.2" />
    </Svg>
  );
}

export function IconeLien(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M18 5.5h8.5V14M26.5 5.5 15 17" />
      <path d="M23 18.5v6a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h6" />
    </Svg>
  );
}

export function IconeCorbeille(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M5.5 8.5h21M12.5 8.5V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 19.5 6v2.5" />
      <path d="M8 8.5 9.2 25a2 2 0 0 0 2 1.8h9.6a2 2 0 0 0 2-1.8L24 8.5M13.5 13.5v8M18.5 13.5v8" />
    </Svg>
  );
}

export function IconeCrayon(p: PropsIcone) {
  return (
    <Svg {...p}>
      <path d="M20.5 6.5 25.5 11.5 12 25l-6 1 1-6L20.5 6.5Z" />
      <path d="m18 9 5 5" />
    </Svg>
  );
}

export function IconeOk(p: PropsIcone) {
  // Une marque de validation reste nécessaire pour les listes d'état. Elle est
  // dessinée dans le style maison : épaisse, sur une pastille.
  return (
    <Svg {...p}>
      <circle cx="16" cy="16" r="11.5" {...aplat} />
      <path d="m10.5 16.4 3.8 3.8 7.4-8" strokeWidth="2.4" />
    </Svg>
  );
}

/* ========================================================================== */

/**
 * Le catalogue, par nom : permet de choisir une icône depuis des données
 * (une liste de moyens de défense, un module de navigation) sans importer
 * chaque composant à la main.
 */
export const ICONES = {
  ticket: IconeTicket,
  "pare-brise": IconePareBrise,
  horodateur: IconeHorodateur,
  "horodateur-panne": IconeHorodateurPanne,
  "panneau-p": IconePanneauP,
  "panneau-illisible": IconePanneauIllisible,
  scancar: IconeScanCar,
  plaque: IconePlaque,
  recommande: IconeRecommande,
  lettre: IconeLettre,
  delai: IconeDelai,
  chrono: IconeChrono,
  huissier: IconeHuissier,
  "mise-en-demeure": IconeMiseEnDemeure,
  balance: IconeBalance,
  bouclier: IconeBouclier,
  loupe: IconeLoupe,
  "scan-doc": IconeScanDoc,
  euros: IconeEuros,
  doublon: IconeDoublon,
  "carte-riverain": IconeCarteRiverain,
  "carte-pmr": IconeCartePmr,
  "app-mobile": IconeAppMobile,
  "cle-vendue": IconeCleVendue,
  "pv-police": IconePvPolice,
  arret: IconeArret,
  volant: IconeVolant,
  "hotel-de-ville": IconeHotelDeVille,
  belgique: IconeBelgique,
  "boite-lettres": IconeBoiteLettres,
  cerveau: IconeCerveau,
  bouee: IconeBouee,
  preuve: IconePreuve,
  cadenas: IconeCadenas,
  donnees: IconeDonnees,
  tampon: IconeTampon,
  ampoule: IconeAmpoule,
  "main-tendue": IconeMainTendue,
  agenda: IconeAgenda,
  dossiers: IconeDossiers,
  maison: IconeMaison,
  personne: IconePersonne,
  bulle: IconeBulle,
  mail: IconeMail,
  telephone: IconeTelephone,
  euro: IconeEuro,
  sceau: IconeSceau,
} as const;

export type NomIcone = keyof typeof ICONES;

export function Icone({ nom, ...p }: PropsIcone & { nom: NomIcone }) {
  const Composant = ICONES[nom];
  return <Composant {...p} />;
}
