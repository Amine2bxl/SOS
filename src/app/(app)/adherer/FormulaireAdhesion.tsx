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
    <Card className="mt-6 border-2 border-gold-400 bg-gold-100/50">
      <h2 className="font-display text-lg font-bold text-navy-900">Demander mon adhésion</h2>
      <ol className="mt-3 space-y-2 text-sm text-ink">
        <li>
          <strong>1.</strong> Vous confirmez ci-dessous. Rien n&apos;est débité : aucune donnée
          bancaire ne vous est demandée sur ce site.
        </li>
        <li>
          <strong>2.</strong> L&apos;écran suivant vous donne le montant et la référence de
          paiement à indiquer sur votre virement.
        </li>
        <li>
          <strong>3.</strong> Votre accès illimité s&apos;active dès réception, en général un à deux
          jours ouvrables.
        </li>
      </ol>

      {erreur && (
        <p role="alert" className="mt-4 rounded-md bg-danger-100 p-3 text-sm font-medium text-danger-700">
          {erreur}
        </p>
      )}

      <Btn onClick={envoyer} variant="gold" className="mt-5 w-full" disabled={enCours}>
        {enCours ? "Enregistrement…" : `Adhérer — formule ${nomFormule}, ${prix} € par an`}
      </Btn>

      <p className="mt-3 text-center text-xs text-ink-soft">
        Vous pourrez renoncer avant de payer : une demande non réglée n&apos;engage à rien.
      </p>
    </Card>
  );
}
