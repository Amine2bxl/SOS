"use client";

import { useState } from "react";
import { COMMUNES } from "@/lib/data";
import { IconeLien } from "@/components/icones";

/** Sections d'une fiche commune, présentées sous forme de repères clairs. */
function Repaire({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-paper p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{valeur}</p>
    </div>
  );
}

/**
 * Explorateur : choisir une commune dans la liste, lire sa fiche à droite.
 * Partagé par la page publique et par le module « Règles de ma commune », qui
 * l'ouvre directement sur la commune du dossier en cours.
 */
export function ExplorateurCommunes({ slugInitial }: { slugInitial?: string }) {
  const [slug, setSlug] = useState(slugInitial ?? COMMUNES[0].slug);
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
              className={`shrink-0 rounded-full border px-4 py-2 text-left text-sm font-semibold transition lg:w-full lg:rounded-2xl ${
                actif
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-line bg-card text-navy-800 hover:border-navy-200 hover:bg-navy-50"
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
        className="animate-rise rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-extrabold text-navy-900">{commune.nom}</h2>
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

        <p className="mt-4 rounded-2xl border-l-4 border-gold-400 bg-gold-50 p-3.5 text-sm leading-relaxed text-ink">
          <span className="font-bold text-navy-900">À retenir :</span> {commune.aSavoir}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={commune.parking}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
          >
            {estPageGenerale
              ? `Règlement communal de ${commune.nom} — parking.brussels`
              : `Tarifs et zones de ${commune.nom} — parking.brussels`}
            <IconeLien className="h-3.5 w-3.5" />
          </a>
          <a
            href={commune.siteOfficiel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-navy-900 transition hover:border-navy-200 hover:bg-navy-50"
          >
            Site officiel de la commune
            <IconeLien className="h-3.5 w-3.5" />
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