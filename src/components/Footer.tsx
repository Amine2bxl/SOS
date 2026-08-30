import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ASSO } from "@/lib/data";

const LIENS = [
  { href: "/contester", label: "Contester mon amende" },
  { href: "/comprendre", label: "Comprendre la procédure" },
  { href: "/comprendre#faq", label: "Questions fréquentes" },
  { href: "/communes", label: "Les 19 communes" },
  { href: "/tarifs", label: "Tarifs et adhésion" },
  { href: "/contact", label: "Nous contacter" },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-navy-950 text-navy-100 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-100/80">
            Association citoyenne bruxelloise. Nous aidons gratuitement les habitants à comprendre et
            contester les redevances de stationnement et les sanctions administratives.
          </p>
        </div>

        <nav aria-label="Liens du site">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gold-300">Le site</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {LIENS.map((l) => (
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
            Nous joindre
          </h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-navy-100/90">
            <p>
              <a href={`tel:${ASSO.telephoneLien}`} className="font-semibold text-white hover:text-gold-300">
                {ASSO.telephone}
              </a>
            </p>
            <p>
              <a href={`mailto:${ASSO.email}`} className="break-all hover:text-gold-300">
                {ASSO.email}
              </a>
            </p>
            <p className="pt-1">
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
