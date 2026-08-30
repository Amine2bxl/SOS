import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseConfigure } from "@/lib/supabase/config";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";
import { lireUtilisateur } from "@/lib/supabase/server";
import { listerDossiers, lireProfil, lireAlertesNonVues } from "@/lib/dossiers";
import {
  TYPES_DOCUMENT, joursAvantEcheance, formatMontant, formatDate,
} from "@/lib/dossiers-format";
import { planById, contestationsRestantes } from "@/lib/plans";
import { LinkBtn, Card, BarreProgression } from "@/components/ui";
import { BadgeStatut, PastilleEcheance } from "@/components/dossier-ui";
import { AlerteReglementaire } from "@/components/AlerteReglementaire";
import { RafraichirEnTempsReel } from "@/components/RafraichirEnTempsReel";
import { NavigationMembre } from "@/components/NavigationMembre";

export const metadata: Metadata = { title: "Mon tableau de bord" };
export const dynamic = "force-dynamic";

export default async function TableauDeBordPage() {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  const utilisateur = await lireUtilisateur();
  if (!utilisateur) redirect("/connexion?suite=/tableau-de-bord");

  const [dossiers, profil, alertes] = await Promise.all([
    listerDossiers(),
    lireProfil(),
    lireAlertesNonVues(),
  ]);

  const plan = planById(profil?.plan);
  const restantes = contestationsRestantes(profil?.plan, dossiers.length);

  const enCours = dossiers.filter(
    (d) => !["accepte", "rejete", "clos"].includes(d.statut),
  );
  const urgents = enCours.filter((d) => {
    const j = joursAvantEcheance(d.date_echeance);
    return j !== null && j <= 7;
  });
  const totalEnJeu = enCours.reduce((s, d) => s + (d.montant ?? 0), 0);

  // Prochaine échéance, pour ne jamais rater un délai.
  const prochain = enCours
    .filter((d) => d.date_echeance)
    .sort((a, b) => (a.date_echeance! < b.date_echeance! ? -1 : 1))[0];
  const joursProchain = prochain ? joursAvantEcheance(prochain.date_echeance) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <RafraichirEnTempsReel />

      {alertes.length > 0 && <AlerteReglementaire alerte={alertes[0]} />}

      <NavigationMembre prenom={profil?.prenom ?? undefined} planNom={plan.nom} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-900">
            Bonjour{profil?.prenom ? ` ${profil.prenom}` : ""}
          </h1>
          <p className="mt-1 text-ink-soft">
            Formule {plan.nom}
            {restantes !== null && (
              <> — {restantes} contestation{restantes > 1 ? "s" : ""} gratuite{restantes > 1 ? "s" : ""} restante{restantes > 1 ? "s" : ""}</>
            )}
          </p>
        </div>
        <LinkBtn href="/tableau-de-bord/nouveau" variant="gold">
          + Nouvelle contestation
        </LinkBtn>
      </div>

      {/* Rappel d'échéance : l'information la plus critique passe en premier. */}
      {urgents.length > 0 && (
        <div className="mt-6 rounded-xl border-2 border-danger-600/40 bg-danger-100 p-5">
          <p className="font-display font-bold text-danger-700">
            {urgents.length === 1
              ? "1 dossier arrive à échéance"
              : `${urgents.length} dossiers arrivent à échéance`}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {urgents.map((d) => {
              const j = joursAvantEcheance(d.date_echeance)!;
              return (
                <li key={d.id}>
                  <Link href={`/tableau-de-bord/${d.id}`} className="font-semibold underline">
                    {d.reference ?? "Dossier sans référence"}
                  </Link>{" "}
                  — {j < 0 ? `échéance dépassée depuis ${-j} jour(s)` : j === 0 ? "échéance aujourd'hui" : `dans ${j} jour(s)`}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Chiffres clés */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { valeur: String(dossiers.length), label: "dossiers au total" },
          { valeur: String(enCours.length), label: "en cours de traitement" },
          { valeur: formatMontant(totalEnJeu), label: "montant en jeu" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-line bg-card p-5">
            <p className="font-display text-3xl font-black text-navy-900">{c.valeur}</p>
            <p className="mt-1 text-sm text-ink-soft">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Abonnement et prochaine échéance : les deux infos qui comptent. */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                Mon abonnement
              </p>
              <p className="mt-0.5 font-display text-lg font-bold text-navy-900">{plan.nom}</p>
              <p className="text-sm text-ink-soft">
                {restantes === null
                  ? "Contestations illimitées"
                  : `${restantes} contestation${restantes > 1 ? "s" : ""} gratuite${restantes > 1 ? "s" : ""} restante${restantes > 1 ? "s" : ""}`}
              </p>
            </div>
            <LinkBtn href="/tableau-de-bord/abonnement" variant="secondary">
              Gérer mon abonnement
            </LinkBtn>
          </div>

          {restantes !== null && plan.quotaContestations !== null && (
            <div className="mt-4">
              <BarreProgression
                utilise={Math.min(dossiers.length, plan.quotaContestations)}
                total={plan.quotaContestations}
                label="Contestations utilisées"
              />
            </div>
          )}

          {restantes !== null && restantes === 0 && (
            <p className="mt-3 rounded-md bg-gold-100 p-2.5 text-sm text-ink">
              Quota épuisé —{" "}
              <Link href="/tarifs" className="font-semibold text-navy-700 underline">
                adhérez pour continuer gratuitement
              </Link>{" "}
              sur de nouveaux dossiers ? Vos dossiers restent suivis.
            </p>
          )}
        </Card>

        <Card>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
            Prochaine échéance
          </p>
          {prochain ? (
            <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={`/tableau-de-bord/${prochain.id}`}
                  className="font-display text-lg font-bold text-navy-900 hover:underline"
                >
                  {prochain.reference ?? "Dossier"}
                </Link>
                <p className="text-sm text-ink-soft">
                  {joursProchain === null
                    ? "Date limite à vérifier"
                    : joursProchain < 0
                      ? `Échéance dépassée depuis ${-joursProchain} jour(s)`
                      : joursProchain === 0
                        ? "L'échéance, c'est aujourd'hui"
                        : `${formatDate(prochain.date_echeance)} — dans ${joursProchain} jour${joursProchain > 1 ? "s" : ""}`}
                </p>
              </div>
              {joursProchain !== null && <PastilleEcheance jours={joursProchain} />}
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-ink-soft">Aucun dossier en cours : aucune échéance.</p>
          )}
        </Card>
      </div>

      {/* Quota épuisé */}
      {restantes === 0 && (
        <Card className="mt-6 border-2 border-gold-400 bg-gold-100/60">
          <p className="font-display text-lg font-bold text-navy-900">
            Vous avez utilisé vos 2 contestations gratuites
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Vos dossiers restent accessibles et vous continuez à les suivre. Pour en ouvrir un
            nouveau, adhérez à l&apos;association.
          </p>
          <LinkBtn href="/tarifs" variant="gold" className="mt-4">
            Voir les formules
          </LinkBtn>
        </Card>
      )}

      {/* Liste */}
      <h2 className="mt-10 font-display text-xl font-bold text-navy-900">Mes dossiers</h2>

      {dossiers.length === 0 ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-lg font-bold text-navy-900">Aucun dossier pour l&apos;instant</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Prenez votre courrier en photo. Nous en extrayons la référence, le montant et les
            dates ; vous n&apos;avez plus qu&apos;à vérifier.
          </p>
          <LinkBtn href="/tableau-de-bord/nouveau" variant="gold" className="mt-5">
            Scanner mon document
          </LinkBtn>
        </Card>
      ) : (
        <ul className="mt-4 space-y-3">
          {dossiers.map((d) => (
            <li key={d.id}>
              <Link
                href={`/tableau-de-bord/${d.id}`}
                className="block rounded-xl border border-line bg-card p-5 shadow-sm transition hover:border-navy-600/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold text-navy-900">
                      {d.reference ?? "Dossier sans référence"}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {TYPES_DOCUMENT[d.type_document] ?? d.type_document}
                      {d.commune && ` — ${d.commune}`}
                    </p>
                  </div>
                  <BadgeStatut statut={d.statut} />
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink-soft">
                  <span><strong className="text-navy-900">{formatMontant(d.montant)}</strong></span>
                  {d.plaque && <span>{d.plaque}</span>}
                  <span>Constat : {formatDate(d.date_constat)}</span>
                  {d.date_echeance && (
                    <PastilleEcheance jours={joursAvantEcheance(d.date_echeance)} />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-center text-xs text-ink-soft">
        Vos dossiers se mettent à jour tout seuls, sans rechargement de page.
      </p>
    </div>
  );
}
