import type { Metadata } from "next";
import { lireProfil, listerDossiers } from "@/lib/dossiers";
import { planById, contestationsRestantes, formatPrix } from "@/lib/plans";
import { Card, LinkBtn, BarreProgression } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { CarteFormule } from "@/components/formules";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Mon abonnement" };
export const dynamic = "force-dynamic";

export default async function AbonnementPage() {
  const [profil, dossiers] = await Promise.all([lireProfil(), listerDossiers()]);

  const plan = planById(profil?.plan);
  const restantes = contestationsRestantes(profil?.plan, dossiers.length);
  const demandeEnCours = profil?.plan_demande && profil.plan_demande !== profil.plan;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-navy-900">Mon abonnement</h1>
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

        <p className="mt-5 border-t border-line-soft pt-4 text-sm leading-relaxed text-ink-soft">
          {plan.id === "gratuit"
            ? "Deux contestations, le scan, la lettre et le suivi des délais. L'aide par écrit reste gratuite sans limite."
            : "Contestations illimitées, relecture de vos lettres et alertes réglementaires."}{" "}
          <a href="#formules" className="ml-1 font-semibold text-navy-700 underline">
            Comparer les formules →
          </a>
        </p>
      </Card>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Card title="Ce que vous pouvez faire">
          {restantes === null ? (
            <p className="text-sm leading-relaxed text-ink-soft">
              <strong className="text-navy-900">Contestations illimitées.</strong> Votre adhésion
              vous permet d&apos;ouvrir autant de dossiers que nécessaire.
            </p>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-ink-soft">
                Il vous reste{" "}
                <strong className="text-navy-900">
                  {restantes} contestation{restantes > 1 ? "s" : ""} gratuite{restantes > 1 ? "s" : ""}
                </strong>{" "}
                sur votre formule.
              </p>
              {plan.quotaContestations !== null && (
                <div className="mt-4">
                  <BarreProgression
                    utilise={Math.min(dossiers.length, plan.quotaContestations)}
                    total={plan.quotaContestations}
                    label="Contestations utilisées"
                  />
                </div>
              )}
              {restantes > 0 && (
                <LinkBtn href="/tableau-de-bord/nouveau" variant="secondary" className="mt-4">
                  Ouvrir une contestation
                </LinkBtn>
              )}
            </>
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
              <LinkBtn href="#formules" variant="gold" className="mt-2">
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

      {/* La comparaison complète, ici plutôt que sur la vitrine : un membre
          connecté n'a aucune raison d'être renvoyé vers la page publique. */}
      <section id="formules" className="mt-10 scroll-mt-24">
        <h3 className="font-display text-xl font-bold text-navy-900">Toutes les formules</h3>
        <p className="mt-1.5 text-sm text-ink-soft">
          L&apos;adhésion finance l&apos;outil et la veille réglementaire. L&apos;aide par écrit
          reste gratuite sans limite, quelle que soit votre formule.
        </p>
        <div className="mt-5 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <CarteFormule
              key={p.id}
              plan={p}
              sansAction={p.id === plan.id}
              libelleAction={p.id === "gratuit" ? "Formule de départ" : `Adhérer — ${p.nom}`}
              href={p.id === "gratuit" ? "/tableau-de-bord" : `/adherer?formule=${p.id}`}
            />
          ))}
        </div>
      </section>

      <Card title="Comment se règle l'adhésion ?" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Le paiement en ligne n&apos;est pas encore actif : aucune donnée bancaire n&apos;est demandée
          sur ce site. L&apos;adhésion se règle par virement au compte de l&apos;association, et votre
          accès est activé dès réception. Une question ?{" "}
          <BoutonContact variante="lien">Contactez-nous</BoutonContact>.
        </p>
      </Card>
    </div>
  );
}