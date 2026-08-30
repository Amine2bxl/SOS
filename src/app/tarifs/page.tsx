import type { Metadata } from "next";
import { PageHead, Card, LinkBtn, Check, KeyBox } from "@/components/ui";
import { PhoneIcon } from "@/components/Logo";
import { PLANS, formatPrix } from "@/lib/plans";
import { ASSO, FAQS } from "@/lib/data";

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

      <div className="mt-12 grid gap-5 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col rounded-xl border bg-card p-6 shadow-sm ${
              plan.miseEnAvant ? "border-2 border-gold-400 lg:-mt-3 lg:pb-9" : "border-line"
            }`}
          >
            {plan.miseEnAvant && (
              <p className="mb-3 inline-block self-start rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-navy-950">
                Le plus choisi
              </p>
            )}

            <h2 className="font-display text-xl font-bold text-navy-900">{plan.nom}</h2>
            <p className="mt-1 text-sm text-ink-soft">{plan.pour}</p>

            <p className="mt-5">
              <span className="font-display text-4xl font-black text-navy-900">
                {formatPrix(plan.prixAnnuel)}
              </span>
              {plan.prixAnnuel > 0 && (
                <span className="ml-1 text-sm text-ink-soft">/ an</span>
              )}
            </p>

            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.avantages.map((a) => (
                <li key={a} className="flex gap-2.5 text-sm text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
                  {a}
                </li>
              ))}
            </ul>

            <LinkBtn
              href={plan.id === "gratuit" ? "/inscription" : `/adherer?formule=${plan.id}`}
              variant={plan.miseEnAvant ? "gold" : "secondary"}
              className="mt-7 w-full"
            >
              {plan.id === "gratuit" ? "Créer un compte gratuit" : `Adhérer — ${plan.nom}`}
            </LinkBtn>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <KeyBox title="L'aide par téléphone reste gratuite, quelle que soit la formule">
          Vous pouvez nous appeler autant que nécessaire sans adhérer. L&apos;adhésion finance
          l&apos;outil en ligne. Et si l&apos;argent est un obstacle, dites-le nous au{" "}
          <a href={`tel:${ASSO.telephoneLien}`} className="font-semibold underline">
            {ASSO.telephone}
          </a>{" "}
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
          Appelez-nous. Nous vous dirons franchement si la formule gratuite suffit dans votre cas.
        </p>
        <LinkBtn href={`tel:${ASSO.telephoneLien}`} variant="secondary" className="mt-5">
          <PhoneIcon className="h-4 w-4" />
          {ASSO.telephone}
        </LinkBtn>
      </Card>
    </div>
  );
}
