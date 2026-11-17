"use client";

import { useActionState, useRef, useState } from "react";
import { envoyerCodeSms, verifierCodeSms, type EtatTelephone } from "@/lib/connexion-actions";
import { Btn } from "@/components/ui";
import { IconeFlecheGauche, IconeTelephone } from "@/components/icones";
import { AntiRobot } from "./AntiRobot";

/**
 * Entrer avec son numéro de GSM : un numéro, un code par SMS. Deux écrans.
 * Le code se valide tout seul dès le sixième chiffre.
 */
export function ConnexionSms({
  suite,
  intention,
  surVerifie,
  surPasDeCompte,
  cleTurnstile,
}: {
  suite: string;
  intention: "connexion" | "inscription";
  surVerifie: (telephone: string) => void;
  /** « Se connecter » avec un numéro inconnu : basculer vers la création. */
  surPasDeCompte: () => void;
  cleTurnstile: string | null;
}) {
  const [saisie, setSaisie] = useState("");
  const [jetonHumain, setJetonHumain] = useState("");
  const [code, setCode] = useState("");
  const formulaireCode = useRef<HTMLFormElement>(null);

  const [envoi, envoyer, envoiEnCours] = useActionState<EtatTelephone, FormData>(envoyerCodeSms, {});
  const [verif, verifier, verifEnCours] = useActionState<EtatTelephone, FormData>(async (p, d) => {
    const r = await verifierCodeSms(p, d);
    if (r.verifie && r.telephone) surVerifie(r.telephone);
    return r;
  }, {});
  const [retour, setRetour] = useState(false);

  if (envoi.envoye && envoi.telephone && !retour) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setRetour(true);
            setCode("");
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900"
        >
          <IconeFlecheGauche className="h-4 w-4" /> Changer de numéro
        </button>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Code envoyé par SMS au <strong className="text-ink">{envoi.telephone}</strong>.
        </p>
        <form ref={formulaireCode} action={verifier} className="mt-5">
          <input type="hidden" name="telephone" value={envoi.telephone} />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-900">Code reçu par SMS</span>
            <input
              name="code"
              value={code}
              onChange={(e) => {
                const chiffres = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(chiffres);
                if (chiffres.length === 6 && !verifEnCours) setTimeout(() => formulaireCode.current?.requestSubmit(), 0);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={6}
              placeholder="••••••"
              disabled={verifEnCours}
              aria-invalid={!!verif.erreur}
              className="h-16 w-full rounded-2xl border-2 border-line bg-white text-center font-display text-3xl font-extrabold tracking-[0.5em] text-navy-900 outline-none transition placeholder:text-line focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
            />
          </label>
          {verif.erreur && (
            <p role="alert" className="mt-3 rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger-700">
              {verif.erreur}
            </p>
          )}
          <Btn type="submit" variant="gold" taille="lg" className="mt-5 w-full" disabled={verifEnCours || code.length < 6}>
            {verifEnCours ? "Vérification…" : "Entrer"}
          </Btn>
        </form>
        <form action={envoyer} className="mt-4 text-center">
          <input type="hidden" name="telephone" value={envoi.telephone} />
          <input type="hidden" name="suite" value={suite} />
          <input type="hidden" name="intention" value={intention} />
          <button
            type="submit"
            disabled={envoiEnCours}
            className="text-sm font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4 hover:text-navy-900"
          >
            {envoiEnCours ? "Envoi…" : "Renvoyer un SMS"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={(d) => {
        setRetour(false);
        return envoyer(d);
      }}
    >
      <input type="hidden" name="suite" value={suite} />
      <input type="hidden" name="intention" value={intention} />
      {jetonHumain && <input type="hidden" name="cf-turnstile-response" value={jetonHumain} />}
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-navy-900">Numéro de GSM</span>
        <span className="relative block">
          <IconeTelephone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
          <input
            name="telephone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="0470 12 34 56"
            className="h-13 w-full rounded-2xl border-2 border-line bg-white py-3 pl-12 pr-4 text-base text-ink outline-none transition placeholder:text-ink-faint focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
          />
        </span>
      </label>
      {cleTurnstile && (
        <div className="mt-4">
          <AntiRobot cle={cleTurnstile} surJeton={setJetonHumain} />
        </div>
      )}
      {envoi.erreur && !envoi.pasDeCompte && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger-700">
          {envoi.erreur}
        </p>
      )}
      {envoi.pasDeCompte && intention === "connexion" && (
        <p role="alert" className="mt-4 rounded-xl bg-gold-50 p-3 text-sm text-ink">
          <strong className="text-navy-900">Aucun compte avec ce numéro.</strong>{" "}
          <button type="button" onClick={surPasDeCompte} className="font-semibold text-navy-700 underline underline-offset-4">
            Créer mon compte
          </button>
        </p>
      )}
      <Btn type="submit" variant="gold" taille="lg" className="mt-5 w-full" disabled={envoiEnCours || (!!cleTurnstile && !jetonHumain)}>
        {envoiEnCours ? "Envoi du SMS…" : intention === "inscription" ? "Créer mon compte par SMS" : "Recevoir mon code par SMS"}
      </Btn>
      <p className="mt-3 text-xs text-ink-soft">Le SMS est gratuit à recevoir.</p>
    </form>
  );
}
