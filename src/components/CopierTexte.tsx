"use client";

import { useState } from "react";

/**
 * Bouton de copie, avec confirmation visible.
 *
 * Il sert là où une valeur doit être recopiée sans la moindre erreur : un IBAN,
 * une communication structurée. Le retour « Copié » compte autant que la copie
 * elle-même — sans lui, on ne sait pas si le clic a fonctionné, et on recopie à
 * la main par précaution.
 *
 * `navigator.clipboard` n'existe pas partout (contexte non sécurisé, vieux
 * navigateur). Dans ce cas on ne montre pas d'erreur : le texte reste
 * sélectionnable à côté, ce qui est le vrai filet de sécurité.
 */
export function CopierTexte({ valeur, libelle }: { valeur: string; libelle: string }) {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(valeur);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible : la valeur affichée reste sélectionnable.
    }
  };

  return (
    <button
      type="button"
      onClick={copier}
      aria-label={libelle}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-900 transition hover:bg-navy-50"
    >
      {copie ? (
        <>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ok-600" fill="currentColor" aria-hidden="true">
            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" />
          </svg>
          Copié
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
            <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z" />
          </svg>
          Copier
        </>
      )}
    </button>
  );
}
