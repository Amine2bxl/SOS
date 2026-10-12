import Link from "next/link";
import { Suspense } from "react";
import { MOYENS, REGIONS } from "@/cerveau";
import { PLANS } from "@/lib/plans";
import { ASSO } from "@/lib/data";
import { LinkBtn } from "@/components/ui";
import { CarteFormule } from "@/components/formules";
import { BoutonContact } from "@/components/Contact";
import { AssistantScan } from "@/components/scan/AssistantScan";
import { EscalierProcedure } from "@/components/guide";
import { ApercuAnalyse } from "@/components/site/ApercuAnalyse";
import {
  IconeAgenda,
  IconeBalance,
  IconeBelgique,
  IconeCadenas,
  IconeChevron,
  IconeDelai,
  IconeFleche,
  IconeLettre,
  IconeLibre,
  IconeScanDoc,
  IconeTampon,
} from "@/components/icones";

/** Ce que fait le moteur, dans l'ordre où il le fait. */
const MOTEUR = [
  { Icone: IconeScanDoc, titre: "Il lit votre courrier", texte: "Référence, montant, dates, plaque, lieu : rien à retaper. Photo, capture ou PDF." },
  { Icone: IconeDelai, titre: "Il calcule votre délai", texte: "Le délai de contestation de votre région, souvent plus court que la date imprimée." },
  { Icone: IconeBalance, titre: "Il trouve vos arguments", texte: "Trois à cinq questions, une réponse d'un geste : il retient ce qui tient vraiment." },
  { Icone: IconeLettre, titre: "Il rédige votre lettre", texte: "Pour votre cas, en français ou en néerlandais, avec les pièces à joindre." },
  { Icone: IconeAgenda, titre: "Il suit votre dossier", texte: "Échéances, relance si l'administration se tait, réponse à l'huissier si besoin." },
];

const FAQ = [
  {
    q: "Est-ce vraiment gratuit ?",
    r: "L'analyse est gratuite, sans compte. Vos deux premiers dossiers aussi, lettre comprise. L'adhésion à l'association — 70 € par an — n'est utile que si vous recevez plus de courriers.",
  },
  {
    q: "Mon document part-il quelque part ?",
    r: "Non. Votre photo ou votre PDF est lu dans votre navigateur, sur votre appareil. Seules les informations que vous confirmez rejoignent votre dossier.",
  },
  {
    q: "Ça marche en Wallonie et en Flandre ?",
    r: "Oui. Le moteur reconnaît la région du constat et adapte le délai, la procédure et la langue de la lettre — en néerlandais pour la Flandre. Bruxelles est couverte en détail ; ailleurs, chaque commune fixe son règlement et le moteur s'appuie sur ce qu'indique votre courrier.",
  },
  {
    q: "Vous garantissez l'annulation ?",
    r: "Non, et méfiez-vous de qui vous le promet. Le moteur vous dit honnêtement si votre dossier est solide — et quand il vaut mieux payer. La décision appartient à l'administration, puis au juge.",
  },
  {
    q: "C'est une intelligence artificielle ?",
    r: "C'est un moteur d'analyse écrit par l'association : des règles, des procédures et des arguments vérifiés, appliqués à votre cas. Il ne devine rien et n'invente rien — chaque conclusion se relit et s'explique. Il tourne sur nos serveurs, sans service extérieur.",
  },
  {
    q: "Et si mon cas est compliqué ?",
    r: "L'association répond par écrit, par WhatsApp ou par e-mail. Les membres bénéficient d'une relecture de leur dossier.",
  },
];

export default async function Accueil({ searchParams }: { searchParams: Promise<{ compte?: string }> }) {
  const { compte } = await searchParams;
  const gratuit = PLANS[0];
  const membre = PLANS.find((p) => p.miseEnAvant) ?? PLANS[1];

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
              <IconeBelgique className="h-4 w-4 text-white [--icone-accent:var(--color-gold-400)]" />
              Bruxelles · Wallonie · Flandre
            </p>
            <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl">
              Une redevance de stationnement&nbsp;?{" "}
              <span className="text-gold-400">Contestez-la en trois minutes.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-100">
              Photographiez le courrier. Le moteur SOS le lit, calcule votre délai, trouve vos arguments et rédige votre
              lettre — en français ou en néerlandais.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkBtn href="#analyser" variant="gold" taille="lg">
                <IconeScanDoc className="h-6 w-6 [--icone-accent:transparent]" />
                Analyser mon courrier
              </LinkBtn>
              <LinkBtn href="#comment" variant="outline" taille="lg">
                Comment ça marche
              </LinkBtn>
            </div>
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-navy-100">
              <span>Gratuit, sans compte</span>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span>Votre document reste sur votre téléphone</span>
            </p>
          </div>
          <div className="lg:pl-6">
            <ApercuAnalyse />
          </div>
        </div>
        <div className="motif-marquage h-2" aria-hidden="true" />
      </section>

      {/* ===================================================== BANDE DE CONFIANCE */}
      <section className="border-b border-line bg-card">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-4 px-4 py-6 sm:px-6 lg:grid-cols-4">
          {[
            { Icone: IconeTampon, texte: "Association sans but lucratif", detail: `BCE ${ASSO.bce}` },
            { Icone: IconeCadenas, texte: "Lu sur votre appareil", detail: "Le document n'est envoyé nulle part" },
            { Icone: IconeLettre, texte: "Lettre en FR ou NL", detail: "Dans la langue de l'administration" },
            { Icone: IconeBelgique, texte: "Toute la Belgique", detail: "Les trois régions" },
          ].map(({ Icone, texte, detail }) => (
            <li key={texte} className="flex items-center gap-3">
              <Icone className="h-9 w-9 shrink-0 text-navy-900" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-navy-900">{texte}</span>
                <span className="block text-xs text-ink-soft">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ============================================================ ANALYSER */}
      <section id="analyser" className="scroll-mt-20 px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">Essayez maintenant</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">
            Votre analyse, gratuite et sans compte
          </h2>
          <p className="mt-3 text-[1.05rem] text-ink-soft">
            Déposez votre courrier : en une minute, vous savez quoi faire, avant quand, et avec quels arguments.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-2xl rounded-[1.75rem] border border-line/80 bg-card p-5 shadow-flotte sm:p-8">
          <Suspense>
            <AssistantScan mode="visiteur" />
          </Suspense>
        </div>
      </section>

      {/* ======================================================= LE MOTEUR */}
      <section id="comment" className="scroll-mt-20 bg-navy-900 py-16 text-white lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-400">Le moteur SOS</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              Le savoir de l&apos;association, appliqué à votre courrier.
            </h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-navy-100">
              Les règles, les procédures, les arguments qui marchent et les erreurs qui coûtent cher — réunis dans un
              moteur qui ne devine rien et n&apos;invente rien.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {MOTEUR.map(({ Icone, titre, texte }, i) => (
              <li key={titre} className="rounded-[var(--radius-carte)] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-navy-900">
                    <Icone className="h-8 w-8" />
                  </span>
                  <span className="font-display text-sm font-bold text-gold-400">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{titre}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-100">{texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ======================================================= LES ARGUMENTS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">Les arguments</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">
            {MOYENS.length} façons de faire tomber une redevance
          </h2>
          <p className="mt-3 text-[1.05rem] text-ink-soft">
            Le moteur les passe toutes en revue pour vous. Vous vous reconnaissez peut-être déjà.
          </p>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOYENS.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-line/80 bg-card p-3.5 shadow-carte">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
                <IconeLibre nom={m.icone} className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold leading-snug text-navy-900">« {m.titre} »</span>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <LinkBtn href="#analyser" variant="primary">
            Vérifier mon cas
            <IconeFleche className="h-5 w-5" />
          </LinkBtn>
        </div>
      </section>

      {/* ======================================================= L'ESCALIER */}
      <section className="border-y border-line bg-card py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-danger-700">Le piège</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">
              Une redevance ne reste jamais à son prix.
            </h2>
            <p className="mt-3 text-[1.05rem] text-ink-soft">
              Chaque courrier ignoré ajoute des frais. Le meilleur moment pour réagir, c&apos;est le premier.
            </p>
          </div>
          <div className="mt-10">
            <EscalierProcedure />
          </div>
          <p className="mt-5 text-xs text-ink-faint">
            Procédure publiée par parking.brussels. Ailleurs, chaque commune fixe la sienne : c&apos;est votre courrier qui
            fait foi.
          </p>
        </div>
      </section>

      {/* ========================================================= LA BELGIQUE */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <IconeBelgique className="h-24 w-24 text-navy-900" />
            <h2 className="mt-4 font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">
              Une seule plateforme, trois régions.
            </h2>
            <p className="mt-3 text-[1.05rem] text-ink-soft">
              Le moteur reconnaît où a eu lieu le constat, et adapte tout : le délai, la procédure, la langue.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {(["bruxelles", "wallonie", "flandre"] as const).map((id) => {
              const r = REGIONS[id];
              return (
                <li key={id} className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte">
                  <p className="font-display text-xl font-extrabold text-navy-900">{r.court}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {r.langues.map((l) => (l === "fr" ? "Français" : "Néerlandais")).join(" · ")}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {r.delaiContestationJours
                      ? `Délai de contestation : ${r.delaiContestationJours} jours. Procédure détaillée, étape par étape.`
                      : "Délai fixé par chaque commune : le moteur le lit sur votre courrier."}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ============================================================= TARIFS */}
      <section className="bg-paper pb-16 lg:pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">Tarifs</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">Commencez gratuitement</h2>
            <p className="mx-auto mt-3 max-w-xl text-[1.05rem] text-ink-soft">
              Deux dossiers offerts, sans carte bancaire. Ensuite, l&apos;adhésion : 70 € par an, dossiers illimités.
            </p>
          </div>
          <div className="mt-8 grid items-start gap-5 md:grid-cols-2">
            <CarteFormule plan={gratuit} href="#analyser" libelleAction="Analyser mon courrier" />
            <CarteFormule plan={membre} href="/tarifs" libelleAction="Voir le détail" />
          </div>
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
          Une autre question ? <BoutonContact variante="lien">Écrivez-nous</BoutonContact> ·{" "}
          <Link href="/comprendre" className="font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4">
            Comprendre la procédure
          </Link>
        </p>
      </section>

      {/* ========================================================== APPEL FINAL */}
      <section className="relative overflow-hidden bg-navy-900 py-16 text-white">
        <div className="motif-points absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Le délai court déjà.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[1.05rem] text-navy-100">
            Trois minutes maintenant valent mieux que des frais de rappel plus tard.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkBtn href="#analyser" variant="gold" taille="lg">
              <IconeScanDoc className="h-6 w-6 [--icone-accent:transparent]" />
              Analyser mon courrier
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
