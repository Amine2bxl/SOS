import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Pages qui exigent d'être connecté : tout l'espace membre. */
const PAGES_PROTEGEES = ["/tableau-de-bord", "/adherer"];

export async function middleware(request: NextRequest) {
  const chemin = request.nextUrl.pathname;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sans configuration, on laisse passer : les pages concernées affichent
  // elles-mêmes un message clair. Jamais d'erreur 500 sur le site public.
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesAEcrire) => {
        cookiesAEcrire.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesAEcrire.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Rafraîchit le jeton de session ; ne pas retirer cet appel. Pour un visiteur
  // anonyme, aucun cookie de session n'existe : aucun appel réseau n'est fait.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && PAGES_PROTEGEES.some((p) => chemin.startsWith(p))) {
    const connexion = request.nextUrl.clone();
    connexion.pathname = "/connexion";
    connexion.searchParams.set("suite", chemin);
    return NextResponse.redirect(connexion);
  }

  // Frontière étanche dans l'autre sens : un membre connecté n'a rien à faire
  // sur la page d'accueil vitrine ni sur les écrans d'accès. Il atterrit
  // directement dans son application.
  if (user && ["/", "/connexion", "/inscription"].includes(chemin)) {
    const espace = request.nextUrl.clone();
    espace.pathname = "/tableau-de-bord";
    espace.search = "";
    return NextResponse.redirect(espace);
  }

  return response;
}

export const config = {
  // Le middleware n'intervient que là où l'authentification change quelque
  // chose : l'espace membre, les écrans d'accès, l'accueil (pour renvoyer un
  // membre chez lui). Les autres pages publiques restent statiques et rapides.
  matcher: [
    "/",
    "/connexion",
    "/inscription",
    "/tableau-de-bord/:path*",
    "/adherer/:path*",
  ],
};
