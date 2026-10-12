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

import { Card, KeyBox } from "@/components/ui";
import { IconeHuissier, IconeLettre, IconeMiseEnDemeure, IconeSceau, IconeTicket } from "@/components/icones";
import { DOCUMENTS, NOTIONS, PREUVES } from "@/lib/data";
import { PROCEDURE_RECOUVREMENT } from "@/lib/contestation";

const COULEURS = {
  info: "border-l-azur-600 bg-card",
  attention: "border-l-gold-500 bg-card",
  urgent: "border-l-danger-600 bg-danger-50",
} as const;

const ETIQUETTES = {
  info: { texte: "Vous avez le temps d'agir", classe: "bg-azur-100 text-azur-700" },
  attention: { texte: "Réagissez maintenant", classe: "bg-gold-100 text-gold-700" },
  urgent: { texte: "Urgent — réagissez aujourd'hui", classe: "bg-danger-600 text-white" },
} as const;

const ICONES_ETAPES = [IconeTicket, IconeLettre, IconeMiseEnDemeure, IconeSceau, IconeHuissier];

/**
 * L'escalier des frais : ce que coûte chaque étape si rien n'est fait.
 *
 * Les marches montent pour de bon : chaque carte est un peu plus haute que la
 * précédente, et passe au rouge à partir de la contrainte. On comprend sans
 * lire qu'il vaut mieux agir sur la première.
 */
export function EscalierProcedure({ etapeCourante }: { etapeCourante?: number } = {}) {
  return (
    <ol className="grid gap-3 lg:grid-cols-5 lg:items-end">
      {PROCEDURE_RECOUVREMENT.map((etape, i) => {
        const Icone = ICONES_ETAPES[i] ?? IconeTicket;
        const ici = etapeCourante === i;
        return (
          <li
            key={etape.titre}
            className={`rounded-[var(--radius-carte)] border p-5 ${
              ici
                ? "border-gold-400 bg-gold-50 ring-2 ring-gold-400/40"
                : i === 0
                  ? "border-gold-300 bg-gold-50"
                  : i >= 3
                    ? "border-danger-600/20 bg-danger-50"
                    : "border-line bg-paper"
            }`}
            style={{ minHeight: `${9 + i * 1.6}rem` }}
          >
            <div className="flex items-center justify-between gap-2">
              <Icone className="h-9 w-9 text-navy-900" />
              {(ici || (etapeCourante === undefined && i === 0)) && (
                <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-navy-950">
                  {ici ? "VOUS ÊTES ICI" : "AGIR ICI"}
                </span>
              )}
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-navy-900">{etape.titre}</h3>
            <p className="mt-0.5 text-xs text-ink-soft">{etape.quand}</p>
            <p className={`mt-2 text-sm font-bold ${i === 0 ? "text-navy-900" : "text-danger-700"}`}>{etape.cout}</p>
          </li>
        );
      })}
    </ol>
  );
}

/** Mention de source, à afficher sous l'escalier. */
export function SourceProcedure({ sombre = false }: { sombre?: boolean }) {
  return (
    <p className={`text-xs leading-relaxed ${sombre ? "text-navy-100/60" : "text-ink-faint"}`}>
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
            className={`rounded-[var(--radius-carte)] border border-l-4 border-line/80 p-5 shadow-carte ${COULEURS[d.gravite]} ${
              cestLeVotre ? "ring-2 ring-gold-400" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-navy-900">{d.titre}</h3>
              <div className="flex items-center gap-2">
                {cestLeVotre && (
                  <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-navy-950">
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
        <div key={n.titre} className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte">
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
          <li key={p} className="flex gap-3 rounded-2xl bg-paper p-3 text-sm text-ink">
            <span className="mt-2 h-1 w-3.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
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

/** Le point qui surprend tout le monde : payer sans rien dire referme le dossier. */
export function PayerOuContester() {
  return (
    <KeyBox title="Payer ou contester : décidez avant de payer">
      Payer sans rien dire vaut acceptation : le dossier se referme. Si vous contestez, faites-le{" "}
      <strong>par écrit, dans le délai indiqué, avec une preuve d&apos;envoi</strong>. La contestation ne
      suspend pas le délai de paiement : vous pouvez payer pour éviter les frais de rappel — si elle
      aboutit, la somme vous est remboursée.
    </KeyBox>
  );
}
