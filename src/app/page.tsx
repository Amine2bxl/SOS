import Link from "next/link";
import { Card, LinkBtn, Check, Cross } from "@/components/ui";
import { PhoneIcon, MailIcon } from "@/components/Logo";
import { ASSO, CHIFFRES, ETAPES, NOUS_FAISONS, NOUS_NE_FAISONS_PAS, ALERTE } from "@/lib/data";

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

export default function HomePage() {
  return (
    <div>
      {/* HERO — une seule promesse, deux actions possibles. */}
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
            Nous sommes une association bruxelloise. Nous décryptons votre courrier avec vous et
            vous aidons à le contester quand c&apos;est justifié. Un appel suffit pour commencer, et
            il ne vous coûte <strong className="text-white">rien</strong>.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkBtn href={`tel:${ASSO.telephoneLien}`} variant="gold" className="w-full px-6 py-3.5 text-base sm:w-auto">
              <PhoneIcon className="h-5 w-5" />
              Appelez-nous : {ASSO.telephone}
            </LinkBtn>
            <LinkBtn href="/contester" variant="outline" className="w-full px-6 py-3.5 text-base sm:w-auto">
              Préparer ma contestation en ligne
            </LinkBtn>
          </div>

          <p className="mt-6 text-sm text-navy-100/80">
            Appel gratuit · Sans engagement · Une vraie personne au bout du fil
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
          <a href={`tel:${ASSO.telephoneLien}`} className="font-semibold text-navy-700 underline">
            Appelez-nous, nous regardons avec vous.
          </a>
        </p>
      </section>

      {/* CHIFFRES */}
      <section className="bg-navy-900 py-12 text-white">
        <div className="mx-auto grid max-w-4xl gap-8 px-4 text-center sm:grid-cols-3 sm:px-6">
          {CHIFFRES.map((c) => (
            <div key={c.label}>
              <p className="font-display text-4xl font-black text-gold-400">{c.valeur}</p>
              <p className="mt-1 font-semibold">{c.label}</p>
              <p className="mt-1 text-sm text-navy-100/80">{c.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE — 3 étapes, pas 6. */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-navy-900 sm:text-3xl">
          Comment ça se passe ?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Trois étapes. Vous gardez la main du début à la fin.
        </p>
        <ol className="mt-9 grid gap-5 sm:grid-cols-3">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="rounded-xl border border-line bg-card p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 font-display text-lg font-bold text-gold-300">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-navy-900">{e.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{e.texte}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex justify-center">
          <LinkBtn href="/comprendre" variant="secondary">
            Comprendre la procédure en détail →
          </LinkBtn>
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
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Parlons de votre dossier
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-navy-100">
            Décrivez-nous votre situation : nous vous disons ce qui reste possible, sans jargon ni
            fausse promesse.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkBtn href={`tel:${ASSO.telephoneLien}`} variant="gold" className="w-full px-6 py-3.5 text-base sm:w-auto">
              <PhoneIcon className="h-5 w-5" />
              {ASSO.telephone}
            </LinkBtn>
            <LinkBtn href={`mailto:${ASSO.email}`} variant="outline" className="w-full px-6 py-3.5 text-base sm:w-auto">
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
