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