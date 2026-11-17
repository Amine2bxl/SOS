import Link from "next/link";
import { Logo, MailIcon } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/Contact";
import { ASSO } from "@/lib/data";
import { t, type Langue } from "@/lib/i18n";

/**
 * Le pied de page, en deux bandes et rien de plus.
 *
 * En haut : la marque, les trois façons de nous joindre (en icônes), et deux
 * colonnes de liens. En bas, une seule ligne : l'identité de l'association et
 * les documents légaux. Le détail (versions, autorité de contrôle, adresse)
 * vit dans les pages légales elles-mêmes : le pied de page y mène, il ne les
 * recopie pas.
 */
const COLONNES: { titreCle: string; liens: { href: string; cle: string }[] }[] = [
  {
    titreCle: "footer.service",
    liens: [
      { href: "/#analyser", cle: "commun.analyser" },
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
];

const LEGAL: { href: string; cle: string }[] = [
  { href: "/mentions-legales", cle: "footer.mentionsLegales" },
  { href: "/conditions-utilisation", cle: "footer.cgu" },
  { href: "/confidentialite", cle: "footer.rgpd" },
  { href: "/confidentialite#cookies", cle: "footer.cookies" },
];

const LIEN_WHATSAPP = `https://wa.me/${ASSO.whatsapp}?text=${encodeURIComponent(
  "Bonjour, je vous contacte au sujet d'une redevance de stationnement.",
)}`;

const pastille =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-white/40 hover:bg-white/10";

export function Footer({ langue }: { langue: Langue }) {
  const annee = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-navy-950 text-navy-100 print:hidden">
      <div className="motif-marquage h-1" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-navy-100/70">{t(langue, "footer.tagline")}</p>
            <ul className="mt-4 flex gap-2" aria-label="Nous joindre">
              <li>
                <a href={LIEN_WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={pastille}>
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              </li>
              <li>
                <a href={`mailto:${ASSO.email}`} aria-label={`E-mail : ${ASSO.email}`} className={pastille}>
                  <MailIcon className="h-4 w-4" />
                </a>
              </li>
              <li>
                <a
                  href={`https://www.tiktok.com/@${ASSO.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`TikTok : @${ASSO.tiktok}`}
                  className={pastille}
                >
                  <IconeTikTok className="h-4 w-4" />
                </a>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6 sm:gap-x-16">
            {COLONNES.map((col) => (
              <nav key={col.titreCle} aria-label={t(langue, col.titreCle)}>
                <h2 className="text-sm font-bold text-white">{t(langue, col.titreCle)}</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {col.liens.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-navy-100/75 transition hover:text-white">
                        {t(langue, l.cle)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs leading-relaxed text-navy-100/60 lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {annee} {ASSO.nom} · BCE {ASSO.bce} · {t(langue, "footer.identite")}
          </p>
          <nav aria-label={t(langue, "footer.infosLegales")}>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-navy-100/80 underline decoration-white/20 underline-offset-4 transition hover:text-white">
                    {t(langue, l.cle)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
