"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { MenuCompte } from "@/components/MenuCompte";
import { BoutonContact } from "@/components/Contact";
import { useSession } from "@/components/useSession";

const NAV = [
  { href: "/contester", label: "Contester" },
  { href: "/comprendre", label: "Comprendre" },
  { href: "/communes", label: "Communes" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
];

const NAV_MEMBRE = [
  { href: "/tableau-de-bord", label: "Mes dossiers" },
  { href: "/tableau-de-bord/nouveau", label: "Nouvelle contestation" },
  { href: "/tableau-de-bord/abonnement", label: "Mon abonnement" },
  { href: "/tableau-de-bord/compte", label: "Mon compte" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { connecte, chargement } = useSession();

  // Tant que l'état de connexion n'est pas connu, on garde le header public
  // pour ne pas faire « clignoter » la barre.
  if (chargement) {
    return (
      <header className="sticky top-0 z-40 print:hidden">
        <div className="border-b border-navy-800/80 bg-navy-950 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
            <Logo />
            <span className="h-9 w-40 animate-pulse rounded-md bg-navy-800" aria-hidden="true" />
          </div>
        </div>
      </header>
    );
  }

  return connecte ? <HeaderApp pathname={pathname} mobileOpen={open} setMobileOpen={setOpen} /> : (
    <HeaderPublic pathname={pathname} mobileOpen={open} setMobileOpen={setOpen} />
  );
}

/** Site public : barre bleu marine. */
function HeaderPublic({
  pathname,
  mobileOpen,
  setMobileOpen,
}: {
  pathname: string;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="border-b border-navy-800/80 bg-navy-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <Link href="/" aria-label="SOS Citizens ASBL — Accueil" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigation principale">
            {NAV.map((item) => {
              const actif =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={actif ? "page" : undefined}
                  className={`whitespace-nowrap rounded-md px-2.5 py-2 text-[13.5px] font-medium transition-colors ${
                    actif
                      ? "bg-navy-800 text-gold-300"
                      : "text-navy-100 hover:bg-navy-800/70 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <BoutonContact variante="gold" className="hidden px-3 py-2 sm:inline-flex" />
            <MenuCompte />

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-md border border-navy-700 p-2 text-navy-100 lg:hidden"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-navy-800 px-4 pb-4 lg:hidden" aria-label="Navigation mobile">
            <div className="grid gap-1 pt-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    pathname.startsWith(item.href)
                      ? "bg-navy-800 text-gold-300"
                      : "text-navy-100 hover:bg-navy-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid">
                <BoutonContact variante="gold" className="w-full" />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

/**
 * Application connectée : barre claire, reconnaissable d'un coup d'œil pour
 * bien distinguer l'espace membre du site public.
 */
function HeaderApp({
  pathname,
  mobileOpen,
  setMobileOpen,
}: {
  pathname: string;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="border-b border-line bg-white text-navy-900 shadow-sm shadow-navy-950/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/tableau-de-bord" aria-label="Mon espace SOS Citizens" className="shrink-0">
              <Logo surClair />
            </Link>
            <Link
              href="/tableau-de-bord"
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-xs font-black tracking-wide text-navy-950 transition hover:bg-gold-300"
            >
              <span aria-hidden="true">✦</span>
              <span className="hidden sm:inline">Espace membre</span>
              <span className="sm:hidden">Membre</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Espace membre">
            {NAV_MEMBRE.map((item) => {
              const actif =
                item.href === "/tableau-de-bord"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={actif ? "page" : undefined}
                  className={`whitespace-nowrap rounded-md px-2.5 py-2 text-[13.5px] font-medium transition-colors ${
                    actif
                      ? "bg-navy-900 text-gold-300"
                      : "text-navy-700 hover:bg-navy-50 hover:text-navy-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <Link
              href="/"
              className="hidden whitespace-nowrap rounded-md px-2.5 py-2 text-[13.5px] font-medium text-navy-600 transition hover:bg-navy-50 hover:text-navy-900 sm:inline"
            >
              Voir le site
            </Link>
            <MenuCompte />

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-md border border-line p-2 text-navy-700 xl:hidden"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-line px-4 pb-4 xl:hidden" aria-label="Navigation de l'espace membre">
            <div className="grid gap-1 pt-3">
              {NAV_MEMBRE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    pathname.startsWith(item.href)
                      ? "bg-navy-900 text-gold-300"
                      : "text-navy-700 hover:bg-navy-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-navy-600 hover:bg-navy-50"
              >
                Voir le site public
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}