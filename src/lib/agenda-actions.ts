"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";

/**
 * Crée (ou remplace) l'adresse secrète d'abonnement à l'agenda. La remplacer
 * coupe l'ancienne : utile si on l'a partagée par erreur.
 */
export async function activerAbonnementAgenda(): Promise<{ jeton?: string; erreur?: string }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };
  const jeton = crypto.randomUUID();
  const { error } = await supabase.from("profiles").update({ agenda_jeton: jeton }).eq("id", user.id);
  if (error) return { erreur: "L'abonnement n'a pas pu être créé. Réessayez." };
  revalidatePath("/tableau-de-bord/agenda");
  return { jeton };
}
