import Link from "next/link";
import { Logo, MailIcon } from "@/components/Logo";
import { WhatsAppIcon, BoutonContact } from "@/components/Contact";
import { ASSO } from "@/lib/data";

const LIENS_SITE = [
  { href: "/contester", label: "Contester mon amende" },
  { href: "/comprendre", label: "Comprendre la procédure" },
  { href: "/communes", label: "Les 19 communes" },
  { href: "/tarifs", label: "Tarifs et adhésion" },
  { href: "/contact", label: "Nous contacter" },
];

const LIENS_MEMBRE = [
  { href: "/tableau-de-bord", label: "Mon tableau de bord" },
  { href: "/tableau-de-bord/nouveau", label: "Nouvelle contestation" },
  { href: "/tableau-de-bord/abonnement", label: "Mon abonnement" },
  { href: "/tableau-de-bord/compte", label: "Mon compte" },
];

const LIENS_LEGAUX = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité & RGPD" },
  { href: "/conditions-utilisation", label: "Conditions d'utilisation" },
];

const LIEN_WHATSAPP = `https://wa.me/${ASSO.whatsapp}?text=${encodeURIComponent(
  "Bonjour, je vous contacte au sujet d'une redevance de stationnement.",
)}`;

export function Footer() {
  return (
    <footer className="mt-20 bg-navy-950 text-navy-100 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-100/80">
            Association citoyenne bruxelloise. Nous aidons les habitants à comprendre et contester
            les redevances de stationnement et les sanctions administratives.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={LIEN_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#25d366] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#1da851]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={`mailto:${ASSO.email}`}
              className="inline-flex items-center gap-2 rounded-md border border-navy-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              <MailIcon className="h-4 w-4" />
              E-mail
            </a>
            <BoutonContact variante="outline" />
          </div>
        </div>

        <nav aria-label="Liens du site">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gold-300">
            Le site
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {LIENS_SITE.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="text-navy-100/90 transition hover:text-gold-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Espace membre">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gold-300">
            Espace membre
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {LIENS_MEMBRE.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="text-navy-100/90 transition hover:text-gold-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gold-300">
            Informations
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {LIENS_LEGAUX.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="text-navy-100/90 transition hover:text-gold-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <address className="mt-4 space-y-1 border-t border-navy-800 pt-4 text-sm not-italic text-navy-100/90">
            <p>
              {ASSO.rue}
              <br />
              {ASSO.codePostal} {ASSO.ville}
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-navy-800">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-5 text-xs leading-relaxed text-navy-100/70 sm:px-6">
          <p>
            <strong className="text-navy-100">{ASSO.nom}</strong> — {ASSO.formeJuridique} — Numéro
            d&apos;entreprise {ASSO.bce} — Constituée le {ASSO.constitution} — Président :{" "}
            {ASSO.president}.
          </p>
          <p>
            Nous sommes une association d&apos;information et d&apos;accompagnement citoyen, et non un
            cabinet d&apos;avocats. Nous ne garantissons aucune annulation : chaque dossier dépend des
            faits, des preuves et du règlement applicable.
          </p>
        </div>
      </div>
    </footer>
  );
}