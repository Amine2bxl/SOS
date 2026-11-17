import Link from "next/link";
import {
  TYPES_EVENEMENT,
  cleMois,
  decalerMois,
  grilleMois,
  type EvenementCalendrier,
  type TypeEvenement,
} from "@/lib/agenda";
import { IconeFleche, IconeFlecheGauche } from "@/components/icones";
import { AbonnementAgenda, AjouterAgenda } from "./AjouterAgenda";

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const nomMois = (annee: number, mois0: number) =>
  new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(annee, mois0, 1)));
const jourLong = (iso: string) =>
  new Intl.DateTimeFormat("fr-BE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * La mise en page de l'agenda : la grille du mois, la liste jour par jour avec
 * un bouton « Ajouter » à chaque ligne, et à côté ce qui arrive.
 */
export function VueAgenda({
  evenements,
  annee,
  mois0,
  aujourdhui,
  jeton,
  site,
}: {
  evenements: EvenementCalendrier[];
  annee: number;
  mois0: number;
  aujourdhui: string;
  jeton: string | null;
  site: string;
}) {
  const prec = decalerMois(annee, mois0, -1);
  const suiv = decalerMois(annee, mois0, 1);
  const parJour = new Map<string, EvenementCalendrier[]>();
  for (const e of evenements) parJour.set(e.date, [...(parJour.get(e.date) ?? []), e]);
  const grille = grilleMois(annee, mois0);
  const prefixe = cleMois(annee, mois0);
  const duMois = evenements.filter((e) => e.date.startsWith(prefixe));
  const joursDuMois = Array.from(new Set(duMois.map((e) => e.date)));
  const aVenir = evenements.filter((e) => e.date >= aujourdhui && e.type !== "ferie" && e.type !== "constat").slice(0, 6);
  const typesPresents = Array.from(new Set(duMois.map((e) => e.type))) as TypeEvenement[];

  const prochaine = aVenir.find((e) => !e.date.startsWith(prefixe));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.8rem] font-extrabold capitalize leading-tight text-navy-900">{nomMois(annee, mois0)}</h1>
          <p className="text-sm text-ink-soft">
            {duMois.length === 0 ? "Rien de prévu ce mois-ci." : `${duMois.length} date${duMois.length > 1 ? "s" : ""} ce mois-ci`}
          </p>
        </div>
        <nav aria-label="Changer de mois" className="flex items-center gap-1.5">
          <Link
            href={`?mois=${cleMois(prec.annee, prec.mois0)}`}
            aria-label="Mois précédent"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-navy-900 transition hover:bg-navy-50"
          >
            <IconeFlecheGauche className="h-4 w-4" />
          </Link>
          <Link
            href="/tableau-de-bord/agenda"
            className="inline-flex h-10 items-center rounded-full border border-line bg-card px-4 text-sm font-semibold text-navy-900 transition hover:bg-navy-50"
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href={`?mois=${cleMois(suiv.annee, suiv.mois0)}`}
            aria-label="Mois suivant"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-navy-900 transition hover:bg-navy-50"
          >
            <IconeFleche className="h-4 w-4" />
          </Link>
        </nav>
      </div>

      {/* La grille à gauche, la liste du mois à droite : la page tient sur un écran. */}
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
            <div className="grid grid-cols-7 border-b border-line bg-paper">
              {JOURS_SEMAINE.map((j) => (
                <div key={j} className="py-2 text-center text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {j}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grille.flat().map((j, i) => {
                const evs = parJour.get(j.iso) ?? [];
                const estAujourdhui = j.iso === aujourdhui;
                const weekend = i % 7 >= 5;
                const contenu = (
                  <>
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm tabular-nums ${
                        estAujourdhui ? "bg-navy-900 font-bold text-white" : j.dansMois ? "font-semibold text-navy-900" : "text-ink-faint"
                      }`}
                    >
                      {j.jour}
                    </span>
                    {/* Téléphone : des points. Ordinateur : les intitulés. */}
                    <span className="mt-1 flex flex-wrap gap-1 sm:hidden">
                      {evs.slice(0, 4).map((e) => (
                        <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${TYPES_EVENEMENT[e.type].point}`} />
                      ))}
                    </span>
                    <span className="mt-1 hidden space-y-1 sm:block">
                      {evs.slice(0, 2).map((e) => (
                        <span key={e.id} className={`block truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${TYPES_EVENEMENT[e.type].pastille}`}>
                          {e.titre}
                        </span>
                      ))}
                      {evs.length > 2 && <span className="block text-[11px] font-semibold text-ink-soft">+{evs.length - 2}</span>}
                    </span>
                  </>
                );
                const classes = `min-h-14 border-b border-r border-line p-1.5 sm:min-h-[5.6rem] sm:p-2 ${weekend ? "bg-paper/60" : ""} ${
                  !j.dansMois ? "opacity-55" : ""
                } [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0`;
                return evs.length > 0 && j.dansMois ? (
                  <a key={j.iso} href={`#j-${j.iso}`} className={`${classes} block transition hover:bg-navy-50`} aria-label={`${jourLong(j.iso)} : ${evs.length} date${evs.length > 1 ? "s" : ""}`}>
                    {contenu}
                  </a>
                ) : (
                  <div key={j.iso} className={classes}>
                    {contenu}
                  </div>
                );
              })}
            </div>
          </div>

          {typesPresents.length > 0 && (
            <ul aria-label="Légende" className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft">
              {typesPresents.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${TYPES_EVENEMENT[t].point}`} />
                  {TYPES_EVENEMENT[t].libelle}
                </li>
              ))}
            </ul>
          )}
          <AbonnementAgenda jeton={jeton} site={site} />
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
            <h2 className="border-b border-line px-5 py-3.5 font-display text-lg font-bold text-navy-900">Ce mois-ci</h2>
            {joursDuMois.length === 0 ? (
              <div className="px-5 py-4 text-sm text-ink-soft">
                <p>Aucune date ce mois-ci.</p>
                {prochaine && (
                  <p className="mt-2">
                    Prochaine :{" "}
                    <Link href={`?mois=${prochaine.date.slice(0, 7)}`} className="font-semibold text-navy-700 underline underline-offset-4">
                      {prochaine.titre}, {jourLong(prochaine.date)}
                    </Link>
                  </p>
                )}
              </div>
            ) : (
              <ol className="divide-y divide-line">
                {joursDuMois.map((jour) => (
                  <li key={jour} id={`j-${jour}`} className="scroll-mt-24 px-5 py-3">
                    <h3 className={`text-xs font-bold capitalize ${jour === aujourdhui ? "text-navy-900" : "text-ink-soft"}`}>
                      {jourLong(jour)}
                      {jour === aujourdhui && " · aujourd'hui"}
                    </h3>
                    <ul className="mt-1.5 space-y-2">
                      {(parJour.get(jour) ?? []).map((e) => (
                        <LigneEvenement key={e.id} ev={e} site={site} />
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function LigneEvenement({ ev, site }: { ev: EvenementCalendrier; site: string }) {
  const type = TYPES_EVENEMENT[ev.type];
  return (
    <li className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold leading-snug text-navy-900">
          <span className={`h-2 w-2 shrink-0 rounded-full ${type.point}`} aria-hidden="true" />
          {ev.lien ? (
            <Link href={ev.lien} className="min-w-0 truncate hover:underline">
              {ev.titre}
            </Link>
          ) : (
            <span className="min-w-0 truncate">{ev.titre}</span>
          )}
        </p>
        <p className="mt-0.5 pl-3.5 text-xs text-ink-soft">
          {ev.detail ?? type.libelle}
        </p>
      </div>
      {ev.type !== "ferie" && <AjouterAgenda ev={ev} site={site} />}
    </li>
  );
}
