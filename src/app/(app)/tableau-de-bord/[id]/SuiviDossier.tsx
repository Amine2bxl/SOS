"use client";

import { useState, useTransition } from "react";
import { changerStatut, supprimerDossier } from "@/lib/dossiers-actions";
import type { Evenement } from "@/lib/dossiers-format";
import { formatDate } from "@/lib/dossiers-format";
import { genererIcs } from "@/cerveau/moteur/agenda";
import { Btn } from "@/components/ui";
import { Modale, EnTeteModale } from "@/components/Modale";
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
}: {
  dossierId: string;
  statut: string;
  evenements: Evenement[];
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

  const ajouterAgenda = () => {
    if (!echeance) return;
    const ics = genererIcs({
      uid: `dossier-${dossierId}`,
      titre: titreEcheance,
      date: echeance,
      description: `Dossier SOS Citizens : ${window.location.origin}/tableau-de-bord/${dossierId}`,
      url: `${window.location.origin}/tableau-de-bord/${dossierId}`,
      rappels: [3, 1, 0],
    });
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    lien.download = "echeance-sos-citizens.ics";
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    window.setTimeout(() => URL.revokeObjectURL(lien.href), 2000);
  };

  return (
    <div className="space-y-4">
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

      {/* --------------------------------------------------------- l'historique */}
      <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy-900">Historique</h2>
          {echeance && !termine && (
            <Btn variant="secondary" taille="sm" onClick={ajouterAgenda}>
              <IconeAgenda className="h-5 w-5" />
              Mettre l&apos;échéance dans mon agenda
            </Btn>
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
        <Btn variant="ghost" taille="sm" onClick={() => setSuppression(true)} className="text-danger-700">
          <IconeCorbeille className="h-4 w-4" />
          Supprimer
        </Btn>
      </section>

      <Modale ouverte={suppression} onFermer={() => setSuppression(false)} titre="Supprimer ce dossier ?" variante="alerte" largeur="max-w-md">
        <EnTeteModale titre="Supprimer ce dossier ?" onFermer={() => setSuppression(false)} />
        <p className="mt-3 text-sm leading-relaxed text-ink">
          Le dossier, ses lettres et son historique seront effacés définitivement. Si un délai court encore, vous
          perdrez le rappel.
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
