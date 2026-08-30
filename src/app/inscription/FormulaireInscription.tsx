"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { sInscrire, type EtatAuth } from "@/lib/auth-actions";
import { Card, Field, TextInput, Btn } from "@/components/ui";
import { ModaleOTP } from "@/components/ModaleOTP";

export function FormulaireInscription() {
  const router = useRouter();
  const [etat, action, enCours] = useActionState<EtatAuth, FormData>(sInscrire, {});
  // La modale s'ouvre dès que l'action serveur signale l'envoi d'un code.
  // On mémorise l'état écarté plutôt que d'utiliser un effet : chaque
  // soumission crée un nouvel objet, donc la modale se rouvre d'elle-même.
  const [etatEcarte, setEtatEcarte] = useState<EtatAuth | null>(null);
  const modaleOuverte = Boolean(etat.codeEnvoye && etat.email) && etat !== etatEcarte;

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

          <Field label="Adresse e-mail" required hint="C'est là que nous enverrons votre code de vérification.">
            <TextInput name="email" type="email" required autoComplete="email" defaultValue={etat.email} />
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

      {modaleOuverte && etat.email && (
        <ModaleOTP
          email={etat.email}
          onSucces={() => router.push("/tableau-de-bord")}
          onAnnuler={() => setEtatEcarte(etat)}
        />
      )}
    </>
  );
}
