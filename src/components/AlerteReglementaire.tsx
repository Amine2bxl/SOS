"use client";

import { useState } from "react";
import { marquerAlerteVue } from "@/lib/dossiers-actions";
import { Btn } from "@/components/ui";

import type { Alerte } from "@/lib/dossiers-format";

const TONS: Record<string, { bordure: string; fond: string; texte: string; etiquette: string }> = {
  urgent: { bordure: "border-danger-600", fond: "bg-danger-100", texte: "text-danger-700", etiquette: "Changement important" },
  important: { bordure: "border-warn-600", fond: "bg-warn-100", texte: "text-warn-700", etiquette: "À savoir" },
  info: { bordure: "border-navy-600", fond: "bg-navy-50", texte: "text-navy-700", etiquette: "Information" },
};

/**
 * Prévient l'utilisateur qu'une règle a changé. Volontairement sobre : un
 * encadré en haut du tableau de bord plutôt qu'une fenêtre modale, pour ne
 * pas bloquer quelqu'un qui vient consulter un délai urgent.
 */
export function AlerteReglementaire({ alerte }: { alerte: Alerte }) {
  const [masquee, setMasquee] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const ton = TONS[alerte.importance] ?? TONS.info;

  if (masquee) return null;

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

  return (
    <div
      role="status"
      className={`mb-6 rounded-xl border-2 ${ton.bordure} ${ton.fond} p-5`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full bg-white px-3 py-1 text-xs font-bold ${ton.texte}`}>
          {ton.etiquette}
        </span>
        <span className="text-xs text-ink-soft">
          {new Date(alerte.publie_le).toLocaleDateString("fr-BE")}
        </span>
      </div>

      <h2 className={`mt-3 font-display text-lg font-bold ${ton.texte}`}>{alerte.titre}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">{alerte.resume}</p>

      <Btn onClick={accuser} variant="secondary" className="mt-4" disabled={enCours}>
        J&apos;ai compris
      </Btn>
    </div>
  );
}
