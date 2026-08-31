import Link from "next/link";
import { Logo, MailIcon } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/Contact";
import { ASSO } from "@/lib/data";
import { t, type Langue } from "@/lib/i18n";

const COLONNES: { titreCle: string; liens: { href: string; cle?: string; label?: string }[] }[] = [
  {
    titreCle: "footer.decouvrir",
    liens: [
      { href: "/comprendre", cle: "nav.comprendre" },
      { href: "/communes", cle: "nav.communes" },
      { href: "/tarifs", cle: "nav.tarifs" },
      { href: "/contact", cle: "nav.contact" },
    ],
  },
  {
    titreCle: "footer.espaceMembre",
    liens: [
      { href: "/inscription", cle: "commun.creerCompte" },
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
    <footer className="mt-16 border-t border-navy-800 bg-navy-950 text-navy-100 print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-navy-100/70">
              {t(langue, "footer.tagline")}
            </p>
            <div className="mt-4 flex gap-2">
              <a
                href={LIEN_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex items-center gap-2 rounded-md bg-[#25d366] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#1da851]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={`mailto:${ASSO.email}`}
                aria-label="Email"
                className="inline-flex items-center gap-2 rounded-md border border-navy-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
              >
                <MailIcon className="h-4 w-4" />
                E-mail
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLONNES.map((col) => (
              <nav key={col.titreCle} aria-label={t(langue, col.titreCle)}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gold-300">
                  {t(langue, col.titreCle)}
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {col.liens.map((l) => (
                    <li key={l.href + (l.cle ?? l.label ?? "")}>
                      <Link href={l.href} className="text-navy-100/80 transition hover:text-gold-300">
                        {l.cle ? t(langue, l.cle) : l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 space-y-1 border-t border-navy-800 pt-4 text-xs leading-relaxed text-navy-100/60">
          <p>
            <strong className="text-navy-100">{ASSO.nom}</strong> — {ASSO.formeJuridique} — BCE{" "}
            {ASSO.bce} — {ASSO.rue}, {ASSO.codePostal} {ASSO.ville}.
          </p>
          <p>{t(langue, "footer.identite")}</p>
        </div>
      </div>
    </footer>
  );
}