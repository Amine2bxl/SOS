import { STATUTS } from "@/lib/dossiers-format";

const TONS = {
  neutre: "bg-navy-50 text-navy-700 border-navy-600/30",
  attention: "bg-warn-100 text-warn-700 border-warn-600/40",
  ok: "bg-ok-100 text-ok-700 border-ok-600/40",
  risque: "bg-danger-100 text-danger-700 border-danger-600/40",
} as const;

export function BadgeStatut({ statut }: { statut: string }) {
  const s = STATUTS[statut] ?? { label: statut, ton: "neutre" as const };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${TONS[s.ton]}`}>
      {s.label}
    </span>
  );
}

/** Compte à rebours avant l'échéance : rouge dès que le délai devient serré. */
export function PastilleEcheance({ jours }: { jours: number | null }) {
  if (jours === null) return null;

  const [texte, classe] =
    jours < 0
      ? [`Échéance dépassée (${-jours} j)`, "bg-danger-100 text-danger-700"]
      : jours === 0
        ? ["Échéance aujourd'hui", "bg-danger-100 text-danger-700"]
        : jours <= 7
          ? [`Plus que ${jours} jour${jours > 1 ? "s" : ""}`, "bg-danger-100 text-danger-700"]
          : jours <= 21
            ? [`${jours} jours restants`, "bg-warn-100 text-warn-700"]
            : [`${jours} jours restants`, "bg-ok-100 text-ok-700"];

  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${classe}`}>{texte}</span>;
}
