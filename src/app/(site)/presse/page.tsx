import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES_TRIES, RUBRIQUES, dateParution, domaineSource } from "@/lib/presse";
import { PhotoArticle } from "@/components/site/PhotoArticle";
import { IconeFleche } from "@/components/icones";

export const metadata: Metadata = {
  title: "Dans la presse",
  description:
    "La DH, L'Avenir, Bruxelles Today, Bladi.net : les vrais articles qui parlent de SOS Citizens et de Mohamed Azouzi, avec le lien vers chaque article.",
};

export default async function PressePage({ searchParams }: { searchParams: Promise<{ rubrique?: string }> }) {
  const { rubrique } = await searchParams;
  const filtre = RUBRIQUES.find((r) => r === rubrique) ?? null;
  const articles = filtre ? ARTICLES_TRIES.filter((a) => a.rubrique === filtre) : ARTICLES_TRIES;
  const [une, ...suite] = articles;
  const journaux = Array.from(new Set(ARTICLES_TRIES.map((a) => a.journal)));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-[2rem] font-extrabold leading-[1.08] text-navy-900 sm:text-[2.6rem]">
          Ils parlent de nous
        </h1>
        <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-soft">
          {ARTICLES_TRIES.length} articles : {journaux.join(", ")}. Cliquez pour lire chez le journal.
        </p>
      </header>

      <nav aria-label="Thèmes" className="mt-7 flex flex-wrap gap-2">
        <Filtre actif={!filtre} href="/presse">
          Tout
        </Filtre>
        {RUBRIQUES.map((r) => (
          <Filtre key={r} actif={filtre === r} href={`/presse?rubrique=${encodeURIComponent(r)}`}>
            {r}
          </Filtre>
        ))}
      </nav>

      {une && (
        <article className="mt-8 grid overflow-hidden rounded-[var(--radius-carte)] bg-navy-900 text-white shadow-carte md:grid-cols-[1.1fr_1fr]">
          <PhotoArticle article={une} className="aspect-[1200/630] md:aspect-auto md:h-full" />
          <div className="flex flex-col p-6 sm:p-8">
            <p className="text-sm text-navy-100">
              {une.journal} · <time dateTime={une.date}>{dateParution(une.date)}</time>
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight text-balance">{une.titre}</h2>
            <p className="mt-3 leading-relaxed text-navy-100">{une.resume}</p>
            {une.chiffre && (
              <p className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-gold-400 tabular-nums">{une.chiffre.valeur}</span>
                <span className="text-sm text-navy-100">{une.chiffre.libelle}</span>
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-3 pt-6">
              <a
                href={une.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-gold-400 px-5 font-bold text-navy-950 transition hover:bg-gold-300"
              >
                Lire sur {domaineSource(une)}
                <IconeFleche className="h-4 w-4 -rotate-45" />
              </a>
              <Link href={`/presse/${une.slug}`} className="inline-flex h-11 items-center px-2 font-semibold text-navy-100 hover:text-white">
                Résumé
              </Link>
            </div>
          </div>
        </article>
      )}

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {suite.map((a) => (
          <li key={a.slug}>
            <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
              <PhotoArticle article={a} className="aspect-[1200/630]" />
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs text-ink-faint">
                  {a.journal} · <time dateTime={a.date}>{dateParution(a.date)}</time>
                </p>
                <h2 className="mt-1.5 font-display text-lg font-bold leading-snug text-navy-900 text-balance">
                  <Link href={`/presse/${a.slug}`} className="hover:underline hover:decoration-gold-400 hover:decoration-2 hover:underline-offset-4">
                    {a.titre}
                  </Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.resume}</p>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-navy-700 hover:text-navy-900"
                >
                  Lire sur {domaineSource(a)}
                  <IconeFleche className="h-3.5 w-3.5 -rotate-45" />
                </a>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-ink-faint">
        Articles vérifiés le 16 novembre 2026. Photos et textes : propriété des journaux. Un résultat ne garantit pas le
        suivant.
      </p>
    </div>
  );
}

function Filtre({ actif, href, children }: { actif: boolean; href: string; children: React.ReactNode }) {
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
