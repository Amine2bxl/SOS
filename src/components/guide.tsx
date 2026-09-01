/**
 * Les blocs pédagogiques du site, écrits une seule fois.
 *
 * Le site public et l'espace membre expliquent la même procédure : il serait
 * absurde — et vite contradictoire — d'en tenir deux versions. Ces composants
 * sont la source unique ; chaque page choisit lesquels afficher et dans quel
 * contexte. Ils ne dépendent que de `data.ts` et de `contestation.ts`, jamais
 * d'une session : ils peuvent être rendus par le serveur, côté vitrine comme
 * côté application.
 */

import { Card, Check, KeyBox } from "@/components/ui";
import { DOCUMENTS, NOTIONS, PREUVES } from "@/lib/data";
import { PROCEDURE_RECOUVREMENT } from "@/lib/contestation";

const COULEURS = {
  info: "border-navy-600/30 bg-navy-50",
  attention: "border-warn-600/40 bg-warn-100/60",
  urgent: "border-danger-600/40 bg-danger-100/60",
} as const;

const ETIQUETTES = {
  info: { texte: "Vous avez le temps d'agir", classe: "bg-navy-700 text-white" },
  attention: { texte: "Réagissez maintenant", classe: "bg-warn-600 text-white" },
  urgent: { texte: "Urgent — appelez-nous", classe: "bg-danger-600 text-white" },
} as const;

/**
 * L'escalier des frais : ce que coûte chaque étape si rien n'est fait.
 *
 * Un seul rendu, deux habillages. `sombre` sert sur les fonds navy de la
 * vitrine ; `compact` réduit à l'essentiel pour une fiche de dossier.
 */
export function EscalierProcedure({
  sombre = false,
  etapeCourante,
}: {
  sombre?: boolean;
  /** Index de l'étape où en est l'utilisateur : elle est mise en évidence. */
  etapeCourante?: number;
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {PROCEDURE_RECOUVREMENT.map((etape, i) => {
        const active = etapeCourante === i;
        const premiere = i === 0;
        return (
          <li
            key={etape.titre}
            className={`rounded-xl border p-4 ${
              active
                ? "border-gold-400 bg-gold-100/60 ring-2 ring-gold-400/40"
                : sombre
                  ? "border-white/10 bg-white/5"
                  : premiere
                    ? "border-ok-600/40 bg-ok-100/50"
                    : "border-line bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full font-display text-xs font-black ${
                  premiere && !sombre ? "bg-ok-600 text-white" : "bg-navy-900 text-gold-300"
                }`}
              >
                {i + 1}
              </span>
              {active && (
                <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-black text-navy-950">
                  VOUS ÊTES ICI
                </span>
              )}
            </div>
            <p
              className={`mt-3 font-display text-sm font-bold ${
                sombre && !active ? "text-white" : "text-navy-900"
              }`}
            >
              {etape.titre}
            </p>
            <p
              className={`mt-1 text-[11.5px] leading-snug ${
                sombre && !active ? "text-navy-100/70" : "text-ink-soft"
              }`}
            >
              {etape.quand}
            </p>
            <p
              className={`mt-2 text-xs font-bold ${
                premiere && !sombre ? "text-ok-700" : sombre && !active ? "text-gold-300" : "text-danger-700"
              }`}
            >
              {etape.cout}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** Mention de source, à afficher sous l'escalier. */
export function SourceProcedure({ sombre = false }: { sombre?: boolean }) {
  return (
    <p className={`text-xs leading-relaxed ${sombre ? "text-navy-100/60" : "text-ink-soft"}`}>
      Procédure publiée par parking.brussels ; les montants et délais communaux peuvent différer.
      C&apos;est toujours la mention portée sur votre courrier qui fait foi.
    </p>
  );
}

/** Les cinq courriers de la procédure, expliqués un par un. */
export function QuelCourrier({ typeCourant }: { typeCourant?: string | null }) {
  return (
    <ol className="space-y-4">
      {DOCUMENTS.map((d) => {
        const etiquette = ETIQUETTES[d.gravite];
        // Le document de l'utilisateur est mis en avant, les autres restent lisibles.
        const cestLeVotre = typeCourant ? d.titre.toLowerCase().includes(typeCourant) : false;
        return (
          <li
            key={d.titre}
            className={`rounded-xl border-2 p-5 ${COULEURS[d.gravite]} ${
              cestLeVotre ? "ring-2 ring-gold-400" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-navy-900">{d.titre}</h3>
              <div className="flex items-center gap-2">
                {cestLeVotre && (
                  <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-black text-navy-950">
                    Votre courrier
                  </span>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${etiquette.classe}`}>
                  {etiquette.texte}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              <strong className="text-navy-900">C&apos;est quoi ?</strong> {d.cestQuoi}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              <strong className="text-navy-900">À faire :</strong> {d.aFaire}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** Le vocabulaire administratif, traduit. */
export function NotionsCles() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {NOTIONS.map((n) => (
        <div key={n.titre} className="rounded-xl border border-line bg-card p-5 shadow-sm">
          <h3 className="font-display text-base font-bold text-navy-900">{n.titre}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{n.texte}</p>
        </div>
      ))}
    </div>
  );
}

/** Les preuves qui font la différence. */
export function PreuvesUtiles() {
  return (
    <Card
      title="Les preuves qui font la différence"
      subtitle="Sans preuve, une contestation aboutit rarement."
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {PREUVES.map((p) => (
          <li key={p} className="flex gap-2.5 rounded-md bg-paper p-3 text-sm text-ink">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
            {p}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Le cadre réglementaire bruxellois, en un paragraphe.
 * Affiché par la page publique des communes et par le module « Règles ».
 */
export function CadreReglementaire() {
  return (
    <KeyBox title="Le cadre, valable partout en Région bruxelloise">
      Le stationnement est réglementé par chaque commune dans son règlement-redevance, et géré en
      pratique par <strong className="text-navy-900">parking.brussels</strong>. Ne pas payer donne
      lieu à une <strong className="text-navy-900">redevance de stationnement</strong> : une dette
      administrative locale, distincte d&apos;une amende pénale de police.
    </KeyBox>
  );
}

/** Le point qui surprend tout le monde : payer referme le dossier. */
export function PayerOuContester() {
  return (
    <KeyBox title="Payer ou contester : décidez avant de payer">
      Payer vaut reconnaissance des faits et referme le dossier. Si vous comptez contester,
      faites-le <strong>par écrit, dans le délai indiqué, avec une preuve d&apos;envoi</strong>.
      Attention&nbsp;: introduire une contestation ne suspend pas pour autant l&apos;obligation de
      payer dans ce délai — si elle aboutit, les sommes versées vous sont remboursées.
    </KeyBox>
  );
}
