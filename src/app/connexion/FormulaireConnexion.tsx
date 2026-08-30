"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { seConnecter, type EtatAuth } from "@/lib/auth-actions";
import { Card, Field, TextInput, Btn } from "@/components/ui";
import { MotDePasseInput } from "@/components/MotDePasseInput";

export function FormulaireConnexion() {
  const parametres = useSearchParams();
  const suite = parametres.get("suite") ?? "/tableau-de-bord";
  const [etat, action, enCours] = useActionState<EtatAuth, FormData>(seConnecter, {});

  return (
    <Card className="mt-8">
      <form action={action} className="space-y-4">
        <input type="hidden" name="suite" value={suite} />

        <Field label="Adresse e-mail" required>
          <TextInput name="email" type="email" required autoComplete="email" autoFocus />
        </Field>

        <Field label="Mot de passe" required>
          <MotDePasseInput name="motDePasse" required autoComplete="current-password" />
        </Field>

        {etat.erreur && (
          <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm font-medium text-danger-700">
            {etat.erreur}
          </p>
        )}

        <Btn type="submit" variant="gold" className="w-full" disabled={enCours}>
          {enCours ? "Connexion…" : "Se connecter"}
        </Btn>
      </form>
    </Card>
  );
}
