import Link from "next/link";
import { db } from "@/db";
import { communes } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";
import { PageHead, SectionCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CommunesPage() {
  await ensureSeeded();
  const rows = await db.select().from(communes).orderBy(asc(communes.nom));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Région de Bruxelles-Capitale"
        title="Les 19 communes"
        intro="Le gestionnaire, les zones, les tarifs, les cartes, les modalités de contrôle et les procédures peuvent varier. Chaque fiche présente les informations pertinentes, sous réserve de la vérification de la version applicable à la date des faits."
      />

      <SectionCard className="mt-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <Link
              key={c.slug}
              href={`/communes/${c.slug}`}
              className="group rounded-lg border border-line bg-white p-4 transition hover:border-navy-700/50 hover:shadow-md"
            >
              <p className="font-display text-lg font-bold text-navy-900 group-hover:underline">{c.nom}</p>
              <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{c.zones}</p>
              {c.alertes && <p className="mt-2 line-clamp-1 text-xs font-medium text-warn-700">⚠ {c.alertes}</p>}
            </Link>
          ))}
        </div>
      </SectionCard>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Les fiches sont vérifiées périodiquement. La date de dernière vérification figure sur chaque fiche.
      </p>
    </div>
  );
}
