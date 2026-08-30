"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { MenuCompte } from "@/components/MenuCompte";
import { BoutonContact, WhatsAppIcon } from "@/components/Contact";
import { PillAbonnement } from "@/components/PillAbonnement";
import { useSession } from "@/components/useSession";
import { useLangue, t, ChoixLangue } from "@/lib/i18n";

const NAV = [
  { href: "/contester", cle: "nav.contester" },
  { href: "/comprendre", cle: "nav.comprendre" },
  { href: "/communes", cle: "nav.communes" },
  { href: "/tarifs", cle: "nav.tarifs" },
  { href: "/contact", cle: "nav.contact" },
];

const LIENS_MEMBRE = [
  { href: "/tableau-de-bord", cle: "menu.mesDossiers" },
  { href: "/tableau-de-bord/nouveau", cle: "menu.nouvelleContestation" },
  { href: "/tableau-de-bord/abonnement", cle: "menu.monAbonnement" },
  { href: "/tableau-de-bord/compte", cle: "menu.mesParametres" },
];

/** Style commun des liens de la barre : soulignement actif, jamais de pastille. */
function LienNav({
  href,
  actif,
  onSameClass,
  children,
}: {
  href: string;
  actif: boolean;
  onSameClass: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`whitespace-nowrap border-b-2 px-2.5 py-1.5 text-[13.5px] font-medium transition-colors ${onSameClass} ${
        actif
          ? "border-gold-400 text-gold-300"
          : "border-transparent text-navy-100 hover:border-navy-700 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { langue } = useLangue();
  const { connecte, chargement } = useSession();

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

  return connecte ? (
    <HeaderApp pathname={pathname} open={open} setOpen={setOpen} langue={langue} />
  ) : (
    <HeaderPublic pathname={pathname} open={open} setOpen={setOpen} langue={langue} />
  );
}

function HeaderPublic({
  pathname,
  open,
  setOpen,
  langue,
}: {
  pathname: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  langue: ReturnType<typeof useLangue>["langue"];
}) {
  const estActif = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="border-b border-navy-800/80 bg-navy-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <Link href="/" aria-label="SOS Citizens ASBL" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigation principale">
            {NAV.map((item) => (
              <LienNav key={item.href} href={item.href} actif={estActif(item.href)} onSameClass="">
                {t(langue, item.cle)}
              </LienNav>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ChoixLangue />
            <BoutonContact variante="gold" className="hidden px-3 py-2 lg:inline-flex" />
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
          <nav className="border-t border-navy-800 px-4 pb-4 lg:hidden" aria-label="Navigation mobile">
            <div className="grid gap-1 pt-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    pathname.startsWith(item.href)
                      ? "bg-white/10 text-white"
                      : "text-navy-100 hover:bg-navy-800"
                  }`}
                >
                  {t(langue, item.cle)}
                </Link>
              ))}
              <div className="mt-2 grid gap-2">
                <BoutonContact variante="gold" className="w-full" />
                <MenuCompte />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

function HeaderApp({
  pathname,
  open,
  setOpen,
  langue,
}: {
  pathname: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  langue: ReturnType<typeof useLangue>["langue"];
}) {
  const estActif = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="border-b border-navy-800 bg-navy-900 text-white shadow-lg shadow-navy-950/20">
        <div className="h-0.5 bg-gold-400" aria-hidden="true" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/tableau-de-bord" aria-label="Mon espace SOS Citizens" className="shrink-0">
              <Logo />
            </Link>
            <PillAbonnement />
          </div>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Navigation principale">
            {NAV.map((item) => (
              <LienNav key={item.href} href={item.href} actif={estActif(item.href)} onSameClass="">
                {t(langue, item.cle)}
              </LienNav>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <BoutonContact
              variante="gold"
              className="hidden px-3 py-2 lg:inline-flex"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span className="hidden xl:inline">{t(langue, "commun.contacter")}</span>
            </BoutonContact>
            <ChoixLangue />
            <MenuCompte />

            <button
              onClick={() => setOpen(!open)}
              className="rounded-md border border-navy-700 p-2 text-navy-100 xl:hidden"
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
          <nav className="border-t border-navy-800 px-4 pb-4 xl:hidden" aria-label="Navigation mobile">
            <div className="grid gap-1 pt-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    pathname.startsWith(item.href)
                      ? "bg-white/10 text-white"
                      : "text-navy-100 hover:bg-navy-800"
                  }`}
                >
                  {t(langue, item.cle)}
                </Link>
              ))}
              <div className="mt-2 border-t border-navy-800 pt-2">
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-navy-100/60">
                  {t(langue, "footer.espaceMembre")}
                </p>
                {LIENS_MEMBRE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-navy-100 hover:bg-navy-800"
                  >
                    {t(langue, item.cle)}
                  </Link>
                ))}
              </div>
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