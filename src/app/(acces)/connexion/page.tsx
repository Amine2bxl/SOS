import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormulaireConnexion } from "./FormulaireConnexion";
import { supabaseConfigure } from "@/lib/supabase/config";
import { modeConfirmation } from "@/lib/auth-actions";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage() {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  // Le formulaire doit savoir comment une adresse se confirme ici : par code
  // saisi, ou par lien cliqué. Sans cela il proposerait une grille de saisie
  // même quand aucun code n'est envoyé.
  const mode = await modeConfirmation();

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center font-display text-3xl font-bold text-navy-900">
        Connexion
      </h1>
      <p className="mt-3 text-center text-ink-soft">
        Retrouvez vos dossiers et leur avancement.
      </p>

      <Suspense fallback={null}>
        <FormulaireConnexion mode={mode} />
      </Suspense>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-navy-700 underline">
          Créer un compte gratuit
        </Link>
      </p>
    </div>
  );
}
