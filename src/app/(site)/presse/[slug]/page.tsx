import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, ARTICLES_TRIES, articleParSlug, dateParution, referenceSource } from "@/lib/presse";
import { LinkBtn } from "@/components/ui";
import { IconeFleche, IconeFlecheGauche } from "@/components/icones";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = articleParSlug(slug);
  if (!a) return { title: "Article introuvable" };
  return {
    title: a.titre,
    description: a.chapo,
    openGraph: { title: a.titre, description: a.chapo, type: "article", publishedTime: a.date },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleParSlug(slug);
  if (!article) notFound();

  const i = ARTICLES_TRIES.findIndex((a) => a.slug === slug);
  const precedent = ARTICLES_TRIES[i + 1] ?? null;
  const suivant = i > 0 ? ARTICLES_TRIES[i - 1] : null;
  const s = article.source;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <Link
        href="/presse"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900"
      >
        <IconeFlecheGauche className="h-4 w-4" />
        Tous les articles
      </Link>

      <header className="mt-6">
        <p className="text-sm text-ink-soft">
          <time dateTime={article.date}>{dateParution(article.date)}</time> · {s.journal} ·{" "}
          <Link href={`/presse?rubrique=${encodeURIComponent(article.rubrique)}`} className="font-semibold text-navy-700 hover:underline">
            {article.rubrique}
          </Link>
        </p>
        <h1 className="mt-3 font-display text-[2rem] font-extrabold leading-[1.1] text-navy-900 text-balance sm:text-[2.5rem]">
          {article.titre}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{article.chapo}</p>
      </header>

      {article.chiffre && (
        <p className="mt-8 flex items-baseline gap-3 border-y border-line py-5">
          <span className="font-display text-4xl font-extrabold text-navy-900 tabular-nums">{article.chiffre.valeur}</span>
          <span className="text-ink-soft">{article.chiffre.libelle}</span>
        </p>
      )}

      <div className="mt-8 max-w-[65ch] space-y-5 text-[1.05rem] leading-relaxed text-ink">
        {article.resume.map((p) => (
          <p key={p.slice(0, 32)}>{p}</p>
        ))}
      </div>

      {article.aRetenir && (
        <aside className="mt-8 rounded-[var(--radius-carte)] bg-gold-50 p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-navy-900">Ce qu&apos;on en retient</h2>
          <p className="mt-1.5 leading-relaxed text-ink">{article.aRetenir}</p>
        </aside>
      )}

      <section aria-labelledby="source" className="mt-10 rounded-[var(--radius-carte)] border border-line bg-card p-5 sm:p-6">
        <h2 id="source" className="font-display text-base font-bold text-navy-900">
          L&apos;article d&apos;origine
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="text-ink-faint">Titre</dt>
          <dd className="font-semibold text-navy-900">{s.titre}</dd>
          <dt className="text-ink-faint">Parution</dt>
          <dd className="text-navy-900">{referenceSource(article)}</dd>
          {s.journaliste && (
            <>
              <dt className="text-ink-faint">Journaliste</dt>
              <dd className="text-navy-900">{s.journaliste}</dd>
            </>
          )}
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Résumé rédigé par l&apos;association. Le texte complet, les photos et la une appartiennent à l&apos;éditeur :
          consultez l&apos;édition d&apos;origine. Chaque dossier est différent : ce résultat ne garantit pas l&apos;issue
          d&apos;un autre.
        </p>
      </section>

      <div className="mt-10 rounded-[var(--radius-carte)] bg-navy-900 p-6 text-white sm:p-8">
        <p className="font-display text-xl font-bold">Un courrier du même genre ?</p>
        <p className="mt-1.5 text-navy-100">Le moteur le lit et vous dit, point par point, ce qui tient.</p>
        <div className="mt-5">
          <LinkBtn href="/#analyser" variant="gold">
            Analyser mon courrier
            <IconeFleche className="h-5 w-5" />
          </LinkBtn>
        </div>
      </div>

      <nav aria-label="Autres articles" className="mt-10 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        {precedent ? (
          <Link href={`/presse/${precedent.slug}`} className="group">
            <span className="text-sm text-ink-faint">Article précédent</span>
            <span className="mt-1 block font-semibold leading-snug text-navy-900 group-hover:underline">{precedent.titre}</span>
          </Link>
        ) : (
          <span />
        )}
        {suivant && (
          <Link href={`/presse/${suivant.slug}`} className="group sm:text-right">
            <span className="text-sm text-ink-faint">Article suivant</span>
            <span className="mt-1 block font-semibold leading-snug text-navy-900 group-hover:underline">{suivant.titre}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
