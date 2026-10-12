import type { Metadata } from "next";
import { lireProfil, lireAdhesionEnAttente } from "@/lib/dossiers";
import { planById, PLANS, formatPrix } from "@/lib/plans";
import { Card, LinkBtn } from "@/components/ui";
import { CarteFormule } from "@/components/formules";
import { InstructionsVirement } from "@/components/app/InstructionsVirement";
import { FormulaireAdhesion } from "./FormulaireAdhesion";

export const metadata: Metadata = { title: "Adhérer à l'association" };
export const dynamic = "force-dynamic";

export default async function AdhererPage({
  searchParams,
}: {
  searchParams: Promise<{ formule?: string }>;
}) {
  const [{ formule }, profil, enAttente] = await Promise.all([
    searchParams,
    lireProfil(),
    lireAdhesionEnAttente(),
  ]);
  const choisie = PLANS.find((p) => p.id === formule && p.id !== "gratuit") ?? planById("membre");

  if (profil && profil.plan !== "gratuit") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <Card className="border-ok-600/40 bg-ok-100/50 text-center">
          <h2 className="font-display text-2xl font-bold text-ok-700">Vous êtes déjà membre</h2>
          <p className="mt-3 text-sm text-ink">
            Votre formule {planById(profil.plan).nom} est active : vos contestations sont illimitées.
          </p>
          <LinkBtn href="/tableau-de-bord" variant="secondary" className="mt-5">
            Retour à mon espace
          </LinkBtn>
        </Card>
      </div>
    );
  }

  // Une demande déjà posée : on reprend là où la personne s'était arrêtée, avec
  // sa référence de paiement, plutôt que de lui faire recommencer.
  const formuleAffichee = enAttente ? planById(enAttente.formule) : choisie;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h2 className="font-display text-3xl font-bold text-navy-900">
        Adhérer — formule {formuleAffichee.nom}
      </h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        {formuleAffichee.pour} — {formatPrix(formuleAffichee.prixAnnuel)} par an.
      </p>

      <div className="mt-8">
        <CarteFormule plan={formuleAffichee} sansAction />
      </div>

      {enAttente ? (
        <InstructionsVirement
          communication={enAttente.communication}
          montant={enAttente.montant}
          nomFormule={formuleAffichee.nom}
        />
      ) : (
        <FormulaireAdhesion
          formule={choisie.id}
          nomFormule={choisie.nom}
          prix={choisie.prixAnnuel}
        />
      )}
    </div>
  );
}
