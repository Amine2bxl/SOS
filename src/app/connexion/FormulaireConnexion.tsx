"use client";

import { useActionState, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { seConnecter, type EtatAuth } from "@/lib/auth-actions";
import { Card, Field, TextInput, Btn } from "@/components/ui";
import { ModaleOTP } from "@/components/ModaleOTP";

export function FormulaireConnexion() {
  const router = useRouter();
  const parametres = useSearchParams();
  const suite = parametres.get("suite") ?? "/tableau-de-bord";
  const [etat, action, enCours] = useActionState<EtatAuth, FormData>(seConnecter, {});
  // Compte jamais confirmé : l'action renvoie un code et la modale s'ouvre.
  // Ouverture dérivée de l'état, sans effet : chaque soumission crée un
  // nouvel objet, donc la modale se rouvre après une annulation.
  const [etatEcarte, setEtatEcarte] = useState<EtatAuth | null>(null);
  const modaleOuverte = Boolean(etat.codeEnvoye && etat.email) && etat !== etatEcarte;

  return (
    <>
      <Card className="mt-8">
        <form action={action} className="space-y-4">
          <input type="hidden" name="suite" value={suite} />

          <Field label="Adresse e-mail" required>
            <TextInput name="email" type="email" required autoComplete="email" autoFocus defaultValue={etat.email} />
          </Field>

          <Field label="Mot de passe" required>
            <TextInput name="motDePasse" type="password" required autoComplete="current-password" />
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

      {modaleOuverte && etat.email && (
        <ModaleOTP
          email={etat.email}
          onSucces={() => router.push(suite.startsWith("/") ? suite : "/tableau-de-bord")}
          onAnnuler={() => setEtatEcarte(etat)}
        />
      )}
    </>
  );
}
