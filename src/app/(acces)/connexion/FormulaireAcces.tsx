"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { envoyerCode, verifierCode, type EtatAuth, type ModeConfirmation } from "@/lib/auth-actions";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { Btn } from "@/components/ui";
import { IconeFlecheGauche, IconeMail } from "@/components/icones";
import { MarqueSos } from "@/components/Logo";
import { cheminSur } from "@/lib/chemin-sur";

/**
 * Entrer dans son espace : une adresse, un code. Rien d'autre.
 *
 * Il n'y a pas de bouton « créer un compte » distinct : la première fois, le
 * code crée le compte ; les fois suivantes, il l'ouvre. Pas de mot de passe à
 * inventer, pas de case « confirmer le mot de passe », pas d'e-mail de
 * confirmation suivi d'un second formulaire. C'est le parcours le plus court
 * qui prouve qu'une adresse est bien la vôtre.
 */

const ERREURS_URL: Record<string, string> = {
  "lien-expire": "Ce lien a expiré ou a déjà servi. Demandez un nouveau code ci-dessous.",
  "autre-navigateur":
    "Le lien a été ouvert dans un autre navigateur que celui de la demande. Saisissez plutôt le code reçu, ou redemandez-en un ici.",
  "connexion-annulee": "La connexion a été annulée. Vous pouvez réessayer.",
  "lien-incomplet": "Ce lien est incomplet. Demandez un nouveau code ci-dessous.",
  "service-indisponible": "Le service est momentanément indisponible. Réessayez dans un instant.",
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

/** Le widget anti-robot de Cloudflare, chargé seulement s'il est configuré. */
function AntiRobot({ cle, surJeton }: { cle: string; surJeton: (jeton: string) => void }) {
  const zone = useRef<HTMLDivElement>(null);
  const rendu = useRef(false);

  useEffect(() => {
    const afficher = () => {
      if (rendu.current || !zone.current || !window.turnstile) return;
      rendu.current = true;
      window.turnstile.render(zone.current, {
        sitekey: cle,
        callback: surJeton,
        "refresh-expired": "auto",
        language: "fr",
        appearance: "interaction-only",
      });
    };
    if (window.turnstile) {
      afficher();
      return;
    }
    const existant = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    const script = existant ?? document.createElement("script");
    if (!existant) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.turnstile = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", afficher);
    return () => script.removeEventListener("load", afficher);
  }, [cle, surJeton]);

  return <div ref={zone} className="flex justify-center empty:hidden" />;
}

function IconeGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.4 24 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

export function FormulaireAcces({
  mode,
  googleActif,
  cleTurnstile,
}: {
  mode: ModeConfirmation;
  googleActif: boolean;
  cleTurnstile: string | null;
}) {
  const parametres = useSearchParams();
  const brute = parametres.get("suite") ?? "/tableau-de-bord";
  const suite = cheminSur(brute);
  const erreurUrl = ERREURS_URL[parametres.get("erreur") ?? ""] ?? null;

  const [envoi, envoyer, envoiEnCours] = useActionState<EtatAuth, FormData>(envoyerCode, {});
  const [verif, verifier, verifEnCours] = useActionState<EtatAuth, FormData>(verifierCode, {});

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [jetonHumain, setJetonHumain] = useState("");
  const [modifierAdresse, setModifierAdresse] = useState(false);
  const [attente, setAttente] = useState(0);
  const [googleEnCours, setGoogleEnCours] = useState(false);
  const formulaireCode = useRef<HTMLFormElement>(null);

  // L'étape « code » est dérivée de la réponse du serveur, pas d'un état qu'on
  // synchroniserait à la main : impossible d'afficher une saisie de code pour
  // un e-mail qui n'est pas parti.
  const etapeCode = !!envoi.envoye && !modifierAdresse;
  const adresse = envoi.email ?? email;
  const modeEnvoi = envoi.mode ?? mode;

  // Compte à rebours avant de pouvoir redemander un code.
  useEffect(() => {
    if (attente <= 0) return;
    const t = setTimeout(() => setAttente((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [attente]);

  // Code vérifié : on charge l'espace par une navigation complète, pour que le
  // serveur lise le cookie de session tout juste écrit.
  useEffect(() => {
    if (verif.verifie) window.location.assign(suite);
  }, [verif.verifie, suite]);

  const continuerAvecGoogle = async () => {
    const supabase = creerClientNavigateur();
    if (!supabase) return;
    setGoogleEnCours(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm?suite=${encodeURIComponent(suite)}` },
    });
  };

  if (verif.verifie) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center animate-rise">
        <MarqueSos className="h-16 w-16 animate-pop" />
        <p className="font-display text-xl font-bold text-navy-900">Ouverture de votre espace…</p>
      </div>
    );
  }

  /* ---------------------------------------------------------- étape 2 : code */
  if (etapeCode) {
    return (
      <div className="w-full max-w-sm animate-rise">
        <button
          type="button"
          onClick={() => {
            setEmail(adresse);
            setModifierAdresse(true);
            setCode("");
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900"
        >
          <IconeFlecheGauche className="h-4 w-4" /> Modifier l&apos;adresse
        </button>

        <span className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-navy-900">
          <IconeMail className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-[1.9rem] font-extrabold leading-tight text-navy-900">
          {modeEnvoi === "code" ? "Entrez votre code" : "Ouvrez votre e-mail"}
        </h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          {modeEnvoi === "code" ? "Un code à 6 chiffres vient de partir vers " : "Un e-mail vient de partir vers "}
          <strong className="text-ink">{adresse}</strong>.
          {modeEnvoi === "lien" && " Cliquez sur le lien qu'il contient, sur cet appareil."}
        </p>

        <form ref={formulaireCode} action={verifier} className="mt-7">
          <input type="hidden" name="email" value={adresse} />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-900">
              {modeEnvoi === "code" ? "Code reçu par e-mail" : "Votre e-mail contient un code ? Saisissez-le ici"}
            </span>
            <input
              name="code"
              value={code}
              onChange={(e) => {
                const chiffres = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(chiffres);
                // Six chiffres : on valide sans attendre le clic.
                if (chiffres.length === 6) setTimeout(() => formulaireCode.current?.requestSubmit(), 0);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus={modeEnvoi === "code"}
              placeholder="••••••"
              aria-describedby="aide-code"
              className="h-16 w-full rounded-2xl border-2 border-line bg-white text-center font-display text-3xl font-extrabold tracking-[0.5em] text-navy-900 outline-none transition placeholder:text-line focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
            />
          </label>
          <p id="aide-code" className="mt-2 text-xs text-ink-soft">
            Pas reçu ? Regardez dans les indésirables — l&apos;expéditeur est SOS Citizens.
          </p>

          {verif.erreur && (
            <p role="alert" className="mt-4 rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger-700">
              {verif.erreur}
            </p>
          )}

          <Btn type="submit" variant="gold" taille="lg" className="mt-5 w-full" disabled={verifEnCours || code.length !== 6}>
            {verifEnCours ? "Vérification…" : "Entrer dans mon espace"}
          </Btn>
        </form>

        <form
          action={envoyer}
          onSubmit={() => setAttente(45)}
          className="mt-4 text-center"
        >
          <input type="hidden" name="email" value={adresse} />
          <input type="hidden" name="suite" value={suite} />
          {jetonHumain && <input type="hidden" name="cf-turnstile-response" value={jetonHumain} />}
          <button
            type="submit"
            disabled={envoiEnCours || attente > 0}
            className="text-sm font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4 hover:text-navy-900 disabled:cursor-default disabled:text-ink-faint disabled:no-underline"
          >
            {envoiEnCours ? "Envoi…" : attente > 0 ? `Renvoyer un code dans ${attente} s` : "Renvoyer un code"}
          </button>
          {envoi.erreur && <p className="mt-2 text-sm text-danger-700">{envoi.erreur}</p>}
        </form>
      </div>
    );
  }

  /* -------------------------------------------------------- étape 1 : e-mail */
  return (
    <div className="w-full max-w-sm animate-rise">
      <h1 className="font-display text-[2rem] font-extrabold leading-[1.08] text-navy-900">
        Entrer dans mon espace
      </h1>
      <p className="mt-2.5 leading-relaxed text-ink-soft">
        Votre adresse e-mail, un code, et vous y êtes. Pas de mot de passe — et si c&apos;est votre
        première visite, votre compte se crée tout seul.
      </p>

      {erreurUrl && (
        <p role="alert" className="mt-5 rounded-xl bg-warn-100 p-3 text-sm font-medium text-warn-700">
          {erreurUrl}
        </p>
      )}

      {googleActif && (
        <>
          <button
            type="button"
            onClick={continuerAvecGoogle}
            disabled={googleEnCours}
            className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-white font-semibold text-navy-900 shadow-sm transition hover:bg-navy-50 disabled:opacity-60"
          >
            <IconeGoogle />
            {googleEnCours ? "Ouverture de Google…" : "Continuer avec Google"}
          </button>
          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            <span className="h-px flex-1 bg-line" /> ou par e-mail <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form
        action={(donnees) => {
          setModifierAdresse(false);
          envoyer(donnees);
          setAttente(45);
        }}
        className={googleActif ? "" : "mt-7"}
      >
        <input type="hidden" name="suite" value={suite} />
        {jetonHumain && <input type="hidden" name="cf-turnstile-response" value={jetonHumain} />}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy-900">Adresse e-mail</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus={!googleActif}
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.be"
            className="h-13 w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-ink-faint focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
          />
        </label>

        {cleTurnstile && (
          <div className="mt-4">
            <AntiRobot cle={cleTurnstile} surJeton={setJetonHumain} />
          </div>
        )}

        {envoi.erreur && (
          <p role="alert" className="mt-4 rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger-700">
            {envoi.erreur}
          </p>
        )}

        <Btn
          type="submit"
          variant="gold"
          taille="lg"
          className="mt-5 w-full"
          disabled={envoiEnCours || (!!cleTurnstile && !jetonHumain)}
        >
          {envoiEnCours ? "Envoi du code…" : "Recevoir mon code"}
        </Btn>
      </form>

      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        En continuant, vous acceptez les{" "}
        <a href="/conditions-utilisation" className="underline hover:text-ink">
          conditions d&apos;utilisation
        </a>
        . Votre adresse sert à vous envoyer votre code et les rappels de vos dossiers — à rien
        d&apos;autre.
      </p>
    </div>
  );
}
