"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { BoutonContact } from "@/components/Contact";
import { useSession } from "@/components/useSession";
import { useLangue, t, ChoixLangue } from "@/lib/i18n";

/**
 * Navigation du site public. Elle ne parle que du site : comprendre son
 * courrier, les communes, les formules, nous joindre. Les outils (scan,
 * lettre, dossiers) vivent dans l'espace membre et n'apparaissent pas ici.
 */
const NAV = [
  { href: "/comprendre", cle: "nav.comprendre" },
  { href: "/communes", cle: "nav.communes" },
  { href: "/tarifs", cle: "nav.tarifs" },
  { href: "/contact", cle: "nav.contact" },
];

/**
 * Bloc de droite : « Connexion » et « Créer un compte » par défaut. Un membre
 * déjà connecté qui atterrit sur le site public voit à la place un retour vers
 * son espace. L'emplacement a une largeur minimale fixe : la bascule ne
 * décale jamais la mise en page.
 */
function AccesCompte() {
  const { connecte, chargement } = useSession();
  const { langue } = useLangue();

  if (chargement || !connecte) {
    return (
      <div className="flex min-w-[8.5rem] items-center justify-end gap-1.5">
        <Link
          href="/connexion"
          className="rounded-md px-3 py-2 text-sm font-semibold text-navy-100 transition hover:bg-navy-800 hover:text-white"
        >
          {t(langue, "commun.seConnecter")}
        </Link>
        <Link
          href="/inscription"
          className="hidden rounded-md bg-gold-400 px-3.5 py-2 text-sm font-bold text-navy-950 shadow-sm transition hover:bg-gold-300 sm:inline-flex"
        >
          {t(langue, "commun.creerCompteCourt")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-w-[8.5rem] items-center justify-end">
      <Link
        href="/tableau-de-bord"
        className="inline-flex items-center gap-2 rounded-md bg-gold-400 px-3.5 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
      >
        {t(langue, "commun.monEspace")}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

export function HeaderSite() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { langue } = useLangue();

  const estActif = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="border-b border-navy-800/80 bg-navy-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <Link href="/" aria-label="SOS Citizens ASBL — accueil" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigation principale">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={estActif(item.href) ? "page" : undefined}
                className={`whitespace-nowrap border-b-2 px-2.5 py-1.5 text-[13.5px] font-medium transition-colors ${
                  estActif(item.href)
                    ? "border-gold-400 text-gold-300"
                    : "border-transparent text-navy-100 hover:border-navy-700 hover:text-white"
                }`}
              >
                {t(langue, item.cle)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ChoixLangue />
            <BoutonContact variante="outline" className="hidden px-3 py-2 lg:inline-flex" />
            <AccesCompte />

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
                  aria-current={estActif(item.href) ? "page" : undefined}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    estActif(item.href) ? "bg-white/10 text-white" : "text-navy-100 hover:bg-navy-800"
                  }`}
                >
                  {t(langue, item.cle)}
                </Link>
              ))}
              <div className="mt-2 grid gap-2">
                <Link
                  href="/inscription"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-gold-400 px-3.5 py-2.5 text-center text-sm font-bold text-navy-950"
                >
                  {t(langue, "commun.creerCompte")}
                </Link>
                <BoutonContact variante="outline" className="w-full" />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
