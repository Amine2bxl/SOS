"use client";

import { useState } from "react";
import type { ArticlePresse } from "@/lib/presse";

/**
 * La photo d'un article de presse, chargée chez le journal.
 *
 * Elle n'est pas copiée sur nos serveurs : c'est l'image que le journal publie
 * pour l'aperçu de son article. Si elle ne charge plus (le journal l'a
 * déplacée), on garde un cadre propre avec le nom du journal, jamais une image
 * cassée. Le crédit reste visible.
 */
export function PhotoArticle({ article, className = "" }: { article: ArticlePresse; className?: string }) {
  const [echec, setEchec] = useState(false);
  return (
    <figure className={`relative overflow-hidden bg-navy-800 ${className}`}>
      {!echec ? (
        <img
          src={article.image}
          alt={`Photo de l'article « ${article.titre} »`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setEchec(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-navy-100">
          {article.journal}
        </span>
      )}
      <figcaption className="absolute bottom-2 right-2 rounded-full bg-navy-950/75 px-2 py-0.5 text-[10px] font-medium text-white">
        {article.credit}
      </figcaption>
    </figure>
  );
}
