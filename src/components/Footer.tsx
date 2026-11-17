import Link from "next/link";
import { Logo, MailIcon } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/Contact";
import { IconeFleche } from "@/components/icones";
import { ASSO } from "@/lib/data";
import { DOCUMENTS_LEGAUX } from "@/lib/versions-legales";
import { t, type Langue } from "@/lib/i18n";

/**
 * Le pied de page : trois colonnes de navigation, un bloc légal à part, et
 * l'identité de l'association. Le légal a sa propre ligne : on le trouve sans
 * le chercher, et chaque document affiche sa version.
 */
const COLONNES: { titreCle: string; liens: { href: string; cle: string }[] }[] = [
  {
    titreCle: "footer.service",
    liens: [
      { href: "/#comment", cle: "nav.commentCaMarche" },
      { href: "/comprendre", cle: "nav.videoMinute" },
      { href: "/communes", cle: "nav.communes" },
      { href: "/tarifs", cle: "nav.tarifs" },
    ],
  },
  {
    titreCle: "footer.association",
    liens: [
      { href: "/association", cle: "nav.quiSommesNous" },
      { href: "/presse", cle: "nav.presse" },
      { href: "/don", cle: "nav.don" },
      { href: "/contact", cle: "nav.contact" },
    ],
  },
  {
    titreCle: "footer.espaceMembre",
    liens: [
      { href: "/#analyser", cle: "commun.analyser" },
      { href: "/connexion", cle: "commun.seConnecter" },
      { href: "/connexion?compte=nouveau", cle: "nav.creerCompte" },
      { href: "/tableau-de-bord", cle: "commun.monEspace" },
    ],
  },
];

const LEGAL: { href: string; cle: string }[] = [
  { href: "/mentions-legales", cle: "footer.mentionsLegales" },
  { href: "/conditions-utilisation", cle: "footer.cgu" },
  { href: "/confidentialite", cle: "footer.rgpd" },
  { href: "/confidentialite#cookies", cle: "footer.cookies" },
  { href: "/confidentialite#droits", cle: "footer.droits" },
];

const LIEN_WHATSAPP = `https://wa.me/${ASSO.whatsapp}?text=${encodeURIComponent(
  "Bonjour, je vous contacte au sujet d'une redevance de stationnement.",
)}`;

export function Footer({ langue }: { langue: Langue }) {
  const annee = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-navy-950 text-navy-100 print:hidden">
      <div className="motif-marquage h-1.5" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_2fr]">
          {/* ------------------------------------------- l'association, en bref */}
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-100/75">{t(langue, "footer.tagline")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={LIEN_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25d366] px-4 text-sm font-bold text-white transition hover:bg-[#1da851]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={`mailto:${ASSO.email}`}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <MailIcon className="h-4 w-4" />
                E-mail
              </a>
            </div>
            <a
              href={`https://www.tiktok.com/@${ASSO.tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4 flex max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/25 hover:bg-white/[0.07]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                <IconeTikTok className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">TikTok · @{ASSO.tiktok}</span>
                <span className="block text-xs text-navy-100/70">{t(langue, "footer.tiktok")}</span>
              </span>
              <IconeFleche className="ml-auto h-4 w-4 shrink-0 text-navy-100/50 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* ----------------------------------------------------- navigation */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLONNES.map((col) => (
              <nav key={col.titreCle} aria-label={t(langue, col.titreCle)}>
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-gold-400">{t(langue, col.titreCle)}</h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {col.liens.map((l) => (
                    <li key={l.href + l.cle}>
                      <Link href={l.href} className="text-navy-100/80 transition hover:text-white">
                        {t(langue, l.cle)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------ légal */}
        <nav aria-label={t(langue, "footer.infosLegales")} className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-gold-400">{t(langue, "footer.infosLegales")}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-navy-100/85 underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-white/60">
                  {t(langue, l.cle)}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-navy-100/55">
            Versions en vigueur : {DOCUMENTS_LEGAUX.cgu.version} · {DOCUMENTS_LEGAUX.confidentialite.version}. Réclamation
            sur vos données : Autorité de protection des données, rue de la Presse 35, 1000 Bruxelles.
          </p>
        </nav>

        {/* --------------------------------------------------------- identité */}
        <div className="mt-6 flex flex-col gap-2 text-xs leading-relaxed text-navy-100/60 md:flex-row md:items-start md:justify-between">
          <p>
            © {annee} <strong className="text-navy-100">{ASSO.nom}</strong> · {ASSO.formeJuridique} · BCE {ASSO.bce} ·{" "}
            {ASSO.rue}, {ASSO.codePostal} {ASSO.ville}
          </p>
          <p className="md:max-w-sm md:text-right">{t(langue, "footer.identite")}</p>
        </div>
      </div>
    </footer>
  );
}

/** Le logo TikTok, simplifié, à une couleur. */
function IconeTikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 3c.3 2.2 1.6 3.9 3.9 4.2v3.1c-1.4 0-2.7-.4-3.9-1.1v6.3c0 3.4-2.6 5.5-5.6 5.5A5.4 5.4 0 0 1 5.6 15.6c0-3.4 2.9-5.8 6.3-5.3v3.2c-1.5-.4-3 .5-3 2.1 0 1.2 1 2.2 2.2 2.2 1.4 0 2.3-.9 2.3-2.6V3h3.2Z" />
    </svg>
  );
}
