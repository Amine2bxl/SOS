import { db } from "@/db";
import { articles } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { PageHead, SectionCard } from "@/components/ui";

export const dynamic = "force-dynamic";

const TYPES = [
  "Presse",
  "Rapports publics",
  "Communications institutionnelles",
  "Analyses SOS Citizens ASBL",
  "Guides",
  "Jurisprudence vérifiée",
  "Évolutions réglementaires",
  "Retours d'expérience anonymisés",
];

export default async function ArticlesPage() {
  await ensureSeeded();
  const rows = await db.select().from(articles);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Veille citoyenne"
        title="Articles, enquêtes et ressources publiques"
        intro="Cette rubrique rassemble des contenus consacrés au stationnement, aux contrôles automatisés, aux procédures de recouvrement et aux droits des citoyens."
      />

      <div className="mt-10 space-y-8">
        {TYPES.map((type) => {
          const items = rows.filter((r) => r.type === type);
          if (items.length === 0) return null;
          return (
            <div key={type}>
              <h2 className="font-display text-xl font-bold text-navy-900">{type}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {items.map((a) => (
                  <SectionCard key={a.id} className="flex flex-col">
                    <p className="font-bold leading-snug text-navy-900">{a.titre}</p>
                    <p className="mt-1 text-xs text-ink-soft">{a.auteurMedia} · {a.datePub}</p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{a.resume}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-navy-800">{a.theme}</span>
                      <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-gold-600">Vérifié : {a.dateVerification}</span>
                    </div>
                  </SectionCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-10 rounded-lg border border-line bg-card p-4 text-center text-xs text-ink-soft">
        La présence d'un article ne signifie pas que SOS Citizens ASBL approuve toutes les opinions qui y sont
        exprimées. Les sources sont vérifiées et datées.
      </p>
    </div>
  );
}
