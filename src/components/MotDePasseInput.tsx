"use client";

import { useState } from "react";
import { TextInput } from "@/components/ui";

/** Champ mot de passe avec bouton pour afficher ou masquer la saisie. */
export function MotDePasseInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <TextInput {...props} type={visible ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-navy-600 transition hover:text-navy-900"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3.5 12a13.5 13.5 0 0 1 4.5-4.4M9.8 4.6A11 11 0 0 1 12 4.3c5 0 8.5 4.6 8.5 7.7a13 13 0 0 1-2 3.5M5.2 20.2 18.8 6.6M9.9 14.1a3 3 0 0 1 4.2-4.2M6.1 6.1A14.5 14.5 0 0 0 3.5 12c0 3.1 3.5 7.7 8.5 7.7 1.3 0 2.5-.3 3.6-.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M2 12s3.5-7.5 10-7.5S22 12 22 12s-3.5 7.5-10 7.5S2 12 2 12Z" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}