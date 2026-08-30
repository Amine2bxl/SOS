"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { supabaseConfigure } from "@/lib/supabase/config";

/**
 * État de connexion vérifié dans le navigateur, volontairement pas sur le
 * serveur : lire la session dans le layout rendrait toutes les pages
 * dynamiques et exposerait le site public à une panne de la base. Ici, une
 * base injoignable n'a aucune conséquence visible.
 */
export function EtatCompte({ surNavigation }: { surNavigation?: () => void }) {
  // Sans configuration, l'état est connu d'emblée : inutile d'attendre un
  // effet pour afficher le lien de connexion.
  const [connecte, setConnecte] = useState<boolean | null>(
    supabaseConfigure() ? null : false,
  );

  useEffect(() => {
    const supabase = creerClientNavigateur();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setConnecte(!!data.session));

    const { data: abonnement } = supabase.auth.onAuthStateChange((_e, session) =>
      setConnecte(!!session),
    );
    return () => abonnement.subscription.unsubscribe();
  }, []);

  // Tant que l'état n'est pas connu, on n'affiche rien plutôt qu'un lien
  // qui changerait sous le doigt de l'utilisateur.
  if (connecte === null) return <span className="h-9 w-24" aria-hidden="true" />;

  if (connecte) {
    return (
      <Link
        href="/tableau-de-bord"
        onClick={surNavigation}
        className="rounded-md border border-navy-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
      >
        Mon espace
      </Link>
    );
  }

  return (
    <Link
      href="/connexion"
      onClick={surNavigation}
      className="rounded-md border border-navy-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
    >
      Connexion
    </Link>
  );
}
