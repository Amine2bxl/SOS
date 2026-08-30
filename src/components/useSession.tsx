"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { supabaseConfigure } from "@/lib/supabase/config";

export type SessionUtilisateur = {
  id: string;
  email: string | null;
  prenom: string;
  nom: string;
  initiale: string;
};

export function versSessionUtilisateur(
  user: { id?: string; email?: string | null; user_metadata?: Record<string, unknown> } | null,
): SessionUtilisateur | null {
  if (!user) return null;
  const prenom = String(user.user_metadata?.prenom ?? "").trim();
  const nom = String(user.user_metadata?.nom ?? "").trim();
  return {
    id: user.id ?? "",
    email: user.email ?? null,
    prenom,
    nom,
    initiale: (prenom.charAt(0) || user.email?.charAt(0) || "?").toUpperCase(),
  };
}

type EtatSession = {
  connecte: boolean;
  chargement: boolean;
  utilisateur: SessionUtilisateur | null;
};

const ContexteSession = createContext<EtatSession>({
  connecte: false,
  chargement: false,
  utilisateur: null,
});

/**
 * Fournisseur unique de la session, enveloppant tout le site : un seul
 * abonnement à l'authentification, un seul appel getSession, partagés par
 * l'en-tête, le pied de page et tous les composants — plus rapide au chargement.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<SessionUtilisateur | null | undefined>(
    supabaseConfigure() ? undefined : null,
  );

  useEffect(() => {
    const supabase = creerClientNavigateur();
    if (!supabase) return;

    let actif = true;
    supabase.auth.getSession().then(({ data }) => {
      if (actif) setUtilisateur(versSessionUtilisateur(data.session?.user ?? null));
    });

    const { data: abonnement } = supabase.auth.onAuthStateChange((_evenement, session) => {
      if (actif) setUtilisateur(versSessionUtilisateur(session?.user ?? null));
    });

    return () => {
      actif = false;
      abonnement.subscription.unsubscribe();
    };
  }, []);

  return (
    <ContexteSession.Provider
      value={{
        connecte: utilisateur !== null,
        chargement: utilisateur === undefined,
        utilisateur: utilisateur ?? null,
      }}
    >
      {children}
    </ContexteSession.Provider>
  );
}

export function useSession(): EtatSession {
  return useContext(ContexteSession);
}