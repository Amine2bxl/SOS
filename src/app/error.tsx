"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ASSO } from "@/lib/data";

/**
 * Filet de sécurité : ce qui s'affiche si une page échoue à se rendre.
 *
 * Sans ce fichier, Next montre un écran d'erreur générique — noir sur blanc,
 * sans issue. Quelqu'un dont le délai de contestation court ne doit jamais se
 * retrouver devant une impasse : on lui laisse un moyen de réessayer et un
 * moyen de nous joindre.
 */
export default function Erreur({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Le `digest` est la seule trace exploitable côté serveur : on le garde
    // visible dans la console pour pouvoir relier un signalement à un journal.
    console.error("Erreur de rendu :", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <p className="font-display text-5xl font-black text-gold-400">Oups</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-navy-900">
        Cette page n&apos;a pas pu s&apos;afficher
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        L&apos;incident vient de chez nous, pas de vous. Vos dossiers et vos documents ne sont pas
        affectés.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-gold-400 px-5 py-3 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
        >
          Réessayer
        </button>
        <Link
          href="/tableau-de-bord"
          className="inline-flex items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-navy-900 transition hover:bg-navy-50"
        >
          Retour à mon espace
        </Link>
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        Si cela se reproduit, écrivez-nous à{" "}
        <a href={`mailto:${ASSO.email}`} className="font-semibold text-navy-700 underline">
          {ASSO.email}
        </a>
        {error.digest && (
          <>
            {" "}
            en mentionnant la référence <code className="font-mono text-xs">{error.digest}</code>
          </>
        )}
        .
      </p>
    </div>
  );
}
