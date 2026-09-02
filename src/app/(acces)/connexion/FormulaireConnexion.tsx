"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { traduireErreur } from "@/lib/auth-erreurs";
import { Card, Field, TextInput, Btn } from "@/components/ui";
import { MotDePasseInput } from "@/components/MotDePasseInput";
import { FenetreCodeEmail } from "@/components/FenetreCodeEmail";
import { VerifierBoiteMail } from "@/components/VerifierBoiteMail";
import { EcranTransition } from "@/components/EcranTransition";
import type { ModeConfirmation } from "@/lib/auth-actions";

/**
 * Connexion directement dans le navigateur : la session s'ouvre côté client,
 * puis on charge l'espace membre par une navigation complète. C'est
 * volontaire : le serveur voit ainsi le cookie tout juste écrit et rend la
 * coquille de l'application du premier coup, sans état intermédiaire.
 */
export function FormulaireConnexion({ mode }: { mode: ModeConfirmation }) {
  const parametres = useSearchParams();
  const brute = parametres.get("suite") ?? "/tableau-de-bord";
  const suite = brute.startsWith("/") ? brute : "/tableau-de-bord";

  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [bascule, setBascule] = useState(false);
  const [aConfirmer, setAConfirmer] = useState(false);

  const seConnecter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    const adresse = String(donnees.get("email") ?? "").trim();
    const motDePasse = String(donnees.get("motDePasse") ?? "");

    if (!adresse || !motDePasse) {
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
      const { error } = await supabase.auth.signInWithPassword({
        email: adresse,
        password: motDePasse,
      });
      if (error) {
        // Compte créé mais adresse jamais confirmée : au lieu d'une impasse,
        // on rouvre la fenêtre de code là où l'utilisateur en était resté.
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setEmail(adresse);
          setAConfirmer(true);
          return;
        }
        setErreur(traduireErreur(error.message));
        return;
      }
      setBascule(true);
      window.location.assign(suite);
    } finally {
      setEnCours(false);
    }
  };

  if (bascule) return <EcranTransition message="Connexion en cours…" />;

  return (
    <>
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

      {/* Adresse jamais confirmée : on rattrape, avec la bonne fenêtre selon
          ce que le site sait réellement envoyer. */}
      {aConfirmer && mode === "code" && (
        <FenetreCodeEmail
          email={email}
          suite={suite}
          introduction="Votre adresse n'a jamais été confirmée. Demandez un nouveau code, il partira vers"
          onFermer={() => setAConfirmer(false)}
        />
      )}
      {aConfirmer && mode === "lien" && <VerifierBoiteMail email={email} />}
    </>
  );
}
