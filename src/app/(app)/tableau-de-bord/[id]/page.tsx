import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { analyserDossier, lireDossier, lireProfil, listerEvenements, listerLettres } from "@/lib/dossiers";
import {
  JOURS_AVANT_RELANCE,
  TYPES_DOCUMENT,
  formatDate,
  formatMontant,
  joursDepuis,
  prochaineAction,
} from "@/lib/dossiers-format";
import { faitsDepuisDossier } from "@/lib/faits";
import { completudeProfil } from "@/lib/contestation";
import { typeLettreConseille, REGIONS } from "@/cerveau";
import { FICHES } from "@/cerveau/base/savoir";
import { Pastille, Plaque } from "@/components/ui";
import {
  CompteARebours,
  FriseProcedure,
  IconeStade,
  JaugeSolidite,
  NOMS_REGION,
  PastilleStatut,
  nomDossier,
} from "@/components/dossier-ui";
import { RafraichirEnTempsReel } from "@/components/RafraichirEnTempsReel";
import { IconeAttention, IconeFleche, IconeFlecheGauche, IconeLibre, IconeOk } from "@/components/icones";
import { OngletsDossier } from "./OngletsDossier";
import { AtelierLettre } from "./AtelierLettre";
import { SuiviDossier } from "./SuiviDossier";
import { CorrectionFaits, PiecesDossier, QuestionOuverte } from "./AnalyseInteractive";

export const metadata: Metadata = { title: "Mon dossier" };
export const dynamic = "force-dynamic";

const FORCE = {
  solide: { texte: "Argument solide", ton: "ok" },
  serieux: { texte: "Argument sérieux", ton: "signal" },
  possible: { texte: "À étayer", ton: "neutre" },
} as const;

export default async function FicheDossier({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nouveau?: string }>;
}) {
  const [{ id }, { nouveau }] = await Promise.all([params, searchParams]);

  // La politique RLS garantit qu'un dossier appartenant à quelqu'un d'autre
  // ressort simplement comme introuvable.
  const dossier = await lireDossier(id);
  if (!dossier) notFound();

  const [evenements, lettres, profil] = await Promise.all([listerEvenements(id), listerLettres(id), lireProfil()]);

  const analyse = analyserDossier(dossier);
  const action = prochaineAction(dossier, analyse.delai);
  const faits = faitsDepuisDossier(dossier);

  const envoyeDepuis = joursDepuis(dossier.date_envoi_contestation);
  const envoye = dossier.statut === "contestation_envoyee" || dossier.statut === "en_attente_reponse";
  const typeConseille =
    envoye && envoyeDepuis !== null && envoyeDepuis >= JOURS_AVANT_RELANCE
      ? "relance"
      : typeLettreConseille(faits, analyse.strategie.code);

  const manquants = completudeProfil(profil)
    .manquants.filter((c) => c.niveau === "bloquant")
    .map((c) => c.libelle);
  const termine = dossier.statut === "accepte" || dossier.statut === "clos";
  const region = dossier.region ? REGIONS[dossier.region as keyof typeof REGIONS] : null;
  const conseilRejet = FICHES.find((f) => f.id === "contestation-rejetee") ?? null;
  const memePage = action.lien.startsWith(`/tableau-de-bord/${id}`);
  const ancre = memePage ? action.lien.slice(action.lien.indexOf("#")) : action.lien;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:py-10">
      <RafraichirEnTempsReel dossierId={id} />

      <Link
        href="/tableau-de-bord/dossiers"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900 print:hidden"
      >
        <IconeFlecheGauche className="h-4 w-4" />
        Mes dossiers
      </Link>

      {nouveau === "1" && (
        <p className="animate-rise mt-4 flex items-start gap-3 rounded-2xl bg-ok-50 p-4 text-sm text-ok-700">
          <IconeOk className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            <strong>Dossier ouvert.</strong> Votre lettre est prête juste en dessous : relisez-la, complétez ce qui est
            surligné, puis envoyez-la.
          </span>
        </p>
      )}

      {/* ------------------------------------------------------------ en-tête */}
      <header className="mt-4 overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
            <IconeStade stade={dossier.type_document} className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold leading-tight text-navy-900">{nomDossier(dossier)}</h1>
              <PastilleStatut statut={dossier.statut} />
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">
              {TYPES_DOCUMENT[dossier.type_document] ?? "Courrier"}
              {dossier.reference ? ` · ${dossier.reference}` : ""}
              {dossier.region ? ` · ${NOMS_REGION[dossier.region]}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl font-extrabold text-navy-900">{formatMontant(dossier.montant)}</p>
            {dossier.plaque && <Plaque valeur={dossier.plaque} className="mt-1" />}
          </div>
        </div>
        <div className="border-t border-line px-5 py-4 sm:px-6">
          <FriseProcedure stade={dossier.type_document} />
        </div>
      </header>

      {/* --------------------------------------------------- prochaine étape */}
      <section
        aria-label="Prochaine étape"
        className={`relative mt-4 overflow-hidden rounded-[var(--radius-carte)] p-5 shadow-carte sm:p-6 ${
          termine ? "border border-ok-600/30 bg-ok-50" : "bg-navy-900 text-white"
        }`}
      >
        {!termine && <div className="motif-points absolute inset-0" aria-hidden="true" />}
        <div className="relative flex items-center gap-5">
          {!termine && action.ton !== "neutre" && <CompteARebours jours={action.jours} surFonce />}
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold uppercase tracking-[0.16em] ${termine ? "text-ok-700" : "text-gold-400"}`}>
              Prochaine étape
            </p>
            <p className={`mt-1 font-display text-xl font-extrabold leading-tight ${termine ? "text-ok-700" : ""}`}>
              {action.action}
            </p>
            <p className={`mt-1 text-sm leading-relaxed ${termine ? "text-ink-soft" : "text-navy-100"}`}>{action.raison}</p>
          </div>
        </div>
        {!termine && (
          <div className="relative mt-4">
            {memePage ? (
              <a
                href={ancre}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-gold-400 px-5 text-[0.95rem] font-bold text-navy-950 shadow-bouton transition hover:bg-gold-300"
              >
                {action.libelleLien}
                <IconeFleche className="h-5 w-5" />
              </a>
            ) : (
              <Link
                href={action.lien}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-gold-400 px-5 text-[0.95rem] font-bold text-navy-950 shadow-bouton transition hover:bg-gold-300"
              >
                {action.libelleLien}
                <IconeFleche className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}
      </section>

      <OngletsDossier
        onglets={[
          {
            id: "lettre",
            libelle: "Lettre",
            signal: action.ton === "urgent",
            contenu: (
              <AtelierLettre
                dossierId={id}
                typeConseille={typeConseille}
                langueConseillee={analyse.langueLettre}
                lettres={lettres}
                moyens={analyse.moyens.map((m) => ({ id: m.id, titre: m.titre }))}
                profil={{
                  prenom: profil?.prenom ?? "",
                  nom: profil?.nom ?? "",
                  adresse: profil?.adresse ?? "",
                  code_postal: profil?.code_postal ?? "",
                  commune: profil?.commune ?? "",
                  telephone: profil?.telephone ?? "",
                }}
                manquants={manquants}
                region={dossier.region}
                crediteur={dossier.crediteur ?? dossier.autorite}
                statut={dossier.statut}
              />
            ),
          },
          {
            id: "analyse",
            libelle: "Analyse",
            contenu: (
              <div className="space-y-4">
                {!termine && analyse.questions[0] && <QuestionOuverte dossierId={id} question={analyse.questions[0]} />}

                <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">L&apos;avis du moteur</p>
                  <h2 className="mt-1 font-display text-xl font-extrabold text-navy-900">{analyse.strategie.titre}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{analyse.strategie.explication}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-3">
                    <JaugeSolidite niveau={analyse.solidite.niveau} />
                    <span className="text-sm text-ink-soft">{analyse.solidite.explication}</span>
                  </div>
                </section>

                {analyse.alertes.length > 0 && (
                  <ul className="space-y-2">
                    {analyse.alertes.map((a) => (
                      <li key={a} className="flex gap-3 rounded-2xl border border-warn-600/25 bg-warn-100 p-4 text-sm leading-relaxed text-warn-700">
                        <IconeAttention className="mt-0.5 h-5 w-5 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                )}

                {analyse.moyens.length > 0 && (
                  <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
                    <h2 className="font-display text-lg font-bold text-navy-900">Vos arguments</h2>
                    <ul className="mt-4 space-y-3">
                      {analyse.moyens.map((m) => (
                        <li key={m.id} className="flex gap-3.5 rounded-2xl bg-paper p-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-navy-900">
                            <IconeLibre nom={m.icone} className="h-7 w-7" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-navy-900">{m.titre}</p>
                              <Pastille ton={FORCE[m.force].ton}>{FORCE[m.force].texte}</Pastille>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{m.explication}</p>
                            {m.source && <p className="mt-1.5 text-xs text-ink-faint">Fondement : {m.source}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {analyse.pieces.length > 0 && analyse.strategie.code !== "payer" && (
                  <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
                    <h2 className="font-display text-lg font-bold text-navy-900">Pièces à joindre</h2>
                    <div className="mt-3">
                      <PiecesDossier dossierId={id} pieces={analyse.pieces} reunies={dossier.pieces_reunies ?? []} />
                    </div>
                  </section>
                )}

                <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
                  <h2 className="font-display text-lg font-bold text-navy-900">Le délai</h2>
                  <p className="mt-2 text-sm font-semibold text-navy-900">
                    {analyse.delai.limite ? `Jusqu'au ${formatDate(analyse.delai.limite)}` : "Date à vérifier sur votre courrier"}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{analyse.delai.explication}</p>
                  {analyse.inaction && (
                    <p className="mt-3 rounded-2xl bg-danger-50 p-3 text-sm leading-relaxed text-ink">
                      <strong className="text-danger-700">Sans réaction :</strong> {analyse.inaction.etape} —{" "}
                      {analyse.inaction.quand}. {analyse.inaction.surcout}
                    </p>
                  )}
                  {region?.couverture === "generale" && (
                    <p className="mt-3 text-xs leading-relaxed text-ink-faint">
                      En {region.nom}, chaque commune fixe son règlement : le délai exact figure sur votre courrier, et
                      c&apos;est lui qui fait foi.
                    </p>
                  )}
                </section>
              </div>
            ),
          },
          {
            id: "suivi",
            libelle: "Suivi",
            contenu: (
              <SuiviDossier
                dossierId={id}
                statut={dossier.statut}
                evenements={evenements}
                echeance={analyse.delai.limite}
                titreEcheance={`${action.action} — ${nomDossier(dossier)}`}
                conseilRejet={conseilRejet ? { reponse: conseilRejet.reponse, texte: conseilRejet.texte } : null}
              />
            ),
          },
          {
            id: "courrier",
            libelle: "Courrier",
            contenu: (
              <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
                <h2 className="font-display text-lg font-bold text-navy-900">Ce que dit le courrier</h2>
                <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Info terme="Type" valeur={TYPES_DOCUMENT[dossier.type_document]} />
                  <Info terme="Référence" valeur={dossier.reference} mono />
                  <Info terme="Organisme" valeur={dossier.crediteur ?? dossier.autorite} />
                  <Info terme="Commune" valeur={dossier.commune} />
                  <Info terme="Région" valeur={dossier.region ? NOMS_REGION[dossier.region] : null} />
                  <Info terme="Montant" valeur={dossier.montant !== null ? formatMontant(dossier.montant) : null} />
                  <Info terme="Constat" valeur={dossier.date_constat ? `${formatDate(dossier.date_constat)}${dossier.heure_constat ? ` à ${dossier.heure_constat}` : ""}` : null} />
                  <Info terme="Lieu" valeur={dossier.lieu_constat} />
                  <Info terme="Date du courrier" valeur={dossier.date_envoi ? formatDate(dossier.date_envoi) : null} />
                  <Info terme="Date limite imprimée" valeur={dossier.date_echeance ? formatDate(dossier.date_echeance) : null} />
                  <Info terme="Zone" valeur={dossier.zone} />
                  <Info terme="Communication" valeur={dossier.communication} mono />
                </dl>
                <div className="mt-6 border-t border-line pt-5">
                  <CorrectionFaits
                    dossierId={id}
                    region={dossier.region}
                    dateEnvoi={dossier.date_envoi}
                    dateEcheance={dossier.date_echeance}
                  />
                </div>
              </section>
            ),
          },
        ]}
      />
    </div>
  );
}

function Info({ terme, valeur, mono = false }: { terme: string; valeur: string | null | undefined; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{terme}</dt>
      <dd className={`mt-0.5 truncate text-[0.95rem] ${valeur ? "font-semibold text-navy-900" : "text-ink-faint"} ${mono && valeur ? "font-mono" : ""}`}>
        {valeur || "—"}
      </dd>
    </div>
  );
}
