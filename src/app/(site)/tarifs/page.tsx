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
    r: "L'analyse de votre courrier, sans compte et sans limite. Puis vos deux premiers dossiers, lettre et suivi compris. L'aide par écrit de l'association reste gratuite pour tous.",
  },
  {
    q: "Comment se passe le paiement ?",
    r: "Par virement, depuis votre banque. Vous demandez votre adhésion dans votre espace : l'écran suivant vous donne le montant et la référence à indiquer. Votre adhésion s'active dès réception.",
  },
  {
    q: "Que se passe-t-il après mes deux dossiers offerts ?",
    r: "Ils restent ouverts et suivis, avec leurs lettres. Seule l'ouverture d'un nouveau dossier demande une adhésion.",
  },
  {
    q: "L'adhésion est-elle reconduite automatiquement ?",
    r: "Non. Aucun prélèvement automatique : l'adhésion couvre douze mois, et vous décidez librement de la renouveler.",
  },
  {
    q: "Puis-je obtenir une facture ?",
    r: "Oui. Pour les formules Indépendant et Société, la facture est établie au nom de votre activité ou de votre entreprise.",
  },
];

export default function Tarifs() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <PageHead
        kicker="Adhésion"
        title="Commencez gratuitement"
        intro="L'analyse est gratuite, sans compte. Vos deux premiers dossiers aussi. Au-delà, l'adhésion fait vivre l'association et ouvre des dossiers illimités."
      />

      <div className="mt-12 grid items-start gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <CarteFormule
            key={plan.id}
            plan={plan}
            href={plan.id === "gratuit" ? "/#analyser" : undefined}
            libelleAction={plan.id === "gratuit" ? "Analyser mon courrier" : undefined}
          />
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl items-start gap-4 rounded-[var(--radius-carte)] border border-gold-300 bg-gold-50 p-5">
        <IconeMainTendue className="h-9 w-9 shrink-0 text-navy-900" />
        <p className="text-sm leading-relaxed text-ink">
          <strong className="text-navy-900">L&apos;argent ne doit pas être un obstacle.</strong> L&apos;aide par écrit
          reste gratuite, quelle que soit la formule. Si l&apos;adhésion vous pose problème,{" "}
          <BoutonContact variante="lien">dites-le-nous</BoutonContact> : nous trouverons une solution.
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
        <p className="font-display text-xl font-bold">Un doute sur la formule adaptée ?</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-navy-100">
          Analysez d&apos;abord votre courrier : c&apos;est gratuit. Et écrivez-nous si besoin, nous vous dirons
          franchement ce qui suffit.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkBtn href="/#analyser" variant="gold">
            Analyser mon courrier
          </LinkBtn>
          <BoutonContact variante="outline">Nous écrire</BoutonContact>
        </div>
      </section>
    </div>
  );
}
