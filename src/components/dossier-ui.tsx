/**
 * Les signes d'un dossier, partagés par l'accueil, la liste et la fiche.
 *
 * Un dossier se lit en trois secondes : où il en est dans la procédure (la
 * frise), combien de temps il reste (le compte à rebours), et ce qu'il faut
 * faire (la prochaine action). Tout le reste est secondaire.
 */

import Link from "next/link";
import { IconeFleche, IconeLibre } from "@/components/icones";
import { Pastille, Plaque, type TonPastille } from "@/components/ui";
import {
  STATUTS,
  TYPES_DOCUMENT,
  formatMontant,
  type Dossier,
  type ProchaineAction,
} from "@/lib/dossiers-format";

export const NOMS_REGION: Record<string, string> = {
  bruxelles: "Bruxelles",
  wallonie: "Wallonie",
  flandre: "Flandre",
};

const TON_STATUT: Record<string, TonPastille> = {
  attention: "attention",
  neutre: "info",
  ok: "ok",
  risque: "danger",
};

export function PastilleStatut({ statut }: { statut: string }) {
  const s = STATUTS[statut] ?? { label: statut, ton: "neutre" as const };
  return <Pastille ton={TON_STATUT[s.ton]}>{s.label}</Pastille>;
}

/** « 3 jours », « Aujourd'hui », « Dépassé » — rouge dès que ça presse. */
export function PastilleDelai({ jours }: { jours: number | null }) {
  if (jours === null) return null;
  if (jours < 0) return <Pastille ton="danger">Délai dépassé</Pastille>;
  if (jours === 0) return <Pastille ton="danger">Aujourd&apos;hui</Pastille>;
  return (
    <Pastille ton={jours <= 2 ? "danger" : jours <= 7 ? "attention" : "neutre"}>
      {jours} jour{jours > 1 ? "s" : ""}
    </Pastille>
  );
}

const ICONE_STADE: Record<string, string> = {
  notification: "ticket",
  premier_rappel: "lettre",
  deuxieme_rappel: "lettre",
  mise_en_demeure: "mise-en-demeure",
  contrainte: "sceau",
  courrier_huissier: "huissier",
};

export function IconeStade({ stade, className = "h-7 w-7" }: { stade: string; className?: string }) {
  return <IconeLibre nom={ICONE_STADE[stade] ?? "ticket"} className={className} />;
}

/**
 * Le compte à rebours : le chiffre qui compte, en très gros.
 *
 * Un anneau qui se vide à mesure que l'échéance approche (sur trente jours),
 * et dont la couleur passe de l'encre au rouge. Sans date connue, on le dit
 * — on n'invente pas d'urgence.
 */
export function CompteARebours({
  jours,
  taille = "md",
  surFonce = false,
}: {
  jours: number | null;
  taille?: "md" | "lg";
  surFonce?: boolean;
}) {
  const dim = taille === "lg" ? 112 : 76;
  const trait = taille === "lg" ? 9 : 7;
  const r = (dim - trait) / 2;
  const circonference = 2 * Math.PI * r;
  const part = jours === null ? 0 : jours < 0 ? 1 : Math.max(0.04, Math.min(1, 1 - jours / 30));
  const couleur =
    jours === null
      ? "var(--color-ink-faint)"
      : jours <= 2
        ? "var(--color-danger-600)"
        : jours <= 7
          ? "var(--color-gold-500)"
          : surFonce
            ? "var(--color-gold-400)"
            : "var(--color-navy-900)";

  const chiffre = jours === null ? "?" : jours < 0 ? "!" : String(jours);
  const legende =
    jours === null ? "date à vérifier" : jours < 0 ? "dépassé" : jours === 0 ? "aujourd'hui" : jours === 1 ? "jour" : "jours";

  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }} role="img" aria-label={jours === null ? "Délai inconnu" : jours < 0 ? "Délai dépassé" : `${jours} jours restants`}>
      <svg viewBox={`0 0 ${dim} ${dim}`} className="h-full w-full -rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={surFonce ? "rgb(255 255 255 / 0.14)" : "var(--color-line)"} strokeWidth={trait} />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke={couleur}
          strokeWidth={trait}
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - part)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className={`font-display font-extrabold ${taille === "lg" ? "text-4xl" : "text-2xl"} ${surFonce ? "text-white" : "text-navy-900"}`}
        >
          {chiffre}
        </span>
        <span className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${surFonce ? "text-navy-100" : "text-ink-soft"}`}>
          {legende}
        </span>
      </div>
    </div>
  );
}

/** La solidité du dossier, en trois crans. */
export function JaugeSolidite({ niveau }: { niveau: "solide" | "defendable" | "fragile" }) {
  const rang = { fragile: 1, defendable: 2, solide: 3 }[niveau];
  const libelle = { fragile: "Fragile", defendable: "Défendable", solide: "Solide" }[niveau];
  const couleur = { fragile: "bg-danger-600", defendable: "bg-gold-500", solide: "bg-ok-600" }[niveau];
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-2.5 w-7 rounded-full ${i <= rang ? couleur : "bg-line"}`} />
        ))}
      </div>
      <span className="text-sm font-bold text-navy-900">{libelle}</span>
    </div>
  );
}

const ETAPES_FRISE = [
  { stade: "notification", court: "Avis" },
  { stade: "premier_rappel", court: "Rappel" },
  { stade: "deuxieme_rappel", court: "2e rappel" },
  { stade: "mise_en_demeure", court: "Mise en demeure" },
  { stade: "contrainte", court: "Contrainte" },
  { stade: "courrier_huissier", court: "Huissier" },
];

/**
 * Où en est-on ? La procédure en six marches, celle du courrier reçu
 * surlignée. On comprend d'un regard qu'il vaut mieux agir maintenant que
 * deux marches plus haut.
 */
export function FriseProcedure({ stade, surFonce = false }: { stade: string; surFonce?: boolean }) {
  const actuel = Math.max(0, ETAPES_FRISE.findIndex((e) => e.stade === stade));
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="Étape de la procédure">
      {ETAPES_FRISE.map((e, i) => {
        const passe = i < actuel;
        const ici = i === actuel;
        return (
          <li key={e.stade} className="min-w-0" aria-current={ici ? "step" : undefined}>
            <span
              className={`block h-1.5 rounded-full ${
                ici
                  ? i >= 3
                    ? "bg-danger-600"
                    : "bg-gold-400"
                  : passe
                    ? surFonce
                      ? "bg-white/70"
                      : "bg-navy-900"
                    : surFonce
                      ? "bg-white/15"
                      : "bg-line"
              }`}
            />
            <span
              className={`mt-1.5 block truncate text-[10px] sm:text-[11px] ${
                ici ? `font-bold ${surFonce ? "text-white" : "text-navy-900"}` : surFonce ? "text-navy-200" : "text-ink-faint"
              }`}
            >
              {e.court}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Le nom qu'on donne à un dossier : là où ça s'est passé, sinon qui réclame. */
export function nomDossier(d: Pick<Dossier, "commune" | "crediteur" | "autorite" | "type_document">): string {
  return d.commune || d.crediteur || d.autorite || TYPES_DOCUMENT[d.type_document] || "Redevance";
}

/**
 * Un dossier dans une liste : l'essentiel d'un coup d'œil, et la prochaine
 * action en bas, là où le regard finit.
 */
export function CarteDossier({ dossier, action }: { dossier: Dossier; action: ProchaineAction }) {
  const termine = action.ton === "termine";
  const bandeau =
    action.ton === "urgent" ? "bg-danger-600" : action.ton === "attention" ? "bg-gold-400" : termine ? "bg-ok-600" : "bg-azur-600";

  return (
    <Link
      href={`/tableau-de-bord/${dossier.id}`}
      className="group relative flex overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte transition hover:-translate-y-0.5 hover:shadow-flotte"
    >
      <span className={`w-1.5 shrink-0 ${bandeau}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
            <IconeStade stade={dossier.type_document} className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-display text-base font-bold text-navy-900">{nomDossier(dossier)}</h3>
              <PastilleStatut statut={dossier.statut} />
            </div>
            <p className="mt-0.5 truncate text-sm text-ink-soft">
              {TYPES_DOCUMENT[dossier.type_document] ?? "Courrier"}
              {dossier.reference ? ` · ${dossier.reference}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-extrabold text-navy-900">{formatMontant(dossier.montant)}</p>
            {dossier.plaque && <Plaque valeur={dossier.plaque} className="mt-1 scale-90 origin-right" />}
          </div>
        </div>

        <div className="trait-detache mt-4" aria-hidden="true" />

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-bold ${action.ton === "urgent" ? "text-danger-700" : "text-navy-900"}`}>
              {action.action}
            </p>
            <p className="truncate text-xs text-ink-soft">{action.raison}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!termine && <PastilleDelai jours={action.jours} />}
            <IconeFleche className="h-5 w-5 text-navy-700 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
