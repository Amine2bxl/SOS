"use client";

import { useActionState, useEffect, useState } from "react";
import { renvoyerCode, type EtatAuth } from "@/lib/auth-actions";
import { Btn } from "@/components/ui";
import { Modale } from "@/components/Modale";

/**
 * Fenêtre affichée quand la confirmation se fait par **lien** et non par code.
 *
 * Le gabarit d'e-mail par défaut de Supabase ne contient pas de code à
 * 6 chiffres : il ne porte qu'un lien. Afficher une grille de saisie dans ce
 * mode reviendrait à réclamer un code qui n'existe nulle part — c'est
 * exactement la panne qu'on vient de corriger. On demande donc ce que
 * l'utilisateur peut réellement faire : ouvrir sa boîte et cliquer.
 *
 * Le lien atterrit sur `/auth/confirm`, qui ouvre la session et redirige.
 */
export function VerifierBoiteMail({ email }: { email: string }) {
  const [attente, setAttente] = useState(0);
  const [etat, action, enCours] = useActionState<EtatAuth, FormData>(renvoyerCode, {});

  useEffect(() => {
    if (attente <= 0) return;
    const minuteur = setTimeout(() => setAttente((n) => n - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [attente]);

  return (
    <Modale ouverte fermable={false} onFermer={() => {}} titre="Confirmez votre adresse e-mail">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/20">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold-600" fill="currentColor" aria-hidden="true">
          <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm2.4.5L12 11.6l6.6-5.1H5.4Z" />
        </svg>
      </div>

      <h2 className="mt-4 text-center font-display text-xl font-bold text-navy-900">
        Votre compte est créé
      </h2>
      <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
        Un e-mail vient de partir vers{" "}
        <span className="font-semibold text-ink">{email || "votre adresse"}</span>. Ouvrez-le et{" "}
        <strong className="text-navy-900">cliquez sur le lien de confirmation</strong> : votre
        espace s&apos;ouvrira aussitôt.
      </p>

      <ol className="mt-5 space-y-2.5 rounded-lg bg-navy-50 p-4">
        {[
          "Ouvrez votre boîte de réception.",
          "Cherchez l'e-mail de confirmation — regardez aussi dans les indésirables.",
          "Cliquez sur le lien qu'il contient. Cette page se mettra à jour toute seule.",
        ].map((etape, i) => (
          <li key={etape} className="flex gap-3 text-sm text-ink">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-gold-300">
              {i + 1}
            </span>
            {etape}
          </li>
        ))}
      </ol>

      {etat.message && !etat.erreur && (
        <p className="mt-4 rounded-md bg-ok-100 p-3 text-center text-sm font-medium text-ok-700">
          {etat.message}
        </p>
      )}
      {etat.erreur && (
        <p role="alert" className="mt-4 rounded-md bg-danger-100 p-3 text-center text-sm font-medium text-danger-700">
          {etat.erreur}
        </p>
      )}

      <form action={action} onSubmit={() => setAttente(60)} className="mt-4 text-center">
        <input type="hidden" name="email" value={email} />
        <Btn type="submit" variant="secondary" className="w-full" disabled={enCours || attente > 0}>
          {enCours
            ? "Envoi en cours…"
            : attente > 0
              ? `Renvoyer dans ${attente} s`
              : "Je n'ai rien reçu, renvoyer l'e-mail"}
        </Btn>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-ink-soft">
        Vous pourrez vous connecter dès que votre adresse sera confirmée.
      </p>
    </Modale>
  );
}
