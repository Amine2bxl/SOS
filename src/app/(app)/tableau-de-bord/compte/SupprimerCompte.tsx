"use client";

import { useActionState, useState } from "react";
import { supprimerMonCompte, type EtatProfil } from "@/lib/profile-actions";
import { Btn, Field, TextInput } from "@/components/ui";
import { Modale, EnTeteModale } from "@/components/Modale";

/**
 * Suppression définitive du compte, exécutée sur place.
 *
 * Elle remplace un lien `mailto:` qui demandait à quelqu'un d'écrire, puis
 * d'attendre qu'un bénévole trouve le temps de le faire à la main. Le RGPD
 * donne un droit à l'effacement ; un droit qui dépend de la disponibilité d'un
 * bénévole n'en est pas tout à fait un.
 *
 * Deux garde-fous, parce que l'action est irréversible et qu'elle emporte des
 * dossiers dont le délai de contestation peut encore courir : une fenêtre de
 * confirmation, et un mot à recopier. Un mot à recopier arrête le clic
 * machinal, ce que « Êtes-vous sûr ? » ne fait pas.
 */
export function SupprimerCompte({ dossiers }: { dossiers: number }) {
  const [ouverte, setOuverte] = useState(false);
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(supprimerMonCompte, {});

  return (
    <>
      <Btn onClick={() => setOuverte(true)} variant="dangerDiscret" taille="sm">
        Supprimer mon compte
      </Btn>

      <Modale
        ouverte={ouverte}
        onFermer={() => setOuverte(false)}
        titre="Supprimer mon compte"
        variante="alerte"
        largeur="max-w-md"
      >
        <EnTeteModale titre="Supprimer mon compte" onFermer={() => setOuverte(false)} />
        <p className="mt-1 text-sm text-ink-soft">
          Cette action est définitive. Il n&apos;y a pas de corbeille.
        </p>

        <div className="mt-4 rounded-2xl border-l-4 border-danger-600 bg-danger-50 p-4 text-sm leading-relaxed text-ink">
          <p className="font-semibold text-danger-700">Ce qui sera effacé</p>
          <ul className="mt-2 space-y-1">
            <li>
              • {dossiers === 0
                ? "Vos dossiers de contestation"
                : `Vos ${dossiers} dossier${dossiers > 1 ? "s" : ""} de contestation`}
              , avec leurs lettres et leur historique
            </li>
            <li>• Vos informations personnelles et votre adresse</li>
            <li>• Le texte lu sur les courriers que vous avez scannés</li>
          </ul>
        </div>

        {dossiers > 0 && (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Si une contestation est en cours, téléchargez votre lettre avant de continuer : nous
            n&apos;en garderons aucune copie, et le délai, lui, continue de courir.
          </p>
        )}

        <form action={action} className="mt-5 space-y-4">
          <Field
            label="Recopiez SUPPRIMER pour confirmer"
            required
            hint="En majuscules, sans espace."
          >
            <TextInput name="confirmation" required autoComplete="off" autoCapitalize="characters" />
          </Field>

          {etat.erreur && (
            <p role="alert" className="rounded-2xl bg-danger-100 p-3 text-sm font-medium text-danger-700">
              {etat.erreur}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Btn type="submit" variant="danger" className="flex-1" disabled={enCours}>
              {enCours ? "Suppression…" : "Supprimer définitivement"}
            </Btn>
            <Btn type="button" variant="secondary" className="flex-1" onClick={() => setOuverte(false)}>
              Annuler
            </Btn>
          </div>
        </form>
      </Modale>
    </>
  );
}
