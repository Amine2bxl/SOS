import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { analyser } from "@/cerveau";
import { faitsDepuisDossier } from "@/lib/faits";
import { COMMUNES } from "@/lib/data";
import { JOURS_AVANT_RELANCE, type Dossier } from "@/lib/dossiers-format";
import { nomDossier } from "@/components/dossier-ui";
import { evenementsDuDossier, evenementsFeries, trier, type EvenementCalendrier } from "@/lib/agenda";

/**
 * Rassemble tous les événements d'un membre : ses dossiers, ses mandats, son
 * adhésion, les changements de règles des communes et les jours fériés.
 *
 * Le client passé décide de l'accès : la session du membre dans l'application,
 * ou la clé de service pour l'abonnement ICS (qui ne porte pas de cookie). Dans
 * les deux cas, chaque requête filtre sur `userId`.
 */
export async function chargerAgenda(
  supabase: SupabaseClient,
  userId: string,
  annees: number[],
): Promise<EvenementCalendrier[]> {
  const [dossiers, mandats, profil, regles] = await Promise.all([
    supabase.from("dossiers").select("*").eq("user_id", userId),
    supabase.from("mandats").select("id, dossier_id, expire_le, revoque_le").eq("user_id", userId),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("regles_changements")
      .select("id, commune_slug, titre, resume, publie_le")
      .order("publie_le", { ascending: false })
      .limit(60),
  ]);

  const evs: EvenementCalendrier[] = [];
  const liste = ((dossiers.data ?? []) as Dossier[]);
  const noms = new Map(liste.map((d) => [d.id, nomDossier(d)]));

  for (const d of liste) {
    const analyse = analyser(faitsDepuisDossier(d));
    evs.push(
      ...evenementsDuDossier(
        {
          id: d.id,
          nom: nomDossier(d),
          statut: d.statut,
          date_constat: d.date_constat,
          date_echeance: d.date_echeance,
          date_envoi_contestation: d.date_envoi_contestation,
          accuse_reception_le: d.accuse_reception_le ?? null,
        },
        { date: analyse.delai.limite, nature: analyse.delai.nature },
        JOURS_AVANT_RELANCE,
      ),
    );
  }

  for (const m of (mandats.error ? [] : mandats.data ?? []) as { id: string; dossier_id: string; expire_le: string; revoque_le: string | null }[]) {
    if (m.revoque_le) continue;
    evs.push({
      id: `mandat-${m.id}`,
      date: m.expire_le.slice(0, 10),
      type: "mandat",
      titre: `Fin du mandat — ${noms.get(m.dossier_id) ?? "dossier"}`,
      detail: "L'association n'aura plus accès à ce dossier. Prolongez-le depuis la fiche si besoin.",
      lien: `/tableau-de-bord/${m.dossier_id}#suivi`,
    });
  }

  const expire = (profil.data as { plan_expire_le?: string | null } | null)?.plan_expire_le;
  if (expire) {
    evs.push({
      id: "adhesion-fin",
      date: expire.slice(0, 10),
      type: "adhesion",
      titre: "Fin de votre adhésion",
      detail: "Renouvelez pour garder les dossiers illimités.",
      lien: "/adherer",
    });
  }

  const nomCommune = (slug: string | null) => COMMUNES.find((c) => c.slug === slug)?.nom ?? null;
  for (const r of (regles.error ? [] : regles.data ?? []) as { id: string; commune_slug: string | null; titre: string; resume: string; publie_le: string }[]) {
    const commune = nomCommune(r.commune_slug);
    evs.push({
      id: `regle-${r.id}`,
      date: r.publie_le.slice(0, 10),
      type: "regle",
      titre: commune ? `${commune} : ${r.titre}` : r.titre,
      detail: r.resume,
      lien: r.commune_slug ? `/communes?commune=${r.commune_slug}` : "/communes",
    });
  }

  for (const a of annees) evs.push(...evenementsFeries(a));
  return trier(evs);
}
