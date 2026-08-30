import Link from "next/link";
import { Logo, MailIcon } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/Contact";
import { ASSO } from "@/lib/data";

const COLONNES: { titre: string; liens: { href: string; label: string }[] }[] = [
  {
    titre: "Découvrir",
    liens: [
      { href: "/contester", label: "Contester" },
      { href: "/comprendre", label: "Comprendre" },
      { href: "/communes", label: "Communes" },
      { href: "/tarifs", label: "Tarifs" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    titre: "Espace membre",
    liens: [
      { href: "/tableau-de-bord", label: "Mon tableau de bord" },
      { href: "/tableau-de-bord/abonnement", label: "Mon abonnement" },
      { href: "/tableau-de-bord/compte", label: "Mon compte" },
    ],
  },
  {
    titre: "Légal",
    liens: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/conditions-utilisation", label: "Conditions d'utilisation" },
    ],
  },
];

const LIEN_WHATSAPP = `https://wa.me/${ASSO.whatsapp}?text=${encodeURIComponent(
  "Bonjour, je vous contacte au sujet d'une redevance de stationnement.",
)}`;

export function Footer() {
  return (
    <footer className="mt-16 border-t border-navy-800 bg-navy-950 text-navy-100 print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-navy-100/70">
              Association citoyenne bruxelloise qui aide à comprendre et contester les redevances
              de stationnement.
            </p>
            <div className="mt-4 flex gap-2">
              <a
                href={LIEN_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Nous contacter sur WhatsApp"
                className="inline-flex items-center gap-2 rounded-md bg-[#25d366] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#1da851]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={`mailto:${ASSO.email}`}
                aria-label="Nous écrire par e-mail"
                className="inline-flex items-center gap-2 rounded-md border border-navy-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
              >
                <MailIcon className="h-4 w-4" />
                E-mail
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLONNES.map((col) => (
              <nav key={col.titre} aria-label={col.titre}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gold-300">
                  {col.titre}
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {col.liens.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-navy-100/80 transition hover:text-gold-300">
                        {l.label}
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
          <p>
            Association d&apos;information et d&apos;accompagnement citoyen, non un cabinet d&apos;avocats :
            aucune annulation n&apos;est garantie.
          </p>
        </div>
      </div>
    </footer>
  );
}