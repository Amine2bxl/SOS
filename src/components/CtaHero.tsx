"use client";

import Link from "next/link";
import { useSession } from "@/components/useSession";

/**
 * CTA principal du haut de page. Connecté : on passe à l'action. Sinon :
 * le site est informatif, on invite à créer un compte pour pouvoir contester.
 */
export function CtaHero() {
  const { connecte, chargement } = useSession();

  if (chargement) {
    return <span className="h-14 w-64 animate-pulse rounded-md bg-gold-400/60" aria-hidden="true" />;
  }

  return connecte ? (
    <Link
      href="/tableau-de-bord/nouveau"
      className="inline-flex items-center justify-center gap-2 rounded-md bg-gold-400 px-7 py-4 text-base font-black text-navy-950 shadow-xl shadow-gold-500/25 transition hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-2xl hover:shadow-gold-400/40"
    >
      Ouvrir une contestation
      <span aria-hidden="true">→</span>
    </Link>
  ) : (
    <Link
      href="/inscription"
      className="inline-flex items-center justify-center gap-2 rounded-md bg-gold-400 px-7 py-4 text-base font-black text-navy-950 shadow-xl shadow-gold-500/25 transition hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-2xl hover:shadow-gold-400/40"
    >
      Créer mon compte gratuit
      <span aria-hidden="true">→</span>
    </Link>
  );
}