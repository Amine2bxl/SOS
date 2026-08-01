"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Dossier } from "@/db/schema";
import {
  NATURES, DOCUMENTS, DESTINATAIRES, CONDUCTEURS, MODES_CONTROLE, MODES_RECEPTION,
  CANAUX_CONTESTATION, MOTIFS, MOTIF_QUESTIONS, PIECES, INVENTAIRE_KEYS, TECHNIQUES,
  ADMINISTRATIVES, JURIDIQUES, DONNEES_PERSO, DEMANDES, labelOf, formatMontant, formatDate,
} from "@/lib/constants";
import type { AuditResult } from "@/lib/audit";
import {
  PageHead, SectionCard, Field, TextInput, TextArea, SelectInput, RadioCards,
  CheckGrid, EduBox, LearnedBox, Btn, StatusBadge,
} from "@/components/ui";

const STEP_TITLES = [
  "Identifier votre dossier",
  "Reconstituer la procédure et les délais",
  "Décrire les faits et examiner les preuves",
  "Vérifier les documents et préparer les demandes",
  "Résultats de l'analyse",
];

export default function AnalyserPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-soft">Chargement de l'assistant…</div>}>
      <Wizard />
    </Suspense>
  );
}

function Wizard() {
  const router = useRouter();
  const sp = useSearchParams();
  const idParam = sp.get("d");
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [etape, setEtape] = useState(Math.min(5, Math.max(1, Number(sp.get("etape") || 1))));
  const [communeNames, setCommuneNames] = useState<string[]>([]);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/communes").then((r) => r.json()).then((rows) => setCommuneNames(rows.map((r: { nom: string }) => r.nom))).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!idParam) {
        const res = await fetch("/api/dossiers", { method: "POST" });
        const d = await res.json();
        if (!cancelled) {
          setDossier(d);
          router.replace(`/analyser?d=${d.id}&etape=1`);
        }
      } else {
        const res = await fetch(`/api/dossiers/${idParam}`);
        if (res.ok) {
          const d = await res.json();
          if (!cancelled) setDossier(d);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [idParam, router]);

  useEffect(() => {
    if (etape === 5 && dossier) {
      fetch(`/api/dossiers/${dossier.id}/audit`).then((r) => r.json()).then(setAudit).catch(() => {});
    }
  }, [etape, dossier]);

  const patch = async (data: Record<string, unknown>) => {
    if (!dossier) return;
    const res = await fetch(`/api/dossiers/${dossier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setDossier(updated);
    return updated;
  };

  const goTo = async (n: number, data?: Record<string, unknown>) => {
    setBusy(true);
    if (data) await patch(data);
    await patch({ etape: n });
    setEtape(n);
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!dossier) {
    return <div className="p-16 text-center text-ink-soft">Préparation de votre dossier…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Progression */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-ink-soft">
          <span>Référence dossier : {dossier.ref}</span>
          <span>Étape {etape} sur 6</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEP_TITLES.map((t, i) => (
            <button
              key={t}
              onClick={() => i + 1 < etape && setEtape(i + 1)}
              title={t}
              className={`h-2 flex-1 rounded-full transition ${i + 1 <= etape ? "bg-navy-800" : "bg-line"}`}
              aria-label={`Étape ${i + 1} : ${t}`}
            />
          ))}
          <div className={`h-2 w-8 rounded-full ${etape === 5 ? "bg-gold-400" : "bg-line"}`} title="Courrier et suivi" />
        </div>
        <p className="mt-2 text-center font-display text-lg font-bold text-navy-900">
          {etape}. {STEP_TITLES[etape - 1]}
        </p>
      </div>

      {etape === 1 && <Step1 d={dossier} patch={patch} next={() => goTo(2)} communeNames={communeNames} />}
      {etape === 2 && <Step2 d={dossier} patch={patch} next={() => goTo(3)} back={() => setEtape(1)} />}
      {etape === 3 && <Step3 d={dossier} patch={patch} next={() => goTo(4)} back={() => setEtape(2)} />}
      {etape === 4 && <Step4 d={dossier} patch={patch} next={() => goTo(5)} back={() => setEtape(3)} busy={busy} />}
      {etape === 5 && audit && (
        <Step5
          d={dossier}
          audit={audit}
          back={() => setEtape(4)}
          finish={async () => {
            await patch({ etape: 6, statut: "pret" });
            router.push(`/dossiers/${dossier.id}`);
          }}
        />
      )}
      {etape === 5 && !audit && <div className="p-10 text-center text-ink-soft">Calcul de l'audit en cours…</div>}
    </div>
  );
}

function NavBtns({ back, nextLabel = "Continuer", onNext, onBack, busy }: { back?: () => void; nextLabel?: string; onNext: () => void; onBack?: () => void; busy?: boolean }) {
  return (
    <div className="mt-8 flex justify-between gap-3">
      {onBack ? (
        <Btn variant="secondary" onClick={onBack}>← Retour</Btn>
      ) : <span />}
      <Btn onClick={onNext} disabled={busy}>{nextLabel} →</Btn>
    </div>
  );
}

/* ---------------- ÉTAPE 1 ---------------- */
function Step1({ d, patch, next, communeNames }: { d: Dossier; patch: (x: Record<string, unknown>) => Promise<unknown>; next: () => void; communeNames: string[] }) {
  const set = (data: Record<string, unknown>) => patch(data);
  return (
    <div className="space-y-5 animate-rise">
      <PageHead
        title="1. Identifier votre dossier"
        intro="Cette première étape détermine la nature de la procédure, la commune compétente, le stade du dossier et les informations qui devront être vérifiées."
      />
      <EduBox title="Pourquoi cette étape est-elle importante ?">
        Une notification initiale, un premier rappel, une mise en demeure et un courrier d'huissier n'appellent
        pas la même réaction. La plateforme adaptera les questions et les documents demandés au stade exact de
        votre dossier.
      </EduBox>

      <SectionCard title="Section 1 — Nature du dossier">
        <RadioCards options={NATURES} value={d.natureDossier} onChange={(v) => set({ natureDossier: v })} />
        {d.natureDossier === "nspp" && (
          <p className="mt-3 rounded-md bg-navy-50 p-3 text-sm text-navy-800">
            En cas d'incertitude, indiquez ci-dessous une photographie lisible du document : la plateforme vous
            aidera à identifier sa nature.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Section 2 — Document reçu">
        <RadioCards columns={2} options={DOCUMENTS} value={d.documentRecu} onChange={(v) => set({ documentRecu: v })} />
      </SectionCard>

      <SectionCard title="Section 3 — Personnes concernées">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-navy-900">Qui a reçu le document ?</p>
            <RadioCards options={DESTINATAIRES} value={d.destinataireType} onChange={(v) => set({ destinataireType: v })} />
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-navy-900">Qui conduisait le véhicule ?</p>
            <RadioCards options={CONDUCTEURS} value={d.conducteur} onChange={(v) => set({ conducteur: v })} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Section 4 — Identité et coordonnées">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom"><TextInput value={d.prenom ?? ""} onChange={(e) => set({ prenom: e.target.value })} /></Field>
          <Field label="Nom"><TextInput value={d.nom ?? ""} onChange={(e) => set({ nom: e.target.value })} /></Field>
          <Field label="Adresse complète" className="sm:col-span-2"><TextInput value={d.adresse ?? ""} onChange={(e) => set({ adresse: e.target.value })} /></Field>
          <Field label="Code postal"><TextInput value={d.codePostal ?? ""} onChange={(e) => set({ codePostal: e.target.value })} /></Field>
          <Field label="Commune de résidence"><TextInput value={d.communeResidence ?? ""} onChange={(e) => set({ communeResidence: e.target.value })} /></Field>
          <Field label="E-mail"><TextInput type="email" value={d.email ?? ""} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Téléphone"><TextInput value={d.telephone ?? ""} onChange={(e) => set({ telephone: e.target.value })} /></Field>
        </div>
        <label className="mt-4 flex items-center gap-2.5 text-sm font-medium text-ink">
          <input type="checkbox" checked={d.representeSos} onChange={(e) => set({ representeSos: e.target.checked })} className="h-4 w-4 accent-[#0b2545]" />
          Je suis accompagné ou représenté par SOS Citizens ASBL
        </label>
        {d.representeSos && (
          <div className="mt-3">
            <p className="mb-2 text-[13px] font-semibold text-navy-900">Documents liés à la représentation</p>
            <CheckGrid
              options={[
                { value: "mandat", label: "Mandat de représentation" },
                { value: "carte_identite", label: "Copie de la carte d'identité" },
                { value: "autre", label: "Autre justificatif" },
              ]}
              values={d.documentsRepresentation ?? []}
              onToggle={(v) => {
                const cur = d.documentsRepresentation ?? [];
                set({ documentsRepresentation: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
              }}
            />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Section 5 — Références du dossier">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Numéro de redevance"><TextInput value={d.refRedevance ?? ""} onChange={(e) => set({ refRedevance: e.target.value })} placeholder="ex : 830202712650" /></Field>
          <Field label="Référence de contestation"><TextInput value={d.refContestation ?? ""} onChange={(e) => set({ refContestation: e.target.value })} /></Field>
          <Field label="Référence du courrier d'huissier"><TextInput value={d.refHuissier ?? ""} onChange={(e) => set({ refHuissier: e.target.value })} /></Field>
          <Field label="Plaque d'immatriculation" required><TextInput value={d.plaque ?? ""} onChange={(e) => set({ plaque: e.target.value.toUpperCase() })} placeholder="1-ABC-123" /></Field>
          <Field label="Nom de l'autorité ou de l'opérateur"><TextInput value={d.autorite ?? ""} onChange={(e) => set({ autorite: e.target.value })} placeholder="parking.brussels" /></Field>
          <Field label="Commune du constat">
            <TextInput list="communes-list" value={d.communeConstat ?? ""} onChange={(e) => set({ communeConstat: e.target.value })} placeholder="Bruxelles-Ville" />
            <datalist id="communes-list">
              {communeNames.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
          <Field label="Montant actuellement réclamé (€)"><TextInput value={d.montantReclame ?? ""} onChange={(e) => set({ montantReclame: e.target.value })} placeholder="125,00" /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Section 6 — Dépôt du document">
        <Field label="Ajouter une photographie ou un PDF du document reçu" hint="Photographiez le document en entier. Vérifiez que les références, dates, montants et coordonnées restent lisibles.">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => set({ documentFileName: e.target.files?.[0]?.name ?? null })}
            className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-800"
          />
        </Field>
        {d.documentFileName && <p className="mt-2 text-sm font-medium text-ok-700">Fichier joint : {d.documentFileName}</p>}
      </SectionCard>

      <LearnedBox items={[
        "Le type de document reçu détermine la prochaine étape.",
        "La plaque, le numéro de redevance et les références doivent toujours être vérifiés.",
        "La personne qui reçoit le courrier n'est pas nécessairement celle qui conduisait le véhicule.",
      ]} />

      <NavBtns onNext={next} nextLabel="Continuer vers la chronologie" />
    </div>
  );
}

/* ---------------- ÉTAPE 2 ---------------- */
function Step2({ d, patch, next, back }: { d: Dossier; patch: (x: Record<string, unknown>) => Promise<unknown>; next: () => void; back: () => void }) {
  const c = d.chronologie ?? {};
  const set = (k: string, v: string) => patch({ chronologie: { ...c, [k]: v } });

  const seq: [string, string][] = [
    ["date_constat", "Constat"], ["notif_date", "Notification"], ["rappel1_date", "Premier rappel"],
    ["contestation_date", "Contesté"], ["accuse_date", "Accusé de réception"], ["rappel2_date", "Deuxième rappel"],
    ["mise_en_demeure_date", "Mise en demeure"], ["contrainte_date", "Contrainte"], ["huissier_date", "Huissier"],
  ];
  const frise = seq.filter(([k]) => c[k]).map(([k, l]) => ({ k, l, t: new Date(c[k]).getTime() }));
  const sorted = [...frise].sort((a, b) => a.t - b.t);
  const incoherent = frise.some((e, i) => sorted[i]?.k !== e.k);

  const alerts: string[] = [];
  if (!c["date_constat"]) alerts.push("Date du constat manquante");
  if (incoherent) alerts.push("Ordre chronologique incohérent : les dates saisies ne suivent pas la séquence attendue");
  if (c["contestation_date"] && (c["rappel1_date"] || c["rappel2_date"])) {
    const ct = new Date(c["contestation_date"]).getTime();
    if ((c["rappel1_date"] && new Date(c["rappel1_date"]).getTime() > ct) || (c["rappel2_date"] && new Date(c["rappel2_date"]).getTime() > ct)) {
      alerts.push("Rappel émis pendant l'examen d'une contestation");
    }
  }
  if (c["huissier_date"] && !c["mise_en_demeure_date"]) alerts.push("Document annoncé mais absent du dossier : mise en demeure non renseignée avant huissier");

  return (
    <div className="space-y-5 animate-rise">
      <PageHead
        title="2. Reconstituer la procédure et les délais"
        intro="La chronologie constitue l'un des éléments centraux du dossier. La plateforme rassemble les dates du constat, des courriers, des recours et des réponses afin de repérer les incohérences ou les informations manquantes."
      />
      <EduBox title="Un écart de date n'annule pas automatiquement la redevance">
        Il faut déterminer si le délai est imposé par un texte applicable, s'il a été respecté et si une
        irrégularité affecte les droits de l'usager.
      </EduBox>

      <SectionCard title="Section 1 — Le constat">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date du constat" required><TextInput type="date" value={c["date_constat"] ?? ""} onChange={(e) => set("date_constat", e.target.value)} /></Field>
          <Field label="Heure du constat"><TextInput type="time" value={c["heure_constat"] ?? ""} onChange={(e) => set("heure_constat", e.target.value)} /></Field>
          <Field label="Zone de stationnement (si connue)"><TextInput value={c["zone"] ?? ""} onChange={(e) => set("zone", e.target.value)} placeholder="Zone verte" /></Field>
          <Field label="Rue" className="sm:col-span-2"><TextInput value={c["rue"] ?? ""} onChange={(e) => set("rue", e.target.value)} placeholder="Rue de la Loi 100" /></Field>
          <Field label="Numéro ou repère"><TextInput value={c["numero"] ?? ""} onChange={(e) => set("numero", e.target.value)} /></Field>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[13px] font-semibold text-navy-900">Mode de contrôle</p>
          <RadioCards columns={2} options={MODES_CONTROLE} value={c["mode_controle"]} onChange={(v) => set("mode_controle", v)} />
        </div>
      </SectionCard>

      <SectionCard title="Section 2 — La notification initiale">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date figurant sur le document"><TextInput type="date" value={c["notif_date"] ?? ""} onChange={(e) => set("notif_date", e.target.value)} /></Field>
          <Field label="Date de réception"><TextInput type="date" value={c["notif_reception"] ?? ""} onChange={(e) => set("notif_reception", e.target.value)} /></Field>
          <Field label="La notification est-elle disponible ?">
            <SelectInput options={[{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }]} value={c["notif_dispo"] ?? ""} onChange={(e) => set("notif_dispo", e.target.value)} placeholder="Choisir" />
          </Field>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[13px] font-semibold text-navy-900">Mode de réception</p>
          <RadioCards columns={2} options={MODES_RECEPTION} value={c["mode_reception"]} onChange={(v) => set("mode_reception", v)} />
        </div>
      </SectionCard>

      <SectionCard title="Section 3 — Les rappels">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date du 1er rappel"><TextInput type="date" value={c["rappel1_date"] ?? ""} onChange={(e) => set("rappel1_date", e.target.value)} /></Field>
          <Field label="Réception du 1er rappel"><TextInput type="date" value={c["rappel1_reception"] ?? ""} onChange={(e) => set("rappel1_reception", e.target.value)} /></Field>
          <Field label="Date du 2e rappel"><TextInput type="date" value={c["rappel2_date"] ?? ""} onChange={(e) => set("rappel2_date", e.target.value)} /></Field>
          <Field label="Réception du 2e rappel"><TextInput type="date" value={c["rappel2_reception"] ?? ""} onChange={(e) => set("rappel2_reception", e.target.value)} /></Field>
        </div>
        <Field label="Montants réclamés à chaque étape" className="mt-4">
          <TextInput value={c["montants_etapes"] ?? ""} onChange={(e) => set("montants_etapes", e.target.value)} placeholder="ex : 125 € puis 165 €" />
        </Field>
      </SectionCard>

      <SectionCard title="Section 4 — Mise en demeure et recouvrement">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date de la mise en demeure"><TextInput type="date" value={c["mise_en_demeure_date"] ?? ""} onChange={(e) => set("mise_en_demeure_date", e.target.value)} /></Field>
          <Field label="Date de la contrainte"><TextInput type="date" value={c["contrainte_date"] ?? ""} onChange={(e) => set("contrainte_date", e.target.value)} /></Field>
          <Field label="Date du courrier d'huissier"><TextInput type="date" value={c["huissier_date"] ?? ""} onChange={(e) => set("huissier_date", e.target.value)} /></Field>
          <Field label="Nom de l'étude"><TextInput value={c["etude_huissier"] ?? ""} onChange={(e) => set("etude_huissier", e.target.value)} /></Field>
          <Field label="Frais ajoutés"><TextInput value={c["frais_ajoutes"] ?? ""} onChange={(e) => set("frais_ajoutes", e.target.value)} /></Field>
          <Field label="Plan de paiement demandé ou accepté">
            <SelectInput options={[{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }]} value={c["plan_paiement"] ?? ""} onChange={(e) => set("plan_paiement", e.target.value)} placeholder="Choisir" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Section 5 — Contestations déjà introduites">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date de la première contestation"><TextInput type="date" value={c["contestation_date"] ?? ""} onChange={(e) => set("contestation_date", e.target.value)} /></Field>
          <Field label="Canal employé"><SelectInput options={CANAUX_CONTESTATION} value={c["contestation_canal"] ?? ""} onChange={(e) => set("contestation_canal", e.target.value)} placeholder="Choisir" /></Field>
          <Field label="Accusé de réception reçu ?">
            <SelectInput options={[{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }]} value={c["contestation_accuse"] ?? ""} onChange={(e) => set("contestation_accuse", e.target.value)} placeholder="Choisir" />
          </Field>
          <Field label="Date de l'accusé de réception"><TextInput type="date" value={c["accuse_date"] ?? ""} onChange={(e) => set("accuse_date", e.target.value)} /></Field>
          <Field label="Référence attribuée"><TextInput value={c["contestation_ref"] ?? ""} onChange={(e) => set("contestation_ref", e.target.value)} /></Field>
          <Field label="Réponse sur le fond reçue ?">
            <SelectInput options={[{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }]} value={c["contestation_reponse_fond"] ?? ""} onChange={(e) => set("contestation_reponse_fond", e.target.value)} placeholder="Choisir" />
          </Field>
          <Field label="Date de la réponse"><TextInput type="date" value={c["reponse_date"] ?? ""} onChange={(e) => set("reponse_date", e.target.value)} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Section 6 — Frise chronologique automatique">
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-soft">Renseignez des dates ci-dessus pour générer la frise.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {sorted.map((e, i) => (
              <div key={e.k} className="flex items-center gap-2">
                <span className="rounded-full border border-navy-700 bg-navy-50 px-3 py-1.5 text-xs font-bold text-navy-900">
                  {e.l} <span className="font-normal text-ink-soft">· {formatDate(c[e.k])}</span>
                </span>
                {i < sorted.length - 1 && <span className="text-line">→</span>}
              </div>
            ))}
          </div>
        )}
        {alerts.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {alerts.map((a) => (
              <p key={a} className="flex items-center gap-2 rounded-md bg-warn-100 px-3 py-2 text-sm font-medium text-warn-700">
                <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor"><path d="M10 2 1 18h18L10 2Zm0 6 1 6H9l1-6Zm0 9.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"/></svg>
                {a}
              </p>
            ))}
          </div>
        )}
      </SectionCard>

      <LearnedBox items={[
        "Une procédure de recouvrement se déroule par étapes.",
        "Chaque document doit être relié à une date, un montant et une référence.",
        "Une pièce absente du dossier ne prouve pas qu'elle n'a jamais existé : elle doit être demandée.",
      ]} />

      <NavBtns onBack={back} onNext={next} nextLabel="Continuer vers les faits et les preuves" />
    </div>
  );
}

/* ---------------- ÉTAPE 3 ---------------- */
function Step3({ d, patch, next, back }: { d: Dossier; patch: (x: Record<string, unknown>) => Promise<unknown>; next: () => void; back: () => void }) {
  const questions = MOTIF_QUESTIONS[d.motifPrincipal ?? ""] ?? [
    "Quels éléments objectifs soutiennent votre situation ?",
    "Quelles preuves datées pouvez-vous fournir ?",
    "Quels échanges avez-vous eus avec l'administration ?",
  ];
  const rep = d.reponsesMotif ?? {};
  return (
    <div className="space-y-5 animate-rise">
      <PageHead
        title="3. Décrire les faits et examiner les preuves"
        intro="Décrivez ce qui s'est passé dans l'ordre chronologique. Ne présentez pas une hypothèse comme un fait certain. La plateforme confrontera votre récit aux documents déposés."
      />

      <SectionCard title="Section 1 — Motif principal">
        <SelectInput
          options={MOTIFS}
          placeholder="Sélectionnez le motif principal"
          value={d.motifPrincipal ?? ""}
          onChange={(e) => patch({ motifPrincipal: e.target.value })}
        />
      </SectionCard>

      {d.motifPrincipal && (
        <SectionCard title="Section 2 — Questions adaptées au motif">
          <div className="space-y-3">
            {questions.map((q, i) => (
              <Field key={q} label={q}>
                <TextInput value={rep[`q${i}`] ?? ""} onChange={(e) => patch({ reponsesMotif: { ...rep, [`q${i}`]: e.target.value } })} />
              </Field>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Section 3 — Exposé chronologique">
        <Field label="Décrivez les faits dans l'ordre exact" hint="Indiquez les heures, actions, documents et échanges. Évitez les accusations personnelles. Distinguez ce que vous avez constaté de ce que vous supposez.">
          <TextArea rows={7} value={d.faits ?? ""} onChange={(e) => patch({ faits: e.target.value })} placeholder="Le 05/05/2026 à 13h58, j'ai activé une session de stationnement…" />
        </Field>
        <p className="mt-1 text-right text-xs text-ink-soft">{(d.faits ?? "").length} caractères</p>
      </SectionCard>

      <SectionCard title="Section 4 — Pièces disponibles">
        <CheckGrid
          options={PIECES}
          values={d.pieces ?? []}
          onToggle={(v) => {
            const cur = d.pieces ?? [];
            patch({ pieces: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
          }}
        />
      </SectionCard>

      <SectionCard title="Section 5 — Analyse de concordance">
        <p className="text-sm text-ink-soft">La plateforme vérifie notamment : la plaque, la date, l'heure, le lieu, le montant, la référence, la période de validité et la concordance entre le paiement et le constat. Résultat affiché pour chaque pièce : preuve forte, preuve utile mais incomplète, simple indice, pièce non concordante ou vérification humaine requise.</p>
      </SectionCard>

      <LearnedBox items={[
        "Une affirmation doit être soutenue par une pièce concordante.",
        "Une preuve bancaire n'identifie pas toujours la plaque ou la zone.",
        "Une capture d'application doit montrer la date, l'heure et le véhicule concerné.",
        "Une photographie doit être replacée dans son contexte.",
      ]} />

      <NavBtns onBack={back} onNext={next} nextLabel="Continuer vers l'audit documentaire" />
    </div>
  );
}

/* ---------------- ÉTAPE 4 ---------------- */
function Step4({ d, patch, next, back, busy }: { d: Dossier; patch: (x: Record<string, unknown>) => Promise<unknown>; next: () => void; back: () => void; busy: boolean }) {
  const ad = d.auditDoc ?? { inventaire: {}, techniques: [], administratives: [], juridiques: [], donnees: [], demandes: [] };
  const toggle = (key: "techniques" | "administratives" | "juridiques" | "donnees" | "demandes", v: string) => {
    const cur = ad[key] ?? [];
    patch({ auditDoc: { ...ad, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } });
  };
  return (
    <div className="space-y-5 animate-rise">
      <PageHead
        title="4. Vérifier les documents et préparer les demandes"
        intro="La plateforme détermine ce qui est déjà démontré et ce qui doit encore être demandé à l'administration ou au gestionnaire."
      />
      <EduBox title="Contester, c'est aussi demander les preuves de l'autorité">
        Il faut identifier les preuves détenues par l'autorité, demander leur communication et vérifier si la
        décision repose sur un dossier complet.
      </EduBox>

      <SectionCard title="Section 1 — Inventaire sans doublons" subtitle="Pour chaque document de la procédure : présent ou absent de votre dossier.">
        <div className="grid gap-3 sm:grid-cols-2">
          {INVENTAIRE_KEYS.map((k) => (
            <div key={k.value} className="flex items-center justify-between rounded-md border border-line bg-white px-3 py-2">
              <span className="text-sm font-medium">{k.label}</span>
              <select
                value={ad.inventaire?.[k.value] ?? ""}
                onChange={(e) => patch({ auditDoc: { ...ad, inventaire: { ...ad.inventaire, [k.value]: e.target.value } } })}
                className="rounded border border-line bg-white px-2 py-1 text-xs font-semibold"
              >
                <option value="">—</option>
                <option value="present">Présent</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Section 2 — Pièces techniques à réclamer">
        <CheckGrid options={TECHNIQUES} values={ad.techniques ?? []} onToggle={(v) => toggle("techniques", v)} />
      </SectionCard>
      <SectionCard title="Section 3 — Pièces administratives à réclamer">
        <CheckGrid options={ADMINISTRATIVES} values={ad.administratives ?? []} onToggle={(v) => toggle("administratives", v)} />
      </SectionCard>
      <SectionCard title="Section 4 — Éléments juridiques à réclamer">
        <CheckGrid options={JURIDIQUES} values={ad.juridiques ?? []} onToggle={(v) => toggle("juridiques", v)} />
      </SectionCard>
      <SectionCard title="Section 5 — Éléments relatifs aux données personnelles">
        <CheckGrid options={DONNEES_PERSO} values={ad.donnees ?? []} onToggle={(v) => toggle("donnees", v)} />
      </SectionCard>
      <SectionCard title="Section 6 — Demandes à intégrer au courrier">
        <CheckGrid options={DEMANDES} values={ad.demandes ?? []} onToggle={(v) => toggle("demandes", v)} />
      </SectionCard>

      <LearnedBox items={[
        "Le dossier administratif contient les éléments sur lesquels repose la décision.",
        "Une demande de pièces doit être précise.",
        "La contestation et la demande d'accès aux données personnelles sont deux démarches distinctes, même si elles peuvent se compléter.",
      ]} />

      <NavBtns onBack={back} onNext={next} nextLabel="Lancer l'audit RESPARK-BXL" busy={busy} />
    </div>
  );
}

/* ---------------- ÉTAPE 5 ---------------- */
function Step5({ d, audit, back, finish }: { d: Dossier; audit: AuditResult; back: () => void; finish: () => void }) {
  const ring = audit.score;
  const circ = 2 * Math.PI * 42;
  return (
    <div className="space-y-5 animate-rise">
      <PageHead
        title="5. Résultats de l'analyse"
        intro="Le dossier est évalué selon les faits, les preuves, la chronologie, la procédure, les montants et les documents disponibles."
      />
      <p className="rounded-md bg-warn-100 px-4 py-2.5 text-center text-sm font-medium text-warn-700">
        Le score constitue un indicateur d'orientation. Il ne garantit ni l'annulation ni l'issue d'un recours.
      </p>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <SectionCard className="flex flex-col items-center justify-center text-center">
          <div className="relative h-36 w-36">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-line-soft)" strokeWidth="9" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={ring >= 55 ? "var(--color-ok-600)" : ring >= 35 ? "var(--color-warn-600)" : "var(--color-danger-600)"} strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (circ * ring) / 100} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-black text-navy-900">{ring}%</span>
              <span className="text-[11px] font-bold text-ink-soft">{audit.label}</span>
            </div>
          </div>
          <p className="mt-4 rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-800">{audit.confianceLabel}</p>
          <p className="mt-2 text-xs text-ink-soft">{audit.niveauDocumentaire}</p>
        </SectionCard>

        <SectionCard title="Synthèse du dossier">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
            {[
              ["Référence", d.ref], ["Commune", d.communeConstat || "—"], ["Opérateur", d.autorite || "—"],
              ["Plaque", d.plaque || "—"], ["Date du constat", formatDate(d.chronologie?.["date_constat"])],
              ["Document reçu", labelOf(DOCUMENTS, d.documentRecu)], ["Montant réclamé", formatMontant(d.montantReclame)],
              ["Motif", labelOf(MOTIFS, d.motifPrincipal)], ["Statut", "En analyse"],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-ink-soft">{k}</dt><dd className="font-semibold text-ink">{v}</dd></div>
            ))}
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="Résultats de l'audit">
        <ul className="divide-y divide-line-soft">
          {audit.categories.map((cat) => (
            <li key={cat.key} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-bold text-navy-900">{cat.label}</p>
                <p className="text-[13px] text-ink-soft">{cat.detail}</p>
              </div>
              <StatusBadge status={cat.status} />
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title={`Points favorables (${audit.favorables.length})`} className="border-ok-600/30">
          <ul className="space-y-2 text-sm">
            {audit.favorables.length === 0 && <li className="text-ink-soft">Aucun point favorable identifié à ce stade.</li>}
            {audit.favorables.map((p) => (
              <li key={p.title} className="rounded-md bg-ok-100/60 p-2.5"><span className="font-semibold text-ok-700">{p.title}.</span> <span className="text-ink">{p.detail}</span></li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title={`Points favorables à l'administration (${audit.administration.length})`} className="border-danger-600/30">
          <ul className="space-y-2 text-sm">
            {audit.administration.length === 0 && <li className="text-ink-soft">Aucun point défavorable majeur identifié.</li>}
            {audit.administration.map((p) => (
              <li key={p.title} className="rounded-md bg-danger-100/60 p-2.5"><span className="font-semibold text-danger-700">{p.title}.</span> <span className="text-ink">{p.detail}</span></li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title={`Points à vérifier (${audit.aVerifier.length})`}>
          <ul className="space-y-2 text-sm">
            {audit.aVerifier.map((p) => (
              <li key={p.title} className="rounded-md bg-warn-100/60 p-2.5"><span className="font-semibold text-warn-700">{p.title}.</span> <span className="text-ink">{p.detail}</span></li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Pièces manquantes recommandées">
          <ul className="space-y-1.5 text-sm">
            {audit.piecesManquantes.length === 0 && <li className="text-ink-soft">Aucune pièce essentielle manquante.</li>}
            {audit.piecesManquantes.map((p) => (
              <li key={p} className="flex gap-2 text-ink"><svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-warn-600" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="8"/><path d="M10 6v5M10 14h.01"/></svg>{p}</li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {audit.vigilance.length > 0 && (
        <SectionCard title="Points de vigilance" className="border-danger-600/40 bg-danger-100/30">
          <ul className="space-y-2 text-sm">
            {audit.vigilance.map((p) => (
              <li key={p.title}><span className="font-bold text-danger-700">{p.title}.</span> {p.detail}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="Notre recommandation" className="border-navy-700/40 bg-navy-50">
        <p className="text-sm leading-relaxed text-ink">{audit.recommandation}</p>
      </SectionCard>

      <LearnedBox items={[
        "Un dossier sérieux présente également les arguments défavorables.",
        "Une pièce manquante ne signifie pas automatiquement que l'administration a commis une faute.",
        "La solidité d'un moyen dépend à la fois du droit applicable et des preuves disponibles.",
      ]} />

      <div className="flex flex-wrap justify-between gap-3">
        <Btn variant="secondary" onClick={back}>← Retour</Btn>
        <div className="flex flex-wrap gap-3">
          <Btn variant="secondary" onClick={back}>Ajouter une pièce</Btn>
          <Btn variant="gold" onClick={finish}>Générer la démarche recommandée →</Btn>
        </div>
      </div>
    </div>
  );
}
