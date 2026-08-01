import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { dossiers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { computeAudit } from "@/lib/audit";
import { labelOf, NATURES, formatMontant, formatDate } from "@/lib/constants";
import { SectionCard, LinkBtn, StatusBadge } from "@/components/ui";
import { HeartIcon } from "@/components/Logo";

export const dynamic = "force-dynamic";

const VERIFIE = [
  "La nature du document reçu",
  "La commune et l'opérateur compétents",
  "La chronologie du dossier",
  "Les notifications et rappels",
  "Les délais à contrôler",
  "Les montants et frais réclamés",
  "Les photographies et éléments techniques",
  "Les titres de stationnement ou autorisations",
  "Les réponses déjà adressées par l'administration",
  "Les documents encore manquants",
];

const APPRENDRE = [
  "Comment fonctionne une zone payante",
  "Ce qu'est une ScanCar et comment une plaque est contrôlée",
  "Ce que signifie l'absence de titre de stationnement",
  "Comment distinguer notification, rappel et mise en demeure",
  "Quelles preuves conserver et comment les présenter",
  "Comment présenter les faits chronologiquement",
  "Comment demander les pièces d'une décision",
  "Comment conserver une preuve de votre démarche",
];

const STEPS = [
  ["Créez votre dossier", "Répondez à quelques questions et indiquez la nature de votre dossier."],
  ["Déposez vos documents", "Importez courriers, preuves, captures, tickets, photographies."],
  ["Analyse automatique", "Le moteur vérifie les délais, la procédure, les preuves et les montants."],
  ["Audit juridique complet", "Identification des irrégularités, des points forts et des risques."],
  ["Génération de courriers", "Obtenez vos courriers personnalisés prêts à être envoyés."],
  ["Suivi et réponses", "Suivez les réponses, relances et suites de votre dossier."],
];

export default async function HomePage() {
  const [latest] = await db.select().from(dossiers).orderBy(desc(dossiers.updatedAt)).limit(1);
  const audit = latest ? computeAudit(latest) : null;

  return (
    <div>
      {/* HERO */}
      <section className="bg-navy-950 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div className="animate-rise">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
              Plateforme citoyenne — Région de Bruxelles-Capitale
            </p>
            <h1 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Comprenez votre redevance. Vérifiez votre dossier.{" "}
              <span className="text-gold-400">Défendez vos droits.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-navy-100/90">
              La plateforme citoyenne de SOS Citizens ASBL vous accompagne dans l'analyse des redevances de
              stationnement. Elle vous aide à comprendre les règles applicables, à reconstituer la procédure,
              à identifier les documents manquants et à préparer une démarche claire, documentée et adaptée à
              votre situation.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkBtn href="/analyser" variant="gold" className="px-6 py-3 text-base">
                Analyser mon dossier
              </LinkBtn>
              <LinkBtn href="/comprendre" variant="secondary" className="border-navy-700 bg-transparent text-white hover:bg-navy-800 px-6 py-3 text-base">
                Comprendre avant de contester
              </LinkBtn>
              <LinkBtn href="/communes" variant="ghost" className="text-navy-100 hover:bg-navy-800 px-4 py-3">
                Les règles de ma commune →
              </LinkBtn>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-navy-100 sm:grid-cols-2">
              {["Analyse complète de votre dossier", "Vérification des délais et de la procédure", "Génération de courriers personnalisés", "Demande de pièces et suspension du recouvrement"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-ok-600" fill="currentColor"><path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.7 7.7-5.4 6a1 1 0 0 1-1.5 0l-2.5-2.8a1 1 0 1 1 1.5-1.3l1.7 2 4.7-5.2a1 1 0 0 1 1.5 1.3Z"/></svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <Image
              src="/images/hero-devices.png"
              alt="Aperçu de la plateforme SOS Citizens sur ordinateur et téléphone"
              width={1200}
              height={900}
              className="w-full drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* FONCTIONNEMENT + MON DOSSIER */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
        <SectionCard title="Comment ça fonctionne ?" subtitle="Six étapes simples pour reprendre le contrôle de votre dossier.">
          <ol className="space-y-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="flex gap-3.5 rounded-lg border border-line-soft bg-white p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-bold text-gold-300">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-navy-900">{t}</p>
                  <p className="mt-0.5 text-[13px] text-ink-soft">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Mon dossier" subtitle="Tableau de bord de votre dernière analyse.">
          {latest && audit ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-ok-100 px-3 py-1 text-xs font-bold text-ok-700">
                  Dossier actif — {latest.ref}
                </span>
                <Link href={`/dossiers/${latest.id}`} className="text-sm font-semibold text-navy-700 hover:underline">
                  Ouvrir →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-paper p-3"><p className="text-xs text-ink-soft">Nature</p><p className="font-semibold">{labelOf(NATURES, latest.natureDossier)}</p></div>
                <div className="rounded-lg bg-paper p-3"><p className="text-xs text-ink-soft">Commune du constat</p><p className="font-semibold">{latest.communeConstat || "—"}</p></div>
                <div className="rounded-lg bg-paper p-3"><p className="text-xs text-ink-soft">Montant réclamé</p><p className="font-semibold">{formatMontant(latest.montantReclame)}</p></div>
                <div className="rounded-lg bg-paper p-3"><p className="text-xs text-ink-soft">Constat</p><p className="font-semibold">{formatDate(latest.chronologie?.["date_constat"])}</p></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-ink-soft"><span>Score de l'analyse</span><span>{audit.score}%</span></div>
                <div className="mt-1.5 h-2.5 rounded-full bg-line-soft">
                  <div className="h-2.5 rounded-full bg-navy-700" style={{ width: `${audit.score}%` }} />
                </div>
                <p className="mt-1 text-xs text-ink-soft">{audit.label}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-ok-100 p-2"><p className="font-display text-xl font-bold text-ok-700">{audit.favorables.length}</p><p className="text-[10px] font-semibold text-ok-700">Favorables</p></div>
                <div className="rounded-lg bg-warn-100 p-2"><p className="font-display text-xl font-bold text-warn-700">{audit.aVerifier.length}</p><p className="text-[10px] font-semibold text-warn-700">À vérifier</p></div>
                <div className="rounded-lg bg-danger-100 p-2"><p className="font-display text-xl font-bold text-danger-700">{audit.vigilance.length}</p><p className="text-[10px] font-semibold text-danger-700">Vigilance</p></div>
                <div className="rounded-lg bg-navy-50 p-2"><p className="font-display text-xl font-bold text-navy-700">{(latest.pieces ?? []).length}</p><p className="text-[10px] font-semibold text-navy-700">Pièces</p></div>
              </div>
              <div className="flex items-center justify-between text-xs text-ink-soft">
                <span>Niveau de confiance</span>
                <StatusBadge status={audit.confiance === "A" || audit.confiance === "B" ? "ok" : audit.confiance === "C" ? "partial" : "risk"} />
              </div>
              <p className="text-xs font-semibold text-navy-800">{audit.confianceLabel}</p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <p className="max-w-xs text-sm text-ink-soft">
                Aucun dossier analysé pour l'instant. Lancez votre première analyse : elle est guidée et
                pédagogique, étape par étape.
              </p>
              <LinkBtn href="/analyser" variant="gold" className="mt-5">
                Créer mon dossier
              </LinkBtn>
            </div>
          )}
        </SectionCard>
      </section>

      {/* ENCADRÉ ESSENTIEL */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-xl border-2 border-gold-400 bg-gold-100/60 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-900">Encadré essentiel</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink">
            Une redevance de stationnement n'est pas automatiquement une amende pénale. Le document reçu, la
            commune, la date des faits, le stade de la procédure et les règles locales déterminent les
            démarches à accomplir.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink">
            La plateforme ne promet aucune annulation. Elle vous aide à vérifier votre dossier, à comprendre
            les mécanismes administratifs et à préparer une démarche fondée sur des faits et des pièces.
          </p>
        </div>
      </section>

      {/* CE QUE LA PLATEFORME VÉRIFIE */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy-900">Ce que la plateforme vérifie</h2>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {VERIFIE.map((v) => (
                <li key={v} className="flex items-start gap-2.5 rounded-lg border border-line bg-card p-3 text-sm font-medium text-ink">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="8" /><path d="m6.5 10.5 2.5 2.5 4.5-5.5" /></svg>
                  {v}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-navy-900">Comprendre avant d'agir</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Chaque étape comporte une explication claire. Vous apprendrez notamment :
            </p>
            <ul className="mt-4 space-y-2">
              {APPRENDRE.map((a) => (
                <li key={a} className="flex items-start gap-2.5 text-sm text-ink">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3 BLOCS */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-3">
        <SectionCard title="Des règles qui varient selon le lieu et la date" className="flex flex-col">
          <p className="text-sm leading-relaxed text-ink-soft">
            La Région de Bruxelles-Capitale comprend 19 communes. Le gestionnaire, les zones, les tarifs, les
            cartes, les modalités de contrôle et les procédures peuvent varier. La plateforme identifie la
            commune du constat et présente les informations pertinentes, sous réserve de la version applicable
            à la date des faits.
          </p>
          <div className="mt-auto pt-5">
            <LinkBtn href="/communes" variant="secondary" className="w-full">Consulter les 19 communes</LinkBtn>
          </div>
        </SectionCard>
        <SectionCard title="Actualités, enquêtes et analyses" className="flex flex-col">
          <p className="text-sm leading-relaxed text-ink-soft">
            Retrouvez les articles de presse, rapports publics, communications institutionnelles et analyses
            utiles consacrés au stationnement bruxellois, aux ScanCars, au recouvrement et aux droits des
            usagers.
          </p>
          <div className="mt-auto pt-5">
            <LinkBtn href="/articles" variant="secondary" className="w-full">Voir les articles et la presse</LinkBtn>
          </div>
        </SectionCard>
        <SectionCard title="Aidez-nous à défendre un accès équitable à l'information" className="flex flex-col border-gold-400/60 bg-gold-100/40">
          <p className="text-sm leading-relaxed text-ink-soft">
            L'analyse des dossiers, la veille réglementaire, la rédaction des guides et l'accompagnement des
            citoyens nécessitent du temps et des moyens. Votre soutien contribue au développement d'outils
            accessibles, documentés et indépendants.
          </p>
          <div className="mt-auto pt-5">
            <LinkBtn href="/don" variant="gold" className="w-full">
              <HeartIcon className="h-4 w-4 animate-heartbeat" /> Faites un don
            </LinkBtn>
          </div>
        </SectionCard>
      </section>

      {/* MESSAGE CENTRAL */}
      <section className="bg-navy-900 py-14 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="font-display text-2xl font-bold leading-snug sm:text-3xl">
            « SOS Citizens ASBL ne vous aide pas seulement à rédiger un courrier. La plateforme vous apprend à
            lire votre dossier, à comprendre la procédure, à identifier les preuves et à agir de manière
            documentée. »
          </p>
          <p className="mt-5 text-sm text-navy-100/80">
            Une contestation sérieuse commence par une bonne compréhension des faits, des délais et des règles
            applicables.
          </p>
        </div>
      </section>
    </div>
  );
}
