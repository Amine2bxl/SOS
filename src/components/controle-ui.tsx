import type { EtapeCalcul, PointControle, SoldeReconstruit, StatutControle } from "@/cerveau/types";
import { IconeAttention, IconeChevron, IconeInfo, IconeOk } from "@/components/icones";

/**
 * L'affichage du contrôle : ce que le moteur a vérifié, point par point.
 *
 * Trois verdicts, trois formes distinctes — pas seulement trois couleurs : un
 * daltonien doit lire la différence entre « établi » et « anomalie » aussi
 * vite que les autres. L'icône et le mot portent le sens ; la couleur le
 * confirme.
 */

export const VERDICTS: Record<StatutControle, { mot: string; classe: string; Icone: typeof IconeOk }> = {
  etabli: { mot: "Établi", classe: "bg-ok-100 text-ok-700", Icone: IconeOk },
  anomalie: { mot: "Anomalie potentielle", classe: "bg-warn-100 text-warn-700", Icone: IconeAttention },
  indetermine: { mot: "Non déterminable", classe: "bg-navy-50 text-navy-700", Icone: IconeInfo },
};

export function Verdict({ statut }: { statut: StatutControle }) {
  const { mot, classe, Icone } = VERDICTS[statut];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${classe}`}>
      <Icone className="h-3.5 w-3.5" />
      {mot}
    </span>
  );
}

const euros = (n: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);

/** La liste des points contrôlés, les anomalies d'abord. */
export function ControleCourrier({ points }: { points: PointControle[] }) {
  const ordre: Record<StatutControle, number> = { anomalie: 0, indetermine: 1, etabli: 2 };
  const tries = [...points].sort((a, b) => ordre[a.statut] - ordre[b.statut]);
  const compte = (s: StatutControle) => points.filter((p) => p.statut === s).length;

  return (
    <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
      <h2 className="font-display text-lg font-bold text-navy-900">Ce qui a été vérifié sur votre courrier</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        {points.length} points contrôlés : {compte("etabli")} établi{compte("etabli") > 1 ? "s" : ""},{" "}
        {compte("anomalie")} anomalie{compte("anomalie") > 1 ? "s" : ""} potentielle{compte("anomalie") > 1 ? "s" : ""},{" "}
        {compte("indetermine")} non déterminable{compte("indetermine") > 1 ? "s" : ""}.
      </p>
      <ul className="mt-4 divide-y divide-line">
        {tries.map((p) => (
          <li key={p.id} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <p className="font-semibold text-navy-900">{p.titre}</p>
              <Verdict statut={p.statut} />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.detail}</p>
            {p.source && <p className="mt-1 text-xs text-ink-faint">Critère : {p.source}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-faint">
        « Établi » vaut pour le point contrôlé, pas pour la redevance entière. Une anomalie potentielle est une question
        à poser, pas une illégalité constatée.
      </p>
    </section>
  );
}

/** Chaque euro expliqué : ce qui est réclamé, ce que les pièces justifient. */
export function SoldeExplique({ solde, children }: { solde: SoldeReconstruit; children?: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-navy-900">Le montant, euro par euro</h2>
        <Verdict statut={solde.statut} />
      </div>
      <table className="mt-4 w-full text-sm">
        <caption className="sr-only">Reconstruction du montant réclamé</caption>
        <tbody className="divide-y divide-line">
          {solde.lignes.map((l) => (
            <tr key={l.libelle} className="align-top">
              <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                <span className="font-semibold text-navy-900">{l.libelle}</span>
                {l.detail && <span className="mt-0.5 block text-xs leading-relaxed text-ink-faint">{l.detail}</span>}
              </th>
              <td className="whitespace-nowrap py-2.5 text-right font-semibold tabular-nums text-navy-900">
                {l.montant === null ? <span className="text-ink-faint">?</span> : euros(l.montant)}
              </td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="pt-3 text-left font-display font-bold text-navy-900">
              Solde reconstruit
            </th>
            <td className="pt-3 text-right font-display font-bold tabular-nums text-navy-900">
              {solde.reconstruit === null ? <span className="text-ink-faint">?</span> : euros(solde.reconstruit)}
            </td>
          </tr>
          <tr className="border-t-0">
            <th scope="row" className="pt-1 text-left font-normal text-ink-soft">
              Réclamé par le courrier
            </th>
            <td className="pt-1 text-right tabular-nums text-ink-soft">
              {solde.reclame === null ? "?" : euros(solde.reclame)}
            </td>
          </tr>
        </tbody>
      </table>
      <p
        className={`mt-4 rounded-2xl p-3 text-sm leading-relaxed ${
          solde.statut === "anomalie" ? "bg-warn-100 text-warn-700" : solde.statut === "etabli" ? "bg-ok-50 text-ok-700" : "bg-paper text-ink"
        }`}
      >
        {solde.conclusion}
      </p>
      {children}
    </section>
  );
}

/** Le calcul du délai, déplié à la demande. */
export function TraceDelai({ trace }: { trace: EtapeCalcul[] }) {
  if (trace.length === 0) return null;
  return (
    <details className="group mt-3 rounded-2xl bg-paper">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-semibold text-navy-800">
        Voir le calcul
        <IconeChevron className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <dl className="space-y-2 px-3.5 pb-3.5 text-sm">
        {trace.map((e) => (
          <div key={e.libelle} className="grid gap-0.5 sm:grid-cols-[11rem_1fr] sm:gap-3">
            <dt className="text-ink-faint">{e.libelle}</dt>
            <dd className="font-medium text-navy-900">{e.valeur}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
