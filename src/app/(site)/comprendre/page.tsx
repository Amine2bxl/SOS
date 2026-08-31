import type { Metadata } from "next";
import { PageHead, Card, KeyBox, LinkBtn, Check } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { TimelineProcedure } from "@/components/visuels";
import { DOCUMENTS, NOTIONS, PREUVES, FAQS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Comprendre votre amende de stationnement",
  description:
    "Notification, rappel, mise en demeure, contrainte, huissier : ce que chaque courrier signifie, ce que vous risquez et ce qu'il faut faire à chaque étape.",
};

const COULEURS = {
  info: "border-navy-600/30 bg-navy-50",
  attention: "border-warn-600/40 bg-warn-100/60",
  urgent: "border-danger-600/40 bg-danger-100/60",
} as const;

const ETIQUETTES = {
  info: { texte: "Vous avez le temps d'agir", classe: "bg-navy-700 text-white" },
  attention: { texte: "Réagissez maintenant", classe: "bg-warn-600 text-white" },
  urgent: { texte: "Urgent — appelez-nous", classe: "bg-danger-600 text-white" },
} as const;

export default function ComprendrePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Guide"
        title="Comprendre votre courrier"
        intro="Tout part du courrier que vous avez reçu. Trouvez-le dans la liste : vous saurez où vous en êtes et ce qu'il vous reste à faire."
      />

      {/* LES 5 ÉTAPES DE LA PROCÉDURE */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-navy-900">
          Quel courrier avez-vous reçu ?
        </h2>
        <p className="mt-2 text-ink-soft">
          Ils arrivent dans cet ordre. Plus vous réagissez tôt, moins cela vous coûte.
        </p>

        <div className="mt-6 rounded-xl border border-line bg-card p-4 shadow-sm">
          <TimelineProcedure />
        </div>

        <ol className="mt-7 space-y-4">
          {DOCUMENTS.map((d) => {
            const etiquette = ETIQUETTES[d.gravite];
            return (
              <li key={d.titre} className={`rounded-xl border-2 p-5 ${COULEURS[d.gravite]}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-navy-900">{d.titre}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${etiquette.classe}`}>
                    {etiquette.texte}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink">
                  <strong className="text-navy-900">C&apos;est quoi ?</strong> {d.cestQuoi}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink">
                  <strong className="text-navy-900">À faire :</strong> {d.aFaire}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-10">
        <KeyBox title="Payer ou contester : décidez avant de payer">
          Payer vaut reconnaissance des faits et referme le dossier. Si vous comptez contester,
          faites-le <strong>par écrit, dans le délai indiqué, avec une preuve d&apos;envoi</strong>,
          et demandez la suspension du recouvrement pendant l&apos;examen.
        </KeyBox>
      </section>

      {/* LES NOTIONS DE BASE */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold text-navy-900">Les notions à connaître</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {NOTIONS.map((n) => (
            <div key={n.titre} className="rounded-xl border border-line bg-card p-5 shadow-sm">
              <h3 className="font-display text-base font-bold text-navy-900">{n.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{n.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LES PREUVES */}
      <section className="mt-14">
        <Card title="Les preuves qui font la différence" subtitle="Sans preuve, une contestation aboutit rarement.">
          <ul className="grid gap-2 sm:grid-cols-2">
            {PREUVES.map((p) => (
              <li key={p} className="flex gap-2.5 rounded-md bg-paper p-3 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-14 scroll-mt-28">
        <h2 className="font-display text-2xl font-bold text-navy-900">Questions fréquentes</h2>
        <div className="mt-6 divide-y divide-line-soft overflow-hidden rounded-xl border border-line bg-card">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-navy-900">
                {faq.question}
                <span className="shrink-0 text-xl leading-none text-navy-700 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{faq.reponse}</p>
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
                className="group rounded-lg border border-line bg-white p-4 transition hover:border-navy-600/40 hover:shadow-sm"
              >
                <p className="font-semibold text-navy-900 group-hover:underline">
                  {l.titre} {l.href.startsWith("http") ? "↗" : "→"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{l.texte}</p>
              </a>
            ))}
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="mt-14 rounded-xl bg-navy-900 p-8 text-center text-white">
        <h2 className="font-display text-xl font-bold">Prêt à passer à l&apos;action ?</h2>
        <p className="mx-auto mt-3 max-w-lg text-navy-100">
          Préparez votre lettre en quelques minutes. Ou écrivez-nous, si vous préférez en parler.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LinkBtn href="/inscription" variant="gold">
            Préparer ma lettre
          </LinkBtn>
          <BoutonContact variante="outline" />
        </div>
      </section>
    </div>
  );
}
