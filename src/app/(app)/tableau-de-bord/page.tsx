import type { Metadata } from "next";
import Link from "next/link";
import { listerDossiers, lireProfil, lireAlertesNonVues, analyserDossier } from "@/lib/dossiers";
import { formatMontant, prochaineAction, type Dossier, type ProchaineAction } from "@/lib/dossiers-format";
import { planById, contestationsRestantes } from "@/lib/plans";
import { completudeProfil } from "@/lib/contestation";
import { LinkBtn, SectionApp } from "@/components/ui";
import { CarteDossier, CompteARebours, FriseProcedure, nomDossier } from "@/components/dossier-ui";
import { AlerteReglementaire } from "@/components/AlerteReglementaire";
import { RafraichirEnTempsReel } from "@/components/RafraichirEnTempsReel";
import { RechercheRapide } from "@/components/app/RechercheRapide";
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

export const metadata: Metadata = { title: "Accueil" };
export const dynamic = "force-dynamic";

const RANG_TON: Record<ProchaineAction["ton"], number> = { urgent: 0, attention: 1, neutre: 2, termine: 3 };

/** Les dossiers dans l'ordre où il faut s'en occuper. */
function parUrgence(a: { action: ProchaineAction }, b: { action: ProchaineAction }) {
  const ton = RANG_TON[a.action.ton] - RANG_TON[b.action.ton];
  if (ton !== 0) return ton;
  return (a.action.jours ?? 9999) - (b.action.jours ?? 9999);
}

export default async function Accueil() {
  const [dossiers, profil, alertes] = await Promise.all([listerDossiers(), lireProfil(), lireAlertesNonVues()]);

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
      ? "Un courrier à contester ? Commencez par le photographier."
      : urgentes > 0
        ? `${urgentes} dossier${urgentes > 1 ? "s demandent" : " demande"} votre attention aujourd'hui.`
        : enCours.length > 0
          ? "Rien d'urgent. Voici où en sont vos dossiers."
          : "Tous vos dossiers sont terminés. Rien à faire.";

  const [premier, ...autres] = enCours;
  const aujourdhui = new Date().toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <RafraichirEnTempsReel />
      {alertes.map((a) => (
        <AlerteReglementaire key={a.id} alerte={a} />
      ))}

      <header className="animate-rise">
        <p className="text-sm font-medium text-ink-soft first-letter:uppercase">{aujourdhui}</p>
        <h1 className="mt-1 font-display text-[2rem] font-extrabold leading-tight text-navy-900 sm:text-4xl">
          {prenom ? `Bonjour ${prenom}` : "Bonjour"}
        </h1>
        <p className="mt-1.5 text-[1.05rem] text-ink-soft">{resume}</p>
      </header>

      {dossiers.length === 0 ? (
        <PremierPas />
      ) : (
        <>
          {premier ? (
            <CartePriorite dossier={premier.dossier} action={premier.action} />
          ) : (
            <div className="mt-6 rounded-[var(--radius-carte)] border border-ok-600/30 bg-ok-50 p-6">
              <p className="font-display text-lg font-bold text-ok-700">Aucun dossier en cours</p>
              <p className="mt-1 text-sm text-ink-soft">Un nouveau courrier ? Scannez-le : l&apos;analyse prend une minute.</p>
            </div>
          )}

          <dl className="mt-5 grid grid-cols-3 gap-3">
            <Chiffre valeur={String(enCours.length)} libelle="en cours" />
            <Chiffre valeur={formatMontant(montantEnJeu)} libelle="en jeu" />
            <Chiffre valeur={gagnes.length > 0 ? formatMontant(montantGagne) : "0"} libelle={gagnes.length > 0 ? "économisés" : "gagné"} accent={gagnes.length > 0} />
          </dl>

          {autres.length > 0 && (
            <SectionApp
              titre="Vos autres dossiers"
              action={
                <Link href="/tableau-de-bord/dossiers" className="text-sm font-bold text-navy-700 hover:text-navy-900">
                  Tout voir →
                </Link>
              }
            >
              <ul className="grid grid-cols-1 gap-3">
                {autres.slice(0, 3).map((s) => (
                  <li key={s.dossier.id}>
                    <CarteDossier dossier={s.dossier} action={s.action} />
                  </li>
                ))}
              </ul>
            </SectionApp>
          )}
        </>
      )}

      <div className="mt-9 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
              <IconeBulle className="h-7 w-7" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-navy-900">Une question ?</h2>
              <p className="text-sm text-ink-soft">La réponse vient de notre base de savoir.</p>
            </div>
          </div>
          <RechercheRapide />
        </section>

        {plan.id === "gratuit" ? (
          <section className="relative overflow-hidden rounded-[var(--radius-carte)] bg-navy-900 p-5 text-white shadow-carte sm:p-6">
            <div className="motif-points absolute inset-0" aria-hidden="true" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-400">Adhésion</p>
              <h2 className="mt-2 font-display text-xl font-bold">
                {restantes && restantes > 0
                  ? `Encore ${restantes} dossier${restantes > 1 ? "s" : ""} offert${restantes > 1 ? "s" : ""}`
                  : "Vos dossiers offerts sont utilisés"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-100">
                Membre de l&apos;association : dossiers illimités, relecture par nos bénévoles, alertes quand la
                règle change. Une redevance évitée rembourse souvent l&apos;année.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <LinkBtn href="/adherer" variant="gold">
                  Adhérer — 70 € / an
                </LinkBtn>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-100 text-navy-900">
                <IconeSceau className="h-7 w-7" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-navy-900">
                  {plan.id === "membre" ? "Vous êtes membre" : `Membre — formule ${plan.nom}`}
                </h2>
                <p className="text-sm text-ink-soft">Dossiers illimités. Merci de soutenir l&apos;association.</p>
              </div>
            </div>
          </section>
        )}
      </div>

      {profilIncomplet && (
        <Link
          href="/tableau-de-bord/compte"
          className="group mt-4 flex items-center gap-4 rounded-[var(--radius-carte)] border border-gold-300 bg-gold-50 p-5 transition hover:border-gold-500"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-navy-900">
            <IconePersonne className="h-7 w-7" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-navy-900">Complétez vos coordonnées, une seule fois</span>
            <span className="block text-sm text-ink-soft">
              Votre nom et votre adresse s&apos;inscrivent alors tout seuls dans chaque lettre.
            </span>
          </span>
          <IconeFleche className="h-5 w-5 shrink-0 text-navy-700 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function Chiffre({ valeur, libelle, accent = false }: { valeur: string; libelle: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3.5 sm:p-4 ${accent ? "border-ok-600/30 bg-ok-50" : "border-line/80 bg-card"}`}>
      <dd className={`truncate font-display text-xl font-extrabold sm:text-2xl ${accent ? "text-ok-700" : "text-navy-900"}`}>
        {valeur}
      </dd>
      <dt className="text-xs font-medium text-ink-soft">{libelle}</dt>
    </div>
  );
}

/** Le dossier qui passe avant tous les autres, en grand. */
function CartePriorite({ dossier, action }: { dossier: Dossier; action: ProchaineAction }) {
  const urgent = action.ton === "urgent";
  return (
    <section
      aria-label="À faire en priorité"
      className="animate-rise relative mt-6 overflow-hidden rounded-[1.75rem] bg-navy-900 text-white shadow-flotte"
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
      texte: "Ou déposez le PDF. Le moteur lit les dates, le montant, la plaque.",
    },
    {
      Icone: IconeBalance,
      titre: "Répondez à trois questions",
      texte: "Ce que le courrier ne dit pas : aviez-vous payé ? la voiture était-elle à vous ?",
    },
    {
      Icone: IconeLettre,
      titre: "Envoyez votre lettre",
      texte: "Rédigée pour votre cas, avec le délai à tenir et la marche à suivre.",
    },
  ];
  return (
    <section className="animate-rise relative mt-6 overflow-hidden rounded-[1.75rem] bg-navy-900 text-white shadow-flotte">
      <div className="motif-points absolute inset-0" aria-hidden="true" />
      <div className="motif-marquage h-1.5" aria-hidden="true" />
      <div className="relative p-6 sm:p-9">
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
