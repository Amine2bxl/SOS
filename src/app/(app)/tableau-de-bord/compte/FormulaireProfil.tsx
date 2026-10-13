"use client";

import { useActionState } from "react";
import { enregistrerProfil, type EtatProfil } from "@/lib/profile-actions";
import { Field, TextInput, Btn } from "@/components/ui";

/**
 * Les coordonnées, saisies une fois pour toutes : chaque lettre les reprend.
 * La commune est libre : le site couvre Bruxelles-Capitale, mais une adresse en Flandre ou en
 * Wallonie reste une adresse — c'est celle qui figure sur les lettres.
 */
export function FormulaireProfil(props: {
  prenom: string;
  nom: string;
  telephone: string;
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

      <Field label="Rue et numéro">
        <TextInput name="adresse" defaultValue={props.adresse} autoComplete="street-address" placeholder="Rue de la Loi 16" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Field label="Code postal">
          <TextInput
            name="codePostal"
            defaultValue={props.codePostal}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="1000"
          />
        </Field>
        <Field label="Commune">
          <TextInput name="commune" defaultValue={props.commune} autoComplete="address-level2" placeholder="Bruxelles" />
        </Field>
      </div>

      <Field label="Téléphone" hint="Facultatif. Il apparaît sous votre nom dans les lettres, pour qu'on puisse vous joindre.">
        <TextInput name="telephone" type="tel" defaultValue={props.telephone} autoComplete="tel" placeholder="+32 470 00 00 00" />
      </Field>

      {etat.erreur && (
        <p role="alert" className="rounded-2xl bg-danger-100 p-3 text-sm font-medium text-danger-700">
          {etat.erreur}
        </p>
      )}
      {etat.message && (
        <p role="status" className="rounded-2xl bg-ok-100 p-3 text-sm font-medium text-ok-700">
          {etat.message}
        </p>
      )}

      <Btn type="submit" variant="gold" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </Btn>
    </form>
  );
}
