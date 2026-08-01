"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo, HeartIcon } from "@/components/Logo";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/comprendre", label: "Comprendre" },
  { href: "/communes", label: "Les 19 communes" },
  { href: "/dossiers", label: "Mes dossiers" },
  { href: "/modeles", label: "Guides" },
  { href: "/articles", label: "Articles & presse" },
  { href: "/faq", label: "FAQ" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="bg-navy-950 text-white shadow-lg shadow-navy-950/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="SOS Citizens ASBL — Accueil">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                    active ? "bg-navy-800 text-gold-300" : "text-navy-100 hover:bg-navy-800/70 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/analyser"
              className="hidden rounded-md bg-gold-400 px-4 py-2 text-sm font-bold text-navy-950 shadow-sm transition hover:bg-gold-300 sm:inline-block"
            >
              Analyser mon dossier
            </Link>
            <Link
              href="/don"
              title="Soutenez l'accompagnement des citoyens"
              className="inline-flex items-center gap-2 rounded-md border border-gold-400/60 px-3 py-2 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/10"
            >
              <HeartIcon className="h-4 w-4 animate-heartbeat text-gold-400" />
              <span className="hidden md:inline">Faites un don</span>
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="rounded-md border border-navy-700 p-2 text-navy-100 lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={open}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-navy-800 px-4 pb-4 lg:hidden" aria-label="Navigation mobile">
            <div className="grid gap-1 pt-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-navy-100 hover:bg-navy-800"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/analyser"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-md bg-gold-400 px-3 py-2 text-center text-sm font-bold text-navy-950"
              >
                Analyser mon dossier
              </Link>
            </div>
          </nav>
        )}
      </div>

      <div className="border-b border-gold-500/30 bg-gold-100">
        <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-[12px] font-medium text-navy-900 sm:px-6">
          Vous ne remplissez pas seulement un formulaire : à chaque étape, la plateforme vous explique le
          fonctionnement du stationnement, la procédure applicable et les éléments à vérifier avant d'agir.
        </p>
      </div>
    </header>
  );
}
