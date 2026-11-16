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
  "Une photo ou un scan du courrier que vous avez reçu",
  "La référence du dossier et la date du constat",
  "Vos preuves : reçu, capture de l'application, photos du lieu",
  "En une phrase : ce qui s'est passé selon vous",
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
        kicker="Contact"
        title="Parlons de votre dossier"
        intro="Un message suffit. Nous sommes une petite association : ce sont nos bénévoles qui vous répondent, par écrit — c'est le plus sûr pour garder une trace de votre dossier."
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
          <p className="mt-3 font-display text-lg font-bold text-navy-900">Écrivez-nous sur WhatsApp</p>
          <p className="mt-1 font-semibold text-navy-800 group-hover:underline">{ASSO.telephone}</p>
          <p className="mt-2 text-sm text-ink-soft">Le plus rapide, surtout si votre délai est court.</p>
        </a>

        <a
          href={`mailto:${ASSO.email}`}
          className="group rounded-[var(--radius-carte)] border border-line/80 bg-card p-6 text-center shadow-carte transition hover:border-navy-200"
        >
          <MailIcon className="mx-auto h-7 w-7 text-navy-700" />
          <p className="mt-3 font-display text-lg font-bold text-navy-900">Écrivez-nous</p>
          <p className="mt-1 break-all font-semibold text-navy-800 group-hover:underline">{ASSO.email}</p>
          <p className="mt-2 text-sm text-ink-soft">Idéal pour joindre une photo de votre courrier.</p>
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-ink-soft">
        Pas de ligne d&apos;appel direct : nous répondons par écrit, et nous rappelons si nécessaire en
        cas d&apos;urgence.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Ce qu'il faut nous préparer" subtitle="Avec ces éléments, nous pouvons vous aider tout de suite.">
          <ul className="space-y-2.5">
            {A_PREPARER.map((x) => (
              <li key={x} className="flex gap-3 text-sm text-ink">
                <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
                {x}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            Il vous manque des éléments ? Écrivez-nous quand même, nous vous dirons quoi chercher.
          </p>
        </Card>

        <Card title="Écrire à l'association" subtitle="Le message nous arrive directement ; la réponse vous parvient par e-mail.">
          <FormulaireContact sujetInitial={sujetInitial} />
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            Déjà membre ? Pour un dossier précis, demandez l&apos;accompagnement depuis la fiche du dossier : nous
            aurons tout sous les yeux.
          </p>
        </Card>
      </div>

      {/* L'ASSOCIATION */}
      <Card title="L'association" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          {ASSO.nom} est une association sans but lucratif, créée le {ASSO.constitution} à Bruxelles,
          qui aide les automobilistes à se défendre face à une redevance de stationnement — aujourd&apos;hui
          dans les 19 communes de la Région de Bruxelles-Capitale. Identité ci-dessous ; notre rôle exact est décrit dans les mentions légales.
        </p>

        <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-navy-900">Dénomination</dt>
            <dd className="text-ink-soft">{ASSO.nom}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Forme juridique</dt>
            <dd className="text-ink-soft">{ASSO.formeJuridique}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Numéro d&apos;entreprise</dt>
            <dd className="text-ink-soft">{ASSO.bce}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Date de constitution</dt>
            <dd className="text-ink-soft">{ASSO.constitution}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Président</dt>
            <dd className="text-ink-soft">{ASSO.president}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Administrateurs</dt>
            <dd className="text-ink-soft">{ASSO.administrateurs.join(", ")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-navy-900">Siège social</dt>
            <dd className="text-ink-soft">
              {ASSO.rue}, {ASSO.codePostal} {ASSO.ville}, {ASSO.pays}
            </dd>
          </div>
        </dl>
      </Card>

      {/* DONNÉES PERSONNELLES */}
      <Card title="Vos données personnelles" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Votre courrier est lu dans votre navigateur : la photo ou le PDF n&apos;est envoyé nulle part.
          Si vous créez un compte, vos dossiers sont conservés pour vous seul, et vous pouvez tout
          supprimer vous-même, à tout moment, depuis votre compte.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Si vous nous écrivez par le formulaire, votre nom, votre e-mail et votre message servent uniquement à vous
          répondre ; ils sont effacés au plus tard après douze mois. Demandez leur suppression plus tôt quand vous le
          souhaitez à{" "}
          <a href={`mailto:${ASSO.email}`} className="font-semibold text-navy-700 underline">
            {ASSO.email}
          </a>
          .
        </p>
        <p className="mt-3 text-sm">
          <Link href="/confidentialite" className="font-semibold text-navy-700 underline">
            Voir notre politique de confidentialité (RGPD)
          </Link>
        </p>
      </Card>

      <div className="mt-8 text-center">
        <LinkBtn href="/#analyser" variant="gold">
          Analyser mon courrier
        </LinkBtn>
      </div>
    </div>
  );
}
