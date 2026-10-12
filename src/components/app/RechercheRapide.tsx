"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconeRecherche } from "@/components/icones";

const SUGGESTIONS = [
  "Combien de temps pour contester ?",
  "J'avais payé par application",
  "Je n'ai jamais reçu le premier courrier",
  "Un huissier m'écrit",
];

/**
 * La question posée depuis l'accueil, envoyée vers l'Aide où les réponses
 * s'affichent. Les suggestions servent d'exemples : on voit tout de suite
 * qu'on peut écrire comme on parle.
 */
export function RechercheRapide() {
  const router = useRouter();
  const [question, setQuestion] = useState("");

  const poser = (q: string) => {
    const texte = q.trim();
    if (!texte) return;
    router.push(`/tableau-de-bord/aide?q=${encodeURIComponent(texte)}`);
  };

  return (
    <div className="mt-4">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          poser(question);
        }}
        className="flex items-center gap-2 rounded-full border border-line bg-paper p-1.5 pl-4 focus-within:border-navy-600 focus-within:ring-4 focus-within:ring-gold-300/40"
      >
        <IconeRecherche className="h-5 w-5 shrink-0 text-ink-soft" />
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Écrivez comme vous parlez…"
          aria-label="Votre question"
          maxLength={300}
          className="min-w-0 flex-1 bg-transparent py-2 text-[0.95rem] outline-none placeholder:text-ink-faint"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-full bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-800"
        >
          Demander
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => poser(s)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy-800 transition hover:border-navy-200 hover:bg-navy-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
