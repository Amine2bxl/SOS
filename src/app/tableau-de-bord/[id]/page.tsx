import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseConfigure } from "@/lib/supabase/config";
import { ServiceIndisponible } from "@/components/ServiceIndisponible";
import { lireUtilisateur } from "@/lib/supabase/server";
import { lireDossier, listerEvenements, lireProfil } from "@/lib/dossiers";
import {
  TYPES_DOCUMENT, joursAvantEcheance, formatMontant, formatDate,
} from "@/lib/dossiers-format";
import { Card } from "@/components/ui";
import { BadgeStatut, PastilleEcheance } from "@/components/dossier-ui";
import { RafraichirEnTempsReel } from "@/components/RafraichirEnTempsReel";
import { SuiviDossier } from "./SuiviDossier";

export const metadata: Metadata = { title: "Mon dossier" };
export const dynamic = "force-dynamic";

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigure()) return <ServiceIndisponible />;

  const { id } = await params;

  const utilisateur = await lireUtilisateur();
  if (!utilisateur) redirect(`/connexion?suite=/tableau-de-bord/${id}`);

  const dossier = await lireDossier(id);
  // La politique RLS garantit qu'un dossier appartenant à quelqu'un d'autre
  // ressort simplement comme introuvable.
  if (!dossier) notFound();

  const [evenements, profil] = await Promise.all([listerEvenements(id), lireProfil()]);
  const jours = joursAvantEcheance(dossier.date_echeance);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <RafraichirEnTempsReel dossierId={id} />

      <Link href="/tableau-de-bord" className="text-sm font-semibold text-navy-700 hover:underline">
        ← Retour à mes dossiers
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-900">
            {dossier.reference ?? "Dossier sans référence"}
          </h1>
          <p className="mt-1 text-ink-soft">
            {TYPES_DOCUMENT[dossier.type_document] ?? dossier.type_document}
            {dossier.commune && ` — ${dossier.commune}`}
          </p>
        </div>
        <BadgeStatut statut={dossier.statut} />
      </div>

      {jours !== null && jours <= 7 && !["accepte", "rejete", "clos"].includes(dossier.statut) && (
        <div className="mt-5 rounded-xl border-2 border-danger-600/40 bg-danger-100 p-4">
          <p className="font-display font-bold text-danger-700">
            {jours < 0
              ? `L'échéance est dépassée depuis ${-jours} jour${-jours > 1 ? "s" : ""}`
              : jours === 0
                ? "L'échéance, c'est aujourd'hui"
                : `Il ne vous reste que ${jours} jour${jours > 1 ? "s" : ""}`}
          </p>
          <p className="mt-1 text-sm text-ink">
            {jours < 0
              ? "Il reste presque toujours une carte à jouer. Appelez-nous."
              : "Envoyez votre contestation sans attendre et conservez une preuve de l'envoi."}
          </p>
        </div>
      )}

      {/* Informations du dossier */}
      <Card title="Les informations de votre dossier" className="mt-6">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
          {[
            ["Montant réclamé", formatMontant(dossier.montant)],
            ["Plaque", dossier.plaque ?? "—"],
            ["Autorité", dossier.autorite ?? "—"],
            ["Date du constat", formatDate(dossier.date_constat)],
            ["Date limite", formatDate(dossier.date_echeance)],
            ["Commune", dossier.commune ?? "—"],
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

      <SuiviDossier
        dossier={{
          id: dossier.id,
          reference: dossier.reference ?? "",
          plaque: dossier.plaque ?? "",
          montant: dossier.montant !== null ? String(dossier.montant) : "",
          dateConstat: dossier.date_constat ?? "",
          commune: dossier.commune ?? "",
          statut: dossier.statut,
        }}
        profil={{
          prenom: profil?.prenom ?? "",
          nom: profil?.nom ?? "",
          adresse: profil?.adresse ?? "",
          codePostal: profil?.code_postal ?? "",
          ville: profil?.commune ?? "",
          email: profil?.email ?? "",
        }}
      />

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
