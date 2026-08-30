"use client";

import { useActionState } from "react";
import { changerMotDePasse, type EtatProfil } from "@/lib/profile-actions";
import { Card, Field, TextInput, Btn } from "@/components/ui";
import { MotDePasseInput } from "@/components/MotDePasseInput";

export function FormulaireSecurite({ email }: { email: string | null }) {
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(changerMotDePasse, {});

  return (
    <div className="space-y-5">
      <Field label="Adresse e-mail de connexion">
        <TextInput value={email ?? ""} readOnly className="bg-line-soft/60 text-ink-soft" />
        <span className="mt-1 block text-xs text-ink-soft">
          Pour changer d&apos;adresse e-mail, contactez-nous : nous vérifions la nouvelle adresse
          avant de basculer le compte.
        </span>
      </Field>

      <form action={action} className="space-y-4">
        <Field label="Mot de passe actuel" required>
          <MotDePasseInput name="ancienMotDePasse" required autoComplete="current-password" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nouveau mot de passe" required hint="Au moins 8 caractères.">
            <MotDePasseInput name="nouveauMotDePasse" required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="Confirmer le nouveau mot de passe" required>
            <MotDePasseInput name="confirmation" required minLength={8} autoComplete="new-password" />
          </Field>
        </div>

        {etat.erreur && (
          <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm font-medium text-danger-700">
            {etat.erreur}
          </p>
        )}
        {etat.message && (
          <p role="status" className="rounded-md bg-ok-100 p-3 text-sm font-medium text-ok-700">
            {etat.message}
          </p>
        )}

        <Btn type="submit" variant="primary" disabled={enCours}>
          {enCours ? "Modification…" : "Modifier mon mot de passe"}
        </Btn>
      </form>
    </div>
  );
}