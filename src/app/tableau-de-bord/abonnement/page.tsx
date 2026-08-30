import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseConfigure } from "@/lib/supabase/config";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";
import { lireUtilisateur } from "@/lib/supabase/server";
import { lireProfil, listerDossiers } from "@/lib/dossiers";
import { planById, contestationsRestantes, formatPrix } from "@/lib/plans";
import { NavigationMembre } from "@/components/NavigationMembre";
import { Card, LinkBtn, Check } from "@/components/ui";
import { ASSO } from "@/lib/data";

export const metadata: Metadata = { title: "Mon abonnement" };
export const dynamic = "force-dynamic";

export default async function AbonnementPage() {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  const utilisateur = await lireUtilisateur();
  if (!utilisateur) redirect("/connexion?suite=/tableau-de-bord/abonnement");

  const [profil, dossiers] = await Promise.all([lireProfil(), listerDossiers()]);

  const plan = planById(profil?.plan);
  const restantes = contestationsRestantes(profil?.plan, dossiers.length);
  const demandeEnCours = profil?.plan_demande && profil.plan_demande !== profil.plan;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <NavigationMembre prenom={profil?.prenom ?? undefined} planNom={plan.nom} />

      <h1 className="mt-8 font-display text-3xl font-bold text-navy-900">Mon abonnement</h1>
      <p className="mt-1 text-ink-soft">
        Votre formule, ce qu&apos;elle vous permet de faire et votre statut d&apos;adhésion.
      </p>

      <Card title="Votre formule" className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-black text-navy-900">{plan.nom}</p>
            <p className="mt-0.5 text-sm text-ink-soft">{plan.pour}</p>
          </div>
          <p className="font-display text-2xl font-black text-gold-600">
            {formatPrix(plan.prixAnnuel)}
            {plan.prixAnnuel > 0 && <span className="text-sm font-semibold text-ink-soft"> / an</span>}
          </p>
        </div>

        <ul className="mt-5 space-y-2 border-t border-line-soft pt-4">
          {plan.avantages.map((a) => (
            <li key={a} className="flex gap-2.5 text-sm text-ink">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
              {a}
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Card title="Ce que vous pouvez faire">
          {restantes === null ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              <strong className="text-navy-900">Contestations illimitées.</strong> Votre adhésion
              vous permet d&apos;ouvrir autant de dossiers que nécessaire.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-ink-soft">
              Il vous reste{" "}
              <strong className="text-navy-900">
                {restantes} contestation{restantes > 1 ? "s" : ""} gratuite{restantes > 1 ? "s" : ""}
              </strong>{" "}
              sur votre formule. Après cela, une adhésion ouvre les contestations illimitées.
            </p>
          )}
          {restantes !== null && restantes > 0 && (
            <LinkBtn href="/tableau-de-bord/nouveau" variant="secondary" className="mt-4">
              Ouvrir une contestation
            </LinkBtn>
          )}
        </Card>

        <Card title="Statut de votre adhésion">
          {demandeEnCours ? (
            <div className="rounded-lg bg-ok-100 p-3.5 text-sm text-ok-700">
              <p className="font-bold">
                Demande d&apos;adhésion {planById(profil.plan_demande as string).nom} enregistrée ✓
              </p>
              <p className="mt-1 text-ink">
                Nous vous contactons avec les coordonnées bancaires. Votre accès est activé dès
                réception du virement.
              </p>
            </div>
          ) : plan.id === "gratuit" ? (
            <div className="space-y-2 text-sm leading-relaxed text-ink-soft">
              <p>
                Vous utilisez l&apos;accès gratuit. L&apos;adhésion ouvre les contestations illimitées et
                le suivi prioritaire de vos dossiers.
              </p>
              <LinkBtn href="/tarifs" variant="gold" className="mt-2">
                Voir les formules d&apos;adhésion
              </LinkBtn>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-ink-soft">
              Votre adhésion couvre douze mois. Aucun prélèvement automatique : c&apos;est vous qui
              décidez du renouvellement. En cas de question, appelez-nous.
            </p>
          )}
        </Card>
      </div>

      <Card title="Comment se règle l'adhésion ?" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le paiement en ligne n&apos;est pas encore actif : aucune donnée bancaire n&apos;est demandée
          sur ce site. L&apos;adhésion se règle par virement au compte de l&apos;association, et votre
          accès est activé dès réception. Une question ? Appelez-nous au{" "}
          <a href={`tel:${ASSO.telephoneLien}`} className="font-semibold text-navy-700 underline">
            {ASSO.telephone}
          </a>
          .
        </p>
      </Card>
    </div>
  );
}