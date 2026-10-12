import type { Metadata } from "next";
import { PageHead, Card, LinkBtn } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import {
  EscalierProcedure,
  SourceProcedure,
  QuelCourrier,
  NotionsCles,
  PreuvesUtiles,
  PayerOuContester,
} from "@/components/guide";
import { FAQS } from "@/lib/data";
import { IconeChevron, IconeFleche, IconeLien } from "@/components/icones";

export const metadata: Metadata = {
  title: "Comprendre votre redevance de stationnement",
  description:
    "Avis, rappel, mise en demeure, contrainte, huissier : ce que chaque courrier signifie, ce que vous risquez et ce qu'il faut faire à chaque étape.",
};

export default function ComprendrePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <PageHead
        kicker="Guide"
        title="Comprendre votre courrier"
        intro="Tout part du courrier que vous avez reçu. Trouvez-le dans la liste : vous saurez où vous en êtes et ce qu'il vous reste à faire."
      />

      {/* CE QUE COÛTE CHAQUE ÉTAPE */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold text-navy-900">Ce que coûte chaque étape</h2>
        <p className="mt-2 text-ink-soft">
          Une redevance ne reste jamais à son prix. Plus vous réagissez tôt, moins cela vous coûte.
        </p>
        <div className="mt-6">
          <EscalierProcedure />
        </div>
        <div className="mt-4">
          <SourceProcedure />
        </div>
      </section>

      {/* QUEL COURRIER AVEZ-VOUS REÇU ? */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-extrabold text-navy-900">Quel courrier avez-vous reçu ?</h2>
        <p className="mt-2 text-ink-soft">
          Ils arrivent dans cet ordre, du plus doux au plus grave.
        </p>
        <div className="mt-6">
          <QuelCourrier />
        </div>
      </section>

      <section className="mt-10">
        <PayerOuContester />
      </section>

      {/* LES NOTIONS DE BASE */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-extrabold text-navy-900">Les notions à connaître</h2>
        <div className="mt-6">
          <NotionsCles />
        </div>
      </section>

      {/* LES PREUVES */}
      <section className="mt-14">
        <PreuvesUtiles />
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-14 scroll-mt-28">
        <h2 className="font-display text-2xl font-extrabold text-navy-900">Questions fréquentes</h2>
        <div className="mt-6 space-y-3">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-navy-900">
                {faq.question}
                <IconeChevron className="h-4 w-4 shrink-0 text-navy-700 transition group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{faq.reponse}</p>
            </details>
          ))}
        </div>
      </section>

      {/* LIENS UTILES ET SOURCES OFFICIELLES */}
      <section className="mt-14">
        <Card title="Liens utiles et sources officielles" subtitle="Les seuls textes et services qui font foi pour votre dossier.">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                titre: "parking.brussels",
                texte: "Zones, tarifs, horaires et démarches de contestation en ligne.",
                href: "https://www.parking.brussels",
              },
              {
                titre: "Votre commune",
                texte: "Le règlement communal applicable figure sur le site officiel de chaque commune.",
                href: "/communes",
              },
              {
                titre: "Ombudsman bruxellois",
                texte: "Médiation gratuite en cas de blocage avec une administration régionale.",
                href: "https://www.ombudsmanbru.be",
              },
              {
                titre: "Protection des données",
                texte: "Pour vos droits en matière de données personnelles (RGPD).",
                href: "https://www.autoriteprotectiondonnees.be",
              },
            ].map((l) => (
              <a
                key={l.titre}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group rounded-2xl border border-line bg-white p-4 transition hover:border-navy-200 hover:shadow-carte"
              >
                <p className="flex items-center gap-1.5 font-semibold text-navy-900 group-hover:underline">
                  {l.titre}
                  {l.href.startsWith("http") ? <IconeLien className="h-4 w-4" /> : <IconeFleche className="h-4 w-4" />}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{l.texte}</p>
              </a>
            ))}
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="relative mt-14 overflow-hidden rounded-[1.75rem] bg-navy-900 p-8 text-center text-white">
        <div className="motif-points absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <h2 className="font-display text-2xl font-extrabold">Votre courrier, analysé en une minute</h2>
          <p className="mx-auto mt-3 max-w-lg text-navy-100">
            Le moteur lit votre courrier, calcule votre délai et prépare votre lettre. Gratuit, sans compte.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkBtn href="/#analyser" variant="gold">
              Analyser mon courrier
            </LinkBtn>
            <BoutonContact variante="outline">Nous écrire</BoutonContact>
          </div>
        </div>
      </section>
    </div>
  );
}
