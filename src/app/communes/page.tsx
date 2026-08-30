import type { Metadata } from "next";
import { PageHead, KeyBox, LinkBtn } from "@/components/ui";
import { PhoneIcon } from "@/components/Logo";
import { ASSO, COMMUNES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Les 19 communes bruxelloises",
  description:
    "Zones, horaires de paiement, gratuité et régime des riverains dans les 19 communes de la Région de Bruxelles-Capitale, avec les sources officielles à consulter.",
};

/** Source officielle unique pour les tarifs et zones de toutes les communes. */
const PARKING_BRUSSELS = "https://www.parking.brussels";

export default function CommunesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Repères"
        title="Les 19 communes bruxelloises"
        intro="Chaque commune a ses zones, ses horaires et ses règles — posés par son règlement communal, en vigueur à la date des faits. Voici les repères, et la source officielle à consulter pour le chiffre exact."
      />

      {/* Cadre légal et prudence — indispensable avant tout détail. */}
      <div className="mx-auto mt-8 max-w-3xl space-y-4">
        <KeyBox title="Le cadre, valable partout en Région bruxelloise">
          Le stationnement est réglementé par chaque commune dans un règlement communal (le
          « règlement-redevance »). Le contrôle et la perception sont confiés à{" "}
          <strong className="text-navy-900">parking.brussels</strong> (Agence du stationnement).
          Ne pas payer donne lieu à une <strong className="text-navy-900">redevance de
          stationnement</strong> : une dette administrative locale, distincte d&apos;une amende
          pénale de police.
        </KeyBox>
        <p className="text-sm leading-relaxed text-ink-soft">
          Les informations qui suivent sont des repères généraux. Les tarifs, horaires et plages
          de gratuité changent : faites toujours foi du{" "}
          <strong className="text-navy-900">règlement communal applicable à la date de votre
          constat</strong>, affiché sur le site de la commune et consultable via parking.brussels
          et sur les panneaux en rue. En cas de litige, le texte officiel prime sur tout résumé.
        </p>
      </div>

      {/* Les 19 communes */}
      <ul className="mt-10 grid gap-5 md:grid-cols-2">
        {COMMUNES.map((c) => (
          <li key={c.slug} className="flex flex-col rounded-xl border border-line bg-card p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-navy-900">{c.nom}</h2>

            <dl className="mt-3 space-y-3 text-sm">
              {[
                ["Zones", c.zones],
                ["Horaires de paiement", c.heures],
                ["Périodes libres", c.gratuit],
                ["Moyens de paiement", c.moyens],
                ["Riverains", c.riverain],
              ].map(([label, valeur]) => (
                <div key={label}>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                    {label}
                  </dt>
                  <dd className="mt-0.5 leading-relaxed text-ink">{valeur}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-3 rounded-md bg-gold-100/70 p-2.5 text-sm text-ink">
              <span aria-hidden="true">→</span> {c.aSavoir}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
              <a
                href={c.siteOfficiel}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:border-navy-600/50 hover:bg-navy-50"
              >
                Règlement de la commune ↗
              </a>
              <a
                href={PARKING_BRUSSELS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:border-navy-600/50 hover:bg-navy-50"
              >
                parking.brussels ↗
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-soft">
        Ces pages sont un accompagnement d&apos;information : elles ne remplacent ni le règlement
        communal ni un avis juridique. En cas de doute sur le texte applicable, appelez-nous —
        nous vous aiderons à retrouver la bonne version.
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