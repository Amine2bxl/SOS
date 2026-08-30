import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { lireConfigSupabase } from "./config";

/** Client serveur lié aux cookies de session. Renvoie null si non configuré. */
export async function creerClientServeur() {
  const config = lireConfigSupabase();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesAEcrire) => {
        try {
          cookiesAEcrire.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component : le middleware rafraîchit la
          // session, on peut ignorer sans risque.
        }
      },
    },
  });
}

/** Utilisateur connecté, ou null (y compris si Supabase n'est pas configuré). */
export async function lireUtilisateur() {
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
