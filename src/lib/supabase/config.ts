/**
 * Configuration Supabase.
 *
 * Leçon de la panne précédente : le site ne doit JAMAIS renvoyer une erreur 500
 * parce qu'une variable d'environnement manque. Toute la partie applicative
 * (comptes, tableau de bord) interroge d'abord `supabaseConfigure()` et affiche
 * un message clair si la base n'est pas branchée, au lieu de planter.
 */

export type SupabaseConfig = { url: string; anonKey: string };

export function lireConfigSupabase(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export const supabaseConfigure = (): boolean => lireConfigSupabase() !== null;
