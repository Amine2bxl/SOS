"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sInscrire, verifierOtp, renvoyerCode, type EtatAuth } from "@/lib/auth-actions";
import { Card, Field, TextInput, Btn } from "@/components/ui";

/** Quatre cases de saisie du code à 6 chiffres, avec avance automatique. */
function SaisieCode({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chiffres = Array.from({ length: 6 }, (_, i) => valeur[i] ?? "");

  function ajouter(index: number, saisie: string) {
    const chiffre = saisie.replace(/\D/g, "").slice(-1);
    const suivant = valeur.slice(0, index) + chiffre + valeur.slice(index + 1);
    onChange(suivant);
    if (chiffre && index < 5) refs.current[index + 1]?.focus();
  }

  function effacer(index: number) {
    const suivant = valeur.slice(0, index) + valeur.slice(index + 1);
    onChange(suivant);
    if (index > 0) refs.current[index - 1]?.focus();
  }

  return (
    <div className="flex justify-center gap-2">
      {chiffres.map((chiffre, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : undefined}
          value={chiffre}
          onChange={(e) => ajouter(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !chiffre) effacer(i - 1);
          }}
          aria-label={`Chiffre ${i + 1} du code`}
          className="h-12 w-10 rounded-md border border-line bg-white text-center text-lg font-bold text-navy-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/40"
        />
      ))}
    </div>
  );
}

export function FormulaireInscription() {
  const parametres = useSearchParams();
  const suite = parametres.get("suite") ?? "/tableau-de-bord";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const formulaireCodeRef = useRef<HTMLFormElement>(null);

  const [etat, action, enCours] = useActionState<EtatAuth, FormData>(sInscrire, {});
  const [etatCode, actionCode, codeEnCours] = useActionState<EtatAuth, FormData>(verifierOtp, {});
  const [etatRenvol, actionRenvol, renvoiEnCours] = useActionState<EtatAuth, FormData>(
    renvoyerCode,
    {},
  );

  // Dès que les 6 chiffres sont saisis, la vérification part toute seule.
  useEffect(() => {
    if (code.length === 6) formulaireCodeRef.current?.requestSubmit();
  }, [code]);

  const popupVisible = etat.otpEnvoye;

  return (
    <>
      <Card className="mt-6">
        <form action={action} className="space-y-4">
          <input type="hidden" name="suite" value={suite} />

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

      {popupVisible && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-code"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
        >
          <Card className="w-full max-w-sm animate-rise border-navy-950/10 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold-600" fill="currentColor" aria-hidden="true">
                <path d="M7 11V7a5 5 0 0 1 10 0v4h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2Zm2 0h6V7a3 3 0 0 0-6 0v4Z" />
              </svg>
            </div>

            <h2 id="titre-code" className="mt-4 text-center font-display text-xl font-bold text-navy-900">
              Vérifiez votre adresse e-mail
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
              Un code à 6 chiffres a été envoyé à <span className="font-semibold text-ink">{email || "votre adresse"}</span>.
              Saisissez-le pour activer votre compte.
            </p>

            <form ref={formulaireCodeRef} action={actionCode} className="mt-5 space-y-4">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="suite" value={suite} />
              <input type="hidden" name="code" value={code} />

              <SaisieCode valeur={code} onChange={setCode} />

              {etatCode.erreur && (
                <p role="alert" className="rounded-md bg-danger-100 p-3 text-center text-sm font-medium text-danger-700">
                  {etatCode.erreur}
                </p>
              )}
              {etatRenvol.message && (
                <p className="text-center text-sm font-medium text-ok-700">{etatRenvol.message}</p>
              )}

              <Btn type="submit" variant="gold" className="w-full" disabled={codeEnCours || code.length < 6}>
                {codeEnCours ? "Vérification…" : "Vérifier mon compte"}
              </Btn>
            </form>

            <form action={actionRenvol} className="mt-3 text-center">
              <input type="hidden" name="email" value={email} />
              {etatRenvol.erreur && (
                <p role="alert" className="mb-2 rounded-md bg-danger-100 p-2 text-center text-xs font-medium text-danger-700">
                  {etatRenvol.erreur}
                </p>
              )}
              <button
                type="submit"
                disabled={renvoiEnCours}
                className="text-sm font-semibold text-navy-700 underline decoration-navy-700/30 underline-offset-2 transition hover:text-navy-900"
              >
                {renvoiEnCours ? "Envoi en cours…" : "Je n'ai pas reçu le code, renvoyer"}
              </button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}