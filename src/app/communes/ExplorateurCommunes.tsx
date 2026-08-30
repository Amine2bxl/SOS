"use client";

import { useState } from "react";
import { COMMUNES } from "@/lib/data";

/** Sections d'une fiche commune, présentées sous forme de repères clairs. */
function Repaire({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="rounded-lg border border-line-soft bg-white p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-navy-700">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{valeur}</p>
    </div>
  );
}

/** Explorateur : choisir une commune dans la liste, lire sa fiche à droite. */
export function ExplorateurCommunes() {
  const [slug, setSlug] = useState(COMMUNES[0].slug);
  const commune = COMMUNES.find((c) => c.slug === slug) ?? COMMUNES[0];

  // Page « réglementations par commune » : seule page précise pour les communes
  // sans page dédiée sur parking.brussels.
  const estPageGenerale = commune.parking.includes("reglementations/par-commune");

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
      {/* Liste des communes */}
      <div
        role="tablist"
        aria-label="Choisir une commune"
        className="flex gap-1.5 overflow-x-auto pb-1 lg:max-h-[560px] lg:flex-col lg:overflow-y-auto lg:pb-0"
      >
        {COMMUNES.map((c) => {
          const actif = c.slug === commune.slug;
          return (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={actif}
              onClick={() => setSlug(c.slug)}
              className={`shrink-0 rounded-lg border px-3.5 py-2 text-left text-sm font-semibold transition lg:w-full ${
                actif
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-line bg-card text-navy-700 hover:border-navy-600/40 hover:bg-navy-50"
              }`}
            >
              {c.nom}
            </button>
          );
        })}
      </div>

      {/* Fiche détaillée */}
      <section
        key={commune.slug}
        className="animate-rise rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold text-navy-900">{commune.nom}</h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Repaire label="Zones" valeur={commune.zones} />
          <Repaire label="Horaires de paiement" valeur={commune.heures} />
          <Repaire label="Périodes libres" valeur={commune.gratuit} />
          <Repaire label="Moyens de paiement" valeur={commune.moyens} />
          <div className="sm:col-span-2">
            <Repaire label="Riverains" valeur={commune.riverain} />
          </div>
        </div>

        <p className="mt-4 rounded-md bg-gold-100/70 p-3 text-sm leading-relaxed text-ink">
          <span className="font-bold text-navy-900">À retenir :</span> {commune.aSavoir}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={commune.parking}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
          >
            {estPageGenerale
              ? `Règlement communal de ${commune.nom} — parking.brussels`
              : `Tarifs et zones de ${commune.nom} — parking.brussels`}{" "}
            ↗
          </a>
          <a
            href={commune.siteOfficiel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-navy-900 transition hover:border-navy-600/50 hover:bg-navy-50"
          >
            Site officiel de la commune ↗
          </a>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          Les horaires, tarifs et plages de gratuité exacts figurent dans le règlement communal en
          vigueur à la date de votre constat : vérifiez toujours la version officielle avant de
          contester.
        </p>
      </section>
    </div>
  );
}