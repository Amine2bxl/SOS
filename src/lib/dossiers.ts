import "server-only";
import { cache } from "react";
import { creerClientServeur, lireUtilisateur } from "@/lib/supabase/server";
import type { Dossier, Evenement, Profil, Alerte } from "@/lib/dossiers-format";

/**
 * Ces lectures sont mises en cache pour la durée d'une requête.
 *
 * La coquille de l'espace membre et la page qu'elle contient ont besoin des
 * mêmes données — le profil pour la formule, les dossiers pour le quota. Sans
 * cache, chacune interrogeait la base de son côté : deux fois la même requête
 * à chaque affichage. À 50 000 comptes, c'est la moitié du trafic base pour
 * rien.
 */
export const lireProfil = cache(async (): Promise<Profil | null> => {
  const [supabase, user] = await Promise.all([creerClientServeur(), lireUtilisateur()]);
  if (!supabase || !user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profil) ?? null;
});

export const listerDossiers = cache(async (): Promise<Dossier[]> => {
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const { data } = await supabase
    .from("dossiers")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Dossier[]) ?? [];
});

export const lireDossier = cache(async (id: string): Promise<Dossier | null> => {
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const { data } = await supabase.from("dossiers").select("*").eq("id", id).single();
  return (data as Dossier) ?? null;
});

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
export const lireAlertesNonVues = cache(async (): Promise<Alerte[]> => {
  const [supabase, user] = await Promise.all([creerClientServeur(), lireUtilisateur()]);
  if (!supabase || !user) return [];

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
});

/**
 * L'adhésion en attente de paiement, s'il y en a une.
 *
 * C'est elle qui porte la référence du virement. On la relit à chaque
 * affichage de la page d'adhésion plutôt que de se fier au drapeau
 * `plan_demande` du profil : le drapeau dit qu'une formule a été demandée, pas
 * avec quelle référence elle doit être payée.
 */
export const lireAdhesionEnAttente = cache(
  async (): Promise<{ formule: string; montant: number; communication: string } | null> => {
    const [supabase, user] = await Promise.all([creerClientServeur(), lireUtilisateur()]);
    if (!supabase || !user) return null;

    const { data } = await supabase
      .from("adhesions")
      .select("formule, montant, communication")
      .eq("user_id", user.id)
      .eq("statut", "en_attente")
      .order("demandee_le", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return {
      formule: data.formule as string,
      montant: Number(data.montant),
      communication: data.communication as string,
    };
  },
);
