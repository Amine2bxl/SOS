"use client";

import { useEffect, useState } from "react";

export type Onglet = { id: string; libelle: string; contenu: React.ReactNode; signal?: boolean };

/**
 * Les onglets de la fiche dossier : la lettre, l'analyse, le suivi, le
 * courrier. L'onglet actif suit l'ancre de l'adresse (`#lettre`, `#suivi`…) :
 * un lien de l'accueil ouvre directement le bon. Les onglets inactifs restent
 * montés — une lettre en cours de modification ne se perd pas quand on va
 * jeter un œil au suivi.
 */
export function OngletsDossier({ onglets }: { onglets: Onglet[] }) {
  const ids = onglets.map((o) => o.id).join(",");
  const [actif, setActif] = useState(onglets[0]?.id);

  useEffect(() => {
    const connus = ids.split(",");
    const lire = () => {
      const ancre = window.location.hash.slice(1);
      if (connus.includes(ancre)) setActif(ancre);
    };
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, [ids]);

  const choisir = (id: string) => {
    setActif(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label="Sections du dossier"
        className="sticky top-[57px] z-20 -mx-4 overflow-x-auto bg-paper px-4 py-2 sm:mx-0 sm:px-0 lg:top-0"
      >
        <div className="inline-flex min-w-full gap-1 rounded-full border border-line bg-card p-1 sm:min-w-0">
          {onglets.map((o) => (
            <button
              key={o.id}
              role="tab"
              type="button"
              id={`onglet-${o.id}`}
              aria-selected={actif === o.id}
              aria-controls={`panneau-${o.id}`}
              onClick={() => choisir(o.id)}
              className={`relative flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                actif === o.id ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"
              }`}
            >
              {o.libelle}
              {o.signal && actif !== o.id && (
                <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-danger-600" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>

      {onglets.map((o) => (
        <div
          key={o.id}
          role="tabpanel"
          id={`panneau-${o.id}`}
          aria-labelledby={`onglet-${o.id}`}
          hidden={actif !== o.id}
          className="mt-4"
        >
          {o.contenu}
        </div>
      ))}
    </div>
  );
}
