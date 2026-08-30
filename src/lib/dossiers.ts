import "server-only";
import { creerClientServeur } from "@/lib/supabase/server";
import type { Dossier, Evenement, Profil, Alerte } from "@/lib/dossiers-format";

export async function lireProfil(): Promise<Profil | null> {
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profil) ?? null;
}

export async function listerDossiers(): Promise<Dossier[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const { data } = await supabase
    .from("dossiers")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Dossier[]) ?? [];
}

export async function lireDossier(id: string): Promise<Dossier | null> {
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const { data } = await supabase.from("dossiers").select("*").eq("id", id).single();
  return (data as Dossier) ?? null;
}

export async function listerEvenements(dossierId: string): Promise<Evenement[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const { data } = await supabase
    .from("evenements")
    .select("*")
    .eq("dossier_id", dossierId)
    .order("date_evenement", { ascending: false });
  return (data as Evenement[]) ?? [];
}

/** Alertes réglementaires que l'utilisateur n'a pas encore acquittées. */
export async function lireAlertesNonVues(): Promise<Alerte[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: vues } = await supabase
    .from("alertes_vues")
    .select("changement_id")
    .eq("user_id", user.id);

  const dejaVues = (vues ?? []).map((v: { changement_id: string }) => v.changement_id);

  let requete = supabase
    .from("regles_changements")
    .select("*")
    .order("publie_le", { ascending: false })
    .limit(3);

  if (dejaVues.length > 0) requete = requete.not("id", "in", `(${dejaVues.join(",")})`);

  const { data } = await requete;
  return (data as Alerte[]) ?? [];
}
