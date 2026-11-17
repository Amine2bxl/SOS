import type { Metadata } from "next";
import { PageHead, LinkBtn } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { CarteFormule } from "@/components/formules";
import { PLANS } from "@/lib/plans";
import { IconeChevron, IconeMainTendue } from "@/components/icones";

export const metadata: Metadata = {
  title: "Tarifs et adhésion",
  description:
    "Analyse gratuite et sans compte, deux dossiers offerts, puis une adhésion annuelle : Membre 70 €, Indépendant 400 €, Société 800 €.",
};

const QUESTIONS = [
  {
    q: "Qu'est-ce qui est gratuit ?",
    r: "Vérifier une lettre, sans compte ni limite. Vos 2 premiers dossiers, lettre comprise. L'aide écrite de l'association.",
  },
  {
    q: "Comment se passe le paiement ?",
    r: "Par virement : on vous donne le montant et la référence. Active dès que le virement arrive.",
  },
  {
    q: "Que se passe-t-il après mes deux dossiers offerts ?",
    r: "Ils restent ouverts et suivis. Un 3e dossier demande l'adhésion.",
  },
  {
    q: "L'adhésion est-elle reconduite automatiquement ?",
    r: "Non. Aucun prélèvement. 12 mois, puis vous décidez.",
  },
  {
    q: "Puis-je obtenir une facture ?",
    r: "Oui, pour les formules Indépendant et Société.",
  },
];

export default function Tarifs() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <PageHead
        title="Commencez gratuitement"
        intro="Vérifier : gratuit. 2 dossiers offerts. Ensuite, une adhésion par an."
      />

      <div className="mt-12 grid items-start gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <CarteFormule
            key={plan.id}
            plan={plan}
            libelleAction={plan.id === "gratuit" ? "Créer mon compte gratuit" : undefined}
          />
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl items-start gap-4 rounded-[var(--radius-carte)] border border-gold-300 bg-gold-50 p-5">
        <IconeMainTendue className="h-9 w-9 shrink-0 text-navy-900" />
        <p className="text-sm leading-relaxed text-ink">
          <strong className="text-navy-900">70 €, c&apos;est trop ?</strong>{" "}
          <BoutonContact variante="lien">Dites-le-nous</BoutonContact> : on trouve une solution.
        </p>
      </div>

      <section className="mx-auto mt-14 max-w-3xl">
        <h2 className="font-display text-2xl font-extrabold text-navy-900">Questions sur l&apos;adhésion</h2>
        <div className="mt-6 space-y-3">
          {QUESTIONS.map((f) => (
            <details key={f.q} className="group rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-navy-900">
                {f.q}
                <IconeChevron className="h-4 w-4 shrink-0 text-navy-700 transition group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-3xl rounded-[1.75rem] bg-navy-900 p-7 text-center text-white">
        <p className="font-display text-xl font-bold">Quelle formule choisir ?</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-navy-100">
          Vérifiez d&apos;abord votre lettre, gratuitement. On vous dira ce qui suffit.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkBtn href="/#analyser" variant="gold">
            Vérifier ma lettre
          </LinkBtn>
          <BoutonContact variante="outline">Nous écrire</BoutonContact>
        </div>
      </section>
    </div>
  );
}
