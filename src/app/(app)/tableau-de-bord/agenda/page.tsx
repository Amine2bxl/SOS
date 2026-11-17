import type { Metadata } from "next";
import { creerClientServeur, lireUtilisateur } from "@/lib/supabase/server";
import { chargerAgenda } from "@/lib/agenda-donnees";
import { lireMois, type EvenementCalendrier } from "@/lib/agenda";
import { urlDuSite } from "@/lib/url-site";
import { VueAgenda } from "./VueAgenda";

export const metadata: Metadata = { title: "Agenda" };
export const dynamic = "force-dynamic";

/**
 * L'agenda : un mois à la fois, avec tout ce qui a une date. Cette page charge
 * les données ; `VueAgenda` les met en page.
 */
export default async function Agenda({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const { mois } = await searchParams;
  const maintenant = new Date();
  const { annee, mois0 } = lireMois(mois, maintenant);

  const [supabase, utilisateur] = await Promise.all([creerClientServeur(), lireUtilisateur()]);
  const evenements: EvenementCalendrier[] =
    supabase && utilisateur ? await chargerAgenda(supabase, utilisateur.id, [annee - 1, annee, annee + 1]) : [];
  const { data: profil } =
    supabase && utilisateur
      ? await supabase.from("profiles").select("agenda_jeton").eq("id", utilisateur.id).maybeSingle()
      : { data: null };

  return (
    <VueAgenda
      evenements={evenements}
      annee={annee}
      mois0={mois0}
      aujourdhui={maintenant.toISOString().slice(0, 10)}
      jeton={(profil as { agenda_jeton?: string | null } | null)?.agenda_jeton ?? null}
      site={urlDuSite()}
    />
  );
}
