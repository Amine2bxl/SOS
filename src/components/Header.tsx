"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo, PhoneIcon } from "@/components/Logo";
import { EtatCompte } from "@/components/EtatCompte";
import { ASSO } from "@/lib/data";

const NAV = [
  { href: "/contester", label: "Contester mon amende" },
  { href: "/comprendre", label: "Comprendre" },
  { href: "/communes", label: "Ma commune" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="bg-navy-950 text-white shadow-lg shadow-navy-950/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="SOS Citizens ASBL — Accueil">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-navy-800 text-gold-300" : "text-navy-100 hover:bg-navy-800/70 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* L'appel est le premier réflexe attendu : le bouton principal est un téléphone. */}
            <a
              href={`tel:${ASSO.telephoneLien}`}
              className="inline-flex items-center gap-2 rounded-md bg-gold-400 px-3 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300 sm:px-4"
            >
              <PhoneIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{ASSO.telephone}</span>
              <span className="sm:hidden">Appeler</span>
            </a>
            <span className="hidden lg:inline-flex">
              <EtatCompte />
            </span>
            <button
              onClick={() => setOpen(!open)}
              className="rounded-md border border-navy-700 p-2 text-navy-100 lg:hidden"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
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
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-navy-100 hover:bg-navy-800"
                >
                  {item.label}
                </Link>
              ))}
              <span className="mt-2 grid">
                <EtatCompte surNavigation={() => setOpen(false)} />
              </span>
            </div>
          </nav>
        )}
      </div>

      <p className="border-b border-gold-500/30 bg-gold-100 px-4 py-1.5 text-center text-[13px] font-semibold text-navy-900">
        Association sans but lucratif. L'aide par téléphone est gratuite, sans limite.
      </p>
    </header>
  );
}
