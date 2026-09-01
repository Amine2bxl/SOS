import type { Metadata } from "next";
import { PageHead, Card, KeyBox } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { CarteFormule } from "@/components/formules";
import { PLANS } from "@/lib/plans";
import { FAQS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Tarifs et adhésion",
  description:
    "Deux contestations gratuites, puis une adhésion annuelle : Membre 60 €, Indépendant 400 €, Société 800 €. L'accompagnement téléphonique reste gratuit.",
};

export default function TarifsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Adhésion"
        title="Commencez gratuitement"
        intro="Vos deux premières contestations ne coûtent rien. Au-delà, l'adhésion finance l'outil, la veille réglementaire et l'accompagnement des dossiers."
      />

      <div className="mt-12 grid items-start gap-5 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <CarteFormule key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <KeyBox title="L'aide par écrit reste gratuite, quelle que soit la formule">
          Vous pouvez nous écrire sur WhatsApp ou par e-mail autant que nécessaire sans adhérer.
          L&apos;adhésion finance l&apos;outil en ligne. Et si l&apos;argent est un obstacle,{" "}
          <BoutonContact variante="lien">dites-le-nous</BoutonContact>{" "}
          : nous trouverons une solution.
        </KeyBox>
      </div>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="font-display text-2xl font-bold text-navy-900">Questions sur l&apos;adhésion</h2>
        <div className="mt-6 divide-y divide-line-soft overflow-hidden rounded-xl border border-line bg-card">
          {[
            {
              question: "Comment se passe le paiement ?",
              reponse:
                "Par virement, pour l'instant. Vous demandez votre adhésion depuis le site, nous vous envoyons les coordonnées bancaires de l'association, et votre compte s'ouvre dès réception.",
            },
            {
              question: "Que se passe-t-il après mes 2 contestations gratuites ?",
              reponse:
                "Vos dossiers restent accessibles et vous continuez à les suivre. Seule l'ouverture d'une nouvelle contestation demande une adhésion.",
            },
            {
              question: "L'adhésion est-elle reconduite automatiquement ?",
              reponse:
                "Non. Aucun prélèvement automatique n'existe aujourd'hui : l'adhésion couvre douze mois et vous décidez librement de la renouveler.",
            },
            {
              question: "Puis-je obtenir une facture ?",
              reponse:
                "Oui, pour les formules Indépendant et Société, la facture est établie au nom de votre activité ou de votre entreprise.",
            },
            FAQS[0],
          ].map((f) => (
            <details key={f.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-navy-900">
                {f.question}
                <span className="shrink-0 text-xl leading-none text-navy-700 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.reponse}</p>
            </details>
          ))}
        </div>
      </section>

      <Card className="mt-12 border-navy-600/30 bg-navy-50 text-center">
        <p className="font-display text-lg font-bold text-navy-900">Un doute sur la formule adaptée ?</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-soft">
          Écrivez-nous. Nous vous dirons franchement si la formule gratuite suffit dans votre cas.
        </p>
        <BoutonContact variante="secondaire" className="mt-5" />
      </Card>
    </div>
  );
}
