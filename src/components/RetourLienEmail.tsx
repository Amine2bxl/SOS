"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { ouvrirSessionDepuisLien } from "@/lib/auth-actions";
import { lireRetourLien } from "@/lib/lien-email";
import { cheminSur } from "@/lib/chemin-sur";
import { MarqueSos } from "@/components/Logo";

const sAbonner = () => () => {};
const lireFragment = () => window.location.hash;
const fragmentServeur = () => "";

/**
 * L'arrivée d'un lien de connexion reçu par e-mail, sur n'importe quelle page.
 *
 * Supabase renvoie vers la page demandée, ou vers l'accueil quand cette
 * adresse ne figure pas dans sa liste : d'où un composant présent partout
 * plutôt qu'une page dédiée. Il lit la session dans le fragment de l'adresse,
 * l'efface aussitôt (ni historique, ni capture d'écran), la fait ouvrir par le
 * serveur, puis mène à l'écran « adresse vérifiée », qui montre le compte ouvert.
 */
export function RetourLienEmail() {
  const fragment = useSyncExternalStore(sAbonner, lireFragment, fragmentServeur);
  const retour = useMemo(() => lireRetourLien(fragment), [fragment]);
  const traite = useRef(false);

  useEffect(() => {
    if (!retour || traite.current) return;
    traite.current = true;

    const suite = cheminSur(new URLSearchParams(window.location.search).get("suite"));
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    const echec = (raison: string) =>
      window.location.replace(`/connexion?erreur=${raison}&suite=${encodeURIComponent(suite)}`);

    if (retour.type === "erreur") {
      echec(retour.raison);
      return;
    }
    // Étape suivante : l'écran « adresse vérifiée », qui affiche le compte
    // ouvert avant d'y entrer.
    ouvrirSessionDepuisLien(retour.accessToken, retour.refreshToken)
      .then(({ ok }) =>
        ok ? window.location.replace(`/connexion?confirme=1&suite=${encodeURIComponent(suite)}`) : echec("lien-expire"),
      )
      .catch(() => echec("service-indisponible"));
  }, [retour]);

  if (!retour) return null;
  return (
    <div
      role="status"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-paper px-6 text-center"
    >
      <MarqueSos className="h-16 w-16 animate-pop" />
      <p className="font-display text-xl font-bold text-navy-900">Ouverture de votre espace…</p>
    </div>
  );
}
