"use client";

import { useState } from "react";
import Link from "next/link";
import { marquerAlerteVue } from "@/lib/dossiers-actions";
import { Btn } from "@/components/ui";
import { Modale } from "@/components/Modale";

import type { Alerte } from "@/lib/dossiers-format";

const TONS: Record<
  string,
  { bordure: string; fond: string; texte: string; etiquette: string; pastille: string }
> = {
  urgent: {
    bordure: "border-danger-600",
    fond: "bg-danger-100",
    texte: "text-danger-700",
    etiquette: "La règle a changé",
    pastille: "bg-danger-600",
  },
  important: {
    bordure: "border-warn-600",
    fond: "bg-warn-100",
    texte: "text-warn-700",
    etiquette: "À savoir",
    pastille: "bg-warn-600",
  },
  info: {
    bordure: "border-navy-600",
    fond: "bg-navy-50",
    texte: "text-navy-700",
    etiquette: "Information",
    pastille: "bg-navy-600",
  },
};

/**
 * Prévient l'utilisateur qu'une règle a changé.
 *
 * Deux formes, selon la gravité — parce qu'interrompre quelqu'un qui vient
 * consulter un délai urgent a un coût :
 *
 * - `urgent` : une **fenêtre modale**. Un changement de voie de recours ou de
 *   délai peut invalider une démarche déjà engagée ; le laisser passer
 *   inaperçu au milieu d'un tableau de bord serait une faute.
 * - `important` et `info` : un encadré en haut de page, qui informe sans
 *   bloquer.
 *
 * Dans les deux cas l'accusé de réception est enregistré, et l'alerte ne
 * reparaît plus.
 */
export function AlerteReglementaire({ alerte }: { alerte: Alerte }) {
  const [masquee, setMasquee] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const ton = TONS[alerte.importance] ?? TONS.info;

  const accuser = async () => {
    setEnCours(true);
    setMasquee(true); // Retour immédiat : l'appel réseau se termine en arrière-plan.
    try {
      await marquerAlerteVue(alerte.id);
    } catch {
      setMasquee(false);
      setEnCours(false);
    }
  };

  const dateLisible = new Date(alerte.publie_le).toLocaleDateString("fr-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (masquee) return null;

  /* ------------------------------------------------- changement urgent */
  if (alerte.importance === "urgent") {
    return (
      <Modale
        ouverte
        onFermer={accuser}
        titre={alerte.titre}
        variante="alerte"
        largeur="max-w-lg"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-100">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-danger-600" fill="currentColor" aria-hidden="true">
              <path d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-danger-700">
              {ton.etiquette}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold leading-tight text-navy-900">
              {alerte.titre}
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              {alerte.commune_slug ? `Concerne votre commune · ` : "Toute la Région bruxelloise · "}
              publié le {dateLisible}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink">{alerte.resume}</p>

        <div className="mt-5 rounded-lg border-l-4 border-gold-400 bg-gold-100/60 p-4">
          <p className="text-sm font-bold text-navy-900">Ce que cela change pour vous</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            Si une contestation est en cours, vérifiez qu&apos;elle respecte encore cette règle.
            Une démarche engagée sous l&apos;ancienne version peut devoir être refaite — et le
            délai, lui, continue de courir.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Btn onClick={accuser} variant="gold" className="flex-1" disabled={enCours}>
            J&apos;ai compris
          </Btn>
          <Link
            href="/tableau-de-bord/regles"
            onClick={accuser}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 transition hover:bg-navy-50"
          >
            Voir les règles de ma commune
          </Link>
        </div>

        {alerte.source_url && (
          <p className="mt-4 text-center text-xs text-ink-soft">
            <a
              href={alerte.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-navy-700 underline"
            >
              Lire la source officielle ↗
            </a>
          </p>
        )}
      </Modale>
    );
  }

  /* --------------------------------------- information non bloquante */
  return (
    <div role="status" className={`mb-6 rounded-xl border-2 ${ton.bordure} ${ton.fond} p-5`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full bg-white px-3 py-1 text-xs font-bold ${ton.texte}`}>
          {ton.etiquette}
        </span>
        <span className="text-xs text-ink-soft">{dateLisible}</span>
      </div>

      <h2 className={`mt-3 font-display text-lg font-bold ${ton.texte}`}>{alerte.titre}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">{alerte.resume}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Btn onClick={accuser} variant="secondary" disabled={enCours}>
          J&apos;ai compris
        </Btn>
        {alerte.source_url && (
          <a
            href={alerte.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-navy-700 underline"
          >
            Source officielle ↗
          </a>
        )}
      </div>
    </div>
  );
}
