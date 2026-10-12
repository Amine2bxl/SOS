"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { basculerPiece, corrigerDossier } from "@/lib/dossiers-actions";
import type { QuestionPublique } from "@/cerveau/types";
import { Btn } from "@/components/ui";
import { IconeFleche, IconeLibre, IconeOk } from "@/components/icones";

/**
 * Les pièces à rassembler, en liste à cocher. Une pièce cochée est une
 * preuve de plus dans l'enveloppe : on voit la lettre se renforcer.
 */
export function PiecesDossier({
  dossierId,
  pieces,
  reunies,
}: {
  dossierId: string;
  pieces: string[];
  reunies: string[];
}) {
  const [, demarrer] = useTransition();
  const [cochees, cocher] = useOptimistic(reunies, (etat: string[], { piece, ok }: { piece: string; ok: boolean }) =>
    ok ? [...etat, piece] : etat.filter((p) => p !== piece),
  );
  const total = pieces.length;
  const faites = pieces.filter((p) => cochees.includes(p)).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {faites === total ? "Tout est prêt." : `${faites} sur ${total} rassemblée${faites > 1 ? "s" : ""}`}
        </p>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className="h-full rounded-full bg-ok-600 transition-[width]" style={{ width: `${total ? (faites / total) * 100 : 0}%` }} />
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {pieces.map((piece) => {
          const ok = cochees.includes(piece);
          return (
            <li key={piece}>
              <button
                type="button"
                aria-pressed={ok}
                onClick={() =>
                  demarrer(async () => {
                    cocher({ piece, ok: !ok });
                    await basculerPiece(dossierId, piece, !ok);
                  })
                }
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${
                  ok ? "border-ok-600/30 bg-ok-50 text-ok-700" : "border-line bg-white text-navy-900 hover:border-navy-200"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                    ok ? "border-ok-600 bg-ok-600 text-white" : "border-navy-200 bg-white"
                  }`}
                >
                  {ok && <IconeOk className="h-4 w-4" />}
                </span>
                <span className={ok ? "line-through decoration-ok-600/40" : "font-medium"}>{piece}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Une question encore ouverte, posée dans la fiche : la réponse relance
 * l'analyse, et parfois fait apparaître un argument.
 */
export function QuestionOuverte({ dossierId, question }: { dossierId: string; question: QuestionPublique }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <div className="rounded-[var(--radius-carte)] border border-gold-300 bg-gold-50 p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">Une question peut renforcer votre dossier</p>
      <h3 className="mt-2 font-display text-lg font-bold text-navy-900">{question.intitule}</h3>
      <p className="mt-1 text-sm text-ink-soft">{question.pourquoi}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {question.options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={enCours}
            onClick={() =>
              demarrer(async () => {
                const r = await corrigerDossier(dossierId, { reponses: { [question.id]: o.id } });
                if (r.erreur) setErreur(r.erreur);
                else router.refresh();
              })
            }
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left text-sm font-semibold text-navy-900 transition hover:border-navy-600 disabled:opacity-50"
          >
            <IconeLibre nom={o.icone ?? "ticket"} className="h-7 w-7 shrink-0" />
            <span className="flex-1">{o.libelle}</span>
            <IconeFleche className="h-4 w-4 shrink-0 text-ink-faint" />
          </button>
        ))}
      </div>
      {erreur && <p className="mt-2 text-sm font-medium text-danger-700">{erreur}</p>}
    </div>
  );
}

/** Corriger la région ou une date : le délai est recalculé aussitôt. */
export function CorrectionFaits({
  dossierId,
  region,
  dateEnvoi,
  dateEcheance,
}: {
  dossierId: string;
  region: string | null;
  dateEnvoi: string | null;
  dateEcheance: string | null;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [valeurs, setValeurs] = useState({ region: region ?? "", dateEnvoi: dateEnvoi ?? "", dateEcheance: dateEcheance ?? "" });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const champ =
    "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40";

  if (!ouvert) {
    return (
      <Btn variant="secondary" taille="sm" onClick={() => setOuvert(true)}>
        Corriger la région ou une date
      </Btn>
    );
  }

  return (
    <form
      className="grid gap-3 rounded-2xl bg-paper p-4 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        demarrer(async () => {
          const r = await corrigerDossier(dossierId, valeurs);
          if (r.erreur) {
            setErreur(r.erreur);
            return;
          }
          setOuvert(false);
          router.refresh();
        });
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-navy-900">Région</span>
        <select value={valeurs.region} onChange={(e) => setValeurs({ ...valeurs, region: e.target.value })} className={champ}>
          <option value="">Je ne sais pas</option>
          <option value="bruxelles">Bruxelles</option>
          <option value="wallonie">Wallonie</option>
          <option value="flandre">Flandre</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-navy-900">Date du courrier</span>
        <input type="date" value={valeurs.dateEnvoi} onChange={(e) => setValeurs({ ...valeurs, dateEnvoi: e.target.value })} className={champ} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-navy-900">Date limite imprimée</span>
        <input type="date" value={valeurs.dateEcheance} onChange={(e) => setValeurs({ ...valeurs, dateEcheance: e.target.value })} className={champ} />
      </label>
      {erreur && <p className="text-sm font-medium text-danger-700 sm:col-span-3">{erreur}</p>}
      <div className="flex gap-2 sm:col-span-3">
        <Btn type="submit" variant="primary" taille="sm" disabled={enCours}>
          {enCours ? "Recalcul…" : "Enregistrer et recalculer"}
        </Btn>
        <Btn type="button" variant="ghost" taille="sm" onClick={() => setOuvert(false)}>
          Annuler
        </Btn>
      </div>
    </form>
  );
}
