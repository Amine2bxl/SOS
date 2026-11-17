import "server-only";
import { cookies } from "next/headers";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { COOKIE_APPAREIL, lireAppareil } from "@/lib/appareils";
import { emailAffichable, masquerEmail, masquerTelephone } from "@/lib/telephone";

/**
 * Sur l'écran de connexion : cet appareil est-il reconnu, et pour quel compte ?
 * On n'affiche qu'un indice masqué (« a•••@gmail.com », « +32 470 •• •• 56 ») :
 * assez pour se reconnaître, pas assez pour qu'un voisin de bureau lise
 * l'adresse.
 */
export async function lireAppareilConnu(): Promise<{ indice: string } | null> {
  const admin = creerClientAdmin();
  if (!admin) return null;
  const valeur = (await cookies()).get(COOKIE_APPAREIL)?.value;
  if (!valeur) return null;
  try {
    const appareil = await lireAppareil(admin, valeur);
    if (!appareil) return null;
    const { data } = await admin.auth.admin.getUserById(appareil.userId);
    const u = data?.user;
    if (!u) return null;
    const email = emailAffichable(u.email);
    if (email) return { indice: masquerEmail(email) };
    if (u.phone) return { indice: masquerTelephone(`+${u.phone.replace(/^\+/, "")}`) };
    return null;
  } catch {
    return null;
  }
}
