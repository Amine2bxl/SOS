"use client";

import { useActionState, useState } from "react";
import { enregistrerProfil, type EtatProfil } from "@/lib/profile-actions";
import { Field, TextInput, Btn } from "@/components/ui";
import { LANGUES, useLangue, type Langue } from "@/lib/i18n";

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
  typeCompte: "particulier" | "organisation";
  organisation: string;
  langueInterface: string;
}) {
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(enregistrerProfil, {});
  const [type, setType] = useState(props.typeCompte);
  const { changer } = useLangue();

  return (
    <form action={action} className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-navy-900">Ce compte est celui</legend>
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          {(
            [
              ["particulier", "D'un particulier"],
              ["organisation", "D'une organisation ou société"],
            ] as const
          ).map(([valeur, libelle]) => (
            <label
              key={valeur}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gold-300/50 ${
                type === valeur ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"
              }`}
            >
              <input
                type="radio"
                name="typeCompte"
                value={valeur}
                checked={type === valeur}
                onChange={() => setType(valeur)}
                className="sr-only"
              />
              {libelle}
            </label>
          ))}
        </div>
      </fieldset>

      {type === "organisation" && (
        <Field label="Nom de l'organisation" required hint="Pour que l'association sache au nom de qui elle échange.">
          <TextInput name="organisation" defaultValue={props.organisation} autoComplete="organization" required />
        </Field>
      )}

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

      <Field label="Langue de l'interface" hint="Les lettres, elles, partent dans la langue de l'administration.">
        <select
          name="langueInterface"
          defaultValue={props.langueInterface}
          onChange={(e) => changer(e.target.value as Langue)}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
        >
          {LANGUES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
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
