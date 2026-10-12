import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireAcces } from "./FormulaireAcces";
import { supabaseConfigure } from "@/lib/supabase/config";
import { modeConfirmation } from "@/lib/auth-actions";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";
import { lireUtilisateur } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Entrer dans mon espace",
  description: "Votre adresse e-mail, un code, et vous y êtes. Pas de mot de passe.",
};

export default async function ConnexionPage() {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  // Le formulaire doit savoir comment le code arrive (notre e-mail, ou celui
  // de Supabase), si Google est branché, et si l'anti-robot l'est.
  const mode = await modeConfirmation();
  // La session réelle décide de l'étape, y compris après un lien ouvert dans
  // un autre onglet. Aucun paramètre URL ne peut simuler une vérification.
  const utilisateur = await lireUtilisateur();

  return (
    <Suspense fallback={null}>
      <FormulaireAcces
        mode={mode}
        googleActif={process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1"}
        cleTurnstile={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        emailVerifie={utilisateur?.email_confirmed_at ? utilisateur.email ?? null : null}
      />
    </Suspense>
  );
}
