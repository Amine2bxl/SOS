"use client";

import { useActionState } from "react";
import { enregistrerProfil, type EtatProfil } from "@/lib/profile-actions";
import { Card, Field, TextInput, SelectInput, Btn } from "@/components/ui";
import { COMMUNES } from "@/lib/data";

export function FormulaireProfil(props: {
  prenom: string;
  nom: string;
  adresse: string;
  codePostal: string;
  commune: string;
}) {
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(enregistrerProfil, {});

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" required>
          <TextInput name="prenom" defaultValue={props.prenom} autoComplete="given-name" required />
        </Field>
        <Field label="Nom" required>
          <TextInput name="nom" defaultValue={props.nom} autoComplete="family-name" required />
        </Field>
      </div>

      <Field label="Adresse" hint="Utilisée pour générer vos lettres de contestation.">
        <TextInput name="adresse" defaultValue={props.adresse} autoComplete="street-address" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code postal">
          <TextInput name="codePostal" defaultValue={props.codePostal} inputMode="numeric" autoComplete="postal-code" placeholder="1000" />
        </Field>
        <Field label="Commune">
          <SelectInput
            name="commune"
            options={COMMUNES.map((c) => ({ value: c.nom, label: c.nom }))}
            placeholder="Choisissez votre commune…"
            defaultValue={props.commune}
          />
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

      <Btn type="submit" variant="gold" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer mes informations"}
      </Btn>
    </form>
  );
}