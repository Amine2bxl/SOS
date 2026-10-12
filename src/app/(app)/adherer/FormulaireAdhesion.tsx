"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { demanderAdhesion } from "@/lib/dossiers-actions";
import { Card, Btn } from "@/components/ui";

/**
 * Confirmation de la demande d'adhésion.
 *
 * Le rechargement de la page après succès n'est pas un détail : c'est lui qui
 * fait apparaître l'écran de virement avec la communication structurée, rendu
 * côté serveur parce qu'il a besoin des coordonnées bancaires, qui ne doivent
 * pas voyager dans le JavaScript du navigateur.
 */
export function FormulaireAdhesion({
  formule,
  nomFormule,
  prix,
}: {
  formule: string;
  nomFormule: string;
  prix: number;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const envoyer = () => {
    setErreur(null);
    demarrer(async () => {
      const r = await demanderAdhesion(formule);
      if (r.erreur) setErreur(r.erreur);
      else router.refresh();
    });
  };

  return (
    <Card className="mt-6">
      <h2 className="font-display text-lg font-bold text-navy-900">Comment ça se passe</h2>
      <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink">
        {[
          "Vous confirmez ci-dessous. Rien n'est débité : aucune donnée bancaire ne vous est demandée ici.",
          "Vous recevez le montant et la référence à indiquer sur votre virement.",
          "Votre adhésion s'active dès réception du virement, en général sous un à deux jours ouvrables.",
        ].map((etape, i) => (
          <li key={etape} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-400">
              {i + 1}
            </span>
            {etape}
          </li>
        ))}
      </ol>

      {erreur && (
        <p role="alert" className="mt-4 rounded-2xl bg-danger-100 p-3 text-sm font-medium text-danger-700">
          {erreur}
        </p>
      )}

      <Btn onClick={envoyer} variant="gold" taille="lg" className="mt-6 w-full" disabled={enCours}>
        {enCours ? "Enregistrement…" : `Adhérer — ${nomFormule}, ${prix} € par an`}
      </Btn>

      <p className="mt-3 text-center text-xs text-ink-soft">
        Vous pourrez renoncer avant de payer : une demande non réglée n&apos;engage à rien.
      </p>
    </Card>
  );
}
