"use client";

import { useEffect, useState } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { supabaseConfigure } from "@/lib/supabase/config";

export type SessionUtilisateur = {
  email: string | null;
  prenom: string;
  nom: string;
  initiale: string;
};

function versSessionUtilisateur(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): SessionUtilisateur | null {
  if (!user) return null;
  const prenom = String(user.user_metadata?.prenom ?? "").trim();
  const nom = String(user.user_metadata?.nom ?? "").trim();
  return {
    email: user.email ?? null,
    prenom,
    nom,
    initiale: (prenom.charAt(0) || user.email?.charAt(0) || "?").toUpperCase(),
  };
}

/**
 * État de connexion lu dans le navigateur. Le rendu côté serveur reste
 * statique : seule la petite zone du compte s'abonne à la session.
 */
export function useSession(): {
  connecte: boolean;
  chargement: boolean;
  utilisateur: SessionUtilisateur | null;
} {
  const [utilisateur, setUtilisateur] = useState<SessionUtilisateur | null | undefined>(
    supabaseConfigure() ? undefined : null,
  );

  useEffect(() => {
    const supabase = creerClientNavigateur();
    // Sans configuration, l'état initial est déjà null : rien à mettre à jour.
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

  return {
    connecte: utilisateur !== null,
    chargement: utilisateur === undefined,
    utilisateur: utilisateur ?? null,
  };
}