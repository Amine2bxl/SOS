import Link from "next/link";
import { Logo, MailIcon } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/Contact";
import { ASSO } from "@/lib/data";
import { t, type Langue } from "@/lib/i18n";

const COLONNES: { titreCle: string; liens: { href: string; cle: string }[] }[] = [
  {
    titreCle: "footer.decouvrir",
    liens: [
      { href: "/#comment", cle: "nav.commentCaMarche" },
      { href: "/comprendre", cle: "nav.comprendre" },
      { href: "/communes", cle: "nav.communes" },
      { href: "/tarifs", cle: "nav.tarifs" },
      { href: "/association", cle: "nav.association" },
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
      { href: "/tableau-de-bord", cle: "commun.monEspace" },
    ],
  },
  {
    titreCle: "footer.legal",
    liens: [
      { href: "/mentions-legales", cle: "footer.mentionsLegales" },
      { href: "/confidentialite", cle: "footer.confidentialite" },
      { href: "/conditions-utilisation", cle: "footer.conditions" },
    ],
  },
];

const LIEN_WHATSAPP = `https://wa.me/${ASSO.whatsapp}?text=${encodeURIComponent(
  "Bonjour, je vous contacte au sujet d'une redevance de stationnement.",
)}`;

export function Footer({ langue }: { langue: Langue }) {
  return (
    <footer className="border-t border-white/10 bg-navy-950 text-navy-100 print:hidden">
      <div className="motif-marquage h-1.5" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-navy-100/75">{t(langue, "footer.tagline")}</p>
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
              <a
                href={`https://www.tiktok.com/@${ASSO.tiktok}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t(langue, "footer.suivre")} : TikTok @${ASSO.tiktok}`}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <IconeTikTok className="h-4 w-4" />
                @{ASSO.tiktok}
              </a>
            </div>
          </div>

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

        <div className="mt-12 space-y-1 border-t border-white/10 pt-5 text-xs leading-relaxed text-navy-100/60">
          <p>
            <strong className="text-navy-100">{ASSO.nom}</strong> — {ASSO.formeJuridique} — BCE {ASSO.bce} — {ASSO.rue},{" "}
            {ASSO.codePostal} {ASSO.ville}.
          </p>
          <p>{t(langue, "footer.identite")}</p>
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
