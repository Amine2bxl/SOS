import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseConfigure } from "@/lib/supabase/config";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";
import { lireUtilisateur } from "@/lib/supabase/server";
import { listerDossiers, lireProfil } from "@/lib/dossiers";
import { quotaAtteint, planById } from "@/lib/plans";
import { Card, LinkBtn } from "@/components/ui";
import { ScannerDocument } from "./ScannerDocument";

export const metadata: Metadata = { title: "Nouvelle contestation" };
export const dynamic = "force-dynamic";

export default async function NouveauDossierPage() {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  const utilisateur = await lireUtilisateur();
  if (!utilisateur) redirect("/connexion?suite=/tableau-de-bord/nouveau");

  const [dossiers, profil] = await Promise.all([listerDossiers(), lireProfil()]);

  // Le quota est aussi appliqué en base ; ce contrôle sert à l'annoncer avant
  // que l'utilisateur ne perde du temps à scanner son document.
  if (quotaAtteint(profil?.plan, dossiers.length)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <Card className="border-2 border-gold-400 bg-gold-100/60 text-center">
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Vos 2 contestations gratuites sont utilisées
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Vous restez libre de consulter et de suivre vos dossiers existants. Pour en ouvrir un
            nouveau, l&apos;adhésion à l&apos;association donne accès aux contestations illimitées.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkBtn href="/tarifs" variant="gold">Voir les formules</LinkBtn>
            <LinkBtn href="/tableau-de-bord" variant="secondary">Retour au tableau de bord</LinkBtn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ScannerDocument
      formule={planById(profil?.plan).nom}
      profil={{
        prenom: profil?.prenom ?? "",
        nom: profil?.nom ?? "",
      }}
    />
  );
}
