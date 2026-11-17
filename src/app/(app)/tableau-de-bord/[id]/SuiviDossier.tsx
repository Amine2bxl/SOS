"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changerStatut, noterAccuseReception, supprimerDossier } from "@/lib/dossiers-actions";
import type { Evenement } from "@/lib/dossiers-format";
import { MODES_ENVOI, formatDate } from "@/lib/dossiers-format";
import { Btn } from "@/components/ui";
import { Modale, EnTeteModale } from "@/components/Modale";
import { AjouterAgenda } from "../agenda/AjouterAgenda";
import {
  IconeAgenda,
  IconeBalance,
  IconeCorbeille,
  IconeLettre,
  IconeOk,
  IconeSceau,
  IconeTampon,
} from "@/components/icones";

const ICONE_EVENEMENT: Record<string, (p: { className?: string }) => React.ReactElement> = {
  creation: IconeTampon,
  lettre: IconeLettre,
  statut: IconeSceau,
  rappel: IconeAgenda,
};

/**
 * Le suivi : ce qui s'est passé, et le bouton de ce qui vient ensuite.
 *
 * Un dossier n'avance que si l'utilisateur dit ce qu'il a reçu : on lui pose
 * la question au bon moment — « avez-vous eu une réponse ? » — avec les
 * réponses possibles en gros boutons, plutôt qu'une liste de statuts.
 */
export function SuiviDossier({
  dossierId,
  statut,
  evenements,
  echeance,
  titreEcheance,
  conseilRejet,
  preuves,
  accompagnement,
  site,
}: {
  dossierId: string;
  statut: string;
  evenements: Evenement[];
  /** Ce qui atteste de chaque étape de l'envoi. */
  preuves: {
    lettrePrete: boolean;
    dateEnvoi: string | null;
    modeEnvoi: string | null;
    preuveEnvoi: string | null;
    accuseLe: string | null;
  };
  /** La section « accompagnement » (mandat), placée avant l'historique. */
  accompagnement?: React.ReactNode;
  /** Adresse du site, pour les liens d'agenda (Google, Outlook). */
  site: string;
  /** La date qui compte, pour l'agenda du téléphone. */
  echeance: string | null;
  titreEcheance: string;
  conseilRejet: { reponse: string; texte?: string } | null;
}) {
  const [enCours, demarrer] = useTransition();
  const [suppression, setSuppression] = useState(false);

  const changer = (s: string, note?: string) => demarrer(() => changerStatut(dossierId, s, note));
  const envoye = statut === "contestation_envoyee" || statut === "en_attente_reponse";
  const termine = statut === "accepte" || statut === "clos";


  return (
    <div className="space-y-4">
      <PreuvesEnvoi dossierId={dossierId} statut={statut} preuves={preuves} />

      {/* ------------------------------------------------ la question du moment */}
      {envoye && (
        <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Avez-vous reçu une réponse ?</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <ChoixReponse
              disabled={enCours}
              onClick={() => changer("accepte", "La contestation a été acceptée.")}
              titre="Oui, annulée"
              ton="ok"
            />
            <ChoixReponse
              disabled={enCours}
              onClick={() => changer("rejete", "La contestation a été rejetée.")}
              titre="Oui, rejetée"
              ton="danger"
            />
            <a
              href="#lettre"
              className="flex min-h-14 items-center justify-center rounded-2xl border border-line bg-paper px-4 text-center text-sm font-bold text-navy-900 transition hover:border-navy-200"
            >
              Pas encore — relancer
            </a>
          </div>
        </section>
      )}

      {statut === "rejete" && (
        <section className="rounded-[var(--radius-carte)] border border-danger-600/20 bg-danger-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <IconeBalance className="h-8 w-8 shrink-0 text-navy-900" />
            <div>
              <h2 className="font-display text-lg font-bold text-navy-900">Contestation rejetée : et maintenant ?</h2>
              {conseilRejet && (
                <>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-ink">{conseilRejet.reponse}</p>
                  {conseilRejet.texte && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{conseilRejet.texte}</p>}
                </>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn variant="secondary" taille="sm" disabled={enCours} onClick={() => changer("clos", "Dossier clôturé après le rejet.")}>
                  J&apos;ai payé, clôturer
                </Btn>
                <Btn variant="ghost" taille="sm" disabled={enCours} onClick={() => changer("a_contester", "Dossier rouvert pour répondre au rejet.")}>
                  Répondre au rejet
                </Btn>
              </div>
            </div>
          </div>
        </section>
      )}

      {accompagnement}

      {/* --------------------------------------------------------- l'historique */}
      <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy-900">Historique</h2>
          {echeance && !termine && (
            <AjouterAgenda
              site={site}
              ev={{
                id: `dossier-${dossierId}`,
                date: echeance,
                type: "echeance",
                titre: titreEcheance,
                detail: "Dernier jour pour envoyer votre lettre.",
                lien: `/tableau-de-bord/${dossierId}`,
              }}
            />
          )}
        </div>
        {evenements.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Rien pour l&apos;instant.</p>
        ) : (
          <ol className="relative mt-5 space-y-5 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-px before:bg-line">
            {evenements.map((e) => {
              const Icone = ICONE_EVENEMENT[e.type] ?? IconeOk;
              return (
                <li key={e.id} className="relative flex gap-4">
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-navy-900">
                    <Icone className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="text-sm font-bold text-navy-900">{e.titre}</p>
                    <p className="text-xs text-ink-faint">{formatDate(e.date_evenement.slice(0, 10))}</p>
                    {e.note && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{e.note}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ------------------------------------------------------- fin de dossier */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-carte)] border border-line/80 bg-card p-4 sm:p-5">
        {termine ? (
          <Btn variant="secondary" taille="sm" disabled={enCours} onClick={() => changer("nouveau", "Dossier rouvert.")}>
            Rouvrir le dossier
          </Btn>
        ) : (
          <Btn variant="secondary" taille="sm" disabled={enCours} onClick={() => changer("clos", "Dossier clôturé.")}>
            Clôturer le dossier
          </Btn>
        )}
        <Btn variant="dangerDiscret" taille="sm" onClick={() => setSuppression(true)}>
          <IconeCorbeille className="h-4 w-4" />
          Supprimer
        </Btn>
      </section>

      <Modale ouverte={suppression} onFermer={() => setSuppression(false)} titre="Supprimer ce dossier ?" variante="alerte" largeur="max-w-md">
        <EnTeteModale titre="Supprimer ce dossier ?" onFermer={() => setSuppression(false)} />
        <p className="mt-3 text-sm leading-relaxed text-ink">
          Le dossier, ses lettres et son historique seront effacés définitivement. Plus aucun rappel pour ce délai.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Btn variant="danger" className="flex-1" disabled={enCours} onClick={() => demarrer(() => supprimerDossier(dossierId))}>
            Supprimer définitivement
          </Btn>
          <Btn variant="secondary" className="flex-1" onClick={() => setSuppression(false)}>
            Garder
          </Btn>
        </div>
      </Modale>
    </div>
  );
}

function ChoixReponse({
  titre,
  ton,
  onClick,
  disabled,
}: {
  titre: string;
  ton: "ok" | "danger";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-14 items-center justify-center rounded-2xl border px-4 text-sm font-bold transition disabled:opacity-50 ${
        ton === "ok"
          ? "border-ok-600/30 bg-ok-50 text-ok-700 hover:border-ok-600"
          : "border-danger-600/30 bg-danger-50 text-danger-700 hover:border-danger-600"
      }`}
    >
      {titre}
    </button>
  );
}

/**
 * Les preuves, étape par étape. Une lettre préparée n'est pas une lettre
 * envoyée, un envoi n'est pas une réception, une réception n'est pas une
 * réponse : chaque marche est distincte, et chacune garde sa trace.
 */
function PreuvesEnvoi({
  dossierId,
  statut,
  preuves,
}: {
  dossierId: string;
  statut: string;
  preuves: {
    lettrePrete: boolean;
    dateEnvoi: string | null;
    modeEnvoi: string | null;
    preuveEnvoi: string | null;
    accuseLe: string | null;
  };
}) {
  const router = useRouter();
  const [saisie, setSaisie] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const repondu = statut === "accepte" || statut === "rejete";

  const marches = [
    { titre: "Lettre préparée", fait: preuves.lettrePrete, detail: preuves.lettrePrete ? "Gardée dans l'onglet « Lettre »." : null },
    {
      titre: "Envoyée",
      fait: !!preuves.dateEnvoi,
      detail: preuves.dateEnvoi
        ? [
            `Le ${formatDate(preuves.dateEnvoi)}`,
            preuves.modeEnvoi && MODES_ENVOI[preuves.modeEnvoi] ? MODES_ENVOI[preuves.modeEnvoi].libelle.toLowerCase() : null,
            preuves.preuveEnvoi ? `preuve : ${preuves.preuveEnvoi}` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : null,
    },
    {
      titre: "Accusé de réception",
      fait: !!preuves.accuseLe,
      detail: preuves.accuseLe ? `Reçu le ${formatDate(preuves.accuseLe)}` : null,
    },
    { titre: "Réponse de l'organisme", fait: repondu, detail: repondu ? (statut === "accepte" ? "Annulée" : "Rejetée") : null },
  ];

  return (
    <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
      <h2 className="font-display text-lg font-bold text-navy-900">Les preuves de votre démarche</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-4">
        {marches.map((m) => (
          <li key={m.titre} className={`rounded-2xl p-3.5 ${m.fait ? "bg-ok-50" : "bg-paper"}`}>
            <p className={`flex items-center gap-1.5 text-sm font-bold ${m.fait ? "text-ok-700" : "text-ink-faint"}`}>
              {m.fait ? <IconeOk className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-current" aria-hidden="true" />}
              {m.titre}
            </p>
            {m.detail && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{m.detail}</p>}
          </li>
        ))}
      </ol>

      {preuves.dateEnvoi && !preuves.accuseLe && !repondu && (
        <div className="mt-4">
          {!saisie ? (
            <Btn variant="secondary" taille="sm" onClick={() => setSaisie(true)}>
              J&apos;ai reçu l&apos;accusé de réception
            </Btn>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl bg-paper p-4 sm:flex-row sm:items-end">
              <label className="block flex-1">
                <span className="mb-1.5 block text-sm font-semibold text-navy-900">Date de l&apos;accusé</span>
                <input
                  type="date"
                  value={date}
                  min={preuves.dateEnvoi}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
                />
              </label>
              <Btn
                variant="primary"
                disabled={enCours}
                onClick={() =>
                  demarrer(async () => {
                    setErreur(null);
                    const r = await noterAccuseReception(dossierId, date);
                    if (r.erreur) return setErreur(r.erreur);
                    setSaisie(false);
                    router.refresh();
                  })
                }
              >
                {enCours ? "Enregistrement…" : "Noter"}
              </Btn>
            </div>
          )}
          {erreur && (
            <p role="alert" className="mt-2 text-sm font-medium text-danger-700">
              {erreur}
            </p>
          )}
        </div>
      )}
      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Une preuve d&apos;envoi ne prouve pas la réception. Gardez les originaux : récépissés, captures, accusés.
      </p>
    </section>
  );
}
