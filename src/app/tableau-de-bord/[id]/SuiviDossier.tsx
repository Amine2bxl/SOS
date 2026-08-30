"use client";

import { useMemo, useState, useTransition } from "react";
import { changerStatut, supprimerDossier } from "@/lib/dossiers-actions";
import { construireLettre, SAISIE_VIDE } from "@/lib/lettre";
import { MOTIFS } from "@/lib/data";
import { Card, Field, SelectInput, TextArea, Btn } from "@/components/ui";

type DossierLeger = {
  id: string; reference: string; plaque: string; montant: string;
  dateConstat: string; commune: string; statut: string;
};

type Profil = {
  prenom: string; nom: string; adresse: string;
  codePostal: string; ville: string; email: string;
};

/** Étapes proposées, dans l'ordre où elles surviennent réellement. */
const SUITE_LOGIQUE: { statut: string; libelle: string }[] = [
  { statut: "contestation_envoyee", libelle: "J'ai envoyé ma contestation" },
  { statut: "en_attente_reponse", libelle: "J'attends leur réponse" },
  { statut: "accepte", libelle: "Ma redevance a été annulée" },
  { statut: "rejete", libelle: "Ma contestation a été rejetée" },
  { statut: "clos", libelle: "Je clôture ce dossier" },
];

export function SuiviDossier({ dossier, profil }: { dossier: DossierLeger; profil: Profil }) {
  const [motif, setMotif] = useState("paiement");
  const [explication, setExplication] = useState("");
  const [copie, setCopie] = useState(false);
  const [enCours, demarrer] = useTransition();

  const lettre = useMemo(
    () =>
      construireLettre({
        ...SAISIE_VIDE,
        ...profil,
        reference: dossier.reference,
        plaque: dossier.plaque,
        montant: dossier.montant,
        dateConstat: dossier.dateConstat,
        communeConstat: dossier.commune,
        motif,
        explication,
      }),
    [dossier, profil, motif, explication],
  );

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lettre);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      setCopie(false);
    }
  };

  const pieces = MOTIFS.find((m) => m.value === motif)?.pieces ?? [];
  const termine = ["accepte", "rejete", "clos"].includes(dossier.statut);

  return (
    <>
      <Card title="Votre lettre de contestation" className="mt-6 print:border-0 print:shadow-none">
        <div className="space-y-4 print:hidden">
          <Field label="Pourquoi contestez-vous ?">
            <SelectInput
              options={MOTIFS.map((m) => ({ value: m.value, label: m.label }))}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />
          </Field>

          <div className="rounded-lg bg-navy-50 p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-700">
              Pièces à joindre
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-ink">
              {pieces.map((p) => <li key={p}>{p}</li>)}
              <li>Copie du courrier reçu</li>
            </ul>
          </div>

          <Field label="Expliquez votre situation avec vos mots" hint="Facultatif, mais cela renforce nettement votre dossier.">
            <TextArea
              rows={3}
              value={explication}
              onChange={(e) => setExplication(e.target.value)}
              placeholder="Ce qui s'est passé, dans l'ordre, avec les heures…"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Btn onClick={copier} variant="gold">{copie ? "Copié ✓" : "Copier la lettre"}</Btn>
            <Btn onClick={() => window.print()} variant="secondary">Imprimer / PDF</Btn>
          </div>
        </div>

        <div
          id="print-zone"
          className="letter-paper mt-4 max-h-96 overflow-y-auto rounded-lg border border-line bg-white p-5 text-[13.5px] text-ink print:max-h-none print:overflow-visible print:border-0"
        >
          {lettre}
        </div>

        <p className="mt-3 text-xs text-ink-soft print:hidden">
          Complétez les mentions entre crochets […] avant l&apos;envoi. Pour parking.brussels, passez
          par le formulaire en ligne : les e-mails sont rejetés depuis le 15 mars 2026.
        </p>
      </Card>

      <Card title="Où en êtes-vous ?" subtitle="Mettez à jour votre dossier au fil des étapes." className="mt-6 print:hidden">
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
                onClick={() => demarrer(() => { changerStatut(dossier.id, s.statut); })}
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
            onClick={() => {
              if (confirm("Supprimer définitivement ce dossier et sa chronologie ?")) {
                demarrer(() => { supprimerDossier(dossier.id); });
              }
            }}
          >
            Supprimer ce dossier
          </Btn>
        </div>
      </Card>
    </>
  );
}
