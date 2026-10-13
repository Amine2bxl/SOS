import { CARTE_BRUXELLES } from "@/lib/carte-bruxelles";
import { COMMUNES } from "@/lib/data";
import { EtiquettesCarte, PROPORTIONS_CARTE, SLUGS_CARTE, VUE_CARTE } from "@/components/EtiquettesCarte";

const { contour, communes: FORMES } = CARTE_BRUXELLES;
const NOMS = Object.fromEntries(COMMUNES.map((c) => [c.slug, c.nom]));

/**
 * La carte des 19 communes, en simple dessin : chaque commune mène à sa fiche.
 *
 * Pour la page d'accueil. Aucun JavaScript, aucune lecture de base : elle
 * s'affiche aussi vite que le reste de la page, et la carte vivante attend sur
 * la page « Communes ».
 */
export function CarteBruxellesLiens() {
  return (
    <div className="relative w-full select-none [container-type:inline-size]" style={{ aspectRatio: PROPORTIONS_CARTE }}>
      <svg
        viewBox={VUE_CARTE}
        className="absolute inset-0 h-full w-full overflow-visible"
        role="group"
        aria-label="Carte des 19 communes de la Région de Bruxelles-Capitale"
      >
        <path d={contour} transform="translate(5 9)" className="fill-navy-200/60" aria-hidden="true" />
        {SLUGS_CARTE.map((slug) => (
          <a key={slug} href={`/communes?commune=${slug}`} aria-label={`${NOMS[slug]} : voir sa fiche`} className="carte-commune group">
            <path
              d={FORMES[slug].d}
              className="fill-navy-100 stroke-white transition-[fill] duration-150 group-hover:fill-gold-300 group-focus-visible:fill-gold-300"
              strokeWidth={3}
              strokeLinejoin="round"
            />
          </a>
        ))}
        <path d={contour} className="pointer-events-none fill-none stroke-navy-900" strokeWidth={3} strokeLinejoin="round" />
      </svg>
      <EtiquettesCarte />
    </div>
  );
}
