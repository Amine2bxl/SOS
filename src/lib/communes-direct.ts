import "server-only";
import { createClient } from "@supabase/supabase-js";
import { lireConfigSupabase } from "@/lib/supabase/config";
import {
  aujourdhuiBruxelles,
  lireRegistre,
  normaliserChangements,
  selectionnerRegles,
  type LigneChangement,
  type LigneCommune,
  type LigneRegle,
  type ReglesEnDirect,
} from "@/lib/communes-regles";

/**
 * Au-delà, la page s'affiche avec les repères de référence plutôt que
 * d'attendre. Une seule échéance pour toute la lecture : le client Supabase
 * réessaie de lui-même une base indisponible (1 s, 2 s, 4 s…), et sans elle
 * une panne faisait patienter la page sept secondes.
 */
const DELAI_MS = 3000;

/**
 * Les règles des communes bruxelloises, lues en base à chaque visite.
 *
 * Données publiques : un client sans cookies, avec la clé anonyme, suffit — et
 * ne lie pas la page à la session du visiteur. Aucune erreur ne remonte : une
 * base lente ou absente donne `enDirect: false`, et la page affiche ce que le
 * site sait déjà.
 */
export async function lireReglesEnDirect(): Promise<ReglesEnDirect> {
  const maintenant = new Date();
  const luLe = maintenant.toISOString();
  const aujourdhui = aujourdhuiBruxelles(maintenant);
  const repli: ReglesEnDirect = {
    regles: {},
    prochaines: {},
    registre: {},
    changements: [],
    enDirect: false,
    luLe,
    aujourdhui,
  };

  const config = lireConfigSupabase();
  if (!config) return repli;

  const client = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (entree, init) => fetch(entree, { ...init, cache: "no-store" }) },
  });
  const echeance = AbortSignal.timeout(DELAI_MS);

  try {
    const [regles, changements, registre] = await Promise.all([
      client
        .from("communes_regles")
        .select(
          "commune_slug, version, en_vigueur_depuis, en_vigueur_jusque, zones, horaires, gratuite, paiement, cartes, tarifs, contestation, a_savoir, source_url, mis_a_jour_le",
        )
        .limit(1000)
        .abortSignal(echeance),
      client
        .from("regles_changements")
        .select("id, commune_slug, titre, resume, importance, publie_le, source_url")
        .lte("publie_le", aujourdhui)
        .order("publie_le", { ascending: false })
        .limit(100)
        .abortSignal(echeance),
      client
        .from("communes")
        .select("slug, nom_nl, codes_postaux, site_officiel, page_parking, ouverte")
        .eq("region", "bruxelles")
        .abortSignal(echeance),
    ]);

    if (regles.error || changements.error || registre.error) {
      console.error(
        "Règles des communes illisibles :",
        regles.error?.message ?? "",
        changements.error?.message ?? "",
        registre.error?.message ?? "",
      );
    }

    return {
      ...selectionnerRegles((regles.data ?? []) as LigneRegle[], aujourdhui),
      registre: lireRegistre((registre.data ?? []) as LigneCommune[]),
      changements: normaliserChangements((changements.data ?? []) as LigneChangement[], aujourdhui),
      enDirect: !regles.error && !changements.error && !registre.error,
      luLe,
      aujourdhui,
    };
  } catch (erreur) {
    console.error("Règles des communes injoignables :", erreur instanceof Error ? erreur.message : String(erreur));
    return repli;
  }
}
