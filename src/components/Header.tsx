"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { MenuCompte } from "@/components/MenuCompte";
import { BoutonContact, WhatsAppIcon } from "@/components/Contact";
import { useSession } from "@/components/useSession";

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
  const { connecte } = useSession();

  // L'espace membre apparaît dès que l'utilisateur est connecté : la
  // navigation bascule d'un site public vers une vraie application.
  const navigation = connecte
    ? [...NAV, { href: "/tableau-de-bord", label: "Mon espace" }]
    : NAV;

  const estActif = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="bg-navy-950 text-white shadow-md shadow-navy-950/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" aria-label="SOS Citizens ASBL — Accueil">
            <Logo compact />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigation principale">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={estActif(item.href) ? "page" : undefined}
                className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  estActif(item.href)
                    ? "bg-navy-800 text-gold-300"
                    : "text-navy-100 hover:bg-navy-800/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <BoutonContact
              variante="gold"
              className="hidden px-3 py-1.5 sm:inline-flex"
            />
            <MenuCompte />

            <button
              onClick={() => setOpen(!open)}
              className="rounded-md border border-navy-700 p-1.5 text-navy-100 lg:hidden"
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
          <nav className="border-t border-navy-800 px-4 pb-3 lg:hidden" aria-label="Navigation mobile">
            <div className="grid gap-1 pt-2.5">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={estActif(item.href) ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    estActif(item.href) ? "bg-navy-800 text-gold-300" : "text-navy-100 hover:bg-navy-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid gap-2">
                <BoutonContact variante="gold" className="w-full">
                  <WhatsAppIcon className="h-4 w-4" />
                  Nous contacter
                </BoutonContact>
                <MenuCompte />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}