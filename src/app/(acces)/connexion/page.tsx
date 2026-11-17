import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireAcces } from "./FormulaireAcces";
import { supabaseConfigure } from "@/lib/supabase/config";
import { modeConfirmation } from "@/lib/auth-actions";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";
import { lireUtilisateur } from "@/lib/supabase/server";
import { lireAppareilConnu } from "@/lib/appareil-connu";
import { emailAffichable } from "@/lib/telephone";

export const metadata: Metadata = {
  title: "Entrer dans mon espace",
  description: "Un code par e-mail ou par SMS, et vous y êtes. Pas de mot de passe.",
};

export default async function ConnexionPage() {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  // Le formulaire doit savoir comment le code arrive (notre e-mail, ou celui
  // de Supabase), si Google est branché, et si l'anti-robot l'est.
  const mode = await modeConfirmation();
  // La session réelle décide de l'étape, y compris après un lien ouvert dans
  // un autre onglet. Aucun paramètre URL ne peut simuler une vérification.
  const [utilisateur, appareil] = await Promise.all([lireUtilisateur(), lireAppareilConnu()]);

  return (
    <Suspense fallback={null}>
      <FormulaireAcces
        mode={mode}
        googleActif={process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1"}
        cleTurnstile={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        emailVerifie={
          utilisateur?.email_confirmed_at && emailAffichable(utilisateur.email)
            ? emailAffichable(utilisateur.email)
            : utilisateur?.phone_confirmed_at && utilisateur.phone
              ? `+${utilisateur.phone.replace(/^\+/, "")}`
              : null
        }
        telephoneActif={process.env.NEXT_PUBLIC_AUTH_TELEPHONE === "1"}
        appareil={utilisateur ? null : appareil}
      />
    </Suspense>
  );
}
