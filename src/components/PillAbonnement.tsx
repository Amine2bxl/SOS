"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { planById, type PlanId } from "@/lib/plans";
import { useSession } from "@/components/useSession";
import { useLangue, t } from "@/lib/i18n";

/**
 * Pastille de l'en-tête connecté : « Devenir membre » tant que la formule
 * gratuite est utilisée, sinon le nom de la formule choisie une fois payée.
 */
export function PillAbonnement() {
  const { utilisateur } = useSession();
  const { langue } = useLangue();
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!utilisateur?.id) return;
    const supabase = creerClientNavigateur();
    if (!supabase) return;
    let actif = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", utilisateur.id)
          .single();
        if (actif) {
          setPlan(((data as { plan?: string } | null)?.plan as PlanId | undefined) ?? null);
        }
      } catch {
        // Pas de base : on garde l'état « Devenir membre ».
      }
    })();
    return () => {
      actif = false;
    };
  }, [utilisateur?.id]);

  const planActif = planById(plan);
  const paye = plan !== null && planActif.quotaContestations === null;
  const label = paye ? planActif.nom : t(langue, "commun.devenirMembre");
  const court = paye ? planActif.nom : t(langue, "commun.membre");
  const href = paye ? "/tableau-de-bord/abonnement" : "/tarifs";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-xs font-black tracking-wide text-navy-950 transition hover:bg-gold-300"
    >
      <span aria-hidden="true">✦</span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{court}</span>
    </Link>
  );
}