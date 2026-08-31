"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { verifierOtp, renvoyerCode, type EtatAuth } from "@/lib/auth-actions";
import { Card, Btn } from "@/components/ui";

/** Six cases de saisie du code, avec avance automatique et collage accepté. */
function SaisieCode({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chiffres = Array.from({ length: 6 }, (_, i) => valeur[i] ?? "");

  function ajouter(index: number, saisie: string) {
    const propre = saisie.replace(/\D/g, "");
    // Collage du code entier : on remplit tout d'un coup.
    if (propre.length > 1) {
      onChange((valeur.slice(0, index) + propre).slice(0, 6));
      refs.current[Math.min(index + propre.length, 5)]?.focus();
      return;
    }
    const suivant = valeur.slice(0, index) + propre.slice(-1) + valeur.slice(index + 1);
    onChange(suivant);
    if (propre && index < 5) refs.current[index + 1]?.focus();
  }

  function effacer(index: number) {
    if (index < 0) return;
    onChange(valeur.slice(0, index) + valeur.slice(index + 1));
    refs.current[index]?.focus();
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
          pattern="[0-9]*"
          maxLength={6}
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

/** Compte à rebours entre deux renvois, pour éviter le matraquage. */
function useAttente(secondes: number) {
  const [restant, setRestant] = useState(0);
  useEffect(() => {
    if (restant <= 0) return;
    const minuteur = setTimeout(() => setRestant((r) => r - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [restant]);
  return { restant, relancer: () => setRestant(secondes) };
}

/**
 * Fenêtre de saisie du code envoyé par e-mail.
 *
 * Partagée par la création de compte et par la connexion : quelqu'un dont
 * l'adresse n'a jamais été confirmée retrouve ici exactement le même écran, au
 * lieu de rester bloqué sans issue.
 */
export function FenetreCodeEmail({
  email,
  suite,
  introduction,
  erreurInitiale,
  onFermer,
}: {
  email: string;
  suite: string;
  introduction?: string;
  erreurInitiale?: string;
  onFermer?: () => void;
}) {
  const [code, setCode] = useState("");
  const formulaireRef = useRef<HTMLFormElement>(null);
  const attente = useAttente(60);

  const [etatCode, actionCode, codeEnCours] = useActionState<EtatAuth, FormData>(verifierOtp, {});
  const [etatRenvoi, actionRenvoi, renvoiEnCours] = useActionState<EtatAuth, FormData>(
    renvoyerCode,
    {},
  );

  // Les 6 chiffres saisis : la vérification part toute seule.
  useEffect(() => {
    if (code.length === 6) formulaireRef.current?.requestSubmit();
  }, [code]);

  // Code accepté : après le signe de validation, on charge l'espace membre.
  // Navigation complète et non `router.push` : le serveur voit ainsi le cookie
  // de session tout juste écrit et rend la bonne coquille du premier coup.
  useEffect(() => {
    if (!etatCode.verifie) return;
    const minuteur = setTimeout(() => window.location.assign(suite), 1500);
    return () => clearTimeout(minuteur);
  }, [etatCode.verifie, suite]);

  const erreur = etatCode.erreur ?? erreurInitiale;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-code"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
    >
      <Card className="w-full max-w-sm animate-rise border-navy-950/10 shadow-2xl">
        {etatCode.verifie ? (
          <div className="py-4 text-center">
            <span
              className="animate-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ok-600 shadow-lg shadow-ok-600/30"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-white">
                <path
                  className="check-draw"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.5l5 5L19.5 7"
                />
              </svg>
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold text-ok-700">
              Adresse confirmée&nbsp;✓
            </h2>
            <p className="mt-2 text-sm text-ink-soft">On ouvre votre espace…</p>
            <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-line-soft">
              <div className="barre-avance h-full rounded-full bg-gold-400" />
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold-600" fill="currentColor" aria-hidden="true">
                <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm2.4.5L12 11.6l6.6-5.1H5.4Z" />
              </svg>
            </div>

            <h2 id="titre-code" className="mt-4 text-center font-display text-xl font-bold text-navy-900">
              Confirmez votre adresse e-mail
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
              {introduction ?? "Un code à 6 chiffres vient de partir vers"}{" "}
              <span className="font-semibold text-ink">{email || "votre adresse"}</span>. Il est
              aussi rappelé dans l&apos;objet du message.
            </p>

            <form ref={formulaireRef} action={actionCode} className="mt-5 space-y-4">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="code" value={code} />

              <SaisieCode valeur={code} onChange={setCode} />

              {erreur && (
                <p role="alert" className="rounded-md bg-danger-100 p-3 text-center text-sm font-medium text-danger-700">
                  {erreur}
                </p>
              )}
              {etatRenvoi.message && !etatRenvoi.erreur && (
                <p className="text-center text-sm font-medium text-ok-700">{etatRenvoi.message}</p>
              )}

              <Btn type="submit" variant="gold" className="w-full" disabled={codeEnCours || code.length < 6}>
                {codeEnCours ? "Vérification…" : "Confirmer mon adresse"}
              </Btn>
            </form>

            <form
              action={actionRenvoi}
              onSubmit={() => attente.relancer()}
              className="mt-3 text-center"
            >
              <input type="hidden" name="email" value={email} />
              {etatRenvoi.erreur && (
                <p role="alert" className="mb-2 rounded-md bg-danger-100 p-2 text-center text-xs font-medium text-danger-700">
                  {etatRenvoi.erreur}
                </p>
              )}
              <button
                type="submit"
                disabled={renvoiEnCours || attente.restant > 0}
                className="text-sm font-semibold text-navy-700 underline decoration-navy-700/30 underline-offset-2 transition hover:text-navy-900 disabled:no-underline disabled:opacity-50"
              >
                {renvoiEnCours
                  ? "Envoi en cours…"
                  : attente.restant > 0
                    ? `Renvoyer un code dans ${attente.restant} s`
                    : "Je n'ai pas reçu le code, me le renvoyer"}
              </button>
            </form>

            {onFermer && (
              <button
                type="button"
                onClick={onFermer}
                className="mt-4 block w-full text-center text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-ink"
              >
                Revenir en arrière
              </button>
            )}

            <p className="mt-4 rounded-md bg-navy-50 p-3 text-center text-xs leading-relaxed text-ink-soft">
              Rien dans la boîte de réception&nbsp;? Regardez dans les indésirables&nbsp;: l&apos;e-mail
              vient de <span className="font-semibold">SOS Citizens ASBL</span>.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
