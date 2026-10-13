import { CARTE_BRUXELLES } from "@/lib/carte-bruxelles";

/**
 * Le temps de lire les règles en base : la silhouette de la Région et de la
 * fiche, à leur place, pour que rien ne saute quand le contenu arrive.
 */
export default function Chargement() {
  return (
    <div role="status" aria-label="Chargement de la carte des communes" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto h-3 w-32 rounded bg-gold-100" />
        <div className="mx-auto mt-4 h-10 w-80 max-w-full rounded-xl bg-navy-100" />
        <div className="mx-auto mt-4 h-4 w-96 max-w-full rounded-lg bg-navy-50" />
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:items-start">
        <div className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-4 shadow-carte sm:p-5">
          <svg
            viewBox={`-12 -12 ${CARTE_BRUXELLES.largeur + 24} ${CARTE_BRUXELLES.hauteur + 24}`}
            className="mt-10 w-full animate-pulse-doux"
            aria-hidden="true"
          >
            <path d={CARTE_BRUXELLES.contour} className="fill-navy-50 stroke-navy-100" strokeWidth={4} />
          </svg>
        </div>
        <div className="animate-pulse-doux rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
          <div className="h-3 w-16 rounded bg-gold-100" />
          <div className="mt-3 h-7 w-40 rounded-lg bg-navy-100" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-paper" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
