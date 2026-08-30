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

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { connecte } = useSession();

  // Espace membre : visible dans la nav dès que l'utilisateur est connecté —
  // le site public bascule alors en interface d'application.
  const navigation = connecte
    ? [...NAV, { href: "/tableau-de-bord", label: "Mon espace" }]
    : NAV;

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="border-b border-navy-800/80 bg-navy-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <Link href="/" aria-label="SOS Citizens ASBL — Accueil" className="shrink-0">
            <Logo />
          </Link>

          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label="Navigation principale"
          >
            {navigation.map((item) => {
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
          <nav
            className="border-t border-navy-800 px-4 pb-4 lg:hidden"
            aria-label="Navigation mobile"
          >
            <div className="grid gap-1 pt-3">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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