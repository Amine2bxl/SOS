"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/tableau-de-bord", label: "Mes dossiers" },
  { href: "/tableau-de-bord/nouveau", label: "Nouvelle contestation" },
  { href: "/tableau-de-bord/abonnement", label: "Mon abonnement" },
  { href: "/tableau-de-bord/compte", label: "Mon compte" },
];

/**
 * Bandeau de l'espace membre, affiché en tête de chaque page privée :
 * l'utilisateur sait où il est (espace membre), sous quelle formule,
 * et trouve d'un coup d'œil toutes les sections de son compte.
 */
export function NavigationMembre({ prenom, planNom }: { prenom?: string; planNom?: string }) {
  const pathname = usePathname();

  return (
    <div className="mb-6 rounded-xl border border-line bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line-soft px-4 py-2.5 sm:px-5">
        <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ok-600" aria-hidden="true" />
          Espace membre
          {prenom && <span className="hidden font-semibold text-ink-soft sm:inline">— {prenom}</span>}
          {planNom && (
            <span className="rounded-full bg-navy-900 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gold-300">
              {planNom}
            </span>
          )}
        </p>
      </div>

      <nav
        aria-label="Sections de l'espace membre"
        className="flex gap-1 overflow-x-auto whitespace-nowrap px-2 py-2 sm:px-3"
      >
        {LIENS.map((l) => {
          const actif = pathname === l.href || (l.href !== "/tableau-de-bord" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={actif ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                actif ? "bg-navy-900 text-white" : "text-navy-700 hover:bg-navy-50"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}