import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client d'administration (clé `service_role`).
 *
 * Il sert à une seule chose : fabriquer nous-mêmes le code de confirmation à
 * 6 chiffres, sans que Supabase envoie son propre e-mail. C'est ce qui nous
 * permet d'envoyer NOTRE e-mail SOS Citizens, écrit et versionné dans ce dépôt,
 * au lieu d'un gabarit à recopier à la main dans un tableau de bord.
 *
 * Comme partout dans ce projet : si la variable manque, on renvoie `null` et
 * l'appelant retombe sur le chemin classique. Jamais de 500.
 */
export function creerClientAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return null;

  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
