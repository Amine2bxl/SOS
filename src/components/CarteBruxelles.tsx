"use client";

import { useState, type MouseEvent } from "react";
import { CARTE_BRUXELLES } from "@/lib/carte-bruxelles";
import { EtiquettesCarte, PROPORTIONS_CARTE, SLUGS_CARTE, VUE_CARTE } from "@/components/EtiquettesCarte";

const { contour, communes: FORMES } = CARTE_BRUXELLES;

/**
 * La carte des 19 communes : on touche sa commune, la fiche s'ouvre.
 *
 * Chaque commune est un vrai lien (`/communes?commune=…`) : il se suit au
 * clavier, se lit par un lecteur d'écran, s'ouvre dans un nouvel onglet — et
 * sans JavaScript, il mène quand même à la bonne fiche.
 *
 * Couleurs : l'encre pour la commune choisie, le jaune signal pour celles dont
 * une règle a changé récemment. Une commune modifiée à l'instant (la base vient
 * de bouger) pulse quelques secondes.
 */
export function CarteBruxelles({
  selection,
  onChoisir,
  noms,
  modifiees,
  aLInstant,
  fermees,
}: {
  selection: string;
  onChoisir: (slug: string) => void;
  /** Noms complets, pour les lecteurs d'écran et la légende. */
  noms: Record<string, string>;
  /** Communes concernées par un changement récent. */
  modifiees: Set<string>;
  /** Communes dont la fiche vient de changer, pendant que la page était ouverte. */
  aLInstant: Set<string>;
  /** Communes pas encore ouvertes au public. */
  fermees: Set<string>;
}) {
  const [survol, setSurvol] = useState<string | null>(null);
  const enAvant = survol ?? selection;

  const choisir = (e: MouseEvent<Element>, slug: string) => {
    // Ctrl-clic, clic du milieu… : le lien fait ce qu'on attend d'un lien.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onChoisir(slug);
  };

  const remplissage = (slug: string) => {
    if (slug === selection) return "fill-navy-900";
    if (fermees.has(slug)) return "fill-line-soft";
    if (modifiees.has(slug)) return slug === survol ? "fill-gold-300" : "fill-gold-100";
    return slug === survol ? "fill-navy-200" : "fill-navy-100";
  };

  return (
    <div>
      <div
        className="relative w-full select-none [container-type:inline-size]"
        style={{ aspectRatio: PROPORTIONS_CARTE }}
        onPointerLeave={() => setSurvol(null)}
      >
        <svg
          viewBox={VUE_CARTE}
          className="absolute inset-0 h-full w-full overflow-visible"
          role="group"
          aria-label="Carte des 19 communes de la Région de Bruxelles-Capitale"
        >
          {/* Une ombre portée, sans filtre : un simple décalage du contour. */}
          <path d={contour} transform="translate(5 9)" className="fill-navy-200/60" aria-hidden="true" />

          {SLUGS_CARTE.map((slug) => (
            <a
              key={slug}
              href={`/communes?commune=${slug}`}
              aria-label={`${noms[slug] ?? FORMES[slug].etiquette}${modifiees.has(slug) ? " — règle modifiée récemment" : ""}`}
              aria-current={slug === selection ? "true" : undefined}
              onClick={(e) => choisir(e, slug)}
              onPointerEnter={() => setSurvol(slug)}
              onFocus={() => setSurvol(slug)}
              onBlur={() => setSurvol(null)}
              className="carte-commune cursor-pointer"
            >
              <path
                d={FORMES[slug].d}
                className={`${remplissage(slug)} stroke-white transition-[fill] duration-150`}
                strokeWidth={3}
                strokeLinejoin="round"
              />
            </a>
          ))}

          {/* Le liseré de la Région, puis la commune mise en avant, redessinée
              au-dessus de ses voisines pour que son contour ne soit pas rogné. */}
          <path d={contour} className="pointer-events-none fill-none stroke-navy-900" strokeWidth={3} strokeLinejoin="round" />
          {enAvant && FORMES[enAvant] && (
            <path
              d={FORMES[enAvant].d}
              className={`pointer-events-none fill-none ${enAvant === selection ? "stroke-gold-400" : "stroke-navy-900"}`}
              strokeWidth={enAvant === selection ? 7 : 4}
              strokeLinejoin="round"
            />
          )}
        </svg>

        <EtiquettesCarte selection={selection} modifiees={modifiees} aLInstant={aLInstant} fermees={fermees} />
      </div>

      {/* Ce que l'on survole, ou ce qui est choisi : un nom complet, lisible. */}
      <p className="mt-3 min-h-5 text-center text-sm text-ink-soft" aria-hidden="true">
        {survol && survol !== selection ? (
          <>
            <span className="font-semibold text-navy-900">{noms[survol]}</span> — ouvrir sa fiche
          </>
        ) : (
          <>
            Fiche ouverte : <span className="font-semibold text-navy-900">{noms[selection]}</span>
          </>
        )}
      </p>
    </div>
  );
}
