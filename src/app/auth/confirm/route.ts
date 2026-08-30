import { NextResponse, type NextRequest } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";

/**
 * Destinataire des liens de confirmation envoyés par Supabase
 * (…/auth/confirm?token_hash=…&type=signup) : le lien de l'e-mail arrive ici,
 * vérifie le code et ouvre la session, puis renvoie vers le tableau de bord.
 *
 * La voie normale reste le code à 6 chiffres saisi dans la fenêtre : cette
 * route ne sert que si quelqu'un clique directement sur le lien reçu.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "signup") as
    | "signup"
    | "invite"
    | "recovery"
    | "email_change"
    | "magiclink"
    | "email";
  const suite = url.searchParams.get("next") ?? "/tableau-de-bord";

  const supabase = await creerClientServeur();
  const racine = url.origin;

  if (supabase && tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(
        new URL(suite.startsWith("/") ? suite : "/tableau-de-bord", racine),
      );
    }
  }

  // Échec ou lien incomplet : on renvoie proprement vers l'accueil.
  return NextResponse.redirect(new URL("/", racine));
}