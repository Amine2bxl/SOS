"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { DOCUMENTS_LEGAUX, DOCUMENTS_A_ACCEPTER, type DocumentLegal } from "@/lib/versions-legales";

/**
 * Enregistre l'acceptation des versions en vigueur.
 *
 * Seules les versions connues du serveur sont enregistrées : le navigateur dit
 * « j'accepte », jamais « j'accepte la version X ».
 */
export async function accepterConditions(documents: string[]): Promise<{ ok?: boolean; erreur?: string }> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Vous devez être connecté." };

  const choisis = DOCUMENTS_A_ACCEPTER.filter((d) => documents.includes(d));
  if (choisis.length === 0) return { erreur: "Cochez les deux cases pour continuer." };

  const { error } = await supabase.from("consentements").upsert(
    choisis.map((d: DocumentLegal) => ({ user_id: user.id, document: d, version: DOCUMENTS_LEGAUX[d].version })),
    { onConflict: "user_id,document,version", ignoreDuplicates: true },
  );
  if (error) return { erreur: "Votre acceptation n'a pas pu être enregistrée. Réessayez." };

  revalidatePath("/tableau-de-bord", "layout");
  return { ok: true };
}
