import type { Metadata } from "next";
import { lireProfil } from "@/lib/dossiers";
import { planById, PLANS, formatPrix } from "@/lib/plans";
import { Card, LinkBtn } from "@/components/ui";
import { CarteFormule } from "@/components/formules";
import { BoutonContact } from "@/components/Contact";
import { FormulaireAdhesion } from "./FormulaireAdhesion";

export const metadata: Metadata = { title: "Adhérer à l'association" };
export const dynamic = "force-dynamic";

export default async function AdhererPage({
  searchParams,
}: {
  searchParams: Promise<{ formule?: string }>;
}) {
  const [{ formule }, profil] = await Promise.all([searchParams, lireProfil()]);
  const choisie = PLANS.find((p) => p.id === formule && p.id !== "gratuit") ?? planById("membre");

  if (profil && profil.plan !== "gratuit") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <Card className="border-ok-600/40 bg-ok-100/50 text-center">
          <h2 className="font-display text-2xl font-bold text-ok-700">
            Vous êtes déjà membre
          </h2>
          <p className="mt-3 text-sm text-ink">
            Votre formule {planById(profil.plan).nom} est active : vos contestations sont illimitées.
          </p>
          <LinkBtn href="/tableau-de-bord" variant="secondary" className="mt-5">
            Retour au tableau de bord
          </LinkBtn>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h2 className="font-display text-3xl font-bold text-navy-900">
        Adhérer — formule {choisie.nom}
      </h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        {choisie.pour} — {formatPrix(choisie.prixAnnuel)} par an.
      </p>

      <div className="mt-8">
        <CarteFormule plan={choisie} sansAction />
      </div>

      {profil?.plan_demande ? (
        <Card className="mt-6 border-ok-600/40 bg-ok-100/50">
          <h2 className="font-display text-lg font-bold text-ok-700">Demande enregistrée ✓</h2>
          <p className="mt-2 text-sm text-ink">
            Votre demande d&apos;adhésion à la formule {planById(profil.plan_demande).nom} nous est
            parvenue. Nous vous contactons rapidement avec les coordonnées bancaires. Votre accès
            sera activé dès réception du virement.
          </p>
          <p className="mt-3 text-sm text-ink">
            Une question dans l&apos;intervalle ?{" "}
            <BoutonContact variante="lien">Contactez-nous</BoutonContact>
            .
          </p>
        </Card>
      ) : (
        <FormulaireAdhesion formule={choisie.id} nomFormule={choisie.nom} />
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-soft">
        Le paiement en ligne n&apos;est pas encore actif : aucune donnée bancaire ne vous est
        demandée sur ce site. L&apos;adhésion se règle par virement au compte de l&apos;association.
      </p>
    </div>
  );
}
