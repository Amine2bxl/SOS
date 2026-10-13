import { CARTE_BRUXELLES } from "@/lib/carte-bruxelles";

const { largeur: L, hauteur: H, communes: FORMES } = CARTE_BRUXELLES;

/** Une marge autour du dessin, pour que le liseré et l'ombre ne soient pas rognés. */
const MARGE = 12;
export const VUE_CARTE = `${-MARGE} ${-MARGE} ${L + 2 * MARGE} ${H + 2 * MARGE}`;
export const PROPORTIONS_CARTE = `${L} / ${H}`;
export const SLUGS_CARTE = Object.keys(FORMES);

const VIDE = new Set<string>();

/**
 * Les noms des communes, posés en HTML par-dessus le dessin.
 *
 * Un texte dans le SVG rétrécirait avec lui : sur un téléphone, où la carte ne
 * fait que 340 pixels de large, les petites communes deviendraient illisibles.
 * Ici la taille suit la largeur de la carte, sans descendre sous 10 pixels.
 * Sans état ni effet : sert à la carte interactive comme à la carte statique.
 */
export function EtiquettesCarte({
  selection,
  modifiees = VIDE,
  aLInstant = VIDE,
  fermees = VIDE,
}: {
  selection?: string;
  modifiees?: Set<string>;
  aLInstant?: Set<string>;
  fermees?: Set<string>;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {SLUGS_CARTE.map((slug) => {
        const f = FORMES[slug];
        const choisie = slug === selection;
        return (
          <span
            key={slug}
            className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-semibold leading-none ${
              choisie
                ? "text-white [text-shadow:0_0_3px_#0f1e3d,0_0_3px_#0f1e3d]"
                : fermees.has(slug)
                  ? "text-ink-faint [text-shadow:0_0_3px_#fff,0_0_3px_#fff]"
                  : "text-navy-900 [text-shadow:0_0_3px_#fff,0_0_3px_#fff]"
            }`}
            style={{
              left: `${((f.x + MARGE) / (L + 2 * MARGE)) * 100}%`,
              top: `${((f.y + MARGE) / (H + 2 * MARGE)) * 100}%`,
              fontSize: `clamp(10px, ${(f.taille * 0.1).toFixed(2)}cqw, 15px)`,
            }}
          >
            {f.etiquette}
            {(modifiees.has(slug) || aLInstant.has(slug)) && (
              <span className="absolute -right-3 -top-2 flex h-2.5 w-2.5">
                {aLInstant.has(slug) && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400 motion-safe:animate-ping" />
                )}
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-500 ring-2 ring-white" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
