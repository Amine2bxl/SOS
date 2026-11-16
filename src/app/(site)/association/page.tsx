import type { Metadata } from "next";
import Link from "next/link";
import { ASSO } from "@/lib/data";
import { ARTICLES_TRIES, dateParution } from "@/lib/presse";
import { LinkBtn } from "@/components/ui";
import {
  IconeBalance,
  IconeFleche,
  IconeHotelDeVille,
  IconeMainTendue,
  IconePanneauP,
  IconePvPolice,
  IconeTampon,
} from "@/components/icones";

export const metadata: Metadata = {
  title: "L'association",
  description:
    "SOS Citizens est une association sans but lucratif bruxelloise. Elle informe, accompagne et défend les citoyens face aux redevances de stationnement, aux amendes, aux sanctions communales et aux administrations.",
};

/**
 * Les domaines où l'association intervient. Le premier est outillé de bout en
 * bout par le moteur ; les autres passent par un échange écrit avec
 * l'association. La page le dit : on ne laisse pas croire qu'un outil existe
 * là où c'est une personne qui répond.
 */
const DOMAINES = [
  {
    Icone: IconePanneauP,
    titre: "Stationnement et redevances",
    texte:
      "Redevances, rappels, mises en demeure, recouvrement par huissier. Le moteur lit votre courrier, vérifie chaque élément et prépare la réponse.",
    outille: true,
    sujet: "redevance",
  },
  {
    Icone: IconePvPolice,
    titre: "Amendes routières",
    texte:
      "Procès-verbaux, perceptions immédiates, propositions de transaction : la régularité du constat, les délais et les droits de la défense.",
    sujet: "amende",
  },
  {
    Icone: IconeTampon,
    titre: "Sanctions administratives communales",
    texte:
      "Les SAC décidées par la commune : la motivation de la décision, le droit d'être entendu, la proportionnalité et les délais de recours.",
    sujet: "sac",
  },
  {
    Icone: IconeHotelDeVille,
    titre: "Relations avec les administrations",
    texte:
      "Une décision sans motivation, un courrier resté sans réponse, un retard injustifié : obtenir une réponse écrite et motivée.",
    sujet: "administration",
  },
  {
    Icone: IconeBalance,
    titre: "Médiation et litiges",
    texte:
      "Chercher d'abord une issue amiable, par écrit et documentée, avant toute procédure. Et savoir quand il faut un avocat.",
    sujet: "mediation",
  },
  {
    Icone: IconeMainTendue,
    titre: "Accompagnement citoyen",
    texte:
      "Comprendre un document, savoir à qui s'adresser, rassembler ses preuves. L'association répond par écrit, pour qu'une trace reste.",
    sujet: "autre",
  },
];

const PRINCIPES = [
  {
    titre: "Vérifier avant de conclure",
    texte:
      "Chaque dossier est examiné sur pièces : le constat, le montant, les délais, la procédure suivie. Une conclusion s'explique et se vérifie, ou elle n'est pas donnée.",
  },
  {
    titre: "Ne rien promettre",
    texte:
      "Personne ne peut garantir une annulation. L'association dit quand un dossier tient, et aussi quand il vaut mieux payer.",
  },
  {
    titre: "Agir avec votre accord",
    texte:
      "L'association n'ouvre un dossier qu'avec votre mandat, limité au dossier choisi, et que vous pouvez retirer à tout moment. Rien n'est envoyé en votre nom sans votre feu vert.",
  },
  {
    titre: "Rester à sa place",
    texte:
      "SOS Citizens n'est ni une administration, ni un tribunal, ni un cabinet d'avocats. Quand un dossier exige un professionnel, l'association vous oriente vers lui.",
  },
];

export default function AssociationPage() {
  const recents = ARTICLES_TRIES.slice(0, 3);

  return (
    <div>
      {/* ------------------------------------------------------------- tête */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="motif-points absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-12 sm:px-6 lg:pb-20 lg:pt-16">
          <h1 className="max-w-3xl font-display text-[2.4rem] font-extrabold leading-[1.04] text-balance sm:text-[3.4rem]">
            Vos droits méritent une réponse écrite et motivée.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-100">
            {ASSO.nom} est une association sans but lucratif bruxelloise. Elle informe les citoyens, les accompagne dans
            leurs démarches et porte leur voix auprès des institutions — à commencer par les redevances de
            stationnement dans les 19 communes de Bruxelles-Capitale.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkBtn href="/#analyser" variant="gold" taille="lg">
              Vérifier une redevance
              <IconeFleche className="h-5 w-5" />
            </LinkBtn>
            <LinkBtn href="/contact" variant="outline" taille="lg">
              Nous écrire
            </LinkBtn>
          </div>
        </div>
        <div className="motif-marquage h-2" aria-hidden="true" />
      </section>

      {/* ---------------------------------------------------------- missions */}
      <section id="missions" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">Nos domaines d&apos;intervention</h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-soft">
            Le stationnement est outillé de bout en bout. Pour le reste, c&apos;est l&apos;association qui vous répond,
            par écrit.
          </p>
        </div>

        <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {DOMAINES.map(({ Icone, titre, texte, outille, sujet }) => (
            <li key={titre} className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
                <Icone className="h-8 w-8" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-navy-900">{titre}</h3>
                <p className="mt-1 leading-relaxed text-ink-soft">{texte}</p>
                <Link
                  href={outille ? "/#analyser" : `/contact?sujet=${sujet}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-700"
                >
                  {outille ? "Analyser mon courrier" : "Exposer ma situation"}
                  <IconeFleche className="h-3.5 w-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------- principes */}
      <section className="border-y border-line bg-card py-16 lg:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">Notre façon de faire</h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-soft">
              Quatre règles, qui valent pour les bénévoles comme pour le moteur d&apos;analyse.
            </p>
          </div>
          <dl className="space-y-7">
            {PRINCIPES.map((p) => (
              <div key={p.titre} className="border-t-2 border-navy-900 pt-3">
                <dt className="font-display text-lg font-bold text-navy-900">{p.titre}</dt>
                <dd className="mt-1 leading-relaxed text-ink-soft">{p.texte}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------ presse */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">Ce que la presse en dit</h2>
          <Link href="/presse" className="inline-flex items-center gap-1.5 font-semibold text-navy-700 hover:text-navy-900">
            Toute la revue de presse
            <IconeFleche className="h-4 w-4" />
          </Link>
        </div>
        <ol className="mt-8 divide-y divide-line border-y border-line">
          {recents.map((a) => (
            <li key={a.slug}>
              <Link href={`/presse/${a.slug}`} className="group grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <span className="text-sm text-ink-faint">
                  {dateParution(a.date)} · {a.source.journal}
                </span>
                <span className="font-display text-lg font-bold leading-snug text-navy-900 group-hover:underline group-hover:decoration-gold-400 group-hover:decoration-2 group-hover:underline-offset-4">
                  {a.titre}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------- identité */}
      <section className="bg-paper pb-16 lg:pb-20">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-start">
          <div className="rounded-[var(--radius-carte)] border border-line bg-card p-6 sm:p-8">
            <h2 className="font-display text-2xl font-extrabold text-navy-900">Qui sommes-nous ?</h2>
            <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[9rem_1fr]">
              <dt className="text-ink-faint">Dénomination</dt>
              <dd className="font-semibold text-navy-900">{ASSO.nom}</dd>
              <dt className="text-ink-faint">Forme</dt>
              <dd className="text-navy-900">{ASSO.formeJuridique}</dd>
              <dt className="text-ink-faint">Numéro d&apos;entreprise</dt>
              <dd className="tabular-nums text-navy-900">BCE {ASSO.bce} · RPM Bruxelles</dd>
              <dt className="text-ink-faint">Siège</dt>
              <dd className="text-navy-900">
                {ASSO.rue}, {ASSO.codePostal} {ASSO.ville}
              </dd>
              <dt className="text-ink-faint">Constitution</dt>
              <dd className="text-navy-900">
                Acte déposé le {ASSO.constitution}, publié aux annexes du Moniteur belge le 20 août 2024
              </dd>
              <dt className="text-ink-faint">Président</dt>
              <dd className="text-navy-900">{ASSO.president}</dd>
              <dt className="text-ink-faint">Administrateurs</dt>
              <dd className="text-navy-900">{ASSO.administrateurs.join(", ")}</dd>
            </dl>
            <p className="mt-6 border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
              Une association indépendante : ni une administration publique, ni une autorité judiciaire, ni un cabinet
              d&apos;avocats.
            </p>
          </div>

          <div className="rounded-[var(--radius-carte)] bg-navy-900 p-6 text-white sm:p-8">
            <div>
              <h2 className="font-display text-2xl font-extrabold">Soutenir l&apos;association</h2>
              <p className="mt-3 leading-relaxed text-navy-100">
                L&apos;association vit des adhésions de ses membres et des dons. Chaque contribution finance l&apos;outil,
                l&apos;accompagnement des dossiers et le travail d&apos;information — quel qu&apos;en soit le montant.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <LinkBtn href="/don" variant="gold">
                Faire un don
              </LinkBtn>
              <LinkBtn href="/tarifs" variant="outline">
                Devenir membre
              </LinkBtn>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
