"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useSession } from "@/components/useSession";
import { useLangue, t } from "@/lib/i18n";
import { seDeconnecter } from "@/lib/auth-actions";

const LIENS = [
  { href: "/tableau-de-bord", cle: "menu.mesDossiers" },
  { href: "/tableau-de-bord/nouveau", cle: "menu.nouvelleContestation" },
  { href: "/tableau-de-bord/abonnement", cle: "menu.monAbonnement" },
  { href: "/tableau-de-bord/compte", cle: "menu.mesParametres" },
];

/**
 * Zone du compte dans l'en-tête : liens de connexion quand on est déconnecté,
 * sinon un menu avec l'avatar, l'accès à l'espace membre et la déconnexion.
 */
export function MenuCompte() {
  const { connecte, chargement, utilisateur } = useSession();
  const { langue } = useLangue();
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, demarrer] = useTransition();

  if (chargement) return <span className="h-9 w-24" aria-hidden="true" />;

  if (!connecte) {
    return (
      <Link
        href="/connexion"
        className="inline-flex items-center rounded-md border border-navy-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
      >
        {t(langue, "commun.seConnecter")}
      </Link>
    );
  }

  const estActif = (href: string) => pathname.startsWith(href);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label="Menu de mon compte"
        className="flex items-center gap-2 rounded-md border border-navy-600 py-1.5 pl-1.5 pr-2.5 text-white transition hover:bg-navy-800"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-black text-navy-950">
          {utilisateur?.initiale}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-semibold sm:inline">
          {utilisateur?.prenom || t(langue, "footer.espaceMembre")}
        </span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${ouvert ? "rotate-180" : ""}`} fill="currentColor" aria-hidden="true">
          <path d="M5.5 7.5 10 12l4.5-4.5 1.2 1.2L10 14.4 4.3 8.7 5.5 7.5Z" />
        </svg>
      </button>

      {ouvert && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOuvert(false)} />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-card shadow-2xl animate-rise"
          >
            <div className="border-b border-line-soft bg-navy-50/60 px-4 py-3">
              <p className="truncate font-display text-sm font-bold text-navy-900">
                {utilisateur?.prenom} {utilisateur?.nom}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-soft">
                {utilisateur?.email ?? t(langue, "footer.espaceMembre")}
              </p>
            </div>

            <div className="p-1.5">
              {LIENS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  role="menuitem"
                  onClick={() => setOuvert(false)}
                  aria-current={estActif(l.href) ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    estActif(l.href) ? "bg-navy-50 text-navy-900" : "text-navy-700 hover:bg-navy-50"
                  }`}
                >
                  {t(langue, l.cle)}
                </Link>
              ))}
            </div>

            <div className="border-t border-line-soft p-1.5">
              <button
                type="button"
                role="menuitem"
                disabled={enCours}
                onClick={() =>
                  demarrer(async () => {
                    await seDeconnecter();
                  })
                }
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-danger-700 transition hover:bg-danger-100 disabled:opacity-50"
              >
                {enCours ? "…" : t(langue, "commun.seDeconnecter")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}