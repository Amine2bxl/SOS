/**
 * Le logo SOS Citizens.
 *
 * Le symbole dit le métier en un coup d'œil : un BOUCLIER (on vous protège),
 * qui porte le P du panneau de stationnement, dont la panse est une BOUÉE de
 * sauvetage (SOS). Trois idées, une seule forme — et lisible jusqu'à 16 px,
 * parce qu'il sert aussi d'icône d'onglet et d'application.
 */

export function MarqueSos({
  className = "h-9 w-9",
  simplifie = false,
}: {
  className?: string;
  /** Version pleine, sans les bandes de la bouée : pour les toutes petites tailles. */
  simplifie?: boolean;
}) {
  // Circonférence de la bouée (rayon 7) découpée en huit segments égaux :
  // quatre jaunes, quatre blancs, comme une vraie bouée.
  const segment = (2 * Math.PI * 7) / 8;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 2.5 42 8.6v14c0 11.7-7.6 19.9-18 23.4C13.6 42.5 6 34.3 6 22.6v-14L24 2.5Z"
        fill="#0f1e3d"
      />
      {/* Bouée : anneau blanc, bandes jaunes par-dessus. */}
      <circle cx="26.6" cy="20" r="7" fill="none" stroke="#ffffff" strokeWidth="5.4" />
      {simplifie ? (
        <circle cx="26.6" cy="20" r="7" fill="none" stroke="#ffc629" strokeWidth="5.4" />
      ) : (
        <circle
          cx="26.6"
          cy="20"
          r="7"
          fill="none"
          stroke="#ffc629"
          strokeWidth="5.4"
          strokeDasharray={`${segment} ${segment}`}
          strokeDashoffset={segment / 2}
        />
      )}
      {/* Le fût du P, dessiné après : il passe devant la bouée. */}
      <rect x="14.8" y="12.2" width="6.2" height="24.6" rx="2.4" fill="#ffffff" />
      {/* Le marquage au sol, en pied de bouclier. */}
      <path d="M17 41.2h14" stroke="#ffc629" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3.4 3.2" />
    </svg>
  );
}

export function Logo({
  compact = false,
  surClair = false,
  className = "",
}: {
  compact?: boolean;
  /** Variante pour les fonds clairs. Par défaut, le logo est posé sur l'encre. */
  surClair?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <MarqueSos className="h-9 w-9 shrink-0" />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[1.15rem] font-extrabold tracking-tight">
            <span
              className={
                surClair
                  ? "rounded-md bg-gold-400 px-1 py-px text-navy-950"
                  : "text-gold-400"
              }
            >
              SOS
            </span>{" "}
            <span className={surClair ? "text-navy-900" : "text-white"}>Citizens</span>
          </span>
          <span
            className={`mt-1 block text-[9.5px] font-bold uppercase tracking-[0.26em] ${
              surClair ? "text-ink-soft" : "text-navy-200/80"
            }`}
          >
            ASBL · Belgique
          </span>
        </span>
      )}
    </span>
  );
}

// Compatibilité pendant la refonte : les anciennes pages importent ces noms.
export { IconeMail as MailIcon, IconeTelephone as PhoneIcon } from "./icones";
