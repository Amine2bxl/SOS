import { cache } from "react";
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

/**
 * Utilisateur connecté, ou null (y compris si Supabase n'est pas configuré).
 *
 * Mis en cache pour la durée d'une requête. `getUser()` n'est pas une lecture
 * locale : il fait valider le jeton par le serveur d'authentification Supabase,
 * c'est-à-dire un aller-retour réseau. Sans ce cache, l'affichage du tableau de
 * bord en déclenchait six — la coquille, le profil, la liste des dossiers, les
 * alertes — pour la même réponse. `cache()` les ramène à un seul, sans changer
 * une ligne des appelants.
 */
export const lireUtilisateur = cache(async () => {
  const supabase = await creerClientServeur();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
