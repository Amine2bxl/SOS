"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useSession } from "@/components/useSession";
import { useLangue, t, ChoixLangue } from "@/lib/i18n";
import { IconeFermer, IconeFleche, IconeMainTendue, IconeMenu } from "@/components/icones";

/**
 * Navigation du site public. Elle ne parle que du site ; les outils vivent
 * dans l'espace membre. Une seule action en jaune : analyser son courrier —
 * c'est elle qu'on vient faire.
 */
const NAV = [
  { href: "/comprendre", cle: "nav.comprendre" },
  { href: "/communes", cle: "nav.communes" },
  { href: "/tarifs", cle: "nav.tarifs" },
  { href: "/association", cle: "nav.association" },
  { href: "/presse", cle: "nav.presse" },
  { href: "/contact", cle: "nav.contact" },
];

/**
 * Le bloc de droite. Un visiteur voit « Connexion » et l'action principale ;
 * un membre déjà connecté, un retour vers son espace. La largeur minimale est
 * fixe : la bascule ne décale jamais la mise en page.
 */
function AccesCompte() {
  const { connecte, chargement } = useSession();
  const { langue } = useLangue();

  if (!chargement && connecte) {
    return (
      <Link
        href="/tableau-de-bord"
        className="inline-flex h-10 items-center gap-2 rounded-full bg-gold-400 px-4 text-sm font-bold text-navy-950 shadow-bouton transition hover:bg-gold-300"
      >
        {t(langue, "commun.monEspace")}
        <IconeFleche className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/don"
        aria-label={t(langue, "nav.don")}
        className="hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold text-gold-300 transition hover:bg-white/10 hover:text-gold-400 xl:inline-flex"
      >
        <IconeMainTendue className="h-5 w-5 [--icone-accent:currentColor]" />
        {t(langue, "nav.donCourt")}
      </Link>
      <Link
        href="/connexion"
        className="inline-flex h-10 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-semibold text-navy-100 transition hover:bg-white/10 hover:text-white"
      >
        {t(langue, "commun.seConnecter")}
      </Link>
      <Link
        href="/#analyser"
        className="hidden h-10 items-center whitespace-nowrap rounded-full bg-gold-400 px-4 text-sm font-bold text-navy-950 shadow-bouton transition hover:bg-gold-300 sm:inline-flex"
      >
        {t(langue, "commun.analyser")}
      </Link>
    </div>
  );
}

export function HeaderSite() {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const { langue } = useLangue();

  const estActif = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(href + "/"));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900 text-white print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="SOS Citizens ASBL — accueil" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex 2xl:gap-1" aria-label="Navigation principale">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={estActif(item.href) ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition 2xl:px-3 ${
                estActif(item.href) ? "bg-white/10 text-white" : "text-navy-100 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t(langue, item.cle)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ChoixLangue />
          <AccesCompte />
          <button
            type="button"
            onClick={() => setOuvert(!ouvert)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-navy-100 xl:hidden"
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={ouvert}
          >
            {ouvert ? <IconeFermer className="h-5 w-5" /> : <IconeMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {ouvert && (
        <nav className="border-t border-white/10 px-4 pb-5 xl:hidden" aria-label="Navigation mobile">
          <div className="grid gap-1 pt-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOuvert(false)}
                aria-current={estActif(item.href) ? "page" : undefined}
                className={`rounded-2xl px-4 py-3 text-base font-medium ${
                  estActif(item.href) ? "bg-white/10 text-white" : "text-navy-100 hover:bg-white/5"
                }`}
              >
                {t(langue, item.cle)}
              </Link>
            ))}
            <Link
              href="/#analyser"
              onClick={() => setOuvert(false)}
              className="mt-3 flex h-12 items-center justify-center rounded-full bg-gold-400 text-base font-bold text-navy-950"
            >
              {t(langue, "commun.analyser")}
            </Link>
            <Link
              href="/don"
              onClick={() => setOuvert(false)}
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 text-base font-semibold text-gold-300"
            >
              <IconeMainTendue className="h-5 w-5 [--icone-accent:currentColor]" />
              {t(langue, "nav.don")}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
