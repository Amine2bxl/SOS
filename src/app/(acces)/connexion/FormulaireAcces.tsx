"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { envoyerCode, verifierCode, verifierSession, type EtatAuth, type ModeConfirmation } from "@/lib/auth-actions";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { Btn } from "@/components/ui";
import { IconeFlecheGauche, IconeMail } from "@/components/icones";
import { MarqueSos } from "@/components/Logo";
import { cheminSur } from "@/lib/chemin-sur";
import { CLE_ATTENTE_AUTH, lireAttenteAuth, secondesAvantRenvoi, type AttenteAuth } from "@/lib/auth-attente";

function lireStockage(): string | null {
  try { return sessionStorage.getItem(CLE_ATTENTE_AUTH); } catch { return null; }
}

function abonnerStockage(changement: () => void) {
  window.addEventListener(CLE_ATTENTE_AUTH, changement);
  return () => window.removeEventListener(CLE_ATTENTE_AUTH, changement);
}

function stockerAttente(attente: AttenteAuth | null) {
  try {
    if (attente) sessionStorage.setItem(CLE_ATTENTE_AUTH, JSON.stringify(attente));
    else sessionStorage.removeItem(CLE_ATTENTE_AUTH);
    window.dispatchEvent(new Event(CLE_ATTENTE_AUTH));
  } catch { /* Le formulaire fonctionne aussi sans stockage navigateur. */ }
}

const stockageServeur = () => null;

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
      remove: (id: string) => void;
    };
  }
}

/** Le widget anti-robot de Cloudflare, chargé seulement s'il est configuré. */
function AntiRobot({ cle, surJeton }: { cle: string; surJeton: (jeton: string) => void }) {
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id: string | null = null;
    const afficher = () => {
      if (id || !zone.current || !window.turnstile) return;
      id = window.turnstile.render(zone.current, {
        sitekey: cle,
        callback: surJeton,
        "expired-callback": () => surJeton(""),
        "error-callback": () => surJeton(""),
        "refresh-expired": "auto",
        language: "fr",
        appearance: "interaction-only",
      });
    };
    const existant = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    const script = existant ?? document.createElement("script");
    if (!existant) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.turnstile = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", afficher);
    afficher();
    return () => {
      script.removeEventListener("load", afficher);
      if (id) window.turnstile?.remove(id);
    };
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
  emailVerifie = null,
}: {
  mode: ModeConfirmation;
  googleActif: boolean;
  cleTurnstile: string | null;
  emailVerifie?: string | null;
}) {
  const routeur = useRouter();
  const parametres = useSearchParams();
  const brute = parametres.get("suite") ?? "/tableau-de-bord";
  const suite = cheminSur(brute);
  const erreurUrl = ERREURS_URL[parametres.get("erreur") ?? ""] ?? null;

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [jetonHumain, setJetonHumain] = useState("");
  const [demande, setDemande] = useState<AttenteAuth | null>(null);
  const [horloge, setHorloge] = useState(() => Date.now());
  const [cycleHumain, setCycleHumain] = useState(0);
  const [sessionVerifiee, setSessionVerifiee] = useState<string | null>(null);
  const [erreurVerification, setErreurVerification] = useState<string | null>(null);
  const [googleEnCours, setGoogleEnCours] = useState(false);
  const [erreurGoogle, setErreurGoogle] = useState<string | null>(null);
  const formulaireCode = useRef<HTMLFormElement>(null);
  const derniereSoumission = useRef("");
  const stockage = useSyncExternalStore(abonnerStockage, lireStockage, stockageServeur);
  const enAttente = demande ?? lireAttenteAuth(stockage, suite, horloge);
  const etapeCode = !!enAttente;
  const adresse = enAttente?.email ?? email;
  const modeEnvoi = enAttente?.mode ?? mode;
  const attente = enAttente ? secondesAvantRenvoi(enAttente.envoyeLe, horloge) : 0;

  const [envoi, envoyer, envoiEnCours] = useActionState<EtatAuth, FormData>(async (precedent, donnees) => {
    const resultat = await envoyerCode(precedent, donnees);
    setJetonHumain("");
    setCycleHumain((n) => n + 1);
    if (resultat.envoye && resultat.email) {
      const a: AttenteAuth = { email: resultat.email, suite, mode: resultat.mode ?? mode, envoyeLe: Date.now() };
      setDemande(a);
      stockerAttente(a);
      setHorloge(a.envoyeLe);
      setCode("");
      setErreurVerification(null);
      derniereSoumission.current = "";
    }
    return resultat;
  }, {});

  const [verif, verifier, verifEnCours] = useActionState<EtatAuth, FormData>(async (precedent, donnees) => {
    const resultat = await verifierCode(precedent, donnees);
    setErreurVerification(resultat.erreur ?? null);
    if (resultat.verifie) stockerAttente(null);
    return resultat;
  }, {});

  // Le délai commence uniquement après un envoi réussi, même après rechargement.
  useEffect(() => {
    if (!etapeCode || attente <= 0) return;
    const t = setTimeout(() => setHorloge(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [etapeCode, attente]);

  // En revenant de la messagerie, l'onglet initial suit un ancien lien validé.
  // Le serveur vérifie la session ET son adresse, jamais un simple paramètre URL.
  useEffect(() => {
    if (!etapeCode) return;
    let actif = true;
    const actualiser = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const resultat = await verifierSession(adresse);
        if (actif && resultat.verifie) {
          stockerAttente(null);
          setSessionVerifiee(resultat.email ?? adresse);
        }
      } catch { /* Une panne de réseau n'efface pas la saisie du code. */ }
    };
    window.addEventListener("focus", actualiser);
    document.addEventListener("visibilitychange", actualiser);
    void actualiser();
    return () => {
      actif = false;
      window.removeEventListener("focus", actualiser);
      document.removeEventListener("visibilitychange", actualiser);
    };
  }, [etapeCode, adresse]);

  const continuerAvecGoogle = async () => {
    const supabase = creerClientNavigateur();
    if (!supabase) return;
    setGoogleEnCours(true);
    setErreurGoogle(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/confirm?suite=${encodeURIComponent(suite)}` },
      });
      if (error) setErreurGoogle("Google n'est pas disponible. Utilisez votre adresse e-mail.");
    } catch {
      setErreurGoogle("Google n'est pas disponible. Utilisez votre adresse e-mail.");
    } finally {
      setGoogleEnCours(false);
    }
  };

  if (verif.verifie || sessionVerifiee || emailVerifie) {
    // L'adresse du compte ouvert, en clair : après un lien reçu par e-mail,
    // c'est ce qui permet de voir qu'on n'est pas dans le compte de quelqu'un d'autre.
    const compte = (verif.verifie ? verif.email : null) ?? sessionVerifiee ?? emailVerifie;
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center animate-rise">
        <MarqueSos className="h-16 w-16 animate-pop" />
        <h1 className="font-display text-2xl font-bold text-navy-900">Votre adresse est vérifiée</h1>
        <p className="text-ink-soft">
          {compte && (
            <>
              Connecté avec <strong className="break-all text-ink">{compte}</strong>.{" "}
            </>
          )}
          Vous pouvez maintenant accéder à vos dossiers.
        </p>
        <Btn variant="gold" taille="lg" onClick={() => {
          stockerAttente(null);
          routeur.replace(suite);
        }}>Continuer vers mon espace</Btn>
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
            setDemande(null);
            stockerAttente(null);
            setCode("");
            setErreurVerification(null);
            derniereSoumission.current = "";
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900"
        >
          <IconeFlecheGauche className="h-4 w-4" /> Modifier l&apos;adresse
        </button>

        <span className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-navy-900">
          <IconeMail className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-[1.9rem] font-extrabold leading-tight text-navy-900">
          Entrez votre code
        </h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Un e-mail de vérification vient de partir vers{" "}
          <strong className="text-ink">{adresse}</strong>.
          {" "}Saisissez son code ici pour continuer sur cette page.
        </p>

        <form ref={formulaireCode} action={verifier} onSubmit={() => {
          derniereSoumission.current = code;
        }} className="mt-7">
          <input type="hidden" name="email" value={adresse} />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-900">
              Code reçu par e-mail
            </span>
            <input
              name="code"
              value={code}
              onChange={(e) => {
                const chiffres = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(chiffres);
                setErreurVerification(null);
                // Six chiffres : on valide sans attendre le clic.
                if (chiffres.length === 6 && !verifEnCours && derniereSoumission.current !== chiffres) {
                  derniereSoumission.current = chiffres;
                  setTimeout(() => formulaireCode.current?.requestSubmit(), 0);
                }
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              minLength={6}
              maxLength={6}
              pattern="[0-9]{6}"
              disabled={verifEnCours}
              aria-invalid={!!erreurVerification}
              placeholder="••••••"
              aria-describedby="aide-code"
              className="h-16 w-full rounded-2xl border-2 border-line bg-white text-center font-display text-3xl font-extrabold tracking-[0.5em] text-navy-900 outline-none transition placeholder:text-line focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
            />
          </label>
          <p id="aide-code" className="mt-2 text-xs text-ink-soft">
            Pas reçu ? Regardez dans les indésirables — l&apos;expéditeur est SOS Citizens.
          </p>

          {erreurVerification && (
            <p role="alert" className="mt-4 rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger-700">
              {erreurVerification}
            </p>
          )}

          <Btn type="submit" variant="gold" taille="lg" className="mt-5 w-full" disabled={verifEnCours || code.length !== 6}>
            {verifEnCours ? "Vérification…" : "Entrer dans mon espace"}
          </Btn>
        </form>

        <form
          action={envoyer}
          className="mt-4 text-center"
        >
          <input type="hidden" name="email" value={adresse} />
          <input type="hidden" name="suite" value={suite} />
          {jetonHumain && <input type="hidden" name="cf-turnstile-response" value={jetonHumain} />}
          {cleTurnstile && <AntiRobot key={cycleHumain} cle={cleTurnstile} surJeton={setJetonHumain} />}
          <button
            type="submit"
            disabled={envoiEnCours || verifEnCours || attente > 0 || (!!cleTurnstile && !jetonHumain)}
            className="text-sm font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4 hover:text-navy-900 disabled:cursor-default disabled:text-ink-faint disabled:no-underline"
          >
            {envoiEnCours ? "Envoi…" : attente > 0 ? `Renvoyer un code dans ${attente} s` : "Renvoyer un code"}
          </button>
          {envoi.erreur && <p role="alert" className="mt-2 text-sm text-danger-700">{envoi.erreur}</p>}
        </form>
        {modeEnvoi === "lien" && (
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            Si votre e-mail contient uniquement un lien, ouvrez-le puis revenez à cet onglet : la vérification sera reconnue automatiquement.
          </p>
        )}
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
        action={envoyer}
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
            <AntiRobot key={cycleHumain} cle={cleTurnstile} surJeton={setJetonHumain} />
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
      {erreurGoogle && <p role="alert" className="mt-3 text-sm text-danger-700">{erreurGoogle}</p>}

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
