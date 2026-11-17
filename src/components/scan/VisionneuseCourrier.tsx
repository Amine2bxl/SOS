"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modale } from "@/components/Modale";
import { IconeFermer, IconeFleche, IconeFlecheGauche } from "@/components/icones";
import type { ChampPreuve, DocumentSurligne } from "@/lib/ocr";

export type ChampVisible = { cle: ChampPreuve; label: string; valeur: string };

/**
 * Le courrier entier, avec au fluo chaque information que nous en avons tirée,
 * et un cercle rouge autour de celle qu'on regarde.
 *
 * On ne compare pas une case à un petit extrait : on voit la page telle
 * qu'elle est, et où chaque valeur a été prise. Les pastilles du haut (ou les
 * flèches du clavier) passent d'une information à l'autre.
 */
export function VisionneuseCourrier({
  document: doc,
  champs,
  actif,
  surChoix,
  onFermer,
}: {
  document: DocumentSurligne;
  champs: ChampVisible[];
  actif: ChampPreuve | null;
  surChoix: (cle: ChampPreuve) => void;
  onFermer: () => void;
}) {
  const ouverte = actif !== null;
  const situes = champs.filter((c) => doc.zones[c.cle]);
  const rang = situes.findIndex((c) => c.cle === actif);
  const courant = champs.find((c) => c.cle === actif) ?? null;
  const zone = actif ? doc.zones[actif] : undefined;
  const cible = useRef<HTMLSpanElement>(null);
  const pastilles = useRef<HTMLUListElement>(null);
  // Sur téléphone, la page entière est trop petite pour lire : on s'approche
  // de l'information entourée, et un bouton rend la vue d'ensemble.
  const [rapproche, setRapproche] = useState(true);

  const deplacer = useCallback(
    (pas: number) => {
      if (!situes.length) return;
      const suivant = situes[(Math.max(rang, 0) + pas + situes.length) % situes.length];
      surChoix(suivant.cle);
    },
    [rang, situes, surChoix],
  );

  // L'information regardée vient au centre de la page affichée.
  useEffect(() => {
    if (!ouverte) return;
    const t = setTimeout(() => {
      cible.current?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      // La pastille choisie reste visible dans la rangée qui défile.
      pastilles.current?.querySelector(`[data-cle="${actif}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, [actif, ouverte, rapproche]);

  useEffect(() => {
    if (!ouverte) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") deplacer(1);
      if (e.key === "ArrowLeft") deplacer(-1);
    };
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  }, [ouverte, deplacer]);

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  // Le cercle déborde un peu de l'information, comme un trait de marqueur.
  const marge = zone ? Math.max(12, (zone.y1 - zone.y0) * 0.6) : 0;

  return (
    <Modale ouverte={ouverte} onFermer={onFermer} titre="Votre courrier, surligné" largeur="max-w-3xl">
      <div className="-m-2 sm:-m-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-navy-900">Votre courrier, surligné</h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              En jaune, tout ce que nous avons lu. En rouge, l&apos;information choisie.
            </p>
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-2 text-navy-700 transition hover:bg-navy-50 hover:text-navy-900 active:scale-[0.97]"
          >
            <IconeFermer className="h-5 w-5" />
          </button>
        </div>

        <ul ref={pastilles} className="mt-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Informations lues">
          {champs.map((c) => {
            const situe = !!doc.zones[c.cle];
            const choisi = c.cle === actif;
            return (
              <li key={c.cle} className="shrink-0">
                <button
                  type="button"
                  disabled={!situe}
                  aria-pressed={choisi}
                  data-cle={c.cle}
                  onClick={() => surChoix(c.cle)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-[0.97] ${
                    choisi
                      ? "border-danger-600 bg-danger-600 text-white"
                      : situe
                        ? "border-gold-300 bg-gold-100 text-navy-900 hover:border-gold-400"
                        : "border-line bg-paper text-ink-faint"
                  }`}
                  title={situe ? undefined : "Pas repéré sur la photo"}
                >
                  {c.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="relative mt-3 max-h-[min(62vh,40rem)] overflow-auto rounded-2xl border border-line bg-paper">
          <div className={`relative ${rapproche ? "w-[210%] sm:w-full" : "w-full"}`}>
            {/* Image générée dans le navigateur (data URL) : next/image n'a rien à optimiser. */}
            <img src={doc.image} alt="Votre courrier" className="block h-auto w-full select-none" draggable={false} />
            <svg
              viewBox={`0 0 ${doc.largeur} ${doc.hauteur}`}
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {champs.map((c) => {
                const z = doc.zones[c.cle];
                if (!z) return null;
                const h = z.y1 - z.y0;
                return (
                  <rect
                    key={c.cle}
                    x={z.x0 - h * 0.15}
                    y={z.y0 - h * 0.12}
                    width={z.x1 - z.x0 + h * 0.3}
                    height={h * 1.24}
                    rx={h * 0.2}
                    className="fluo-pose"
                    style={{ fill: c.cle === actif ? "rgba(255, 216, 102, 0.62)" : "rgba(255, 230, 0, 0.42)", mixBlendMode: "multiply" }}
                  />
                );
              })}
              {zone && (
                <ellipse
                  key={actif}
                  cx={(zone.x0 + zone.x1) / 2}
                  cy={(zone.y0 + zone.y1) / 2}
                  rx={(zone.x1 - zone.x0) / 2 + marge}
                  ry={(zone.y1 - zone.y0) / 2 + marge * 0.75}
                  pathLength={1}
                  fill="none"
                  stroke="var(--color-danger-600)"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  transform={`rotate(-2 ${(zone.x0 + zone.x1) / 2} ${(zone.y0 + zone.y1) / 2})`}
                  className="cercle-trace"
                />
              )}
            </svg>
            {zone && (
              <span
                ref={cible}
                aria-hidden="true"
                className="pointer-events-none absolute"
                style={{
                  left: pct(zone.x0, doc.largeur),
                  top: pct(zone.y0, doc.hauteur),
                  width: pct(zone.x1 - zone.x0, doc.largeur),
                  height: pct(zone.y1 - zone.y0, doc.hauteur),
                }}
              />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRapproche((r) => !r)}
          className="mt-2 w-full rounded-full bg-paper py-2 text-xs font-bold text-navy-900 transition active:scale-[0.98] sm:hidden"
        >
          {rapproche ? "Voir la page entière" : "Zoomer sur l'information"}
        </button>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => deplacer(-1)}
            aria-label="Information précédente"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-navy-900 transition hover:bg-navy-50 active:scale-[0.97]"
          >
            <IconeFlecheGauche className="h-4 w-4" />
          </button>
          <p className="min-w-0 flex-1 text-center" aria-live="polite">
            {courant ? (
              <>
                <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {courant.label}
                  {rang >= 0 && (
                    <span className="font-normal normal-case tracking-normal text-ink-faint">
                      {" "}
                      · {rang + 1}/{situes.length}
                    </span>
                  )}
                </span>
                <span className="block truncate font-display text-base font-bold text-navy-900">{courant.valeur}</span>
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => deplacer(1)}
            aria-label="Information suivante"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-navy-900 transition hover:bg-navy-50 active:scale-[0.97]"
          >
            <IconeFleche className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Modale>
  );
}
