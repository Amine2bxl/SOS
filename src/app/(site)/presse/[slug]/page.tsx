import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, ARTICLES_TRIES, articleParSlug, dateParution, domaineSource, referenceSource } from "@/lib/presse";
import { PhotoArticle } from "@/components/site/PhotoArticle";
import { LinkBtn } from "@/components/ui";
import { IconeFleche, IconeFlecheGauche, IconeOk } from "@/components/icones";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = articleParSlug(slug);
  if (!a) return { title: "Article introuvable" };
  return { title: a.titre, description: a.resume };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleParSlug(slug);
  if (!article) notFound();

  const i = ARTICLES_TRIES.findIndex((a) => a.slug === slug);
  const suivant = ARTICLES_TRIES[i + 1] ?? ARTICLES_TRIES[0];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <Link href="/presse" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900">
        <IconeFlecheGauche className="h-4 w-4" />
        Tous les articles
      </Link>

      <p className="mt-6 text-sm text-ink-soft">
        {article.journal} · <time dateTime={article.date}>{dateParution(article.date)}</time>
      </p>
      <h1 className="mt-2 font-display text-[1.9rem] font-extrabold leading-[1.12] text-navy-900 text-balance sm:text-[2.4rem]">
        {article.titre}
      </h1>

      <PhotoArticle article={article} className="mt-6 aspect-[1200/630] rounded-[var(--radius-carte)]" />

      <p className="mt-6 text-lg leading-relaxed text-ink">{article.resume}</p>

      <ul className="mt-5 space-y-2.5">
        {article.faits.map((f) => (
          <li key={f} className="flex gap-3 leading-relaxed text-ink">
            <IconeOk className="mt-1 h-4 w-4 shrink-0 text-ok-600" />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-[var(--radius-carte)] border border-line bg-card p-5 sm:p-6">
        <p className="text-sm text-ink-soft">{referenceSource(article)}</p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex h-12 items-center gap-2 rounded-full bg-navy-900 px-6 font-bold text-white transition hover:bg-navy-800"
        >
          Lire l&apos;article sur {domaineSource(article)}
          <IconeFleche className="h-4 w-4 -rotate-45" />
        </a>
        <p className="mt-3 text-xs text-ink-faint">Le texte complet et la photo appartiennent au journal.</p>
      </div>

      <div className="mt-8 rounded-[var(--radius-carte)] bg-gold-50 p-6">
        <p className="font-display text-lg font-bold text-navy-900">Vous avez reçu un courrier ?</p>
        <p className="mt-1 text-ink-soft">On le vérifie avec vous, gratuitement.</p>
        <div className="mt-4">
          <LinkBtn href="/#analyser" variant="gold">
            Vérifier mon courrier
            <IconeFleche className="h-5 w-5" />
          </LinkBtn>
        </div>
      </div>

      {suivant && suivant.slug !== article.slug && (
        <Link href={`/presse/${suivant.slug}`} className="group mt-8 block border-t border-line pt-6">
          <span className="text-sm text-ink-faint">Article suivant</span>
          <span className="mt-1 block font-semibold leading-snug text-navy-900 group-hover:underline">{suivant.titre}</span>
        </Link>
      )}
    </article>
  );
}
