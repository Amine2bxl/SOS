import { redirect } from "next/navigation";
import { supabaseConfigure } from "@/lib/supabase/config";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";
import { lireUtilisateur } from "@/lib/supabase/server";
import { listerDossiers, lireProfil } from "@/lib/dossiers";
import { planById, contestationsRestantes } from "@/lib/plans";
import { CoquilleApp, type InfosMembre } from "@/components/app/CoquilleApp";

export const dynamic = "force-dynamic";

/**
 * Coquille de l'espace membre.
 *
 * La session est résolue ici, côté serveur : la barre latérale et l'identité du
 * membre sont justes dès le premier octet envoyé. Plus de squelette qui
 * clignote au chargement, plus d'interface qui change d'avis après coup.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  const utilisateur = await lireUtilisateur();
  if (!utilisateur) redirect("/connexion?suite=/tableau-de-bord");

  const [profil, dossiers] = await Promise.all([lireProfil(), listerDossiers()]);
  const plan = planById(profil?.plan);

  const prenom = (profil?.prenom ?? String(utilisateur.user_metadata?.prenom ?? "")).trim();
  const nom = (profil?.nom ?? String(utilisateur.user_metadata?.nom ?? "")).trim();

  const membre: InfosMembre = {
    prenom,
    nom,
    email: utilisateur.email ?? profil?.email ?? null,
    initiale: (prenom.charAt(0) || utilisateur.email?.charAt(0) || "?").toUpperCase(),
    planNom: plan.nom,
    contestationsRestantes: contestationsRestantes(profil?.plan, dossiers.length),
    estGratuit: plan.id === "gratuit",
  };

  return <CoquilleApp membre={membre}>{children}</CoquilleApp>;
}
