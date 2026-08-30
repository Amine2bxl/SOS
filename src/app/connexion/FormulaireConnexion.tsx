"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { traduireErreur } from "@/lib/auth-erreurs";
import { Card, Field, TextInput, Btn } from "@/components/ui";
import { MotDePasseInput } from "@/components/MotDePasseInput";

/**
 * Connexion directement dans le navigateur : la session s'ouvre côté client,
 * puis l'utilisateur est renvoyé vers son espace. Plus rapide qu'un échange
 * avec le serveur, et le en-tête se met à jour instantanément.
 */
export function FormulaireConnexion() {
  const parametres = useSearchParams();
  const suite = parametres.get("suite") ?? "/tableau-de-bord";
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const seConnecter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    const email = String(donnees.get("email") ?? "").trim();
    const motDePasse = String(donnees.get("motDePasse") ?? "");

    if (!email || !motDePasse) {
      setErreur("Renseignez votre e-mail et votre mot de passe.");
      return;
    }

    setErreur(null);
    setEnCours(true);
    try {
      const supabase = creerClientNavigateur();
      if (!supabase) {
        setErreur("Le service de connexion n'est pas disponible pour le moment.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
      if (error) {
        setErreur(traduireErreur(error.message));
        return;
      }
      router.push(suite.startsWith("/") ? suite : "/tableau-de-bord");
      router.refresh();
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Card className="mt-8">
      <form onSubmit={seConnecter} className="space-y-4">
        <Field label="Adresse e-mail" required>
          <TextInput name="email" type="email" required autoComplete="email" autoFocus />
        </Field>

        <Field label="Mot de passe" required>
          <MotDePasseInput name="motDePasse" required autoComplete="current-password" />
        </Field>

        {erreur && (
          <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm font-medium text-danger-700">
            {erreur}
          </p>
        )}

        <Btn type="submit" variant="gold" className="w-full" disabled={enCours}>
          {enCours ? "Connexion…" : "Se connecter"}
        </Btn>
      </form>
    </Card>
  );
}