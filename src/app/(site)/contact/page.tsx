import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Card, LinkBtn } from "@/components/ui";
import { MailIcon } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/Contact";
import { ASSO } from "@/lib/data";
import { SUJETS_CONTACT } from "@/lib/contact";
import { FormulaireContact } from "./FormulaireContact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Écrivez à SOS Citizens : par le formulaire, sur WhatsApp ou par e-mail. Une association bruxelloise répond par écrit à vos questions sur une redevance, une amende ou une démarche administrative.",
};

/** Ce qu'il est utile de préparer avant de nous écrire. */
const A_PREPARER = [
  "Photo du courrier",
  "Référence et date du constat",
  "Vos preuves : ticket, capture de l'appli, photos du lieu",
  "Ce qui s'est passé, en une phrase",
];

const LIEN_WHATSAPP = `https://wa.me/${ASSO.whatsapp}?text=${encodeURIComponent(
  "Bonjour, je vous contacte au sujet d'une redevance de stationnement.",
)}`;

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sujet?: string }> }) {
  const { sujet } = await searchParams;
  const sujetInitial = SUJETS_CONTACT.find((s) => s.id === sujet)?.id ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <PageHead
        title="Écrivez-nous"
        intro="Un bénévole répond par écrit. Le plus rapide : WhatsApp."
      />

      {/* CONTACT DIRECT — WhatsApp et e-mail, jamais d'appel direct. */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={LIEN_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-[var(--radius-carte)] border-2 border-[#25d366]/40 bg-[#25d366]/10 p-6 text-center transition hover:bg-[#25d366]/20"
        >
          <WhatsAppIcon className="mx-auto h-7 w-7 text-[#1da851]" />
          <p className="mt-3 font-display text-lg font-bold text-navy-900">WhatsApp</p>
          <p className="mt-1 font-semibold text-navy-800 group-hover:underline">{ASSO.telephone}</p>
          <p className="mt-2 text-sm text-ink-soft">Délai court ? Écrivez ici.</p>
        </a>

        <a
          href={`mailto:${ASSO.email}`}
          className="group rounded-[var(--radius-carte)] border border-line/80 bg-card p-6 text-center shadow-carte transition hover:border-navy-200"
        >
          <MailIcon className="mx-auto h-7 w-7 text-navy-700" />
          <p className="mt-3 font-display text-lg font-bold text-navy-900">E-mail</p>
          <p className="mt-1 break-all font-semibold text-navy-800 group-hover:underline">{ASSO.email}</p>
          <p className="mt-2 text-sm text-ink-soft">Pour joindre la photo du courrier.</p>
        </a>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <Card title="À joindre">
            <ul className="space-y-2.5">
              {A_PREPARER.map((x) => (
                <li key={x} className="flex gap-3 text-sm text-ink">
                  <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">Il manque quelque chose ? Écrivez quand même.</p>
          </Card>
          <Card title="Vos données personnelles">
            <ul className="space-y-1.5 text-sm leading-relaxed text-ink-soft">
              <li>La photo du courrier reste dans votre navigateur.</li>
              <li>Vos dossiers : visibles par vous seul, supprimables depuis votre compte.</li>
              <li>
                Le formulaire : sert à vous répondre, effacé après 12 mois. Plus tôt ?{" "}
                <a href={`mailto:${ASSO.email}`} className="font-semibold text-navy-700 underline">
                  {ASSO.email}
                </a>
              </li>
            </ul>
            <p className="mt-3 text-sm">
              <Link href="/confidentialite" className="font-semibold text-navy-700 underline">
                Politique de confidentialité
              </Link>
            </p>
          </Card>
        </div>

        <Card title="Formulaire" subtitle="Réponse par e-mail.">
          <FormulaireContact sujetInitial={sujetInitial} />
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            Membre ? Demandez l&apos;aide depuis votre dossier : on aura tout sous les yeux.
          </p>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <LinkBtn href="/#analyser" variant="gold">
          Vérifier ma lettre
        </LinkBtn>
      </div>
    </div>
  );
}
