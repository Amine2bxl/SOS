import { db } from "@/db";
import { faqs } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { PageHead, SectionCard, LinkBtn } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  await ensureSeeded();
  const rows = await db.select().from(faqs);
  const cats = [...new Set(rows.map((r) => r.categorie ?? "Général"))];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Questions fréquentes"
        title="Comprendre en deux minutes"
        intro="Les réponses aux questions les plus fréquentes sur les redevances de stationnement, la procédure et la plateforme."
      />
      <div className="mt-10 space-y-8">
        {cats.map((cat) => (
          <div key={cat}>
            <h2 className="font-display text-lg font-bold text-gold-600">{cat}</h2>
            <SectionCard className="mt-3 divide-y divide-line-soft p-0">
              {rows.filter((r) => (r.categorie ?? "Général") === cat).map((r) => (
                <details key={r.id} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-navy-900">
                    {r.question}
                    <span className="text-navy-700 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{r.reponse}</p>
                </details>
              ))}
            </SectionCard>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <LinkBtn href="/contact" variant="secondary">Poser une question</LinkBtn>
        <LinkBtn href="/analyser" variant="gold" className="ml-2">Analyser mon dossier</LinkBtn>
      </div>
    </div>
  );
}
