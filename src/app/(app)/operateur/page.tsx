import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { estOperateur, listerDossiersConfies } from "@/lib/dossiers";
import { TYPES_DOCUMENT, formatDate, formatMontant } from "@/lib/dossiers-format";
import { libellePortee } from "@/lib/mandats";
import { nomDossier } from "@/components/dossier-ui";
import { IconeFleche } from "@/components/icones";

export const metadata: Metadata = { title: "Dossiers confiés" };
export const dynamic = "force-dynamic";

/**
 * L'espace des bénévoles : les dossiers qu'un membre a confiés à l'association
 * par un mandat en cours. Lecture seule. Un mandat retiré ou échu fait
 * disparaître le dossier de cette liste — c'est la base qui l'impose.
 */
export default async function DossiersConfies() {
  if (!(await estOperateur())) notFound();
  const confies = await listerDossiersConfies();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
      <h1 className="font-display text-[1.8rem] font-extrabold leading-tight text-navy-900">Dossiers confiés</h1>
      <p className="mt-1 text-ink-soft">
        Les dossiers sur lesquels un membre a donné mandat à l&apos;association. Lecture seule, dans les limites du mandat.
      </p>

      {confies.length === 0 ? (
        <p className="mt-8 rounded-[var(--radius-carte)] border border-line bg-card p-6 text-ink-soft">
          Aucun mandat en cours.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[var(--radius-carte)] border border-line bg-card">
          {confies.map(({ mandat, dossier }) => (
            <li key={mandat.id}>
              <Link href={`/operateur/${dossier.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-navy-50 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-900">{nomDossier(dossier)}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {TYPES_DOCUMENT[dossier.type_document] ?? "Courrier"} · {formatMontant(dossier.montant)}
                    {dossier.date_echeance ? ` · échéance ${formatDate(dossier.date_echeance)}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {mandat.portee.map(libellePortee).join(" · ")} — jusqu&apos;au {formatDate(mandat.expire_le.slice(0, 10))}
                  </p>
                </div>
                <IconeFleche className="h-5 w-5 shrink-0 text-navy-700" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
