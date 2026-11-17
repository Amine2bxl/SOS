import type { Metadata } from "next";
import Link from "next/link";
import { ExplorateurCommunes } from "@/components/ExplorateurCommunes";
import { COMMUNES } from "@/lib/data";
import { lireReglesEnDirect } from "@/lib/communes-direct";
import { listerDossiers } from "@/lib/dossiers";

export const metadata: Metadata = { title: "Communes" };
export const dynamic = "force-dynamic";

const slugDe = (nom: string | null) => (nom ? COMMUNES.find((c) => c.nom.toLowerCase() === nom.trim().toLowerCase())?.slug : undefined);

/**
 * Les 19 communes, dans l'espace membre : la même carte que sur le site, qui
 * s'ouvre sur la commune du dernier dossier. Les communes de vos dossiers
 * sont à un geste, au-dessus de la carte.
 */
export default async function CommunesApp({ searchParams }: { searchParams: Promise<{ commune?: string | string[] }> }) {
  const [{ commune }, direct, dossiers] = await Promise.all([searchParams, lireReglesEnDirect(), listerDossiers()]);
  const vos = Array.from(new Set(dossiers.map((d) => slugDe(d.commune)).filter((s): s is string => Boolean(s))));
  const demandee = typeof commune === "string" && COMMUNES.some((c) => c.slug === commune) ? commune : undefined;
  const slugInitial = demandee ?? vos[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <h1 className="font-display text-[1.8rem] font-extrabold leading-tight text-navy-900">Les 19 communes</h1>
      <p className="mt-1 text-[1.02rem] text-ink-soft">Zones, horaires, gratuité et derniers changements. Touchez une commune sur la carte.</p>

      {vos.length > 0 && (
        <nav aria-label="Les communes de vos dossiers" className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-navy-900">Vos dossiers :</span>
          {vos.map((s) => (
            <Link
              key={s}
              href={`/tableau-de-bord/communes?commune=${s}`}
              aria-current={s === slugInitial ? "true" : undefined}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                s === slugInitial ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-card text-navy-900 hover:bg-navy-50"
              }`}
            >
              {COMMUNES.find((c) => c.slug === s)?.nom}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-6">
        <ExplorateurCommunes key={slugInitial ?? "defaut"} direct={direct} slugInitial={slugInitial} chemin="/tableau-de-bord/communes" />
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-soft">
        C&apos;est de l&apos;information : le règlement de la commune fait foi.
      </p>
    </div>
  );
}
