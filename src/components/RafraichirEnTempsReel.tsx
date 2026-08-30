"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { creerClientNavigateur } from "@/lib/supabase/client";

/**
 * Suit les changements de la table dossiers pour l'utilisateur connecté et
 * rafraîchit la page dès qu'une ligne bouge — y compris lorsque le changement
 * vient de l'association depuis un autre poste. Ne rend rien à l'écran.
 */
export function RafraichirEnTempsReel({ dossierId }: { dossierId?: string } = {}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = creerClientNavigateur();
    if (!supabase) return;

    const canal = supabase
      .channel(dossierId ? `dossier-${dossierId}` : "mes-dossiers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dossiers",
          ...(dossierId ? { filter: `id=eq.${dossierId}` } : {}),
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "evenements" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [router, dossierId]);

  return null;
}
