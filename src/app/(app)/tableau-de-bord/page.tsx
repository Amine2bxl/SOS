import type { Metadata } from "next";
import { listerDossiers, lireProfil, lireAlertesNonVues } from "@/lib/dossiers";
import { VueAccueil } from "./VueAccueil";

export const metadata: Metadata = { title: "Accueil" };
export const dynamic = "force-dynamic";

export default async function Accueil() {
  const [dossiers, profil, alertes] = await Promise.all([listerDossiers(), lireProfil(), lireAlertesNonVues()]);
  return <VueAccueil dossiers={dossiers} profil={profil} alertes={alertes} />;
}
