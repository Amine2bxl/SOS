import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseConfigure } from "@/lib/supabase/config";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";
import { lireUtilisateur } from "@/lib/supabase/server";
import { lireProfil } from "@/lib/dossiers";
import { planById, PLANS, formatPrix } from "@/lib/plans";
import { Card, LinkBtn, Check } from "@/components/ui";
import { ASSO } from "@/lib/data";
import { FormulaireAdhesion } from "./FormulaireAdhesion";

export const metadata: Metadata = { title: "Adhérer à l'association" };
export const dynamic = "force-dynamic";

export default async function AdhererPage({
  searchParams,
}: {
  searchParams: Promise<{ formule?: string }>;
}) {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  const { formule } = await searchParams;

  const utilisateur = await lireUtilisateur();
  if (!utilisateur) redirect(`/connexion?suite=/adherer${formule ? `?formule=${formule}` : ""}`);

  const profil = await lireProfil();
  const choisie = PLANS.find((p) => p.id === formule && p.id !== "gratuit") ?? planById("membre");

  if (profil && profil.plan !== "gratuit") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <Card className="border-ok-600/40 bg-ok-100/50 text-center">
          <h1 className="font-display text-2xl font-bold text-ok-700">
            Vous êtes déjà membre
          </h1>
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
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-navy-900">
        Adhérer — formule {choisie.nom}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        {choisie.pour} — {formatPrix(choisie.prixAnnuel)} par an.
      </p>

      <Card className="mt-8">
        <h2 className="font-display text-lg font-bold text-navy-900">Ce que comprend cette formule</h2>
        <ul className="mt-4 space-y-2.5">
          {choisie.avantages.map((a) => (
            <li key={a} className="flex gap-2.5 text-sm text-ink">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
              {a}
            </li>
          ))}
        </ul>
      </Card>

      {profil?.plan_demande ? (
        <Card className="mt-6 border-ok-600/40 bg-ok-100/50">
          <h2 className="font-display text-lg font-bold text-ok-700">Demande enregistrée ✓</h2>
          <p className="mt-2 text-sm text-ink">
            Votre demande d&apos;adhésion à la formule {planById(profil.plan_demande).nom} nous est
            parvenue. Nous vous contactons rapidement avec les coordonnées bancaires. Votre accès
            sera activé dès réception du virement.
          </p>
          <p className="mt-3 text-sm text-ink">
            Une question dans l&apos;intervalle ? Appelez-nous au{" "}
            <a href={`tel:${ASSO.telephoneLien}`} className="font-semibold underline">
              {ASSO.telephone}
            </a>
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
