/**
 * Petits visuels d'information, sans aucune dépendance client : ils peuvent
 * être rendus par un serveur directement.
 */

const ZONES = [
  {
    nom: "Zone rouge",
    texte: "La plus chère : centres, grandes artères, pôles de transport.",
    classe: "bg-danger-600",
  },
  {
    nom: "Zone verte",
    texte: "Tarif modéré dans les quartiers résidentiels, souvent gratuit la nuit.",
    classe: "bg-ok-600",
  },
  {
    nom: "Zone bleue",
    texte: "Stationnement libre mais limité dans le temps, avec le disque.",
    classe: "bg-navy-600",
  },
];

/** Les 3 zones du stationnement bruxellois, d'un coup d'œil. */
export function ZonesVisuel({ sombre = false }: { sombre?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ZONES.map((z) => (
        <div
          key={z.nom}
          className={`rounded-xl border p-4 ${
            sombre ? "border-white/10 bg-white/5" : "border-line bg-card"
          }`}
        >
          <span className={`block h-2.5 w-full rounded-full ${z.classe}`} aria-hidden="true" />
          <p
            className={`mt-2 font-display text-base font-bold ${
              sombre ? "text-white" : "text-navy-900"
            }`}
          >
            {z.nom}
          </p>
          <p
            className={`mt-1 text-sm leading-relaxed ${
              sombre ? "text-navy-100/80" : "text-ink-soft"
            }`}
          >
            {z.texte}
          </p>
        </div>
      ))}
    </div>
  );
}

const ETAPES = [
  { n: 1, titre: "Notification", classe: "bg-navy-600" },
  { n: 2, titre: "Rappel", classe: "bg-warn-600" },
  { n: 3, titre: "Mise en demeure", classe: "bg-warn-600" },
  { n: 4, titre: "Contrainte", classe: "bg-danger-600" },
  { n: 5, titre: "Huissier", classe: "bg-danger-600" },
];

/** La procédure en 5 étapes, du courrier le plus doux au plus grave. */
export function TimelineProcedure() {
  return (
    <div className="flex items-start overflow-x-auto pb-2">
      {ETAPES.map((e, i) => (
        <div key={e.n} className="flex items-start">
          <div className="flex w-20 shrink-0 flex-col items-center text-center sm:w-24">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white ${e.classe}`}
            >
              {e.n}
            </span>
            <p className="mt-1.5 text-[11px] font-semibold leading-tight text-ink-soft">{e.titre}</p>
          </div>
          {i < ETAPES.length - 1 && <div className="mt-4 h-0.5 w-5 shrink-0 bg-line sm:w-10" />}
        </div>
      ))}
    </div>
  );
}
/**
 * Aperçu de l'espace membre, dessiné en HTML.
 *
 * Une landing qui promet un outil doit le montrer. Plutôt qu'une capture
 * d'écran qui vieillit mal, ce bloc reproduit la hiérarchie réelle de
 * l'application : ce qui presse en haut, le dossier et sa prochaine action
 * juste en dessous.
 */
export function ApercuEspaceMembre() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger-600/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn-600/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-ok-600/60" />
        <span className="ml-2 text-[11px] font-semibold text-ink-soft">Mon espace — Tableau de bord</span>
      </div>

      <div className="grid grid-cols-[104px_1fr] text-left">
        <div className="space-y-1.5 bg-navy-950 p-3">
          {["Tableau de bord", "Scanner", "Ma lettre", "Règles", "Abonnement"].map((l, i) => (
            <p
              key={l}
              className={`truncate rounded px-2 py-1.5 text-[10px] font-semibold ${
                i === 0 ? "bg-navy-800 text-white" : "text-navy-100/60"
              }`}
            >
              {l}
            </p>
          ))}
        </div>

        <div className="space-y-2.5 p-3.5">
          <div className="rounded-lg border-2 border-danger-600/40 bg-danger-100 p-2.5">
            <p className="text-[11px] font-bold text-danger-700">1 dossier arrive à échéance</p>
            <p className="text-[10px] text-ink">2026/4471820 — dans 3 jours</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[["2", "en cours"], ["50 €", "en jeu"], ["1", "acceptée"]].map(([v, l]) => (
              <div key={l} className="rounded-lg border border-line bg-card p-2">
                <p className="font-display text-sm font-black text-navy-900">{v}</p>
                <p className="text-[9px] text-ink-soft">{l}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-line bg-card">
            <div className="p-2.5">
              <p className="text-[11px] font-bold text-navy-900">2026/4471820</p>
              <p className="text-[10px] text-ink-soft">Notification — Ixelles · 25,00 €</p>
            </div>
            <div className="border-t border-warn-600/40 bg-warn-100 px-2.5 py-1.5">
              <p className="text-[10px] font-bold text-warn-700">
                Rédiger votre contestation
                <span className="ml-1 font-medium opacity-80">Il reste 3 jours.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
