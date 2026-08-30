import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Pages qui exigent d'être connecté. Hors connexion, le site reste purement informatif. */
const PAGES_PROTEGEES = ["/tableau-de-bord", "/adherer", "/contester"];

export async function middleware(request: NextRequest) {
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

  // Rafraîchit le jeton de session ; ne pas retirer cet appel.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = request.nextUrl.pathname;

  if (!user && PAGES_PROTEGEES.some((p) => chemin.startsWith(p))) {
    const connexion = request.nextUrl.clone();
    connexion.pathname = "/connexion";
    connexion.searchParams.set("suite", chemin);
    return NextResponse.redirect(connexion);
  }

  // Un utilisateur déjà connecté n'a rien à faire sur les pages d'accès.
  if (user && (chemin === "/connexion" || chemin === "/inscription")) {
    const tableau = request.nextUrl.clone();
    tableau.pathname = "/tableau-de-bord";
    tableau.search = "";
    return NextResponse.redirect(tableau);
  }

  return response;
}

export const config = {
  // Le middleware n'est utile que là où l'authentification compte : l'espace
  // membre et les pages d'accès. Les pages publiques restent statiques et
  // rapides, sans appel Supabase à chaque visite.
  matcher: ["/contester", "/tableau-de-bord/:path*", "/adherer/:path*", "/connexion", "/inscription"],
};
