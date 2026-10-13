import type { Metadata } from "next";
import Link from "next/link";
import { rechercherSavoir, tailleBase } from "@/cerveau";
import { FICHES, type Fiche } from "@/cerveau/base/savoir";
import { BoutonContact } from "@/components/Contact";
import { IconeBouee, IconeChevron, IconeLibre, IconeMainTendue } from "@/components/icones";
import { ChampQuestion } from "./ChampQuestion";

export const metadata: Metadata = { title: "Aide" };
export const dynamic = "force-dynamic";

const CATEGORIES: { id: Fiche["categorie"]; titre: string; icone: string }[] = [
  { id: "procedure", titre: "La procédure, étape par étape", icone: "mise-en-demeure" },
  { id: "moyens", titre: "Les arguments qui marchent", icone: "balance" },
  { id: "preuves", titre: "Les preuves à réunir", icone: "preuve" },
  { id: "droits", titre: "Vos droits", icone: "bouclier" },
  { id: "pratique", titre: "En pratique", icone: "ampoule" },
  { id: "regions", titre: "Bruxelles-Capitale, et les régions à venir", icone: "belgique" },
  { id: "corpus", titre: "Les ressources de l'association", icone: "dossiers" },
];

/**
 * Le développement d'une fiche, sans redire la réponse courte : les fiches
 * dérivées du site commencent souvent par elle.
 */
function suite(texte: string, reponse: string): string {
  const t = texte.trim();
  const r = reponse.trim();
  if (t === r) return "";
  return t.startsWith(r) ? t.slice(r.length).trim() : t;
}

export default async function Aide({ searchParams }: { searchParams: Promise<{ q?: string; fiche?: string }> }) {
  const { q, fiche: idFiche } = await searchParams;
  const question = (q ?? "").trim().slice(0, 300);
  const resultats = question ? rechercherSavoir(question, 5) : [];
  const ficheOuverte = idFiche ? FICHES.find((f) => f.id === idFiche) : undefined;
  const base = tailleBase();

  const [premiere, ...autres] = resultats;
  const ficheComplete = premiere ? FICHES.find((f) => f.id === premiere.id) : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <header>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white">
            <IconeBouee className="h-8 w-8" />
          </span>
          <h1 className="font-display text-[2rem] font-extrabold leading-tight text-navy-900">Aide</h1>
        </div>
        <p className="mt-3 text-[1.05rem] text-ink-soft">
          Posez votre question comme vous la poseriez à quelqu&apos;un. La réponse vient de notre base de savoir :{" "}
          {base.fiches + base.passagesCorpus} fiches, vérifiées par l&apos;association.
        </p>
      </header>

      <ChampQuestion initiale={question} />

      {/* -------------------------------------------------------- une réponse */}
      {question && premiere && (
        <section className="animate-rise mt-6 space-y-4">
          <article className="overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
            <div className="motif-marquage h-1.5" aria-hidden="true" />
            <div className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">La réponse</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-navy-900">{premiere.titre}</h2>
              <p className="mt-3 text-[1.02rem] font-medium leading-relaxed text-navy-900">{premiere.reponse}</p>
              {ficheComplete?.texte && suite(ficheComplete.texte, premiere.reponse) && (
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{suite(ficheComplete.texte, premiere.reponse)}</p>
              )}
              {premiere.categorie === "corpus" && premiere.extrait && (
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{premiere.extrait}</p>
              )}
              {premiere.source && <p className="mt-3 text-xs text-ink-faint">Source : {premiere.source}</p>}
            </div>
          </article>

          {autres.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-navy-900">À lire aussi</h3>
              <ul className="mt-2 space-y-2">
                {autres.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/tableau-de-bord/aide?fiche=${encodeURIComponent(r.id)}`}
                      className="group block rounded-2xl border border-line bg-card p-4 transition hover:border-navy-200"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-navy-900">{r.titre}</span>
                        <IconeChevron className="h-4 w-4 shrink-0 -rotate-90 text-ink-faint transition group-hover:translate-x-0.5" />
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm text-ink-soft">{r.reponse}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {question && !premiere && (
        <section className="mt-6 rounded-[var(--radius-carte)] border-2 border-dashed border-line p-6 text-center">
          <p className="font-display text-lg font-bold text-navy-900">Pas de réponse dans notre base</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Reformulez avec d&apos;autres mots — « rappel », « huissier », « horodateur »… — ou posez-la directement à
            l&apos;association.
          </p>
          <div className="mt-4">
            <BoutonContact variante="secondaire">Poser ma question</BoutonContact>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ une fiche lue */}
      {!question && ficheOuverte && (
        <article className="animate-rise mt-6 overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
          <div className="motif-marquage h-1.5" aria-hidden="true" />
          <div className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-extrabold text-navy-900">{ficheOuverte.titre}</h2>
            <p className="mt-3 text-[1.02rem] font-medium leading-relaxed text-navy-900">{ficheOuverte.reponse}</p>
            {ficheOuverte.texte && suite(ficheOuverte.texte, ficheOuverte.reponse) && (
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{suite(ficheOuverte.texte, ficheOuverte.reponse)}</p>
            )}
            <Link href="/tableau-de-bord/aide" className="mt-5 inline-block text-sm font-semibold text-navy-700 underline underline-offset-4">
              Toutes les fiches
            </Link>
          </div>
        </article>
      )}

      {/* --------------------------------------------- parcourir les fiches */}
      {!question && !ficheOuverte && (
        <section className="mt-8 space-y-3">
          <h2 className="font-display text-lg font-bold text-navy-900">Parcourir</h2>
          {CATEGORIES.map((c) => {
            const fiches = FICHES.filter((f) => f.categorie === c.id);
            if (fiches.length === 0) return null;
            return (
              <details key={c.id} className="group rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
                    <IconeLibre nom={c.icone} className="h-6 w-6" />
                  </span>
                  <span className="flex-1 font-semibold text-navy-900">{c.titre}</span>
                  <span className="text-xs font-semibold text-ink-faint">{fiches.length}</span>
                  <IconeChevron className="h-4 w-4 text-navy-700 transition group-open:rotate-180" />
                </summary>
                <ul className="border-t border-line px-2 py-2">
                  {fiches.map((f) => (
                    <li key={f.id}>
                      <Link
                        href={`/tableau-de-bord/aide?fiche=${encodeURIComponent(f.id)}`}
                        className="block rounded-xl px-3 py-2.5 text-sm text-navy-900 transition hover:bg-paper"
                      >
                        {f.titre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </section>
      )}

      <section className="mt-8 flex flex-col items-start gap-4 rounded-[var(--radius-carte)] bg-navy-900 p-5 text-white sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-navy-900">
          <IconeMainTendue className="h-8 w-8" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold">Un cas que la base ne couvre pas ?</p>
          <p className="text-sm text-navy-100">L&apos;association répond par écrit, par WhatsApp ou par e-mail.</p>
        </div>
        <BoutonContact variante="gold">Nous écrire</BoutonContact>
      </section>
    </div>
  );
}
