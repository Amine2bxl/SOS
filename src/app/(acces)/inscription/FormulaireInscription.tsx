"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sInscrire, type EtatAuth } from "@/lib/auth-actions";
import { Card, Field, TextInput, Btn } from "@/components/ui";
import { MotDePasseInput } from "@/components/MotDePasseInput";
import { FenetreCodeEmail } from "@/components/FenetreCodeEmail";

export function FormulaireInscription() {
  const parametres = useSearchParams();
  const brute = parametres.get("suite") ?? "/tableau-de-bord";
  const suite = brute.startsWith("/") ? brute : "/tableau-de-bord";

  const [email, setEmail] = useState("");
  const [etat, action, enCours] = useActionState<EtatAuth, FormData>(sInscrire, {});

  return (
    <>
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
            <TextInput
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Mot de passe" required hint="Au moins 8 caractères.">
            <MotDePasseInput name="motDePasse" required minLength={8} autoComplete="new-password" />
          </Field>

          <Field label="Confirmer le mot de passe" required>
            <MotDePasseInput name="confirmation" required minLength={8} autoComplete="new-password" />
          </Field>

          {etat.erreur && !etat.otpEnvoye && (
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

      {etat.otpEnvoye && (
        <FenetreCodeEmail
          email={etat.email ?? email}
          suite={suite}
          erreurInitiale={etat.erreur}
        />
      )}
    </>
  );
}
