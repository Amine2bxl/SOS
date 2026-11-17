import Link from "next/link";
import { analyserDossier } from "@/lib/dossiers";
import type { Alerte, Profil } from "@/lib/dossiers-format";
import { formatMontant, prochaineAction, type Dossier, type ProchaineAction } from "@/lib/dossiers-format";
import { planById, contestationsRestantes } from "@/lib/plans";
import { completudeProfil } from "@/lib/contestation";
import { LinkBtn, SectionApp } from "@/components/ui";
import { CarteDossier, CompteARebours, FriseProcedure, nomDossier } from "@/components/dossier-ui";
import { AlerteReglementaire } from "@/components/AlerteReglementaire";
import { RafraichirEnTempsReel } from "@/components/RafraichirEnTempsReel";
import { RechercheRapide } from "@/components/app/RechercheRapide";
import { TYPES_EVENEMENT, evenementsDuDossier } from "@/lib/agenda";
import {
  IconeBalance,
  IconeBulle,
  IconeCadenas,
  IconeFleche,
  IconeLettre,
  IconePersonne,
  IconeScanDoc,
  IconeSceau,
} from "@/components/icones";


const RANG_TON: Record<ProchaineAction["ton"], number> = { urgent: 0, attention: 1, neutre: 2, termine: 3 };

/** Les dossiers dans l'ordre où il faut s'en occuper. */
function parUrgence(a: { action: ProchaineAction }, b: { action: ProchaineAction }) {
  const ton = RANG_TON[a.action.ton] - RANG_TON[b.action.ton];
  if (ton !== 0) return ton;
  return (a.action.jours ?? 9999) - (b.action.jours ?? 9999);
}

/** L'accueil de l'espace membre, mis en page à partir des données déjà chargées. */
export function VueAccueil({ dossiers, profil, alertes }: { dossiers: Dossier[]; profil: Profil | null; alertes: Alerte[] }) {

  const suivis = dossiers
    .map((d) => {
      const analyse = analyserDossier(d);
      return { dossier: d, analyse, action: prochaineAction(d, analyse.delai) };
    })
    .sort(parUrgence);

  const enCours = suivis.filter((s) => s.action.ton !== "termine");
  const gagnes = dossiers.filter((d) => d.statut === "accepte");
  const montantEnJeu = enCours.reduce((t, s) => t + (s.dossier.montant ?? 0), 0);
  const montantGagne = gagnes.reduce((t, d) => t + (d.montant ?? 0), 0);

  const plan = planById(profil?.plan);
  const restantes = contestationsRestantes(profil?.plan, dossiers.length);
  const profilIncomplet = !completudeProfil(profil).complet;
  const prenom = profil?.prenom?.trim();

  const urgentes = enCours.filter((s) => s.action.ton === "urgent").length;
  const resume =
    dossiers.length === 0
      ? "Une lettre reçue ? Prenez-la en photo."
      : urgentes > 0
        ? `${urgentes} dossier${urgentes > 1 ? "s demandent" : " demande"} votre attention aujourd'hui.`
        : enCours.length > 0
          ? "Rien d'urgent. Voici où en sont vos dossiers."
          : "Tous vos dossiers sont terminés. Rien à faire.";

  const [premier, ...autres] = enCours;
  const aujourdhui = new Date().toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
  const jourIso = new Date().toISOString().slice(0, 10);

  // Les prochaines dates de tous les dossiers, comme dans l'agenda.
  const prochainesDates = suivis
    .flatMap(({ dossier: d, analyse }) =>
      evenementsDuDossier(
        {
          id: d.id,
          nom: nomDossier(d),
          statut: d.statut,
          date_constat: d.date_constat,
          date_echeance: d.date_echeance,
          date_envoi_contestation: d.date_envoi_contestation,
          accuse_reception_le: (d as { accuse_reception_le?: string | null }).accuse_reception_le ?? null,
        },
        { date: analyse.delai.limite, nature: analyse.delai.nature },
      ),
    )
    .filter((e) => e.date >= jourIso && e.type !== "constat")
    .sort((x, y) => x.date.localeCompare(y.date))
    .slice(0, 4);
  const jourCourt = (iso: string) =>
    new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <RafraichirEnTempsReel />
      {alertes.map((a) => (
        <AlerteReglementaire key={a.id} alerte={a} />
      ))}

      <header className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-soft first-letter:uppercase">{aujourdhui}</p>
          <h1 className="mt-1 font-display text-[2rem] font-extrabold leading-tight text-navy-900 sm:text-4xl">
            {prenom ? `Bonjour ${prenom}` : "Bonjour"}
          </h1>
          <p className="mt-1.5 text-[1.05rem] text-ink-soft">{resume}</p>
        </div>
      </header>

      {/* Deux colonnes sur ordinateur : vos dossiers à gauche, l'essentiel à droite. */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          {dossiers.length === 0 ? (
            <PremierPas />
          ) : premier ? (
            <CartePriorite dossier={premier.dossier} action={premier.action} />
          ) : (
            <div className="rounded-[var(--radius-carte)] border border-ok-600/30 bg-ok-50 p-6">
              <p className="font-display text-lg font-bold text-ok-700">Aucun dossier en cours</p>
              <p className="mt-1 text-sm text-ink-soft">Une nouvelle lettre ? Prenez-la en photo. Une minute suffit.</p>
            </div>
          )}

          {autres.length > 0 && (
            <SectionApp
              titre="Vos autres dossiers"
              action={
                <Link href="/tableau-de-bord/dossiers" className="text-sm font-bold text-navy-700 hover:text-navy-900">
                  Tout voir →
                </Link>
              }
            >
              <ul className={`grid grid-cols-1 gap-3 ${autres.length > 1 ? "xl:grid-cols-2" : ""}`}>
                {autres.slice(0, 4).map((s) => (
                  <li key={s.dossier.id}>
                    <CarteDossier dossier={s.dossier} action={s.action} />
                  </li>
                ))}
              </ul>
            </SectionApp>
          )}

          <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
                <IconeBulle className="h-7 w-7" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-navy-900">Une question ?</h2>
                <p className="text-sm text-ink-soft">Posez votre question en quelques mots.</p>
              </div>
            </div>
            <RechercheRapide />
          </section>
        </div>

        <aside className="space-y-4">
          {dossiers.length > 0 && (
            <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-line lg:rounded-[var(--radius-carte)] lg:border lg:border-line/80 lg:bg-card lg:shadow-carte">
              <Chiffre valeur={String(enCours.length)} libelle="dossiers en cours" />
              <Chiffre valeur={formatMontant(montantEnJeu)} libelle="en jeu" />
              <Chiffre valeur={gagnes.length > 0 ? formatMontant(montantGagne) : "0 €"} libelle={gagnes.length > 0 ? "économisés" : "économisés jusqu'ici"} accent={gagnes.length > 0} />
            </dl>
          )}

          <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-navy-900">Prochaines dates</h2>
              <Link href="/tableau-de-bord/agenda" className="text-sm font-bold text-navy-700 hover:text-navy-900">
                Agenda →
              </Link>
            </div>
            {prochainesDates.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Aucune date à surveiller. Tout est en ordre.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {prochainesDates.map((e) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="w-14 shrink-0 rounded-lg bg-paper py-1 text-center text-xs font-bold tabular-nums text-navy-900">
                      {jourCourt(e.date)}
                    </span>
                    <span className="min-w-0">
                      <Link href={e.lien ?? "/tableau-de-bord/agenda"} className="block truncate text-sm font-semibold text-navy-900 hover:underline">
                        {e.titre}
                      </Link>
                      <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                        <span className={`h-1.5 w-1.5 rounded-full ${TYPES_EVENEMENT[e.type].point}`} aria-hidden="true" />
                        {TYPES_EVENEMENT[e.type].libelle}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {plan.id === "gratuit" ? (
            <section className="relative overflow-hidden rounded-[var(--radius-carte)] bg-navy-900 p-5 text-white shadow-carte">
              <div className="motif-points absolute inset-0" aria-hidden="true" />
              <div className="relative">
                <h2 className="font-display text-lg font-bold">
                  {restantes && restantes > 0
                    ? `Encore ${restantes} dossier${restantes > 1 ? "s" : ""} offert${restantes > 1 ? "s" : ""}`
                    : "Vos dossiers offerts sont utilisés"}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-100">
                  Membre : dossiers illimités, relecture par nos bénévoles, alertes quand la règle change.
                </p>
                <LinkBtn href="/adherer" variant="gold" className="mt-4 w-full">
                  Adhérer — 70 € / an
                </LinkBtn>
              </div>
            </section>
          ) : (
            <section className="flex items-center gap-3 rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-navy-900">
                <IconeSceau className="h-7 w-7" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-navy-900">
                  {plan.id === "membre" ? "Vous êtes membre" : `Formule ${plan.nom}`}
                </h2>
                <p className="text-sm text-ink-soft">Dossiers illimités. Merci !</p>
              </div>
            </section>
          )}

          {profilIncomplet && (
            <Link
              href="/tableau-de-bord/compte"
              className="group flex items-center gap-3 rounded-[var(--radius-carte)] border border-gold-300 bg-gold-50 p-4 transition hover:border-gold-500"
            >
              <IconePersonne className="h-7 w-7 shrink-0 text-navy-900" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-navy-900">Complétez vos coordonnées</span>
                <span className="block text-xs text-ink-soft">Elles s&apos;inscrivent seules dans chaque lettre.</span>
              </span>
              <IconeFleche className="h-5 w-5 shrink-0 text-navy-700 transition group-hover:translate-x-0.5" />
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

function Chiffre({ valeur, libelle, accent = false }: { valeur: string; libelle: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-3.5 lg:flex lg:items-baseline lg:justify-between lg:gap-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-5 lg:py-3.5 ${
        accent ? "border-ok-600/30 bg-ok-50" : "border-line/80 bg-card"
      }`}
    >
      <dd className={`truncate font-display text-xl font-extrabold tabular-nums sm:text-2xl lg:order-2 lg:text-xl ${accent ? "text-ok-700" : "text-navy-900"}`}>
        {valeur}
      </dd>
      <dt className="text-xs font-medium text-ink-soft lg:text-sm">{libelle}</dt>
    </div>
  );
}

/** Le dossier qui passe avant tous les autres, en grand. */
function CartePriorite({ dossier, action }: { dossier: Dossier; action: ProchaineAction }) {
  const urgent = action.ton === "urgent";
  return (
    <section
      aria-label="À faire en priorité"
      className="animate-rise relative overflow-hidden rounded-[1.75rem] bg-navy-900 text-white shadow-flotte"
    >
      <div className="motif-points absolute inset-0" aria-hidden="true" />
      <div className={`h-1.5 ${urgent ? "bg-danger-600" : "motif-marquage"}`} aria-hidden="true" />
      <div className="relative grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
        <div className="min-w-0">
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${urgent ? "text-danger-100" : "text-gold-400"}`}>
            {urgent ? "Urgent" : "À faire maintenant"} · {nomDossier(dossier)}
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{action.action}</h2>
          <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-navy-100">{action.raison}</p>
          <div className="mt-5 max-w-md">
            <FriseProcedure stade={dossier.type_document} surFonce />
          </div>
          <div className="mt-6">
            <LinkBtn href={action.lien} variant="gold" taille="lg">
              {action.libelleLien}
              <IconeFleche className="h-5 w-5" />
            </LinkBtn>
          </div>
        </div>
        {action.jours !== null && (
          <div className="hidden sm:block">
            <CompteARebours jours={action.jours} taille="lg" surFonce />
          </div>
        )}
      </div>
    </section>
  );
}

/** Le tout premier écran : trois gestes, une seule action. */
function PremierPas() {
  const gestes = [
    {
      Icone: IconeScanDoc,
      titre: "Photographiez votre courrier",
      texte: "Ou ajoutez le PDF. Rien à recopier.",
    },
    {
      Icone: IconeBalance,
      titre: "Répondez à trois questions",
      texte: "2 ou 3 questions simples : aviez-vous payé ? C'était votre voiture ?",
    },
    {
      Icone: IconeLettre,
      titre: "Envoyez votre lettre",
      texte: "Prête à envoyer, avec la date limite.",
    },
  ];
  return (
    <section className="animate-rise relative overflow-hidden rounded-[1.75rem] bg-navy-900 text-white shadow-flotte">
      <div className="motif-points absolute inset-0" aria-hidden="true" />
      <div className="motif-marquage h-1.5" aria-hidden="true" />
      <div className="relative p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-400">Votre premier dossier</p>
        <h2 className="mt-2 max-w-xl font-display text-[1.7rem] font-extrabold leading-tight sm:text-4xl">
          Trois gestes, et votre contestation est prête.
        </h2>
        <ol className="mt-7 grid gap-4 sm:grid-cols-3">
          {gestes.map(({ Icone, titre, texte }, i) => (
            <li key={titre} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-navy-900">
                  <Icone className="h-7 w-7" />
                </span>
                <span className="font-display text-sm font-bold text-gold-400">{i + 1}</span>
              </div>
              <p className="mt-3 font-bold">{titre}</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-100">{texte}</p>
            </li>
          ))}
        </ol>
        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
          <LinkBtn href="/tableau-de-bord/nouveau" variant="gold" taille="lg">
            <IconeScanDoc className="h-6 w-6 [--icone-accent:transparent]" />
            Scanner mon courrier
          </LinkBtn>
          <p className="flex items-center gap-2 text-sm text-navy-100">
            <IconeCadenas className="h-5 w-5 shrink-0 text-white [--icone-accent:transparent]" />
            Votre document est lu sur votre appareil.
          </p>
        </div>
      </div>
    </section>
  );
}
