import type { Metadata } from "next";
import Link from "next/link";
import { listerDossiers, analyserDossier } from "@/lib/dossiers";
import { prochaineAction } from "@/lib/dossiers-format";
import { EtatVide, LinkBtn } from "@/components/ui";
import { CarteDossier } from "@/components/dossier-ui";
import { RafraichirEnTempsReel } from "@/components/RafraichirEnTempsReel";
import { IconeDossiers, IconeScanDoc } from "@/components/icones";

export const metadata: Metadata = { title: "Mes dossiers" };
export const dynamic = "force-dynamic";

const RANG = { urgent: 0, attention: 1, neutre: 2, termine: 3 } as const;

export default async function MesDossiers({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams;
  const dossiers = await listerDossiers();

  const tous = dossiers
    .map((d) => ({ dossier: d, action: prochaineAction(d, analyserDossier(d).delai) }))
    .sort((a, b) => RANG[a.action.ton] - RANG[b.action.ton] || (a.action.jours ?? 9999) - (b.action.jours ?? 9999));

  const enCours = tous.filter((s) => s.action.ton !== "termine");
  const termines = tous.filter((s) => s.action.ton === "termine");
  const montrerTermines = vue === "termines";
  const liste = montrerTermines ? termines : enCours;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <RafraichirEnTempsReel />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2rem] font-extrabold leading-tight text-navy-900">Mes dossiers</h1>
          <p className="mt-1 text-ink-soft">
            {dossiers.length === 0
              ? "Chaque courrier reçu devient un dossier, avec sa lettre et son suivi."
              : "Les plus urgents en premier."}
          </p>
        </div>
        {dossiers.length > 0 && (
          <LinkBtn href="/tableau-de-bord/nouveau" variant="gold" className="hidden sm:inline-flex">
            <IconeScanDoc className="h-5 w-5 [--icone-accent:transparent]" />
            Nouveau courrier
          </LinkBtn>
        )}
      </div>

      {dossiers.length === 0 ? (
        <div className="mt-8">
          <EtatVide
            icone={<IconeDossiers className="h-12 w-12" />}
            titre="Aucun dossier pour l'instant"
            texte="Photographiez votre courrier : le moteur le lit, l'analyse, et prépare votre lettre."
          >
            <LinkBtn href="/tableau-de-bord/nouveau" variant="gold">
              Scanner mon courrier
            </LinkBtn>
          </EtatVide>
        </div>
      ) : (
        <>
          <nav aria-label="Filtrer les dossiers" className="mt-6 inline-flex rounded-full border border-line bg-card p-1">
            <Onglet href="/tableau-de-bord/dossiers" actif={!montrerTermines} libelle="En cours" nombre={enCours.length} />
            <Onglet
              href="/tableau-de-bord/dossiers?vue=termines"
              actif={montrerTermines}
              libelle="Terminés"
              nombre={termines.length}
            />
          </nav>

          {liste.length === 0 ? (
            <p className="mt-8 rounded-[var(--radius-carte)] border-2 border-dashed border-line p-8 text-center text-sm text-ink-soft">
              {montrerTermines ? "Aucun dossier terminé pour l'instant." : "Aucun dossier en cours. Tout est réglé."}
            </p>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-3">
              {liste.map((s) => (
                <li key={s.dossier.id}>
                  <CarteDossier dossier={s.dossier} action={s.action} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Onglet({ href, actif, libelle, nombre }: { href: string; actif: boolean; libelle: string; nombre: number }) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        actif ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"
      }`}
    >
      {libelle} <span className={actif ? "text-gold-400" : "text-ink-faint"}>{nombre}</span>
    </Link>
  );
}
