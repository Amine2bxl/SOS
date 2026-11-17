import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { estOperateur } from "@/lib/dossiers";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { calculerStatistiques, type LigneAdhesion, type LigneDossier, type LigneProfil } from "@/lib/statistiques";
import { formatMontant } from "@/lib/dossiers-format";
import { IconeFlecheGauche } from "@/components/icones";

export const metadata: Metadata = { title: "Statistiques de l'association" };
export const dynamic = "force-dynamic";

const pct = (x: number) => `${Math.round(x * 100)} %`;

/**
 * Les chiffres de l'association, pour les bénévoles : ce qui se conteste, où,
 * avec quel résultat. Utile pour la presse, les rapports d'activité et les
 * demandes de subside. Aucune donnée personnelle : des totaux seulement.
 */
export default async function Statistiques() {
  if (!(await estOperateur())) notFound();
  const admin = creerClientAdmin();
  if (!admin) {
    return <p className="mx-auto max-w-4xl px-4 py-10 text-ink-soft">Statistiques indisponibles : clé de service non configurée.</p>;
  }
  const [{ data: dossiers }, { data: profils }, { data: adhesions }] = await Promise.all([
    admin.from("dossiers").select("statut, montant, commune, created_at").limit(20000),
    admin.from("profiles").select("plan, created_at").limit(20000),
    admin.from("adhesions").select("statut, montant").limit(20000),
  ]);
  const s = calculerStatistiques((dossiers ?? []) as LigneDossier[], (profils ?? []) as LigneProfil[], (adhesions ?? []) as LigneAdhesion[]);
  const maxMois = Math.max(1, ...s.parMois.map((m) => m.n));
  const maxCommune = Math.max(1, ...s.communes.map((c) => c.n));

  const tuiles = [
    { valeur: String(s.dossiers.total), libelle: "dossiers ouverts", detail: `${s.dossiers.enCours} en préparation · ${s.dossiers.envoyes} envoyés` },
    {
      valeur: s.tauxReussite === null ? "—" : pct(s.tauxReussite),
      libelle: "de redevances annulées",
      detail: `${s.dossiers.annules} annulées · ${s.dossiers.rejetes} rejetées (réponses connues)`,
    },
    { valeur: formatMontant(s.montants.annule), libelle: "économisés aux membres", detail: `sur ${formatMontant(s.montants.conteste)} contestés` },
    { valeur: String(s.membres.comptes), libelle: "comptes", detail: `${s.membres.payants} membres · +${s.membres.nouveauxCeMois} ce mois-ci` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <Link href="/operateur" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline">
        <IconeFlecheGauche className="h-4 w-4" /> Dossiers confiés
      </Link>
      <h1 className="mt-2 font-display text-[1.8rem] font-extrabold leading-tight text-navy-900">L&apos;association en chiffres</h1>
      <p className="mt-1 text-ink-soft">Des totaux seulement, aucune donnée personnelle. Mis à jour à chaque visite.</p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tuiles.map((t) => (
          <div key={t.libelle} className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte">
            <dd className="font-display text-3xl font-extrabold tabular-nums text-navy-900">{t.valeur}</dd>
            <dt className="mt-0.5 text-sm font-semibold text-navy-900">{t.libelle}</dt>
            <p className="mt-2 text-xs text-ink-soft">{t.detail}</p>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte">
          <h2 className="font-display text-lg font-bold text-navy-900">Dossiers ouverts par mois</h2>
          <p className="text-xs text-ink-soft">Les douze derniers mois</p>
          <ol className="mt-5 flex h-44 items-end gap-1.5" aria-label="Dossiers ouverts par mois">
            {s.parMois.map((m) => (
              <li key={m.cle} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${m.libelle} : ${m.n} dossier${m.n > 1 ? "s" : ""}`}>
                <span className="text-[11px] font-semibold tabular-nums text-ink-soft opacity-0 transition group-hover:opacity-100">{m.n}</span>
                <span
                  className="w-full max-w-9 rounded-t-[4px] bg-navy-700 transition-colors group-hover:bg-navy-900"
                  style={{ height: `${Math.max(m.n ? 4 : 2, (m.n / maxMois) * 100)}%`, opacity: m.n ? 1 : 0.25 }}
                />
                <span className="text-[10px] text-ink-faint">{m.libelle}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte">
          <h2 className="font-display text-lg font-bold text-navy-900">Communes les plus contestées</h2>
          {s.communes.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Pas encore de commune renseignée.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {s.communes.map((c) => (
                <li key={c.nom} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className="truncate font-semibold text-navy-900">{c.nom}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-navy-50">
                    <span className="block h-full rounded-full bg-navy-700" style={{ width: `${(c.n / maxCommune) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums text-ink-soft">{c.n}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 grid gap-3 rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-navy-900">Adhésions payées</p>
          <p className="font-display text-2xl font-extrabold tabular-nums text-navy-900">{s.adhesions.payees}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-900">En attente de virement</p>
          <p className="font-display text-2xl font-extrabold tabular-nums text-navy-900">{s.adhesions.enAttente}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-900">Cotisations encaissées</p>
          <p className="font-display text-2xl font-extrabold tabular-nums text-navy-900">{formatMontant(s.adhesions.encaisse)}</p>
        </div>
      </section>
    </div>
  );
}
