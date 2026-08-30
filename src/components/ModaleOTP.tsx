"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { verifierCode, renvoyerCode } from "@/lib/auth-actions";
import { Btn } from "@/components/ui";
import { MailIcon } from "@/components/Logo";

const LONGUEUR = 6;
/** Délai avant de pouvoir redemander un code, aligné sur la limite Supabase. */
const ATTENTE_RENVOI = 60;

export function ModaleOTP({
  email,
  onSucces,
  onAnnuler,
}: {
  email: string;
  onSucces: () => void;
  onAnnuler: () => void;
}) {
  const [chiffres, setChiffres] = useState<string[]>(Array(LONGUEUR).fill(""));
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [attente, setAttente] = useState(ATTENTE_RENVOI);
  const [enCours, demarrer] = useTransition();

  const cases = useRef<(HTMLInputElement | null)[]>([]);
  const conteneur = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cases.current[0]?.focus();
  }, []);

  // Compte à rebours avant de pouvoir renvoyer un code.
  useEffect(() => {
    if (attente <= 0) return;
    const t = setTimeout(() => setAttente((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [attente]);

  // Échap ferme la modale ; le focus reste piégé à l'intérieur.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnnuler();
      if (e.key !== "Tab" || !conteneur.current) return;
      const focusables = conteneur.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled])',
      );
      if (focusables.length === 0) return;
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [onAnnuler]);

  const valider = (code: string) => {
    setErreur(null);
    setInfo(null);
    demarrer(async () => {
      const r = await verifierCode(email, code);
      if (r.erreur) {
        setErreur(r.erreur);
        setChiffres(Array(LONGUEUR).fill(""));
        cases.current[0]?.focus();
        return;
      }
      onSucces();
    });
  };

  const saisir = (index: number, valeur: string) => {
    const propre = valeur.replace(/\D/g, "");
    if (!propre) return;

    const suivants = [...chiffres];
    // Un collage remplit toutes les cases d'un coup.
    propre.split("").forEach((c, decalage) => {
      if (index + decalage < LONGUEUR) suivants[index + decalage] = c;
    });
    setChiffres(suivants);

    const prochaineVide = suivants.findIndex((c) => c === "");
    cases.current[prochaineVide === -1 ? LONGUEUR - 1 : prochaineVide]?.focus();

    const complet = suivants.join("");
    if (complet.length === LONGUEUR && !suivants.includes("")) valider(complet);
  };

  const surTouche = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const suivants = [...chiffres];
      if (suivants[index]) suivants[index] = "";
      else if (index > 0) {
        suivants[index - 1] = "";
        cases.current[index - 1]?.focus();
      }
      setChiffres(suivants);
    }
    if (e.key === "ArrowLeft" && index > 0) cases.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < LONGUEUR - 1) cases.current[index + 1]?.focus();
  };

  const renvoyer = () => {
    setErreur(null);
    demarrer(async () => {
      const r = await renvoyerCode(email);
      if (r.erreur) setErreur(r.erreur);
      else {
        setInfo("Un nouveau code vient de partir.");
        setAttente(ATTENTE_RENVOI);
        setChiffres(Array(LONGUEUR).fill(""));
        cases.current[0]?.focus();
      }
    });
  };

  const complet = chiffres.join("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-code"
    >
      <div
        ref={conteneur}
        className="animate-rise w-full max-w-md rounded-xl border border-line bg-card p-6 shadow-2xl sm:p-8"
      >
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900">
            <MailIcon className="h-7 w-7 text-gold-400" />
          </span>
        </div>

        <h2 id="titre-code" className="mt-5 text-center font-display text-2xl font-bold text-navy-900">
          Entrez votre code
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-ink-soft">
          Nous venons d&apos;envoyer un code à 6 chiffres à
          <br />
          <strong className="text-navy-900">{email}</strong>
        </p>

        <div className="mt-7 flex justify-center gap-2" onPaste={(e) => {
          e.preventDefault();
          saisir(0, e.clipboardData.getData("text"));
        }}>
          {chiffres.map((chiffre, i) => (
            <input
              key={i}
              ref={(el) => { cases.current[i] = el; }}
              value={chiffre}
              onChange={(e) => saisir(i, e.target.value)}
              onKeyDown={(e) => surTouche(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={LONGUEUR}
              disabled={enCours}
              aria-label={`Chiffre ${i + 1} sur ${LONGUEUR}`}
              className={`h-14 w-11 rounded-lg border-2 bg-white text-center font-display text-2xl font-bold text-navy-900 outline-none transition disabled:opacity-50 ${
                erreur
                  ? "border-danger-600"
                  : chiffre
                    ? "border-navy-700"
                    : "border-line focus:border-navy-700 focus:ring-2 focus:ring-navy-700/20"
              }`}
            />
          ))}
        </div>

        {erreur && (
          <p role="alert" className="mt-4 rounded-md bg-danger-100 p-3 text-center text-sm font-medium text-danger-700">
            {erreur}
          </p>
        )}
        {info && !erreur && (
          <p role="status" className="mt-4 rounded-md bg-ok-100 p-3 text-center text-sm font-medium text-ok-700">
            {info}
          </p>
        )}

        <Btn
          onClick={() => valider(complet)}
          variant="gold"
          className="mt-6 w-full"
          disabled={enCours || complet.length !== LONGUEUR}
        >
          {enCours ? "Vérification…" : "Valider mon code"}
        </Btn>

        <div className="mt-5 text-center text-sm">
          {attente > 0 ? (
            <p className="text-ink-soft">
              Pas reçu ? Vous pourrez en redemander un dans {attente} s.
            </p>
          ) : (
            <button
              onClick={renvoyer}
              disabled={enCours}
              className="font-semibold text-navy-700 underline hover:text-navy-900 disabled:opacity-50"
            >
              Renvoyer un code
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-ink-soft">
          Pensez à regarder dans vos courriers indésirables. Le code est valable une heure.
        </p>

        <button
          onClick={onAnnuler}
          disabled={enCours}
          className="mt-5 w-full text-center text-sm text-ink-soft underline hover:text-navy-900 disabled:opacity-50"
        >
          Revenir en arrière
        </button>
      </div>
    </div>
  );
}
