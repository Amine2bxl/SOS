import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { communes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";
import { SectionCard, LinkBtn } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CommunePage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSeeded();
  const { slug } = await params;
  const [c] = await db.select().from(communes).where(eq(communes.slug, slug));
  if (!c) notFound();

  const all = await db.select({ slug: communes.slug, nom: communes.nom }).from(communes).orderBy(asc(communes.nom));

  const champs: [string, string | null][] = [
    ["Gestionnaire du stationnement", c.gestionnaire],
    ["Types de zones", c.zones],
    ["Modalités de paiement", c.paiement],
    ["Cartes et dérogations", c.cartes],
    ["Procédure de contestation", c.contestation],
    ["Stades de recouvrement", c.recouvrement],
    ["Coordonnées officielles", c.coordonnees],
    ["Documents à conserver", c.documents],
    ["Règlements applicables", c.reglements],
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/communes" className="text-sm font-semibold text-navy-700 hover:underline">← Les 19 communes</Link>
      <h1 className="mt-2 font-display text-4xl font-black text-navy-900">{c.nom}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Fiche pédagogique · Dernière vérification : <span className="font-semibold text-navy-800">{c.derniereVerification}</span>
      </p>

      {c.alertes && (
        <p className="mt-4 rounded-lg border border-warn-600/30 bg-warn-100 px-4 py-3 text-sm font-medium text-warn-700">
          ⚠ Particularité locale : {c.alertes}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {champs.map(([k, v]) => (
          <SectionCard key={k} className={k === "Gestionnaire du stationnement" || k === "Procédure de contestation" ? "sm:col-span-2" : ""}>
            <h2 className="font-display text-base font-bold text-navy-900">{k}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{v}</p>
          </SectionCard>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {all.filter((x) => x.slug !== slug).slice(0, 6).map((x) => (
            <Link key={x.slug} href={`/communes/${x.slug}`} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-soft hover:border-navy-700/50">
              {x.nom}
            </Link>
          ))}
        </div>
        <LinkBtn href="/analyser" variant="gold">Analyser un dossier à {c.nom}</LinkBtn>
      </div>
    </div>
  );
}
