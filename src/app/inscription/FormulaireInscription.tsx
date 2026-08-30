"use client";

import { useActionState } from "react";
import { sInscrire, type EtatAuth } from "@/lib/auth-actions";
import { Card, Field, TextInput, Btn } from "@/components/ui";

export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState<EtatAuth, FormData>(sInscrire, {});

  if (etat.message) {
    return (
      <Card className="mt-6 border-ok-600/40 bg-ok-100/50 text-center">
        <p className="font-display text-lg font-bold text-ok-700">Compte créé ✓</p>
        <p className="mt-2 text-sm text-ink">{etat.message}</p>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom">
            <TextInput name="prenom" autoComplete="given-name" />
          </Field>
          <Field label="Nom">
            <TextInput name="nom" autoComplete="family-name" />
          </Field>
        </div>

        <Field label="Adresse e-mail" required>
          <TextInput name="email" type="email" required autoComplete="email" />
        </Field>

        <Field label="Mot de passe" required hint="Au moins 8 caractères.">
          <TextInput name="motDePasse" type="password" required minLength={8} autoComplete="new-password" />
        </Field>

        {etat.erreur && (
          <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm font-medium text-danger-700">
            {etat.erreur}
          </p>
        )}

        <Btn type="submit" variant="gold" className="w-full" disabled={enCours}>
          {enCours ? "Création…" : "Créer mon compte"}
        </Btn>

        <p className="text-xs leading-relaxed text-ink-soft">
          Vos données servent au suivi de vos dossiers, à rien d&apos;autre. Supprimez-les quand
          vous voulez.
        </p>
      </form>
    </Card>
  );
}
