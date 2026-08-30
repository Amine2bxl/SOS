import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireInscription } from "./FormulaireInscription";
import { supabaseConfigure } from "@/lib/supabase/config";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";
import { Check } from "@/components/ui";

export const metadata: Metadata = { title: "Créer un compte" };

const INCLUS = [
  "2 contestations gratuites",
  "Scan automatique de votre courrier",
  "Lettre de contestation générée",
  "Suivi de vos dossiers et rappel des délais",
];

export default function InscriptionPage() {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center font-display text-3xl font-bold text-navy-900">
        Créer un compte gratuit
      </h1>

      <ul className="mt-6 space-y-2 rounded-xl border border-line bg-card p-5">
        {INCLUS.map((x) => (
          <li key={x} className="flex gap-2.5 text-sm text-ink">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
            {x}
          </li>
        ))}
      </ul>

      <FormulaireInscription />

      <p className="mt-6 text-center text-sm text-ink-soft">
        Vous avez déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-navy-700 underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
