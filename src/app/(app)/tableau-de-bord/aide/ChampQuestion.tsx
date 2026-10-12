"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { IconeRecherche } from "@/components/icones";

const EXEMPLES = [
  "Combien de temps pour contester ?",
  "J'ai payé par application",
  "L'horodateur était en panne",
  "J'ai reçu une mise en demeure",
  "Obtenir les photos du contrôle",
];

/** La question, dans l'adresse de la page : on peut revenir en arrière, la partager. */
export function ChampQuestion({ initiale }: { initiale: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState(initiale);
  const [enCours, demarrer] = useTransition();

  const poser = (q: string) => {
    const texte = q.trim();
    if (!texte) return;
    setQuestion(texte);
    demarrer(() => router.push(`/tableau-de-bord/aide?q=${encodeURIComponent(texte)}`));
  };

  return (
    <div className="mt-6">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          poser(question);
        }}
        className="flex items-center gap-2 rounded-full border border-line bg-card p-1.5 pl-5 shadow-carte focus-within:border-navy-600 focus-within:ring-4 focus-within:ring-gold-300/40"
      >
        <IconeRecherche className="h-5 w-5 shrink-0 text-ink-soft" />
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex. je n'ai jamais reçu le premier courrier"
          aria-label="Votre question"
          maxLength={300}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-ink-faint"
        />
        <button
          type="submit"
          disabled={enCours}
          className="h-11 shrink-0 rounded-full bg-gold-400 px-5 text-sm font-bold text-navy-950 shadow-bouton transition hover:bg-gold-300 disabled:opacity-60"
        >
          {enCours ? "…" : "Demander"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXEMPLES.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => poser(e)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy-800 transition hover:border-navy-200 hover:bg-navy-50"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
