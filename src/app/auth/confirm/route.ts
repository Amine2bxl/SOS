import { NextResponse, type NextRequest } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";
import { cheminSur } from "@/lib/chemin-sur";

/**
 * L'arrivée des liens de connexion : e-mail de code, lien magique, Google.
 *
 * Trois formes de retour, toutes traitées ici :
 *
 *  - `token_hash` + `type` : le lien de NOTRE e-mail. Il fonctionne sur
 *    n'importe quel appareil — on peut lire l'e-mail sur son téléphone et
 *    ouvrir la session sur son ordinateur… ou l'inverse.
 *  - `code` : le retour de Google, et des liens Supabase envoyés avant le
 *    passage au flux implicite. La vérification exige le même navigateur que
 *    celui de la demande. Les liens Supabase actuels rapportent la session
 *    dans le fragment de l'adresse, que seul le navigateur lit : voir
 *    `components/RetourLienEmail.tsx`.
 *  - `error` : lien expiré, connexion Google annulée. On ramène la personne à
 *    l'écran de connexion avec un message clair, jamais sur une page blanche.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const racine = url.origin;
  const brute = url.searchParams.get("suite") ?? url.searchParams.get("next") ?? "/tableau-de-bord";
  const suite = cheminSur(brute);

  const succes = () => {
    const retour = new URL("/connexion", racine);
    retour.searchParams.set("confirme", "1");
    retour.searchParams.set("suite", suite);
    return NextResponse.redirect(retour);
  };

  const echec = (raison: string) => {
    const retour = new URL("/connexion", racine);
    retour.searchParams.set("erreur", raison);
    retour.searchParams.set("suite", suite);
    return NextResponse.redirect(retour);
  };

  const erreur = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (erreur) {
    return echec(/expired|invalid/i.test(erreur) ? "lien-expire" : "connexion-annulee");
  }

  const supabase = await creerClientServeur();
  if (!supabase) return echec("service-indisponible");

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (tokenHash) {
    const typeOtp = (["signup", "email", "magiclink", "recovery", "invite", "email_change"].includes(type ?? "")
      ? type
      : "email") as "signup" | "email" | "magiclink" | "recovery" | "invite" | "email_change";
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: typeOtp });
    if (error) return echec("lien-expire");
    return succes();
  }

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Un lien ouvert dans un autre navigateur que celui de la demande ne peut
    // pas aboutir : on le dit, et le code reste la solution.
    if (error) return echec("autre-navigateur");
    return succes();
  }

  return echec("lien-incomplet");
}
