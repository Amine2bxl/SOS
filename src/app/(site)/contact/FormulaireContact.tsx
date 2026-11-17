"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { envoyerMessageContact, type EtatContact } from "@/lib/contact-actions";
import { CONSERVATION_MOIS, LONGUEUR_MESSAGE, SUJETS_CONTACT, type IdSujet } from "@/lib/contact";
import { Btn, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { IconeEnvoyer, IconeOk } from "@/components/icones";

/**
 * Le formulaire de contact. Il envoie vraiment : le message arrive à
 * l'association, qui répond par e-mail à l'adresse indiquée.
 *
 * Deux pièges à robots, invisibles pour un humain : un champ `site_web` caché
 * (un robot le remplit, un humain ne le voit pas) et l'heure d'ouverture du
 * formulaire (un robot l'envoie dans la seconde).
 */
export function FormulaireContact({ sujetInitial }: { sujetInitial: IdSujet | null }) {
  const [etat, envoyer, enCours] = useActionState<EtatContact, FormData>(envoyerMessageContact, {});
  const [ouvertLe, setOuvertLe] = useState("");
  const [longueur, setLongueur] = useState(0);
  const formulaire = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const minuteur = setTimeout(() => setOuvertLe(String(Date.now())), 0);
    return () => clearTimeout(minuteur);
  }, []);

  useEffect(() => {
    if (etat.champ) formulaire.current?.querySelector<HTMLElement>(`[name="${etat.champ}"]`)?.focus();
  }, [etat]);

  if (etat.ok) {
    return (
      <div role="status" className="rounded-2xl bg-ok-50 p-5 text-ok-700">
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          <IconeOk className="h-5 w-5" />
          Message envoyé
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">
          Réponse par e-mail sous 2 jours ouvrables. Délai court ? Écrivez aussi sur WhatsApp.
        </p>
      </div>
    );
  }

  const erreurDe = (champ: string) => (etat.champ === champ ? etat.erreur : undefined);

  return (
    <form ref={formulaire} action={envoyer} noValidate className="space-y-4">
      <input type="hidden" name="ouvert_le" value={ouvertLe} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site web
          <input type="text" name="site_web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Votre nom" required>
          <TextInput name="nom" autoComplete="name" required aria-invalid={!!erreurDe("nom")} />
        </Field>
        <Field label="Votre e-mail" required hint="Pour la réponse.">
          <TextInput name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={!!erreurDe("email")} />
        </Field>
      </div>

      <Field label="Sujet" required>
        <SelectInput
          name="sujet"
          defaultValue={sujetInitial ?? ""}
          placeholder="Choisissez…"
          options={SUJETS_CONTACT.map((s) => ({ value: s.id, label: s.libelle }))}
          required
          aria-invalid={!!erreurDe("sujet")}
        />
      </Field>

      <Field
        label="Votre message"
        required
        hint="Type de courrier, commune, date, montant. Pas besoin de la plaque."
      >
        <TextArea
          name="message"
          rows={6}
          maxLength={LONGUEUR_MESSAGE.max}
          onChange={(e) => setLongueur(e.target.value.length)}
          required
          aria-invalid={!!erreurDe("message")}
          aria-describedby="compteur-message"
        />
      </Field>
      <p id="compteur-message" className="-mt-2 text-right text-xs tabular-nums text-ink-faint">
        {longueur} / {LONGUEUR_MESSAGE.max}
      </p>

      <label className="flex items-start gap-3 rounded-2xl bg-paper p-3.5 text-sm leading-relaxed text-ink">
        <input
          type="checkbox"
          name="consentement"
          required
          aria-invalid={!!erreurDe("consentement")}
          className="mt-0.5 h-5 w-5 shrink-0 accent-navy-900"
        />
        <span>
          J&apos;accepte que l&apos;association utilise ces données pour répondre à mon message. Elles sont effacées au
          plus tard après {CONSERVATION_MOIS} mois.{" "}
          <Link href="/confidentialite" className="font-semibold text-navy-700 underline underline-offset-4">
            Confidentialité
          </Link>
        </span>
      </label>

      {etat.erreur && (
        <p role="alert" className="rounded-2xl bg-danger-50 p-3.5 text-sm font-medium text-danger-700">
          {etat.erreur}
        </p>
      )}

      <Btn type="submit" variant="gold" className="w-full" disabled={enCours}>
        <IconeEnvoyer className="h-4 w-4" />
        {enCours ? "Envoi…" : "Envoyer le message"}
      </Btn>
    </form>
  );
}
