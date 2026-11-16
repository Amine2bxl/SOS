import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES_TRIES, RUBRIQUES, dateParution } from "@/lib/presse";
import { IconeFleche } from "@/components/icones";

export const metadata: Metadata = {
  title: "Dans la presse",
  description:
    "Ce que la presse a écrit sur l'action de SOS Citizens : redevances annulées, scan-cars, horodateurs et voirie à Bruxelles. Résumés et références des articles d'origine.",
};

export default async function PressePage({ searchParams }: { searchParams: Promise<{ rubrique?: string }> }) {
  const { rubrique } = await searchParams;
  const filtre = RUBRIQUES.find((r) => r === rubrique) ?? null;
  const articles = filtre ? ARTICLES_TRIES.filter((a) => a.rubrique === filtre) : ARTICLES_TRIES;
  const [une, ...suite] = articles;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-[2rem] font-extrabold leading-[1.08] text-navy-900 sm:text-[2.6rem]">
          Dans la presse
        </h1>
        <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-soft">
          Redevances annulées, scan-cars, horodateurs, voirie : ce que les journaux ont rapporté de l&apos;action de
          l&apos;association. Les victoires, et aussi les défaites.
        </p>
      </header>

      <nav aria-label="Rubriques" className="mt-8 flex flex-wrap gap-2">
        <FiltreRubrique actif={!filtre} href="/presse">
          Tout
        </FiltreRubrique>
        {RUBRIQUES.map((r) => (
          <FiltreRubrique key={r} actif={filtre === r} href={`/presse?rubrique=${encodeURIComponent(r)}`}>
            {r}
          </FiltreRubrique>
        ))}
      </nav>

      {une && (
        <article className="mt-8 overflow-hidden rounded-[var(--radius-carte)] bg-navy-900 text-white shadow-carte">
          <Link href={`/presse/${une.slug}`} className="group block p-6 sm:p-8">
            <p className="text-sm text-navy-100">
              <time dateTime={une.date}>{dateParution(une.date)}</time> · {une.source.journal} · {une.rubrique}
            </p>
            <div className="mt-3 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <h2 className="font-display text-2xl font-extrabold leading-tight text-balance sm:text-[2rem]">
                  {une.titre}
                </h2>
                <p className="mt-3 max-w-xl leading-relaxed text-navy-100">{une.chapo}</p>
              </div>
              {une.chiffre && (
                <p className="sm:text-right">
                  <span className="block font-display text-5xl font-extrabold leading-none text-gold-400 tabular-nums">
                    {une.chiffre.valeur}
                  </span>
                  <span className="mt-1 block text-sm text-navy-100">{une.chiffre.libelle}</span>
                </p>
              )}
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-gold-300 transition-transform duration-200 group-hover:translate-x-0.5">
              Lire le résumé
              <IconeFleche className="h-4 w-4" />
            </span>
          </Link>
        </article>
      )}

      <ol className="mt-4 divide-y divide-line border-y border-line">
        {suite.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/presse/${a.slug}`}
              className="group grid gap-1 py-6 transition-colors sm:grid-cols-[9.5rem_1fr] sm:gap-6"
            >
              <p className="text-sm text-ink-faint">
                <time dateTime={a.date}>{dateParution(a.date)}</time>
                <span className="block">{a.source.journal}</span>
              </p>
              <div>
                <p className="text-xs font-bold text-navy-600">{a.rubrique}</p>
                <h2 className="mt-1 font-display text-xl font-bold leading-snug text-navy-900 text-balance group-hover:underline group-hover:decoration-gold-400 group-hover:decoration-2 group-hover:underline-offset-4">
                  {a.titre}
                </h2>
                <p className="mt-1.5 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">{a.chapo}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-ink-faint">
        Résumés rédigés par l&apos;association. Les articles, leurs photos et leurs unes appartiennent à leurs éditeurs :
        chaque résumé donne la référence de l&apos;édition d&apos;origine. Chaque dossier est différent : un résultat
        obtenu dans l&apos;un ne garantit pas l&apos;issue d&apos;un autre.
      </p>
    </div>
  );
}

function FiltreRubrique({ actif, href, children }: { actif: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
        actif ? "bg-navy-900 text-white" : "border border-line bg-card text-navy-800 hover:border-navy-200"
      }`}
    >
      {children}
    </Link>
  );
}
