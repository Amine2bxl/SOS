import Link from "next/link";
import { Card, LinkBtn, Check, Cross } from "@/components/ui";
import { MailIcon } from "@/components/Logo";
import { BoutonContact } from "@/components/Contact";
import { ZonesVisuel, ApercuEspaceMembre } from "@/components/visuels";
import { EscalierProcedure, SourceProcedure } from "@/components/guide";
import { IconeModule } from "@/components/app/IconeModule";
import { MODULES_DOSSIERS, MODULES_OUTILS } from "@/components/app/modules";
import { DELAI_CONTESTATION_JOURS } from "@/lib/contestation";
import { CarteFormule } from "@/components/formules";
import { PLANS } from "@/lib/plans";
import { ASSO, CHIFFRES, NOUS_FAISONS, NOUS_NE_FAISONS_PAS, ALERTE } from "@/lib/data";

/** Les situations les plus fréquentes : le visiteur doit se reconnaître en 5 secondes. */
const SITUATIONS = [
  {
    titre: "Une redevance de stationnement",
    texte: "parking.brussels ou votre commune vous réclame 25 €, 50 €, parfois bien plus.",
  },
  {
    titre: "Une amende qui a grossi",
    texte: "Vous n'avez pas réagi à temps, et les rappels ont fait grimper la note.",
  },
  {
    titre: "Une sanction communale (SAC)",
    texte: "Un fonctionnaire sanctionnateur vous réclame une somme. Vous ne savez pas quoi répondre.",
  },
];

/** Le parcours, du courrier reçu au dossier suivi. */
const PARCOURS = [
  {
    titre: "Vous photographiez votre courrier",
    texte:
      "Photo, capture d'écran ou PDF. Nous en extrayons la référence, le montant, la date et l'heure du constat, le lieu, la plaque, la communication structurée.",
  },
  {
    titre: "Vous vérifiez, vous ne tapez rien",
    texte:
      "Chaque champ arrive avec son niveau de confiance et l'extrait du document d'où il vient. Vous corrigez ce qui cloche, c'est tout.",
  },
  {
    titre: "Votre lettre s'écrit, votre dossier vit",
    texte:
      "Les bons arguments et les bonnes annexes selon votre motif, un contrôle de complétude avant l'envoi, puis le suivi des délais jusqu'à la réponse.",
  },
];

/** Les objections qui bloquent une inscription, traitées de face. */
const OBJECTIONS = [
  {
    question: "Est-ce que ça coûte quelque chose ?",
    reponse:
      "Deux contestations gratuites, sans carte bancaire. Le téléphone et l'aide par écrit restent gratuits sans limite, quelle que soit votre formule.",
  },
  {
    question: "Mes documents partent-ils quelque part ?",
    reponse:
      "Non. La lecture de votre courrier se fait dans votre navigateur : le fichier ne quitte pas votre appareil. Seules les informations que vous confirmez rejoignent votre dossier.",
  },
  {
    question: "Vous garantissez l'annulation ?",
    reponse:
      "Non, et méfiez-vous de qui vous le promet. Nous vous donnons les moyens de vous défendre correctement et dans les délais. La décision appartient à l'administration, puis au juge.",
  },
  {
    question: "Pourquoi créer un compte ?",
    reponse:
      "Parce que contester, c'est un dossier qui vit dans le temps : des pièces, des délais, une réponse à attendre. Sans compte, vous repartiriez de zéro à chaque courrier.",
  },
];

/** Les quatre modules mis en vitrine, dans l'ordre où on les rencontre. */
const MODULES_VITRINE = [
  MODULES_DOSSIERS[0], // Contester : le chemin guidé
  MODULES_OUTILS[0], // Rédiger ma lettre
  MODULES_DOSSIERS[1], // Mes dossiers
  MODULES_OUTILS[1], // Règles de ma commune
];

export default function HomePage() {
  const gratuit = PLANS[0];
  const membre = PLANS.find((p) => p.miseEnAvant) ?? PLANS[1];

  return (
    <div>
      {/* HERO — la promesse, l'urgence, une seule action. */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(242,183,5,0.16),transparent_60%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
              Association citoyenne — Bruxelles
            </p>
            <h1 className="mt-4 font-display text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">
              Payer votre redevance,{" "}
              <span className="text-gold-400">c&apos;est renoncer à la contester.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100">
              Avant de régler, prenez trois minutes. Photographiez votre courrier&nbsp;: nous en
              lisons la référence, le montant, la date et l&apos;heure du constat, le lieu et la
              plaque. Votre lettre s&apos;écrit, vos délais sont suivis. Les deux premières
              contestations sont gratuites.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gold-400 px-7 py-4 text-base font-black text-navy-950 shadow-xl shadow-gold-500/25 transition hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-2xl hover:shadow-gold-400/40"
              >
                Contester gratuitement
                <span aria-hidden="true">→</span>
              </Link>
              <BoutonContact variante="outline" className="px-6 py-4 text-base" />
            </div>

            <p className="mt-5 text-sm text-navy-100/80">
              Sans carte bancaire · Votre document reste sur votre appareil ·{" "}
              <Link href="/connexion" className="underline hover:text-gold-300">
                J&apos;ai déjà un compte
              </Link>
            </p>

            {/* L'information la plus périssable, tout en haut. */}
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-gold-400/30 bg-gold-400/10 p-4">
              <span className="font-display text-2xl font-black leading-none text-gold-400">
                {DELAI_CONTESTATION_JOURS}
              </span>
              <p className="text-sm leading-relaxed text-navy-100">
                <strong className="text-white">jours seulement</strong> pour contester chez
                parking.brussels, à compter de la réception. Les communes fixent leur propre délai —
                c&apos;est la mention de votre courrier qui fait foi.
              </p>
            </div>
          </div>

          {/* On montre l'outil plutôt que de le décrire. */}
          <div className="lg:pl-4">
            <ApercuEspaceMembre />
            <p className="mt-3 text-center text-xs text-navy-100/60">
              Votre espace membre, une fois connecté.
            </p>
          </div>
        </div>
      </section>

      {/* ALERTE D'ACTUALITÉ */}
      <section className="border-b border-danger-600/30 bg-danger-100">
        <div className="mx-auto flex max-w-4xl gap-3 px-4 py-4 sm:px-6">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" fill="currentColor" aria-hidden="true">
            <path d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z" />
          </svg>
          <p className="text-sm leading-relaxed text-ink">
            <strong className="text-danger-700">{ALERTE.titre} :</strong> {ALERTE.texte}
          </p>
        </div>
      </section>

      {/* CE QUI ARRIVE SI VOUS NE FAITES RIEN — le vrai moteur de décision. */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-navy-900 sm:text-3xl">
          Ce qui arrive si vous laissez traîner
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center leading-relaxed text-ink-soft">
          Une redevance de 25 € ne reste pas à 25 €. Chaque étape ajoute des frais, et la dernière
          se termine chez un huissier.
        </p>

        <div className="mt-9">
          <EscalierProcedure />
        </div>

        <div className="mt-6 text-center">
          <SourceProcedure />
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Contester ne suspend pas l&apos;obligation de payer dans le délai indiqué : si la
            contestation aboutit, les sommes versées sont remboursées.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <LinkBtn href="/inscription" variant="gold" className="px-6 py-3.5 text-base">
            Ouvrir mon dossier maintenant →
          </LinkBtn>
        </div>
      </section>

      {/* EST-CE POUR MOI ? */}
      <section className="border-y border-line bg-card py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold text-navy-900 sm:text-3xl">
            Nous pouvons vous aider si…
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {SITUATIONS.map((s) => (
              <div key={s.titre} className="rounded-xl border border-line bg-paper p-5">
                <Check className="h-6 w-6 text-ok-600" />
                <h3 className="mt-3 font-display text-base font-bold text-navy-900">{s.titre}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.texte}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-ink-soft">
            Vous n&apos;êtes pas sûr de votre situation ?{" "}
            <BoutonContact variante="lien">Écrivez-nous, nous regardons avec vous.</BoutonContact>
          </p>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-navy-900 sm:text-3xl">
          Trois étapes, et vous ne tapez presque rien
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Ce que le courrier contient, nous le lisons. Vous corrigez ce qui cloche, et c&apos;est
          tout.
        </p>
        <ol className="mt-9 grid gap-5 lg:grid-cols-3">
          {PARCOURS.map((p, i) => (
            <li key={p.titre} className="rounded-xl border border-line bg-card p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 font-display text-lg font-bold text-gold-300">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-navy-900">{p.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CE QUE LE COMPTE DÉBLOQUE */}
      <section className="bg-navy-950 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
            L&apos;espace membre
          </p>
          <h2 className="mt-3 text-center font-display text-2xl font-bold sm:text-3xl">
            Quatre modules, quatre rôles distincts
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center leading-relaxed text-navy-100/80">
            Ce que le scan a lu remplit la lettre. Ce que la lettre contient nourrit le suivi.
            Rien n&apos;est saisi deux fois.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {MODULES_VITRINE.map((m) => (
              <div key={m.href} className="flex gap-4 rounded-xl border border-navy-800 bg-navy-900/60 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold-400 text-navy-950">
                  <IconeModule nom={m.icone} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold">{m.titre}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy-100/75">{m.phrase}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 flex justify-center">
            <LinkBtn href="/inscription" variant="gold" className="px-6 py-3.5 text-base">
              Créer mon compte gratuit →
            </LinkBtn>
          </div>
        </div>
      </section>

      {/* CHIFFRES */}
      <section className="border-b border-line bg-card py-12">
        <div className="mx-auto grid max-w-4xl gap-8 px-4 text-center sm:grid-cols-3 sm:px-6">
          {CHIFFRES.map((c) => (
            <div key={c.label}>
              <p className="font-display text-4xl font-black text-gold-600">{c.valeur}</p>
              <p className="mt-1 font-semibold text-navy-900">{c.label}</p>
              <p className="mt-1 text-sm text-ink-soft">{c.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OBJECTIONS */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-navy-900 sm:text-3xl">
          Ce que vous vous demandez sans doute
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {OBJECTIONS.map((o) => (
            <div key={o.question} className="rounded-xl border border-line bg-card p-5">
              <h3 className="font-display text-base font-bold text-navy-900">{o.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{o.reponse}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/comprendre#faq" className="font-semibold text-navy-700 underline">
            Voir les douze questions fréquentes et les sources officielles
          </Link>
        </p>
      </section>

      {/* LES ZONES */}
      <section className="bg-navy-950 py-14 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
            Les zones de stationnement, en un coup d&apos;œil
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-navy-100/80">
            Tout commence par la zone où vous étiez garé : c&apos;est elle qui fixe le tarif, les
            horaires et la règle qu&apos;on vous oppose.
          </p>
          <div className="mt-8">
            <ZonesVisuel sombre />
          </div>
          <div className="mt-8 flex justify-center">
            <LinkBtn href="/communes" variant="outline">
              Voir le détail pour ma commune →
            </LinkBtn>
          </div>
        </div>
      </section>

      {/* FORMULES */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-navy-900 sm:text-3xl">
          Commencez gratuitement
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Deux contestations offertes, sans carte bancaire. L&apos;adhésion vient après, si vous en
          avez besoin.
        </p>
        <div className="mt-8 grid items-start gap-5 sm:grid-cols-2">
          {[gratuit, membre].map((plan) => (
            <CarteFormule
              key={plan.id}
              plan={plan}
              courte
              href={plan.id === "gratuit" ? "/inscription" : "/tarifs"}
              libelleAction={
                plan.id === "gratuit" ? "Commencer gratuitement" : "Voir toutes les formules"
              }
            />
          ))}
        </div>
      </section>

      {/* CE QUE NOUS FAISONS / NE FAISONS PAS */}
      <section className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Ce que nous faisons">
            <ul className="space-y-2.5">
              {NOUS_FAISONS.map((x) => (
                <li key={x} className="flex gap-2.5 text-sm text-ink">
                  <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ok-600" />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Ce que nous ne faisons pas" className="border-line bg-paper">
            <ul className="space-y-2.5">
              {NOUS_NE_FAISONS_PAS.map((x) => (
                <li key={x} className="flex gap-2.5 text-sm text-ink">
                  <Cross className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-soft" />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-navy-900 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-black sm:text-3xl">
            Chez parking.brussels, le délai est de dix jours.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-navy-100">
            Créez votre compte, scannez votre courrier, et sachez ce qui reste possible — sans
            jargon ni promesse d&apos;annulation.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkBtn href="/inscription" variant="gold" className="w-full px-7 py-4 text-base sm:w-auto">
              Contester gratuitement →
            </LinkBtn>
            <BoutonContact variante="outline" className="w-full px-6 py-4 text-base sm:w-auto" />
          </div>
          <p className="mt-8 text-sm text-navy-100/70">
            Ou écrivez-nous à{" "}
            <a href={`mailto:${ASSO.email}`} className="inline-flex items-center gap-1.5 underline hover:text-gold-300">
              <MailIcon className="h-4 w-4" />
              {ASSO.email}
            </a>{" "}
            ·{" "}
            <Link href="/contact" className="underline hover:text-gold-300">
              toutes nos coordonnées
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
