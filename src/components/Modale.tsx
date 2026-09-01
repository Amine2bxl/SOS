"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * La règle unique des fenêtres modales du site.
 *
 * Toute fenêtre qui se superpose à la page passe par ici. Trois raisons, dont
 * une était un vrai bug en production :
 *
 * 1. **Le portail.** Une fenêtre `position: fixed` rendue à l'intérieur d'un
 *    élément qui porte `backdrop-filter` (notre barre supérieure d'application
 *    en a un) se positionne par rapport à cet élément, pas à l'écran : le
 *    popup de contact ouvert depuis l'en-tête apparaissait décalé en haut à
 *    gauche au lieu d'être centré. Passer par `document.body` supprime le
 *    problème définitivement, quel que soit l'endroit d'où la fenêtre est
 *    ouverte.
 * 2. **Le fond figé.** Sans blocage, la page continue de défiler derrière la
 *    fenêtre — sur téléphone, on perd la fenêtre de vue en scrollant. Le
 *    verrou compense aussi la largeur de la barre de défilement, pour que la
 *    page ne sursaute pas au moment de l'ouverture.
 * 3. **Le clavier.** Échap ferme, le focus entre dans la fenêtre et revient
 *    ensuite exactement où il était, et la tabulation reste piégée à
 *    l'intérieur. C'est ce qui rend une fenêtre utilisable sans souris.
 */

/** Nombre de fenêtres ouvertes : le fond ne se libère qu'à la dernière fermée. */
let fenetresOuvertes = 0;

function verrouillerLeFond() {
  fenetresOuvertes += 1;
  if (fenetresOuvertes > 1) return;

  const largeurBarre = window.innerWidth - document.documentElement.clientWidth;
  document.body.dataset.debordementInitial = document.body.style.overflow;
  document.body.dataset.margeInitiale = document.body.style.paddingRight;
  document.body.style.overflow = "hidden";
  // Sans cette compensation, la disparition de la barre de défilement
  // décale toute la page d'une dizaine de pixels à l'ouverture.
  if (largeurBarre > 0) document.body.style.paddingRight = `${largeurBarre}px`;
}

function libererLeFond() {
  fenetresOuvertes = Math.max(0, fenetresOuvertes - 1);
  if (fenetresOuvertes > 0) return;

  document.body.style.overflow = document.body.dataset.debordementInitial ?? "";
  document.body.style.paddingRight = document.body.dataset.margeInitiale ?? "";
  delete document.body.dataset.debordementInitial;
  delete document.body.dataset.margeInitiale;
}

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modale({
  ouverte,
  onFermer,
  titre,
  /** Décrit la fenêtre aux lecteurs d'écran quand le titre ne suffit pas. */
  description,
  /** `alerte` pour une confirmation destructrice : le rôle ARIA change. */
  variante = "dialogue",
  /** Une fenêtre non fermable force un choix explicite (confirmation en cours). */
  fermable = true,
  largeur = "max-w-sm",
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  description?: string;
  variante?: "dialogue" | "alerte";
  fermable?: boolean;
  largeur?: string;
  children: ReactNode;
}) {
  const panneauRef = useRef<HTMLDivElement>(null);
  const focusPrecedentRef = useRef<HTMLElement | null>(null);

  // Le portail n'existe qu'une fois le composant monté dans le navigateur : le
  // rendu serveur ne connaît pas `document`. `useSyncExternalStore` répond
  // « false » au serveur et « true » au client sans passer par un effet, ce qui
  // évite un rendu supplémentaire à chaque ouverture.
  const monte = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!ouverte) return;

    verrouillerLeFond();
    focusPrecedentRef.current = document.activeElement as HTMLElement | null;

    // Le focus entre dans la fenêtre, sinon la tabulation continue derrière.
    const minuteur = setTimeout(() => {
      const cible = panneauRef.current?.querySelector<HTMLElement>(FOCUSABLES);
      (cible ?? panneauRef.current)?.focus();
    }, 0);

    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fermable) {
        e.stopPropagation();
        onFermer();
        return;
      }
      if (e.key !== "Tab") return;

      const cibles = Array.from(
        panneauRef.current?.querySelectorAll<HTMLElement>(FOCUSABLES) ?? [],
      ).filter((el) => el.offsetParent !== null);
      if (cibles.length === 0) return;

      const premier = cibles[0];
      const dernier = cibles[cibles.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };

    document.addEventListener("keydown", auClavier, true);

    return () => {
      document.removeEventListener("keydown", auClavier, true);
      clearTimeout(minuteur);
      libererLeFond();
      focusPrecedentRef.current?.focus?.();
    };
  }, [ouverte, fermable, onFermer]);

  if (!ouverte || !monte) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-navy-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Seul un clic commencé sur le fond ferme : une sélection de texte
        // relâchée en dehors de la fenêtre ne doit pas la refermer.
        if (fermable && e.target === e.currentTarget) onFermer();
      }}
    >
      <div
        ref={panneauRef}
        role={variante === "alerte" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-label={titre}
        aria-description={description}
        tabIndex={-1}
        // `my-auto` garde la fenêtre centrée tant qu'elle tient à l'écran, et
        // la laisse défiler avec le fond dès qu'elle est plus haute.
        className={`animate-rise my-auto w-full ${largeur} rounded-xl border border-line bg-card p-6 shadow-2xl outline-none`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** En-tête standard d'une fenêtre : le titre et la croix de fermeture. */
export function EnTeteModale({
  titre,
  onFermer,
}: {
  titre: string;
  onFermer?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h2 className="font-display text-xl font-bold text-navy-900">{titre}</h2>
      {onFermer && (
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="-mr-1.5 -mt-1.5 rounded-md p-1.5 text-navy-600 transition hover:bg-navy-50 hover:text-navy-900"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
