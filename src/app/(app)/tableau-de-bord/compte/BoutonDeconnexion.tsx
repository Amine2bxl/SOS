"use client";

import { useTransition } from "react";
import { seDeconnecter } from "@/lib/auth-actions";
import { Btn } from "@/components/ui";
import { IconeSortie } from "@/components/icones";

export function BoutonDeconnexion() {
  const [enCours, demarrer] = useTransition();
  return (
    <Btn variant="secondary" taille="sm" disabled={enCours} onClick={() => demarrer(() => seDeconnecter())}>
      <IconeSortie className="h-4 w-4" />
      {enCours ? "Déconnexion…" : "Se déconnecter"}
    </Btn>
  );
}
