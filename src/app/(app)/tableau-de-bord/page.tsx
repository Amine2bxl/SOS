import type { Metadata } from "next";
import Link from "next/link";
import { listerDossiers, lireProfil, lireAlertesNonVues } from "@/lib/dossiers";
import {
  TYPES_DOCUMENT,
  joursAvantEcheance,
  formatMontant,
  formatDate,
  prochaineAction,
  type Dossier,
  type ProchaineAction,
} from "@/lib/dossiers-format";
import { planById, contestationsRestantes } from "@/lib/plans";
import { LinkBtn, Card, Stat, SectionApp, EtatVide, CarteModule, BarreProgression } from "@/components/ui";
import { BadgeStatut, PastilleEcheance } from "@/components/dossier-ui";
import { AlerteReglementaire } from "@/components/AlerteReglementaire";
import { RafraichirEnTempsReel } from "@/components/RafraichirEnTempsReel";
import { IconeModule } from "@/components/app/IconeModule";
import { MODULES_DOSSIERS, MODULES_OUTILS } from "@/components/app/modules";

export const metadata: Metadata = { title: "Mon tableau de bord" };
export const dynamic = "force-dynamic";

const TONS_ACTION: Record<ProchaineAction["ton"], string> = {
  urgent: "border-danger-600/40 bg-danger-100 text-danger-700",
  attention: "border-warn-600/40 bg-warn-100 text-warn-700",
  neutre: "border-navy-600/25 bg-navy-50 text-navy-700",
  termine: "border-ok-600/40 bg-ok-100 text-ok-700",
};

/** Une ligne de dossier : l'identité à gauche, la prochaine action à droite. */
function LigneDossier({ dossier }: { dossier: Dossier }) {
  const suite = prochaineAction(dossier);
  const jours = joursAvantEcheance(dossier.date_echeance);

  return (
    <li className="overflow-hidden rounded-xl border border-line bg-card shadow-sm transition hover:border-navy-600/40 hover:shadow-md">
      <Link href={`/tableau-de-bord/${dossier.id}`} className="block p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display font-bold text-navy-900">
              {dossier.reference ?? "Dossier sans référence"}
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">
              {TYPES_DOCUMENT[dossier.type_document] ?? dossier.type_document}
              {dossier.commune && ` — ${dossier.commune}`}
            </p>
          </div>
          <BadgeStatut statut={dossier.statut} />
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-soft">
          <span className="font-bold text-navy-900">{formatMontant(dossier.montant)}</span>
          {dossier.plaque && <span>{dossier.plaque}</span>}
          <span>Constat&nbsp;: {formatDate(dossier.date_constat)}</span>
          {dossier.date_echeance && <PastilleEcheance jours={jours} />}
        </div>
      </Link>

      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 ${TONS_ACTION[suite.ton]}`}
      >
        <p className="text-sm">
          <span className="font-bold">{suite.action}</span>
          <span className="ml-1.5 opacity-80">{suite.raison}</span>
        </p>
        <Link
          href={suite.lien}
          className="shrink-0 whitespace-nowrap rounded-md bg-white/70 px-3 py-1.5 text-xs font-bold underline-offset-2 transition hover:bg-white hover:underline"
        >
          {suite.libelleLien} →
        </Link>
      </div>
    </li>
  );
}

export default async function TableauDeBordPage() {
  const [dossiers, profil, alertes] = await Promise.all([
    listerDossiers(),
    lireProfil(),
    lireAlertesNonVues(),
  ]);

  const plan = planById(profil?.plan);
  const restantes = contestationsRestantes(profil?.plan, dossiers.length);

  const enCours = dossiers.filter((d) => !["accepte", "rejete", "clos"].includes(d.statut));
  const totalEnJeu = enCours.reduce((s, d) => s + (d.montant ?? 0), 0);
  const gagnes = dossiers.filter((d) => d.statut === "accepte");

  // Ce qui presse : délai dépassé ou dans la semaine, contestation non partie.
  const urgents = enCours
    .filter((d) => {
      const j = joursAvantEcheance(d.date_echeance);
      return j !== null && j <= 7 && !["contestation_envoyee", "en_attente_reponse"].includes(d.statut);
    })
    .sort((a, b) => (a.date_echeance! < b.date_echeance! ? -1 : 1));

  const echeances = enCours
    .filter((d) => d.date_echeance)
    .sort((a, b) => (a.date_echeance! < b.date_echeance! ? -1 : 1))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <RafraichirEnTempsReel />

      {alertes.length > 0 && <AlerteReglementaire alerte={alertes[0]} />}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-navy-900">
            Bonjour{profil?.prenom ? ` ${profil.prenom}` : ""}
          </h2>
          <p className="mt-1 text-ink-soft">
            {enCours.length === 0
              ? "Aucun dossier en cours. Vous êtes à jour."
              : urgents.length > 0
                ? `${urgents.length} dossier${urgents.length > 1 ? "s demandent" : " demande"} votre attention aujourd'hui.`
                : `${enCours.length} dossier${enCours.length > 1 ? "s" : ""} en cours, aucune échéance serrée.`}
          </p>
        </div>
        <LinkBtn href="/tableau-de-bord/nouveau" variant="gold">
          + Scanner un courrier
        </LinkBtn>
      </div>

      {/* CE QUI PRESSE — toujours en premier, jamais noyé dans le reste. */}
      {urgents.length > 0 && (
        <div className="mt-6 rounded-xl border-2 border-danger-600/40 bg-danger-100 p-5">
          <p className="font-display font-bold text-danger-700">
            {urgents.length === 1
              ? "1 dossier arrive à échéance"
              : `${urgents.length} dossiers arrivent à échéance`}
          </p>
          <ul className="mt-2.5 space-y-1.5 text-sm text-ink">
            {urgents.map((d) => {
              const j = joursAvantEcheance(d.date_echeance)!;
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-x-2">
                  <Link href={`/tableau-de-bord/${d.id}`} className="font-semibold underline">
                    {d.reference ?? "Dossier sans référence"}
                  </Link>
                  <span>
                    —{" "}
                    {j < 0
                      ? `échéance dépassée depuis ${-j} jour${-j > 1 ? "s" : ""}`
                      : j === 0
                        ? "échéance aujourd'hui"
                        : `dans ${j} jour${j > 1 ? "s" : ""}`}
                  </span>
                  <Link
                    href={prochaineAction(d).lien}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-danger-700"
                  >
                    {prochaineAction(d).libelleLien} →
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* CHIFFRES CLÉS */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat valeur={String(enCours.length)} label="dossiers en cours" detail="Contestations non clôturées" />
        <Stat valeur={formatMontant(totalEnJeu)} label="montant en jeu" detail="Total réclamé sur ces dossiers" />
        <Stat
          valeur={String(gagnes.length)}
          label={`contestation${gagnes.length > 1 ? "s" : ""} acceptée${gagnes.length > 1 ? "s" : ""}`}
          detail="Dossiers clos en votre faveur"
        />
        <Stat
          valeur={restantes === null ? "∞" : String(restantes)}
          label="contestations restantes"
          detail={`Formule ${plan.nom}`}
        />
      </div>

      {/* PROCHAINES ÉCHÉANCES + FORMULE */}
      {(echeances.length > 0 || restantes !== null) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card title="Vos prochaines échéances" subtitle="Les dates qui ne se rattrapent pas.">
            {echeances.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Aucune date limite enregistrée sur vos dossiers en cours.
              </p>
            ) : (
              <ol className="space-y-3">
                {echeances.map((d) => {
                  const j = joursAvantEcheance(d.date_echeance);
                  return (
                    <li key={d.id} className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          j !== null && j <= 7 ? "bg-danger-600" : j !== null && j <= 21 ? "bg-warn-600" : "bg-ok-600"
                        }`}
                        aria-hidden="true"
                      />
                      <Link
                        href={`/tableau-de-bord/${d.id}`}
                        className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-900 hover:underline"
                      >
                        {d.reference ?? "Dossier sans référence"}
                      </Link>
                      <span className="shrink-0 text-xs text-ink-soft">{formatDate(d.date_echeance)}</span>
                      <PastilleEcheance jours={j} />
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card title={`Formule ${plan.nom}`} subtitle={plan.pour}>
            {restantes === null ? (
              <p className="text-sm leading-relaxed text-ink-soft">
                Contestations illimitées : ouvrez autant de dossiers que nécessaire.
              </p>
            ) : (
              <>
                <BarreProgression
                  utilise={Math.min(dossiers.length, plan.quotaContestations ?? 0)}
                  total={plan.quotaContestations ?? 0}
                  label="Contestations utilisées"
                />
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {restantes === 0 ? (
                    <>
                      Quota épuisé. Vos dossiers restent suivis ; l&apos;adhésion ouvre les
                      contestations illimitées et la relecture de vos lettres.
                    </>
                  ) : (
                    <>
                      Il vous reste {restantes} contestation{restantes > 1 ? "s" : ""} gratuite
                      {restantes > 1 ? "s" : ""}. Le téléphone et l&apos;aide écrite restent gratuits
                      sans limite.
                    </>
                  )}
                </p>
              </>
            )}
            <LinkBtn
              href={plan.id === "gratuit" ? "/tarifs" : "/tableau-de-bord/abonnement"}
              variant={plan.id === "gratuit" ? "gold" : "secondary"}
              className="mt-4"
            >
              {plan.id === "gratuit" ? "Voir les formules d'adhésion" : "Gérer mon abonnement"}
            </LinkBtn>
          </Card>
        </div>
      )}

      {/* MES DOSSIERS */}
      <SectionApp
        titre="Mes dossiers"
        intro="Chaque dossier vous dit ce qu'il attend de vous."
        action={
          dossiers.length > 0 ? (
            <LinkBtn href="/tableau-de-bord/nouveau" variant="secondary">
              Ajouter un dossier
            </LinkBtn>
          ) : undefined
        }
      >
        {dossiers.length === 0 ? (
          <EtatVide
            titre="Votre premier dossier commence ici"
            texte="Prenez votre courrier en photo ou collez une capture d'écran. Nous en extrayons la référence, le montant et la date limite ; vous n'avez plus qu'à vérifier."
          >
            <LinkBtn href="/tableau-de-bord/nouveau" variant="gold">
              Scanner mon document
            </LinkBtn>
            <LinkBtn href="/comprendre" variant="secondary">
              D&apos;abord comprendre mon courrier
            </LinkBtn>
          </EtatVide>
        ) : (
          <ul className="space-y-3">
            {dossiers.map((d) => (
              <LigneDossier key={d.id} dossier={d} />
            ))}
          </ul>
        )}
      </SectionApp>

      {/* LES MODULES — à quoi sert quoi, sans avoir à cliquer. */}
      <SectionApp
        titre="Vos modules"
        intro="Chaque module fait une chose précise. Voici laquelle."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...MODULES_DOSSIERS.slice(1), ...MODULES_OUTILS].map((m) => (
            <CarteModule
              key={m.href}
              href={m.href}
              titre={m.titre}
              phrase={m.phrase}
              cta="Ouvrir"
              icone={<IconeModule nom={m.icone} className="h-5 w-5" />}
            />
          ))}
        </div>
      </SectionApp>

      <p className="mt-8 text-center text-xs text-ink-soft">
        Vos dossiers se mettent à jour tout seuls, sans rechargement de page.
      </p>
    </div>
  );
}
