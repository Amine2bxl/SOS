"use client";

import { useEffect, useState } from "react";

/**
 * Le bouton soleil / lune. Le choix est gardé dans le navigateur ; sans
 * choix, le site suit le réglage du téléphone.
 */
export function BasculeTheme({ className = "" }: { className?: string }) {
  const [sombre, setSombre] = useState(false);
  useEffect(() => {
    // Le thème est posé sur <html> par le script du layout : on le lit une fois affiché.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSombre(document.documentElement.dataset.theme === "dark");
  }, []);

  const basculer = () => {
    const suivant = !sombre;
    setSombre(suivant);
    document.documentElement.dataset.theme = suivant ? "dark" : "light";
    try {
      localStorage.setItem("sos:theme", suivant ? "sombre" : "clair");
    } catch {
      // Stockage indisponible : le choix vaut pour cette visite.
    }
  };

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={sombre ? "Passer en mode clair" : "Passer en mode sombre"}
      title={sombre ? "Mode clair" : "Mode sombre"}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-[0.97] ${className}`}
    >
      {sombre ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
