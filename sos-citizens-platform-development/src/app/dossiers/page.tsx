import Link from "next/link";
import { db } from "@/db";
import { dossiers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { computeAudit } from "@/lib/audit";
import { labelOf, DOCUMENTS, formatMontant, formatDate } from "@/lib/constants";
import { PageHead, LinkBtn, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DossiersPage() {
  const rows = await db.select().from(dossiers).orderBy(desc(dossiers.updatedAt));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHead
          kicker="Espace citoyen"
          title="Mes dossiers"
          intro="Retrouvez vos analyses en cours, vos courriers générés et le suivi de vos démarches."
        />
        <LinkBtn href="/analyser" variant="gold">+ Nouveau dossier</LinkBtn>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line bg-card p-12 text-center">
          <p className="text-sm text-ink-soft">Aucun dossier pour le moment.</p>
          <p className="mt-1 text-sm text-ink-soft">Lancez une analyse guidée : six étapes pédagogiques pour comprendre et préparer votre démarche.</p>
          <LinkBtn href="/analyser" variant="primary" className="mt-5">Analyser mon dossier</LinkBtn>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {rows.map((d) => {
            const a = computeAudit(d);
            return (
              <Link
                key={d.id}
                href={`/dossiers/${d.id}`}
                className="group rounded-xl border border-line bg-card p-5 shadow-sm transition hover:border-navy-700/50 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-navy-900 group-hover:underline">{d.ref}</span>
                  <StatusBadge status={a.confiance === "A" || a.confiance === "B" ? "ok" : a.confiance === "C" ? "partial" : "risk"} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-ink-soft">Document</p><p className="font-medium">{labelOf(DOCUMENTS, d.documentRecu)}</p></div>
                  <div><p className="text-xs text-ink-soft">Commune</p><p className="font-medium">{d.communeConstat || "—"}</p></div>
                  <div><p className="text-xs text-ink-soft">Plaque</p><p className="font-medium">{d.plaque || "—"}</p></div>
                  <div><p className="text-xs text-ink-soft">Montant</p><p className="font-medium">{formatMontant(d.montantReclame)}</p></div>
                  <div><p className="text-xs text-ink-soft">Constat</p><p className="font-medium">{formatDate(d.chronologie?.["date_constat"])}</p></div>
                  <div><p className="text-xs text-ink-soft">Score</p><p className="font-bold text-navy-800">{a.score}% · {a.label}</p></div>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-line-soft">
                  <div className="h-1.5 rounded-full bg-navy-700" style={{ width: `${a.score}%` }} />
                </div>
                <p className="mt-3 text-xs text-ink-soft">
                  {d.letterGeneratedAt ? "Courrier généré — " : "Analyse en cours — "}
                  mis à jour le {new Date(d.updatedAt).toLocaleDateString("fr-BE")}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
