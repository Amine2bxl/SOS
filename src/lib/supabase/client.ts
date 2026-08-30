"use client";

import { createBrowserClient } from "@supabase/ssr";
import { lireConfigSupabase } from "./config";

/** Client navigateur. Renvoie null si Supabase n'est pas configuré. */
export function creerClientNavigateur() {
  const config = lireConfigSupabase();
  if (!config) return null;
  return createBrowserClient(config.url, config.anonKey);
}
