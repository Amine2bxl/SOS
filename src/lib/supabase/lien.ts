import "server-only";
import { createClient } from "@supabase/supabase-js";
import { lireConfigSupabase } from "./config";

/**
 * Client qui demande à Supabase d'envoyer un lien de connexion, en flux
 * « implicite ».
 *
 * Le client lié aux cookies (`server.ts`) suit le flux PKCE : le lien ne
 * s'ouvre alors que dans le navigateur, et sur l'adresse du site, d'où la
 * demande est partie. Ouvert depuis l'application Gmail, ou demandé depuis une
 * préversion, il échouait (« code challenge does not match »). En flux
 * implicite, le lien rapporte la session dans le fragment de l'adresse, et
 * `RetourLienEmail` l'ouvre dans le navigateur qui a cliqué, quel qu'il soit.
 */
export function creerClientLien() {
  const config = lireConfigSupabase();
  if (!config) return null;
  return createClient(config.url, config.anonKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
