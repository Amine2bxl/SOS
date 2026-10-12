"use client";

import { useState } from "react";
import { IconeCopier, IconeOk } from "@/components/icones";

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
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition ${
        copie ? "border-ok-600/30 bg-ok-50 text-ok-700" : "border-line bg-white text-navy-900 hover:bg-navy-50"
      }`}
    >
      {copie ? <IconeOk className="h-3.5 w-3.5" /> : <IconeCopier className="h-3.5 w-3.5" />}
      {copie ? "Copié" : "Copier"}
    </button>
  );
}
