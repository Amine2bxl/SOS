import "server-only";
import { cache } from "react";
import { creerClientServeur, lireUtilisateur } from "@/lib/supabase/server";
import type { Dossier, Evenement, Profil, Alerte, Lettre } from "@/lib/dossiers-format";
import { analyser, type Analyse } from "@/cerveau";
import { faitsDepuisDossier } from "@/lib/faits";
import type { Mandat } from "@/lib/mandats";
import { documentsManquants, type DocumentLegal } from "@/lib/versions-legales";

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

/*
 * Les lectures de l'espace membre filtrent explicitement sur le propriétaire.
 * La politique RLS laisse un bénévole de l'association lire les dossiers qu'on
 * lui a confiés sous mandat : sans ce filtre, ils apparaîtraient dans SA liste
 * de dossiers et compteraient dans SON quota.
 */
export const listerDossiers = cache(async (): Promise<Dossier[]> => {
  const [supabase, user] = await Promise.all([creerClientServeur(), lireUtilisateur()]);
  if (!supabase || !user) return [];
  const { data } = await supabase
    .from("dossiers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data as Dossier[]) ?? [];
});

export const lireDossier = cache(async (id: string): Promise<Dossier | null> => {
  const [supabase, user] = await Promise.all([creerClientServeur(), lireUtilisateur()]);
  if (!supabase || !user) return null;
  const { data } = await supabase.from("dossiers").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
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


/** Les lettres d'un dossier, la plus récente d'abord. */
export async function listerLettres(dossierId: string): Promise<Lettre[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const { data } = await supabase
    .from("lettres")
    .select("id, dossier_id, type, langue, contenu, created_at")
    .eq("dossier_id", dossierId)
    .order("created_at", { ascending: false });
  return (data as Lettre[]) ?? [];
}

/**
 * L'analyse d'un dossier, refaite à la date du jour.
 *
 * L'instantané conservé en base dit ce qui avait été conseillé à la création ;
 * l'affichage, lui, a besoin des jours restants AUJOURD'HUI. Le moteur tourne
 * en quelques millisecondes : on le relance à chaque affichage.
 */
export function analyserDossier(d: Dossier): Analyse {
  return analyser(faitsDepuisDossier(d));
}

/**
 * Le dernier mandat donné sur un dossier, en cours ou non.
 *
 * Une erreur de lecture (table pas encore créée, réseau) rend `null` : la fiche
 * s'affiche sans la section, plutôt que de tomber.
 */
export async function lireMandat(dossierId: string): Promise<Mandat | null> {
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("mandats")
    .select("id, dossier_id, portee, message, accorde_le, expire_le, revoque_le")
    .eq("dossier_id", dossierId)
    .order("accorde_le", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as Mandat) ?? null;
}

/**
 * Les documents juridiques dont la version en vigueur reste à accepter.
 *
 * Si la table n'existe pas encore (migration non appliquée), la lecture échoue
 * et on ne bloque personne : une porte qui ne peut pas enregistrer la réponse
 * ne doit pas se fermer.
 */
export const lireDocumentsAAccepter = cache(async (): Promise<{ manquants: DocumentLegal[]; premiereFois: boolean }> => {
  const [supabase, user] = await Promise.all([creerClientServeur(), lireUtilisateur()]);
  if (!supabase || !user) return { manquants: [], premiereFois: false };
  const { data, error } = await supabase.from("consentements").select("document, version").eq("user_id", user.id);
  if (error) return { manquants: [], premiereFois: false };
  const acceptes = (data ?? []) as { document: string; version: string }[];
  return { manquants: documentsManquants(acceptes), premiereFois: acceptes.length === 0 };
});

/** Vrai pour un bénévole de l'association (table `operateurs`). */
export const estOperateur = cache(async (): Promise<boolean> => {
  const supabase = await creerClientServeur();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("est_operateur");
  return !error && data === true;
});

/**
 * Les dossiers confiés à l'association, pour un bénévole : ceux qu'un mandat en
 * cours couvre. La base ne renvoie rien d'autre (politiques « sous mandat »).
 */
export async function listerDossiersConfies(): Promise<{ mandat: Mandat; dossier: Dossier }[]> {
  const supabase = await creerClientServeur();
  if (!supabase) return [];
  const { data: mandats, error } = await supabase
    .from("mandats")
    .select("id, dossier_id, portee, message, accorde_le, expire_le, revoque_le")
    .is("revoque_le", null)
    .gt("expire_le", new Date().toISOString())
    .order("accorde_le", { ascending: false });
  if (error || !mandats?.length) return [];
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("*")
    .in("id", mandats.map((m) => m.dossier_id));
  const parId = new Map(((dossiers ?? []) as Dossier[]).map((d) => [d.id, d]));
  return (mandats as Mandat[])
    .filter((m) => parId.has(m.dossier_id))
    .map((m) => ({ mandat: m, dossier: parId.get(m.dossier_id) as Dossier }));
}

/** Un dossier confié, avec sa chronologie et ses lettres. `null` hors mandat. */
export async function lireDossierConfie(id: string) {
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const { data: mandat } = await supabase
    .from("mandats")
    .select("id, dossier_id, portee, message, accorde_le, expire_le, revoque_le")
    .eq("dossier_id", id)
    .is("revoque_le", null)
    .gt("expire_le", new Date().toISOString())
    .maybeSingle();
  if (!mandat) return null;
  const [{ data: dossier }, { data: evenements }, { data: lettres }] = await Promise.all([
    supabase.from("dossiers").select("*").eq("id", id).maybeSingle(),
    supabase.from("evenements").select("*").eq("dossier_id", id).order("date_evenement", { ascending: false }),
    supabase
      .from("lettres")
      .select("id, dossier_id, type, langue, contenu, created_at")
      .eq("dossier_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!dossier) return null;
  return {
    mandat: mandat as Mandat,
    dossier: dossier as Dossier,
    evenements: (evenements ?? []) as Evenement[],
    lettres: (lettres ?? []) as Lettre[],
  };
}
