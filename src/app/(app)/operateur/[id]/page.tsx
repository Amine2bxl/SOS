import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { analyserDossier, estOperateur, lireDossierConfie } from "@/lib/dossiers";
import { MODES_ENVOI, STATUTS, TYPES_DOCUMENT, formatDate, formatMontant } from "@/lib/dossiers-format";
import { faitsDepuisDossier } from "@/lib/faits";
import { libellePortee } from "@/lib/mandats";
import { estUuid } from "@/lib/validation";
import { reconstruireSolde } from "@/cerveau/moteur/controle";
import { ControleCourrier, SoldeExplique, TraceDelai } from "@/components/controle-ui";
import { nomDossier } from "@/components/dossier-ui";
import { IconeFlecheGauche } from "@/components/icones";

export const metadata: Metadata = { title: "Dossier confié" };
export const dynamic = "force-dynamic";

export default async function DossierConfie({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!estUuid(id) || !(await estOperateur())) notFound();
  const confie = await lireDossierConfie(id);
  if (!confie) notFound();

  const { mandat, dossier, evenements, lettres } = confie;
  const analyse = analyserDossier(dossier);
  const solde = reconstruireSolde(faitsDepuisDossier(dossier));
  const derniere = lettres[0] ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <Link href="/operateur" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900">
        <IconeFlecheGauche className="h-4 w-4" />
        Dossiers confiés
      </Link>

      <header className="mt-4 rounded-[var(--radius-carte)] border border-line bg-card p-5 sm:p-6">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">{nomDossier(dossier)}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {TYPES_DOCUMENT[dossier.type_document] ?? "Courrier"} · {formatMontant(dossier.montant)} ·{" "}
          {STATUTS[dossier.statut]?.label ?? dossier.statut}
        </p>
        <div className="mt-4 rounded-2xl bg-navy-50 p-3.5 text-sm text-navy-900">
          <p className="font-semibold">
            Mandat : {mandat.portee.map(libellePortee).join(", ").toLowerCase()} — jusqu&apos;au{" "}
            {formatDate(mandat.expire_le.slice(0, 10))}
          </p>
          {mandat.message && <p className="mt-1.5 whitespace-pre-wrap text-ink">« {mandat.message} »</p>}
          <p className="mt-1.5 text-xs text-ink-soft">
            Pour écrire au membre, répondez à l&apos;e-mail de mandat reçu par l&apos;association.
            {!mandat.portee.includes("correspondre") && " Ce mandat ne permet pas d'écrire en son nom à l'organisme."}
          </p>
        </div>
      </header>

      <div className="mt-4 space-y-4">
        <section className="rounded-[var(--radius-carte)] border border-line bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">{analyse.strategie.titre}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{analyse.strategie.explication}</p>
          <p className="mt-3 text-sm font-semibold text-navy-900">
            {analyse.delai.limite ? `Délai : ${formatDate(analyse.delai.limite)}` : "Délai à vérifier sur le courrier"}
          </p>
          <TraceDelai trace={analyse.delai.trace} />
          {analyse.moyens.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm text-ink">
              {analyse.moyens.map((m) => (
                <li key={m.id}>
                  · <strong className="text-navy-900">{m.titre}</strong> ({m.force})
                </li>
              ))}
            </ul>
          )}
        </section>

        <ControleCourrier points={analyse.controles} />
        <SoldeExplique solde={solde} />

        <section className="rounded-[var(--radius-carte)] border border-line bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Envoi</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {dossier.date_envoi_contestation
              ? `Envoyée le ${formatDate(dossier.date_envoi_contestation)}${
                  dossier.mode_envoi && MODES_ENVOI[dossier.mode_envoi] ? ` par ${MODES_ENVOI[dossier.mode_envoi].libelle.toLowerCase()}` : ""
                }${dossier.preuve_envoi ? ` (preuve : ${dossier.preuve_envoi})` : ""}${
                  dossier.accuse_reception_le ? `, accusé de réception le ${formatDate(dossier.accuse_reception_le)}` : ""
                }.`
              : "Pas encore envoyée."}
          </p>
        </section>

        {derniere && (
          <section className="rounded-[var(--radius-carte)] border border-line bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Dernière lettre</h2>
            <p className="mt-0.5 text-xs text-ink-faint">
              {derniere.type} · {derniere.langue.toUpperCase()} · {formatDate(derniere.created_at.slice(0, 10))}
            </p>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-paper p-4 font-sans text-sm leading-relaxed text-ink">
              {derniere.contenu}
            </pre>
          </section>
        )}

        <section className="rounded-[var(--radius-carte)] border border-line bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Chronologie</h2>
          <ol className="mt-3 space-y-3">
            {evenements.map((e) => (
              <li key={e.id} className="text-sm">
                <p className="font-semibold text-navy-900">{e.titre}</p>
                <p className="text-xs text-ink-faint">{formatDate(e.date_evenement.slice(0, 10))}</p>
                {e.note && <p className="mt-0.5 text-ink-soft">{e.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
