import type { Metadata } from "next";
import { PageHead, KeyBox, LinkBtn } from "@/components/ui";
import { PhoneIcon } from "@/components/Logo";
import { ASSO, COMMUNES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Les 19 communes bruxelloises",
  description:
    "Zones de stationnement et points de vigilance dans les 19 communes de la Région de Bruxelles-Capitale.",
};

export default function CommunesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Repères"
        title="Les 19 communes bruxelloises"
        intro="Chaque commune a ses zones, ses tarifs et ses règles. Celui qui compte dans votre dossier : le règlement de la commune du constat, à la date des faits."
      />

      <div className="mx-auto mt-8 max-w-3xl">
        <KeyBox title="À vérifier en priorité">
          La commune inscrite sur votre courrier correspond-elle à l&apos;endroit où vous étiez garé ?
          Une erreur de commune ou de zone suffit à fonder une contestation.
        </KeyBox>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {COMMUNES.map((c) => (
          <li key={c.slug} className="rounded-xl border border-line bg-card p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-navy-900">{c.nom}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.zones}</p>
            <p className="mt-3 flex gap-2 rounded-md bg-gold-100/70 p-2.5 text-sm text-ink">
              <span aria-hidden="true">→</span>
              {c.aSavoir}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-sm text-ink-soft">
        Ces informations sont des repères. Les zones et les tarifs changent : vérifiez le règlement
        applicable à la date de votre constat.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <LinkBtn href="/contester" variant="gold">
          Préparer ma lettre de contestation
        </LinkBtn>
        <LinkBtn href={`tel:${ASSO.telephoneLien}`} variant="secondary">
          <PhoneIcon className="h-4 w-4" />
          Demander de l&apos;aide
        </LinkBtn>
      </div>
    </div>
  );
}
