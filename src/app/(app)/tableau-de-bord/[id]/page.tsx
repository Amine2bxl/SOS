import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lireDossier, listerEvenements } from "@/lib/dossiers";
import {
  TYPES_DOCUMENT,
  joursAvantEcheance,
  formatMontant,
  formatDate,
  prochaineAction,
} from "@/lib/dossiers-format";
import { MOTIFS, COMMUNES } from "@/lib/data";
import {
  echeanceContestation,
  DELAI_CONTESTATION_JOURS,
  CONTESTER_NE_SUSPEND_PAS_LE_PAIEMENT,
  PROCEDURE_RECOUVREMENT,
} from "@/lib/contestation";
import { Card, Check } from "@/components/ui";
import { BadgeStatut, PastilleEcheance } from "@/components/dossier-ui";
import { RafraichirEnTempsReel } from "@/components/RafraichirEnTempsReel";
import { SuiviDossier } from "./SuiviDossier";

export const metadata: Metadata = { title: "Mon dossier" };
export const dynamic = "force-dynamic";

const TONS_ACTION = {
  urgent: "border-danger-600/40 bg-danger-100 text-danger-700",
  attention: "border-warn-600/40 bg-warn-100 text-warn-700",
  neutre: "border-navy-600/25 bg-navy-50 text-navy-700",
  termine: "border-ok-600/40 bg-ok-100 text-ok-700",
} as const;

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dossier = await lireDossier(id);
  // La politique RLS garantit qu'un dossier appartenant à quelqu'un d'autre
  // ressort simplement comme introuvable.
  if (!dossier) notFound();

  const evenements = await listerEvenements(id);
  const jours = joursAvantEcheance(dossier.date_echeance);
  const suite = prochaineAction(dossier);
  const motif = MOTIFS.find((m) => m.value === dossier.motif);
  const commune = COMMUNES.find((c) => c.nom === dossier.commune);
  const delai = echeanceContestation(dossier.date_envoi ?? "");
  const termine = ["accepte", "rejete", "clos"].includes(dossier.statut);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <RafraichirEnTempsReel dossierId={id} />

      <Link
        href="/tableau-de-bord"
        className="inline-block text-sm font-semibold text-navy-700 hover:underline print:hidden"
      >
        ← Retour à mes dossiers
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-navy-900">
            {dossier.reference ?? "Dossier sans référence"}
          </h2>
          <p className="mt-1 text-ink-soft">
            {TYPES_DOCUMENT[dossier.type_document] ?? dossier.type_document}
            {dossier.commune && ` — ${dossier.commune}`}
          </p>
        </div>
        <BadgeStatut statut={dossier.statut} />
      </div>

      {/* LA PROCHAINE CHOSE À FAIRE — avant toute autre information. */}
      <div className={`mt-5 rounded-xl border-2 p-5 print:hidden ${TONS_ACTION[suite.ton]}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">
          Prochaine étape
        </p>
        <p className="mt-1 font-display text-xl font-bold">{suite.action}</p>
        <p className="mt-1 text-sm text-ink">{suite.raison}</p>
        {suite.ton !== "termine" && (
          <Link
            href={suite.lien}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:shadow"
          >
            {suite.libelleLien} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      {/* Informations du dossier */}
      <Card title="Les informations de votre dossier" className="mt-6">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
          {[
            ["Montant réclamé", formatMontant(dossier.montant)],
            ["Plaque", dossier.plaque ?? "—"],
            ["Autorité", dossier.autorite ?? "—"],
            ["Date du constat", formatDate(dossier.date_constat)],
            ["Heure du constat", dossier.heure_constat ?? "—"],
            ["Date limite", formatDate(dossier.date_echeance)],
            ["Lieu du constat", dossier.lieu_constat ?? "—"],
            ["Commune", dossier.commune ?? "—"],
            ["Zone", dossier.zone ?? "—"],
            ["Communication structurée", dossier.communication ?? "—"],
            ["Courrier envoyé le", formatDate(dossier.date_envoi)],
            ["IBAN du courrier", dossier.iban ?? "—"],
          ].map(([label, valeur]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
              <dd className="mt-0.5 font-semibold text-navy-900">{valeur}</dd>
            </div>
          ))}
        </dl>
        {dossier.date_echeance && (
          <div className="mt-4">
            <PastilleEcheance jours={jours} />
          </div>
        )}
      </Card>

      {/* Le délai de contestation, calculé depuis la date d'envoi du courrier. */}
      {delai && !termine && (
        <Card
          title="Votre délai pour contester"
          className={`mt-6 print:hidden ${delai.depasse ? "border-danger-600/40" : "border-navy-600/30"}`}
        >
          <p className="font-display text-lg font-bold text-navy-900">
            {delai.depasse
              ? `Dépassé depuis ${-delai.joursRestants} jour${-delai.joursRestants > 1 ? "s" : ""}`
              : `${delai.joursRestants} jour${delai.joursRestants > 1 ? "s" : ""} restant${delai.joursRestants > 1 ? "s" : ""}`}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Calcul indicatif : {DELAI_CONTESTATION_JOURS} jours à compter du{" "}
            {formatDate(dossier.date_envoi)}, soit jusqu&apos;au {formatDate(delai.limite)}.{" "}
            <strong className="text-navy-900">
              C&apos;est la mention portée sur votre courrier qui fait foi
            </strong>{" "}
            — les délais varient d&apos;une commune à l&apos;autre.
          </p>
          <p className="mt-3 rounded-md bg-navy-50 p-3 text-sm leading-relaxed text-ink">
            {CONTESTER_NE_SUSPEND_PAS_LE_PAIEMENT}
          </p>
        </Card>
      )}

      {/* Pièces attendues pour le motif retenu : la contestation vit ou meurt là-dessus. */}
      {motif && (
        <Card
          title="Les pièces à joindre"
          subtitle={`Motif retenu : ${motif.label.toLowerCase()}. Sans preuve, une contestation aboutit rarement.`}
          className="mt-6"
        >
          <ul className="space-y-2">
            {[...motif.pieces, "Copie du courrier reçu"].map((p) => (
              <li key={p} className="flex gap-2.5 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <SuiviDossier
        dossier={{ id: dossier.id, statut: dossier.statut, lettre: dossier.lettre }}
      />

      {/* Les règles de la commune du constat, à portée du dossier. */}
      {commune && (
        <Card
          title={`Les règles à ${commune.nom}`}
          subtitle="Ce sont elles qui s'appliquent à votre constat."
          className="mt-6 print:hidden"
        >
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              ["Zones", commune.zones],
              ["Horaires de paiement", commune.heures],
              ["Périodes libres", commune.gratuit],
              ["Riverains", commune.riverain],
            ].map(([label, valeur]) => (
              <div key={label}>
                <dt className="text-xs font-bold uppercase tracking-wide text-navy-700">{label}</dt>
                <dd className="mt-0.5 text-sm leading-relaxed text-ink">{valeur}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-md bg-gold-100/70 p-3 text-sm leading-relaxed text-ink">
            <span className="font-bold text-navy-900">À retenir :</span> {commune.aSavoir}
          </p>
          <a
            href={commune.parking}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
          >
            Source officielle — parking.brussels ↗
          </a>
        </Card>
      )}

      {/* Ce qui arrive si rien n'est fait : la note grimpe à chaque étape. */}
      {!termine && (
        <Card
          title="Ce qui se passe si rien n'est fait"
          subtitle="Procédure publiée par parking.brussels. Les montants et délais communaux peuvent différer."
          className="mt-6 print:hidden"
        >
          <ol className="space-y-3">
            {PROCEDURE_RECOUVREMENT.map((etape, i) => (
              <li key={etape.titre} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-navy-900">
                    {etape.titre}{" "}
                    <span className="font-medium text-ink-soft">— {etape.quand}</span>
                  </p>
                  <p className="text-sm text-danger-700">{etape.cout}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{etape.aFaire}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Chronologie */}
      <Card title="Chronologie" subtitle="Tout ce qui s'est passé sur ce dossier." className="mt-6">
        <ol className="space-y-4">
          {evenements.map((e) => (
            <li key={e.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-navy-800" />
                <span className="mt-1 w-px flex-1 bg-line" />
              </div>
              <div className="pb-1">
                <p className="font-semibold text-navy-900">{e.titre}</p>
                <p className="text-xs text-ink-soft">
                  {new Date(e.date_evenement).toLocaleString("fr-BE", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
                {e.note && <p className="mt-1 text-sm text-ink-soft">{e.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
