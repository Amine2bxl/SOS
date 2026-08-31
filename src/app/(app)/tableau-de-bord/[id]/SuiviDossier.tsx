"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { changerStatut, supprimerDossier } from "@/lib/dossiers-actions";
import { Card, Btn, LinkBtn } from "@/components/ui";

type DossierLeger = { id: string; statut: string; lettre: string | null };

/** Étapes proposées, dans l'ordre où elles surviennent réellement. */
const SUITE_LOGIQUE: { statut: string; libelle: string }[] = [
  { statut: "contestation_envoyee", libelle: "J'ai envoyé ma contestation" },
  { statut: "en_attente_reponse", libelle: "J'attends leur réponse" },
  { statut: "accepte", libelle: "Ma redevance a été annulée" },
  { statut: "rejete", libelle: "Ma contestation a été rejetée" },
  { statut: "clos", libelle: "Je clôture ce dossier" },
];

/**
 * Suivi d'un dossier : la lettre déjà rangée, l'avancement, la suppression.
 *
 * La rédaction elle-même se fait dans le module « Rédiger ma lettre » : un seul
 * endroit pour écrire, un seul endroit pour suivre. C'est ce qui rend la
 * différence entre les deux modules immédiatement lisible.
 */
export function SuiviDossier({ dossier }: { dossier: DossierLeger }) {
  const [copie, setCopie] = useState(false);
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);
  const [enCours, demarrer] = useTransition();

  const termine = ["accepte", "rejete", "clos"].includes(dossier.statut);
  const lienLettre = `/tableau-de-bord/lettre?dossier=${dossier.id}`;

  const copier = async () => {
    if (!dossier.lettre) return;
    try {
      await navigator.clipboard.writeText(dossier.lettre);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      setCopie(false);
    }
  };

  return (
    <>
      <Card
        title="Votre lettre de contestation"
        subtitle={
          dossier.lettre
            ? "Rédigée et rangée dans ce dossier."
            : "Elle se rédige dans le module dédié, pré-rempli avec les informations ci-dessus."
        }
        className="mt-6 print:border-0 print:shadow-none"
      >
        {dossier.lettre ? (
          <>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Btn onClick={copier} variant="gold">
                {copie ? "Copié ✓" : "Copier la lettre"}
              </Btn>
              <Btn onClick={() => window.print()} variant="secondary">
                Imprimer / PDF
              </Btn>
              <LinkBtn href={lienLettre} variant="secondary">
                Modifier la lettre
              </LinkBtn>
            </div>

            <div
              id="print-zone"
              className="letter-paper mt-4 max-h-96 overflow-y-auto rounded-lg border border-line bg-white p-5 text-[13.5px] text-ink print:max-h-none print:overflow-visible print:border-0"
            >
              {dossier.lettre}
            </div>

            <p className="mt-3 text-xs text-ink-soft print:hidden">
              Complétez les mentions entre crochets […] avant l&apos;envoi. Pour parking.brussels,
              passez par le formulaire en ligne : les e-mails sont rejetés depuis le 15 mars 2026.
            </p>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-paper/60 p-6 text-center print:hidden">
            <p className="text-sm leading-relaxed text-ink-soft">
              Aucune lettre n&apos;est encore rattachée à ce dossier. Le module de rédaction reprend
              automatiquement la référence, la plaque, le montant, la commune et vos coordonnées.
            </p>
            <LinkBtn href={lienLettre} variant="gold" className="mt-4">
              Rédiger ma lettre
            </LinkBtn>
          </div>
        )}
      </Card>

      <Card
        title="Où en êtes-vous ?"
        subtitle="Mettez à jour votre dossier au fil des étapes : le tableau de bord s'ajuste."
        className="mt-6 print:hidden"
      >
        {termine ? (
          <p className="text-sm text-ink-soft">
            Ce dossier est terminé. Vous pouvez toujours consulter sa chronologie ci-dessous.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {SUITE_LOGIQUE.filter((s) => s.statut !== dossier.statut).map((s) => (
              <Btn
                key={s.statut}
                variant="secondary"
                disabled={enCours}
                onClick={() =>
                  demarrer(() => {
                    changerStatut(dossier.id, s.statut);
                  })
                }
              >
                {s.libelle}
              </Btn>
            ))}
          </div>
        )}

        <div className="mt-6 border-t border-line-soft pt-4">
          <Btn
            variant="ghost"
            className="text-danger-700 hover:bg-danger-100"
            disabled={enCours}
            onClick={() => setConfirmationSuppression(true)}
          >
            Supprimer ce dossier
          </Btn>
        </div>
      </Card>

      {confirmationSuppression && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="titre-suppression"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
        >
          <Card className="w-full max-w-sm animate-rise border-navy-950/10 shadow-2xl">
            <h2 id="titre-suppression" className="font-display text-xl font-bold text-navy-900">
              Supprimer ce dossier ?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Le dossier, la lettre de contestation et sa chronologie seront définitivement
              supprimés. Cette action ne peut pas être annulée.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Btn
                variant="primary"
                className="btn-danger flex-1"
                disabled={enCours}
                onClick={() =>
                  demarrer(() => {
                    supprimerDossier(dossier.id);
                  })
                }
              >
                {enCours ? "Suppression…" : "Supprimer définitivement"}
              </Btn>
              <Btn
                variant="secondary"
                className="flex-1"
                disabled={enCours}
                onClick={() => setConfirmationSuppression(false)}
              >
                Annuler
              </Btn>
            </div>
          </Card>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-ink-soft print:hidden">
        Besoin d&apos;un point de repère sur les règles applicables ?{" "}
        <Link href="/tableau-de-bord/regles" className="font-semibold text-navy-700 underline">
          Voir les règles de votre commune
        </Link>
        .
      </p>
    </>
  );
}
