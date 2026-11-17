"use client";

import { useState, useTransition } from "react";
import { enregistrerRappels } from "@/lib/profile-actions";

/**
 * Comment être prévenu : trois jours avant une date limite, la veille, et
 * quand il est temps de relancer. Par e-mail, par SMS, ou les deux.
 */
export function PreferencesRappels({ email: e0, sms: s0, aTelephone }: { email: boolean; sms: boolean; aTelephone: boolean }) {
  const [email, setEmail] = useState(e0);
  const [sms, setSms] = useState(s0);
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();

  const changer = (suivant: { email: boolean; sms: boolean }) => {
    const avant = { email, sms };
    setEmail(suivant.email);
    setSms(suivant.sms);
    setRetour(null);
    demarrer(async () => {
      const r = await enregistrerRappels(suivant);
      if (r.erreur) {
        setEmail(avant.email);
        setSms(avant.sms);
        setRetour({ ok: false, texte: r.erreur });
      } else setRetour({ ok: true, texte: r.message ?? "C'est noté." });
    });
  };

  return (
    <div>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
        <Interrupteur
          titre="Par e-mail"
          detail="3 jours avant une date limite, la veille, et pour relancer."
          actif={email}
          desactive={enCours}
          onChange={(v) => changer({ email: v, sms })}
        />
        <Interrupteur
          titre="Par SMS"
          detail={aTelephone ? "Les mêmes, par SMS. Gratuit." : "Ajoutez votre numéro dans « Vos coordonnées »."}
          actif={sms}
          desactive={enCours || (!aTelephone && !sms)}
          onChange={(v) => changer({ email, sms: v })}
        />
      </ul>
      {retour && (
        <p role="status" className={`mt-2 text-sm ${retour.ok ? "text-ok-700" : "text-danger-700"}`}>
          {retour.texte}
        </p>
      )}
    </div>
  );
}

function Interrupteur({
  titre,
  detail,
  actif,
  desactive,
  onChange,
}: {
  titre: string;
  detail: string;
  actif: boolean;
  desactive: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 p-4">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy-900">{titre}</span>
        <span className="block text-xs leading-relaxed text-ink-soft">{detail}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={`Rappels ${titre.toLowerCase()}`}
        disabled={desactive}
        onClick={() => onChange(!actif)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${actif ? "bg-ok-600" : "bg-navy-200"}`}
      >
        <span
          className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            actif ? "translate-x-5" : ""
          }`}
        />
      </button>
    </li>
  );
}
