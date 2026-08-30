"use client";

import Link from "next/link";
import { useSession } from "@/components/useSession";
import { useLangue, t } from "@/lib/i18n";

/**
 * CTA principal du haut de page. Connecté : on passe à l'action. Sinon :
 * le site est informatif, on invite à créer un compte pour pouvoir contester.
 */
export function CtaHero() {
  const { connecte, chargement } = useSession();
  const { langue } = useLangue();

  if (chargement) {
    return <span className="h-14 w-64 animate-pulse rounded-md bg-gold-400/60" aria-hidden="true" />;
  }

  const elements = connecte
    ? {
        href: "/tableau-de-bord/nouveau" as const,
        texte: t(langue, "commun.ouvrirContestation"),
      }
    : { href: "/inscription" as const, texte: t(langue, "commun.creerCompte") };

  return (
    <Link
      href={elements.href}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-gold-400 px-7 py-4 text-base font-black text-navy-950 shadow-xl shadow-gold-500/25 transition hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-2xl hover:shadow-gold-400/40"
    >
      {elements.texte}
      <span aria-hidden="true">→</span>
    </Link>
  );
}