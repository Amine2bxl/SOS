"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { demanderAdhesion } from "@/lib/dossiers-actions";
import { Card, Btn } from "@/components/ui";

export function FormulaireAdhesion({ formule, nomFormule }: { formule: string; nomFormule: string }) {
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
        <li>1. Vous confirmez votre demande ci-dessous.</li>
        <li>2. Nous vous envoyons les coordonnées bancaires de l&apos;association.</li>
        <li>3. Votre accès illimité est activé dès réception du virement.</li>
      </ol>

      {erreur && (
        <p role="alert" className="mt-4 rounded-md bg-danger-100 p-3 text-sm font-medium text-danger-700">
          {erreur}
        </p>
      )}

      <Btn onClick={envoyer} variant="gold" className="mt-5 w-full" disabled={enCours}>
        {enCours ? "Envoi…" : `Demander l'adhésion ${nomFormule}`}
      </Btn>
    </Card>
  );
}
