import Link from "next/link";
import { Card, LinkBtn, Check, Cross } from "@/components/ui";
import { MailIcon } from "@/components/Logo";
import { BoutonContact } from "@/components/Contact";
import { ZonesVisuel } from "@/components/visuels";
import { IconeModule } from "@/components/app/IconeModule";
import { MODULES_DOSSIERS, MODULES_OUTILS } from "@/components/app/modules";
import { PLANS, formatPrix } from "@/lib/plans";
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

/** Le parcours, du courrier reçu au dossier suivi. Trois temps, pas quatre. */
const PARCOURS_PUBLIC = [
  {
    titre: "Vous comprenez votre courrier",
    texte:
      "Nos guides gratuits vous disent quel document vous avez reçu, quel délai il vous reste et quelles preuves comptent. Sans compte, sans inscription.",
    cta: "Lire les guides",
    href: "/comprendre",
  },
  {
    titre: "Vous créez votre compte",
    texte:
      "Gratuit, en une minute. C'est la porte d'entrée de l'espace membre : au-delà, tout est fait pour vous, plus rien n'est à retaper.",
    cta: "Créer mon compte",
    href: "/inscription",
  },
  {
    titre: "Vous contestez et vous suivez",
    texte:
      "Vous scannez votre courrier, la lettre s'écrit, le dossier vit : échéances, relances, chronologie. Vous savez en permanence quoi faire ensuite.",
    cta: "Voir les formules",
    href: "/tarifs",
  },
];

/** Les modules réellement livrés dans l'espace membre — la promesse, illustrée. */
const MODULES_VITRINE = [MODULES_DOSSIERS[0], MODULES_DOSSIERS[1], MODULES_OUTILS[0], MODULES_OUTILS[1]];

export default function HomePage() {
  const gratuit = PLANS[0];
  const membre = PLANS.find((p) => p.miseEnAvant) ?? PLANS[1];

  return (
    <div>
      {/* HERO — une promesse, une action. */}
      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
            Association citoyenne — Bruxelles
          </p>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Vous avez reçu une amende de stationnement&nbsp;?{" "}
            <span className="text-gold-400">Vous n&apos;êtes pas seul.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-100">
            Nous sommes une association bruxelloise. Nos guides sont libres d&apos;accès&nbsp;; et
            avec un compte gratuit, vous scannez votre courrier, votre lettre de contestation
            s&apos;écrit et vos dossiers se suivent tout seuls.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/inscription"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold-400 px-7 py-4 text-base font-black text-navy-950 shadow-xl shadow-gold-500/25 transition hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-2xl hover:shadow-gold-400/40 sm:w-auto"
            >
              Créer mon compte gratuit
              <span aria-hidden="true">→</span>
            </Link>
            <BoutonContact variante="outline" className="w-full px-6 py-4 text-base sm:w-auto" />
          </div>

          <p className="mt-6 text-sm text-navy-100/80">
            Gratuit · Sans engagement ·{" "}
            <Link href="/connexion" className="underline hover:text-gold-300">
              J&apos;ai déjà un compte
            </Link>
          </p>
        </div>
      </section>

      {/* ALERTE D'ACTUALITÉ — information critique, visible immédiatement. */}
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

      {/* EST-CE POUR MOI ? */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-navy-900 sm:text-3xl">
          Nous pouvons vous aider si…
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {SITUATIONS.map((s) => (
            <div key={s.titre} className="rounded-xl border border-line bg-card p-5 shadow-sm">
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
      </section>

      {/* CE QUE VOUS OBTENEZ UNE FOIS CONNECTÉ — la vraie valeur du compte. */}
      <section className="bg-navy-950 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
            L&apos;espace membre
          </p>
          <h2 className="mt-3 text-center font-display text-2xl font-bold sm:text-3xl">
            Ce que le compte gratuit débloque
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center leading-relaxed text-navy-100/80">
            Passé la connexion, le site devient un véritable outil de travail. Quatre modules, quatre
            rôles distincts — et vos informations circulent de l&apos;un à l&apos;autre sans jamais
            être retapées.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {MODULES_VITRINE.map((m) => (
              <div
                key={m.href}
                className="flex gap-4 rounded-xl border border-navy-800 bg-navy-900/60 p-5"
              >
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

      {/* LE PARCOURS — trois temps, dans l'ordre où on les vit. */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-navy-900 sm:text-3xl">
          Comment ça se passe
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Le site public informe. Le compte vous donne les outils. Vous avancez à votre rythme.
        </p>
        <ol className="mt-9 grid gap-5 lg:grid-cols-3">
          {PARCOURS_PUBLIC.map((p, i) => (
            <li
              key={p.titre}
              className="flex flex-col rounded-xl border border-line bg-card p-6 shadow-sm transition hover:border-navy-600/40 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 font-display text-lg font-bold text-gold-300">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-navy-900">{p.titre}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{p.texte}</p>
              <LinkBtn href={p.href} variant={i === 1 ? "gold" : "secondary"} className="mt-5 w-full">
                {p.cta}
              </LinkBtn>
            </li>
          ))}
        </ol>
      </section>

      {/* LES ZONES, EN 30 SECONDES */}
      <section className="bg-navy-950 py-14 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
            Les zones de stationnement, en un coup d&apos;œil
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-navy-100/80">
            Tout commence par la zone où vous étiez garé : c&apos;est elle qui fixe le tarif, les
            horaires et les règles applicables à votre dossier.
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

      {/* LES FORMULES, EN DEUX LIGNES */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-navy-900 sm:text-3xl">
          Commencez gratuitement
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Deux contestations offertes, sans carte bancaire. L&apos;adhésion vient après, si vous en
          avez besoin.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[gratuit, membre].map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-xl border p-6 shadow-sm ${
                plan.miseEnAvant ? "border-gold-400 bg-gold-100/40" : "border-line bg-card"
              }`}
            >
              <h3 className="font-display text-xl font-bold text-navy-900">{plan.nom}</h3>
              <p className="mt-0.5 text-sm text-ink-soft">{plan.pour}</p>
              <p className="mt-3 font-display text-3xl font-black text-navy-900">
                {formatPrix(plan.prixAnnuel)}
                {plan.prixAnnuel > 0 && (
                  <span className="text-sm font-semibold text-ink-soft"> / an</span>
                )}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.avantages.slice(0, 4).map((a) => (
                  <li key={a} className="flex gap-2.5 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
                    {a}
                  </li>
                ))}
              </ul>
              <LinkBtn
                href={plan.id === "gratuit" ? "/inscription" : "/tarifs"}
                variant={plan.miseEnAvant ? "gold" : "secondary"}
                className="mt-5 w-full"
              >
                {plan.id === "gratuit" ? "Commencer gratuitement" : "Voir toutes les formules"}
              </LinkBtn>
            </div>
          ))}
        </div>
      </section>

      {/* CE QUE NOUS FAISONS / NE FAISONS PAS — attentes cadrées, confiance. */}
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

      {/* CONTACT FINAL */}
      <section className="bg-navy-900 py-14 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Parlons de votre dossier</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-navy-100">
            Décrivez-nous votre situation : nous vous disons ce qui reste possible, sans jargon ni
            fausse promesse.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BoutonContact variante="gold" className="w-full px-6 py-3.5 text-base sm:w-auto" />
            <LinkBtn
              href={`mailto:${ASSO.email}`}
              variant="outline"
              className="w-full px-6 py-3.5 text-base sm:w-auto"
            >
              <MailIcon className="h-5 w-5" />
              Nous écrire
            </LinkBtn>
          </div>
          <p className="mt-6 text-sm text-navy-100/70">
            <Link href="/contact" className="underline hover:text-gold-300">
              Voir toutes nos coordonnées
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
