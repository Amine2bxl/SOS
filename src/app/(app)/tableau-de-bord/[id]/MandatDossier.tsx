"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { accorderMandat, revoquerMandat } from "@/lib/mandats-actions";
import { DUREES, PORTEES, etatMandat, libellePortee, type Mandat } from "@/lib/mandats";
import { formatDate } from "@/lib/dossiers-format";
import { Btn } from "@/components/ui";
import { IconeCadenas, IconeMainTendue, IconeOk } from "@/components/icones";

/**
 * Demander l'accompagnement de l'association, par un mandat.
 *
 * Sans mandat, aucun bénévole ne voit le dossier : c'est la base qui
 * l'interdit, pas une promesse. Le mandat couvre UN dossier, pour une durée
 * choisie, et se retire d'un geste — l'accès s'arrête aussitôt.
 */
export function MandatDossier({
  dossierId,
  mandat,
  membre,
}: {
  dossierId: string;
  mandat: Mandat | null;
  /** Les membres bénéficient d'une relecture ; les autres, selon les disponibilités. */
  membre: boolean;
}) {
  const router = useRouter();
  const etat = etatMandat(mandat);
  const [ouvert, setOuvert] = useState(false);
  const [correspondre, setCorrespondre] = useState(false);
  const [jours, setJours] = useState<number>(DUREES[1].jours);
  const [message, setMessage] = useState("");
  const [accord, setAccord] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const accorder = () =>
    demarrer(async () => {
      setErreur(null);
      const r = await accorderMandat(dossierId, {
        portee: correspondre ? ["consulter", "correspondre"] : ["consulter"],
        jours,
        message,
        accord,
      });
      if (r.erreur) return setErreur(r.erreur);
      setOuvert(false);
      router.refresh();
    });

  const revoquer = () =>
    demarrer(async () => {
      if (!mandat) return;
      setErreur(null);
      const r = await revoquerMandat(dossierId, mandat.id);
      if (r.erreur) return setErreur(r.erreur);
      router.refresh();
    });

  return (
    <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
          <IconeMainTendue className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-navy-900">L&apos;association à vos côtés</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {etat === "actif"
              ? "L'association voit ce dossier, dans les limites fixées."
              : membre
                ? "Un bénévole relit votre dossier et répond par écrit. Rien sans votre mandat."
                : "Un bénévole peut l'examiner, selon ses disponibilités (garanti aux membres). Rien sans votre mandat."}
          </p>
        </div>
      </div>

      {etat === "actif" && mandat && (
        <div className="mt-4 rounded-2xl bg-ok-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-ok-700">
            <IconeOk className="h-4 w-4" />
            Mandat en cours jusqu&apos;au {formatDate(mandat.expire_le.slice(0, 10))}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {mandat.portee.map((p) => (
              <li key={p}>· {libellePortee(p)}</li>
            ))}
          </ul>
          <div className="mt-3">
            <Btn variant="dangerDiscret" taille="sm" onClick={revoquer} disabled={enCours}>
              {enCours ? "Retrait…" : "Retirer le mandat"}
            </Btn>
          </div>
        </div>
      )}

      {etat !== "actif" && !ouvert && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Btn variant="primary" taille="sm" onClick={() => setOuvert(true)}>
            Demander l&apos;accompagnement
          </Btn>
          {etat === "revoque" && <span className="text-xs text-ink-faint">Mandat précédent retiré.</span>}
          {etat === "expire" && <span className="text-xs text-ink-faint">Mandat précédent arrivé à échéance.</span>}
        </div>
      )}

      {etat !== "actif" && ouvert && (
        <form
          className="mt-4 space-y-4 rounded-2xl bg-paper p-4"
          onSubmit={(e) => {
            e.preventDefault();
            accorder();
          }}
        >
          <fieldset>
            <legend className="text-sm font-semibold text-navy-900">Ce que l&apos;association pourra faire</legend>
            <div className="mt-2 space-y-2">
              {PORTEES.map((p) => (
                <label key={p.id} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={p.obligatoire || correspondre}
                    disabled={p.obligatoire}
                    onChange={(e) => setCorrespondre(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-navy-900"
                  />
                  <span>
                    <span className="font-semibold text-navy-900">{p.libelle}</span>
                    <span className="block text-ink-soft">{p.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-navy-900">Pendant</legend>
            <div className="mt-2 inline-flex rounded-full border border-line bg-white p-1">
              {DUREES.map((d) => (
                <button
                  key={d.jours}
                  type="button"
                  aria-pressed={jours === d.jours}
                  onClick={() => setJours(d.jours)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    jours === d.jours ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"
                  }`}
                >
                  {d.libelle}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy-900">Un mot pour l&apos;association (facultatif)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Ce qui vous inquiète, ce que vous avez déjà tenté…"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
            />
          </label>

          <label className="flex items-start gap-3 text-sm leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={accord}
              onChange={(e) => setAccord(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-navy-900"
            />
            <span>
              J&apos;autorise SOS Citizens ASBL à accéder à ce dossier dans les limites cochées ci-dessus. Je peux retirer
              ce mandat à tout moment ; rien ne sera envoyé en mon nom sans mon accord.
            </span>
          </label>

          {erreur && (
            <p role="alert" className="text-sm font-medium text-danger-700">
              {erreur}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Btn type="submit" variant="primary" taille="sm" disabled={enCours || !accord}>
              {enCours ? "Envoi…" : "Donner mandat"}
            </Btn>
            <Btn type="button" variant="ghost" taille="sm" onClick={() => setOuvert(false)}>
              Annuler
            </Btn>
          </div>
        </form>
      )}

      {erreur && etat === "actif" && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger-700">
          {erreur}
        </p>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
        <IconeCadenas className="mt-0.5 h-4 w-4 shrink-0" />
        Ce dossier seulement. L&apos;accès s&apos;arrête au retrait ou à l&apos;échéance.
      </p>
    </section>
  );
}
