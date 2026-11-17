"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconeChevron, IconeFermer } from "@/components/icones";

/**
 * L'avis sur les cookies et le stockage du navigateur.
 *
 * Le site ne dépose que ce qui est indispensable : la session de connexion et
 * quelques préférences. Ce stockage ne demande pas de consentement (directive
 * ePrivacy, art. 5.3 ; loi belge du 13 juin 2005, art. 129) — d'où un avis, et
 * pas un bandeau « Accepter / Refuser » qui ferait croire à un choix qui
 * n'existe pas. Il s'affiche une fois, et l'inventaire ci-dessous est tenu à
 * jour avec le code : chaque clé listée est réellement écrite quelque part.
 */

const CLE = "sos.avis-cookies";
const VALIDITE_MS = 182 * 86_400_000; // six mois

const INVENTAIRE = [
  {
    nom: "sb-…-auth-token",
    type: "Cookie",
    finalite: "Vous garder connecté à votre espace, de façon sécurisée",
    duree: "Jusqu'à la déconnexion",
  },
  { nom: "sos.langue", type: "Stockage local", finalite: "Retenir la langue choisie", duree: "Jusqu'à ce que vous l'effaciez" },
  {
    nom: "sos:brouillon",
    type: "Stockage local",
    finalite: "Garder votre analyse le temps de créer votre compte (sans l'image du courrier)",
    duree: "6 heures",
  },
  {
    nom: "sos:connexion-en-attente",
    type: "Stockage de session",
    finalite: "Terminer la connexion par code",
    duree: "Le temps de la connexion",
  },
  { nom: CLE, type: "Stockage local", finalite: "Retenir que vous avez lu cet avis", duree: "6 mois" },
];

export function AvisCookies() {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    // Lu après le premier rendu : le serveur ne sait pas ce que le navigateur a retenu.
    const minuteur = setTimeout(() => {
      try {
        const lu = Number(localStorage.getItem(CLE));
        setVisible(!lu || Date.now() - lu > VALIDITE_MS);
      } catch {
        setVisible(false);
      }
    }, 600);
    return () => clearTimeout(minuteur);
  }, []);

  const fermer = () => {
    setVisible(false);
    try {
      localStorage.setItem(CLE, String(Date.now()));
    } catch {
      // Stockage indisponible : l'avis reviendra à la prochaine visite.
    }
  };

  if (!visible) return null;

  return (
    <section
      aria-label="Cookies et stockage"
      className="avis-cookies fixed inset-x-3 bottom-3 z-50 max-h-[80vh] overflow-y-auto rounded-[var(--radius-carte)] border border-line bg-card p-4 text-sm shadow-flotte sm:inset-x-auto sm:left-4 sm:bottom-4 sm:w-[26rem] sm:p-5 print:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-base font-bold text-navy-900">Uniquement le nécessaire.</p>
        <button
          type="button"
          onClick={fermer}
          aria-label="Fermer"
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-navy-50 hover:text-navy-900"
        >
          <IconeFermer className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 leading-relaxed text-ink-soft">
        Votre connexion et vos préférences. Rien d&apos;autre : ni mesure d&apos;audience, ni publicité, ni réseau
        social. Aucun accord à donner.
      </p>

      {details && (
        <table className="mt-3 w-full text-left text-xs">
          <caption className="sr-only">Ce que le site enregistre dans votre navigateur</caption>
          <thead>
            <tr className="text-ink-faint">
              <th scope="col" className="pb-1.5 pr-2 font-semibold">
                Nom
              </th>
              <th scope="col" className="pb-1.5 pr-2 font-semibold">
                À quoi il sert
              </th>
              <th scope="col" className="pb-1.5 font-semibold">
                Durée
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {INVENTAIRE.map((c) => (
              <tr key={c.nom}>
                <td className="py-1.5 pr-2 font-mono text-[11px] text-navy-900">
                  {c.nom}
                  <span className="block font-sans text-ink-faint">{c.type}</span>
                </td>
                <td className="py-1.5 pr-2 text-ink">{c.finalite}</td>
                <td className="py-1.5 text-ink-soft">{c.duree}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setDetails(!details)}
          aria-expanded={details}
          className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:text-navy-900"
        >
          {details ? "Masquer le détail" : "Voir le détail"}
          <IconeChevron className={`h-3.5 w-3.5 transition-transform duration-200 ${details ? "rotate-180" : ""}`} />
        </button>
        <div className="flex items-center gap-3">
          <Link href="/confidentialite" className="text-ink-soft underline underline-offset-4 hover:text-navy-900">
            Confidentialité
          </Link>
          <button
            type="button"
            onClick={fermer}
            className="inline-flex h-9 items-center rounded-full bg-navy-900 px-4 font-bold text-white transition hover:bg-navy-800 active:scale-[0.97]"
          >
            Compris
          </button>
        </div>
      </div>
    </section>
  );
}
