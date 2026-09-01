import type { Metadata } from "next";
import Link from "next/link";
import { listerDossiers } from "@/lib/dossiers";
import { TYPES_DOCUMENT } from "@/lib/dossiers-format";
import { Card, LinkBtn } from "@/components/ui";
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
import { PROCEDURE_RECOUVREMENT } from "@/lib/contestation";

export const metadata: Metadata = { title: "Guides" };
export const dynamic = "force-dynamic";

/** Position dans l'escalier des frais, déduite du type de courrier reçu. */
const RANG_PAR_TYPE: Record<string, number> = {
  notification: 0,
  premier_rappel: 1,
  deuxieme_rappel: 1,
  mise_en_demeure: 2,
  contrainte: 3,
  courrier_huissier: 4,
};

/**
 * Les guides, à l'intérieur de l'application.
 *
 * Même contenu que la page publique — les composants de `guide.tsx` sont la
 * source unique — mais rapporté à la situation du membre : son propre courrier
 * est surligné dans la liste, et l'escalier des frais indique où il se trouve.
 * C'est ce qui distingue le guide de l'espace membre de la page vitrine.
 */
export default async function GuidesPage() {
  const dossiers = await listerDossiers();
  const ouverts = dossiers.filter((d) => !["accepte", "rejete", "clos"].includes(d.statut));
  const recent = ouverts[0] ?? dossiers[0] ?? null;
  const rang = recent ? RANG_PAR_TYPE[recent.type_document] : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-navy-900">
          Comprendre votre courrier
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {recent
            ? "Vos guides, rapportés au dossier que vous suivez."
            : "Tout part du courrier que vous avez reçu : ce qu'il signifie, ce qu'il coûte et ce qu'il faut faire."}
        </p>
      </div>

      {/* Le contexte du membre : là où il se trouve dans la procédure. */}
      {recent && rang !== undefined && (
        <Card className="mt-7 border-navy-600/30 bg-navy-50/60">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
            Votre dossier {recent.reference ?? ""}
          </p>
          <p className="mt-1 font-display text-lg font-bold text-navy-900">
            {TYPES_DOCUMENT[recent.type_document] ?? recent.type_document} — étape {rang + 1} sur{" "}
            {PROCEDURE_RECOUVREMENT.length}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            {PROCEDURE_RECOUVREMENT[rang].aFaire}
          </p>
          <LinkBtn href="/tableau-de-bord/contester" variant="gold" className="mt-4">
            Passer à l&apos;action →
          </LinkBtn>
        </Card>
      )}

      {/* L'ESCALIER DES FRAIS */}
      <section className="mt-10">
        <h3 className="font-display text-xl font-bold text-navy-900">
          Ce que coûte chaque étape
        </h3>
        <p className="mt-1.5 text-sm text-ink-soft">
          Une redevance de 25 € ne reste pas à 25 €. Plus vous réagissez tôt, moins cela vous coûte.
        </p>
        <div className="mt-5">
          <EscalierProcedure etapeCourante={rang} />
        </div>
        <div className="mt-4">
          <SourceProcedure />
        </div>
      </section>

      {/* QUEL COURRIER AVEZ-VOUS REÇU ? */}
      <section className="mt-12">
        <h3 className="font-display text-xl font-bold text-navy-900">
          Quel courrier avez-vous reçu ?
        </h3>
        <p className="mt-1.5 text-sm text-ink-soft">
          Ils arrivent dans cet ordre, du plus doux au plus grave.
        </p>
        <div className="mt-5">
          <QuelCourrier typeCourant={recent?.type_document ?? null} />
        </div>
      </section>

      <section className="mt-10">
        <PayerOuContester />
      </section>

      {/* LES NOTIONS */}
      <section className="mt-12">
        <h3 className="font-display text-xl font-bold text-navy-900">Les notions à connaître</h3>
        <div className="mt-5">
          <NotionsCles />
        </div>
      </section>

      {/* LES PREUVES */}
      <section className="mt-12">
        <PreuvesUtiles />
      </section>

      {/* QUESTIONS FRÉQUENTES */}
      <section className="mt-12">
        <h3 className="font-display text-xl font-bold text-navy-900">Questions fréquentes</h3>
        <div className="mt-5 divide-y divide-line-soft overflow-hidden rounded-xl border border-line bg-card">
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

      <section className="mt-12 rounded-xl bg-navy-900 p-8 text-center text-white">
        <h3 className="font-display text-xl font-bold">Une question que ces guides ne couvrent pas ?</h3>
        <p className="mx-auto mt-3 max-w-lg text-navy-100">
          Écrivez-nous : c&apos;est gratuit, sans limite de dossiers, et une vraie personne de
          l&apos;association vous répond.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <BoutonContact variante="gold" />
          <Link
            href="/tableau-de-bord/regles"
            className="text-sm font-semibold text-navy-100 underline underline-offset-2 hover:text-gold-300"
          >
            Voir les règles de ma commune
          </Link>
        </div>
      </section>
    </div>
  );
}
