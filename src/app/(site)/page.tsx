import Link from "next/link";
import { Suspense } from "react";
import { PLANS } from "@/lib/plans";
import { ARTICLES_TRIES, dateParution } from "@/lib/presse";
import { LinkBtn } from "@/components/ui";
import { CarteFormule } from "@/components/formules";
import { BoutonContact } from "@/components/Contact";
import { AssistantScan } from "@/components/scan/AssistantScan";
import { ApercuAnalyse } from "@/components/site/ApercuAnalyse";
import { PhotoArticle } from "@/components/site/PhotoArticle";
import { VideoExplication } from "@/components/site/VideoExplication";
import {
  IconeCadenas,
  IconeChevron,
  IconeFleche,
  IconeHotelDeVille,
  IconeLettre,
  IconeLoupe,
  IconeScanDoc,
} from "@/components/icones";

/** Trois gestes, dans l'ordre où on les fait. */
const ETAPES = [
  { Icone: IconeScanDoc, titre: "Photographiez la lettre", texte: "Ou ajoutez le PDF. Rien à recopier." },
  { Icone: IconeLoupe, titre: "On vérifie tout", texte: "Dates, montant, délai, lieu." },
  { Icone: IconeLettre, titre: "Votre lettre est prête", texte: "En français ou en néerlandais." },
];

const FAQ = [
  {
    q: "C'est vraiment gratuit ?",
    r: "Oui. Vérifier : gratuit, sans compte. 2 dossiers offerts, lettre comprise. Ensuite : 70 € par an.",
  },
  {
    q: "Ma photo part sur internet ?",
    r: "Non. La lettre est lue sur votre téléphone. On garde seulement ce que vous confirmez.",
  },
  {
    q: "Vous garantissez l'annulation ?",
    r: "Non, personne ne peut. On vous dit si votre dossier tient, ou s'il vaut mieux payer.",
  },
  {
    q: "Mon cas est compliqué.",
    r: "Écrivez-nous : un bénévole vous répond par écrit.",
  },
];

export default async function Accueil({ searchParams }: { searchParams: Promise<{ compte?: string }> }) {
  const { compte } = await searchParams;
  const gratuit = PLANS[0];
  const membre = PLANS.find((p) => p.miseEnAvant) ?? PLANS[1];
  const victoires = ARTICLES_TRIES.filter((a) => a.chiffre && a.rubrique === "Redevances").slice(0, 2);
  const journaux = Array.from(new Set(ARTICLES_TRIES.map((a) => a.journal)));

  return (
    <div>
      {compte === "supprime" && (
        <p role="status" className="bg-ok-100 px-4 py-3 text-center text-sm font-semibold text-ok-700">
          Votre compte et vos données ont été supprimés.
        </p>
      )}

      {/* ================================================================ HÉROS */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="motif-points absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:pb-20 lg:pt-16">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-navy-100">
              <IconeHotelDeVille className="h-4 w-4 text-white [--icone-accent:var(--color-gold-400)]" />
              Association bruxelloise · 19 communes
            </p>
            <h1 className="mt-5 font-display text-[2.5rem] font-extrabold leading-[1.03] text-balance sm:text-6xl">
              Une redevance de stationnement&nbsp;?{" "}
              <span className="text-gold-400">Vérifiez si vous devez payer.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-100">
              Une photo de la lettre. En 1 minute : payer ou contester.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkBtn href="#analyser" variant="gold" taille="lg">
                <IconeScanDoc className="h-6 w-6 [--icone-accent:transparent]" />
                Vérifier ma lettre
              </LinkBtn>
              <LinkBtn href="#video" variant="outline" taille="lg">
                Voir la vidéo (1 min)
              </LinkBtn>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm font-semibold text-navy-100" aria-label="En bref">
              {["Gratuit", "Sans compte", "1 minute"].map((x) => (
                <li key={x} className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                  {x}
                </li>
              ))}
              <li className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1">
                <IconeCadenas className="h-4 w-4 shrink-0 text-gold-300 [--icone-accent:transparent]" />
                Photo gardée sur votre téléphone
              </li>
            </ul>
          </div>
          <div className="lg:pl-6">
            <ApercuAnalyse />
          </div>
        </div>
        <div className="motif-marquage h-2" aria-hidden="true" />
      </section>

      {/* ======================================================= PREUVE SOCIALE */}
      <section className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-ink-soft">
            Vu dans <strong className="font-semibold text-navy-900">{journaux.join(" · ")}</strong>
          </p>
          <Link href="/presse" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900">
            33 et 35 redevances annulées : lire les articles
            <IconeFleche className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ============================================================ ANALYSER */}
      <section id="analyser" className="scroll-mt-20 px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">Vérifiez votre lettre</h2>
        </div>
        <div className="mx-auto mt-8 max-w-2xl rounded-[1.75rem] border border-line/80 bg-card p-5 shadow-flotte sm:p-8">
          <Suspense>
            <AssistantScan mode="visiteur" />
          </Suspense>
        </div>
      </section>

      {/* ======================================================= COMMENT */}
      <section id="comment" className="scroll-mt-20 bg-navy-900 py-16 text-white lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Comment ça marche</h2>
            <ol className="mt-8 space-y-6">
              {ETAPES.map(({ Icone, titre, texte }, i) => (
                <li key={titre} className="flex gap-4">
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-navy-900">
                    <Icone className="h-8 w-8" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-navy-950">
                      {i + 1}
                    </span>
                  </span>
                  <span>
                    <span className="block font-display text-lg font-bold">{titre}</span>
                    <span className="mt-0.5 block text-navy-100">{texte}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div id="video" className="scroll-mt-24">
            <h3 className="mb-3 font-display text-xl font-bold text-gold-300">Le système belge en 1 minute</h3>
            <VideoExplication className="[&_figcaption]:text-navy-100" />
          </div>
        </div>
      </section>

      {/* ============================================================ PRESSE */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-2xl font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">
              Des résultats, dans la presse.
            </h2>
            <Link href="/presse" className="inline-flex items-center gap-1.5 font-semibold text-navy-700 hover:text-navy-900">
              Tous les articles
              <IconeFleche className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {victoires.map((a) => (
              <li key={a.slug}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte transition-colors hover:border-navy-200"
                >
                  <PhotoArticle article={a} className="aspect-[1200/630]" />
                  <div className="p-5 sm:p-6">
                    <p className="flex items-baseline gap-2">
                      <span className="font-display text-4xl font-extrabold text-navy-900 tabular-nums">{a.chiffre?.valeur}</span>
                      <span className="font-semibold text-ink-soft">{a.chiffre?.libelle}</span>
                    </p>
                    <p className="mt-2 leading-relaxed text-ink">{a.resume}</p>
                    <p className="mt-3 text-sm text-ink-faint">
                      {a.journal} · {dateParution(a.date)} · <span className="font-semibold text-navy-700 group-hover:underline">Lire l&apos;article</span>
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-faint">Chaque dossier est différent : un résultat ne garantit pas le suivant.</p>
        </div>
      </section>

      {/* ============================================================= TARIFS */}
      <section id="tarifs" className="scroll-mt-20 border-y border-line bg-card py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">Commencez gratuitement</h2>
            <p className="mx-auto mt-3 max-w-xl text-[1.05rem] text-ink-soft">
              2 dossiers offerts, sans carte. Ensuite : 70 € par an, dossiers illimités.
            </p>
          </div>
          <div className="mt-8 grid items-start gap-5 md:grid-cols-2">
            <CarteFormule plan={gratuit} libelleAction="Créer mon compte gratuit" />
            <CarteFormule plan={membre} libelleAction="Devenir membre" />
          </div>
          <p className="mt-5 text-center text-sm text-ink-soft">
            Indépendant ou société ?{" "}
            <Link href="/tarifs" className="font-semibold text-navy-700 underline underline-offset-4">
              Formules pro
            </Link>
          </p>
        </div>
      </section>

      {/* ================================================================ FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">Vos questions</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-display text-base font-bold text-navy-900">
                {f.q}
                <IconeChevron className="h-4 w-4 shrink-0 text-navy-700 transition group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-[0.95rem] leading-relaxed text-ink-soft">{f.r}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-ink-soft">
          Une autre question ? <BoutonContact variante="lien">Écrivez-nous</BoutonContact>
        </p>
      </section>

      {/* ========================================================== APPEL FINAL */}
      <section className="relative overflow-hidden bg-navy-900 py-16 text-white">
        <div className="motif-points absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Le délai court déjà.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[1.05rem] text-navy-100">10 jours pour contester. Une minute pour vérifier.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkBtn href="#analyser" variant="gold" taille="lg">
              <IconeScanDoc className="h-6 w-6 [--icone-accent:transparent]" />
              Vérifier ma lettre
            </LinkBtn>
            <LinkBtn href="/connexion" variant="outline" taille="lg">
              J&apos;ai déjà un compte
            </LinkBtn>
          </div>
        </div>
      </section>
    </div>
  );
}
