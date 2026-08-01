"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Dossier } from "@/db/schema";
import type { AuditResult } from "@/lib/audit";
import type { GeneratedLetter } from "@/lib/letter";
import { SUIVI_TEMPLATE, DEMANDES, labelOf, PIECES } from "@/lib/constants";
import { SectionCard, Btn, StatusBadge, TextArea, Field } from "@/components/ui";
import { HeartIcon } from "@/components/Logo";

export default function DossierDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [letter, setLetter] = useState<GeneratedLetter | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [reponse, setReponse] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    const [d, a, l] = await Promise.all([
      fetch(`/api/dossiers/${params.id}`).then((r) => r.json()),
      fetch(`/api/dossiers/${params.id}/audit`).then((r) => r.json()),
      fetch(`/api/dossiers/${params.id}/lettre`).then((r) => r.json()),
    ]);
    setDossier(d);
    setAudit(a);
    setLetter(l);
    setReponse(d.reponseAdministration ?? "");
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (dossier && !dossier.letterGeneratedAt) {
      const now = new Date().toISOString();
      const suivi = (dossier.suivi ?? []).map((e) =>
        e.key === "courrier_genere" ? { ...e, fait: true, date: now.slice(0, 10) } : e
      );
      patch({ letterGeneratedAt: now, letterType: "contestation_initiale", suivi });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossier?.id]);

  const patch = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/dossiers/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setDossier(updated);
    return updated;
  };

  const markSuivi = async (key: string, fait: boolean) => {
    if (!dossier) return;
    const suivi = (dossier.suivi ?? []).map((e) =>
      e.key === key ? { ...e, fait, date: fait ? new Date().toISOString().slice(0, 10) : "" } : e
    );
    await patch({ suivi });
  };

  const markSent = async () => {
    const now = new Date().toISOString();
    const suivi = (dossier?.suivi ?? []).map((e) =>
      e.key === "courrier_envoye" ? { ...e, fait: true, date: now.slice(0, 10) } : e
    );
    await patch({ letterSentAt: now, suivi });
    setSent(true);
  };

  const download = (ext: string, mime: string) => {
    if (!letter) return;
    const blob = new Blob([letter.body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contestation-${dossier?.ref ?? "dossier"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    if (!letter) return;
    await navigator.clipboard.writeText(letter.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const analyseReponse = useMemo(() => {
    if (!audit || !reponse.trim()) return null;
    const txt = reponse.toLowerCase();
    return audit.demandes.map((dKey) => {
      const label = labelOf(DEMANDES, dKey);
      const tokens = label.toLowerCase().split(/[^a-zà-ÿ]+/).filter((t) => t.length > 6);
      const traite = tokens.some((t) => txt.includes(t));
      return { label, traite };
    });
  }, [audit, reponse]);

  if (!dossier || !audit || !letter) {
    return <div className="p-16 text-center text-ink-soft">Chargement du dossier…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dossiers" className="text-sm font-semibold text-navy-700 hover:underline">← Retour au dossier</Link>
          <h1 className="mt-1 font-display text-3xl font-bold text-navy-900">6. Préparer, envoyer et suivre votre démarche</h1>
          <p className="mt-1 text-sm text-ink-soft">Dossier {dossier.ref} — Relisez chaque information, vérifiez les pièces annoncées et conservez une preuve de l'envoi.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => router.push(`/analyser?d=${dossier.id}&etape=3`)}>Ajouter une pièce</Btn>
          {confirmDelete ? (
            <Btn
              variant="primary"
              className="bg-danger-600 hover:bg-danger-700"
              onClick={async () => {
                await fetch(`/api/dossiers/${dossier.id}`, { method: "DELETE" });
                router.push("/dossiers");
              }}
            >
              Confirmer la suppression
            </Btn>
          ) : (
            <Btn variant="secondary" onClick={() => setConfirmDelete(true)}>Supprimer</Btn>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* RÉCAPITULATIF */}
        <div className="space-y-6">
          <SectionCard title="Récapitulatif du courrier">
            <dl className="space-y-3 text-sm">
              {[
                ["Type de courrier", letter.typeLabel],
                ["Destinataire", letter.destinataire],
                ["Canal recommandé", letter.canal],
                ["Délai légal pour répondre", letter.delai],
                ["Pièces jointes incluses", `${(dossier.pieces ?? []).length} pièces sélectionnées`],
                ["Demandes formulées", `${audit.demandes.length} demandes`],
                ["Date de génération", new Date(dossier.letterGeneratedAt ?? Date.now()).toLocaleString("fr-BE")],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[170px_1fr] gap-3 border-b border-line-soft pb-2 last:border-0">
                  <dt className="font-semibold text-navy-900">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-md bg-ok-100 px-3 py-2 text-xs font-medium text-ok-700">
              Vérifiez le délai, le destinataire et le canal à utiliser sur le document reçu.
            </p>
          </SectionCard>

          <SectionCard title="Exporter votre courrier">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Btn variant="primary" onClick={copy}>{copied ? "✓ Copié !" : "Copier le texte"}</Btn>
              <Btn variant="secondary" onClick={() => download("txt", "text/plain")}>Télécharger (.txt)</Btn>
              <Btn variant="secondary" onClick={() => download("txt", "text/plain")}>Format modifiable</Btn>
              <Btn variant="secondary" onClick={() => window.print()}>Imprimer</Btn>
              <Btn variant="secondary" onClick={() => download("pdf", "text/plain")}>Télécharger en PDF</Btn>
              <Btn variant="secondary" onClick={() => patch({ statut: "enregistre" })}>Enregistrer</Btn>
            </div>
            <p className="mt-3 text-xs text-ink-soft">
              Le courrier contient automatiquement vos coordonnées, références, moyens invoqués et demandes de pièces. Pour un PDF, utilisez « Imprimer » puis « Enregistrer au format PDF ».
            </p>
          </SectionCard>

          <SectionCard title="Envoyer votre courrier">
            <ul className="divide-y divide-line-soft text-sm">
              <li className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-2 font-medium">Formulaire en ligne <span className="rounded bg-ok-100 px-1.5 py-0.5 text-[10px] font-bold text-ok-700">Recommandé</span></span>
                <span className="text-xs text-ink-soft">Selon instructions du document reçu</span>
              </li>
              <li className="flex items-center justify-between py-2.5"><span className="font-medium">Préparer l'e-mail</span><Btn variant="ghost" onClick={copy}>Copier le texte</Btn></li>
              <li className="flex items-center justify-between py-2.5"><span className="font-medium">Préparer le courrier postal</span><Btn variant="ghost" onClick={() => window.print()}>Imprimer</Btn></li>
              <li className="flex items-center justify-between py-2.5">
                <span className="font-medium">Marquer comme envoyé</span>
                <Btn variant={dossier.letterSentAt ? "secondary" : "gold"} onClick={markSent} disabled={!!dossier.letterSentAt}>
                  {dossier.letterSentAt ? `Envoyé le ${dossier.letterSentAt ? new Date(dossier.letterSentAt).toLocaleDateString("fr-BE") : ""}` : "Marquer comme envoyé"}
                </Btn>
              </li>
            </ul>
            <p className="mt-3 text-xs text-ink-soft">
              La plateforme n'affirme pas qu'un canal est exclusivement obligatoire sans base vérifiée. Consultez également les instructions figurant sur le document reçu.
            </p>
          </SectionCard>

          <SectionCard title="Analyser la réponse reçue">
            <Field label="Collez ici la réponse de l'administration" hint="La plateforme comparera la réponse avec vos demandes et identifiera les points traités, les arguments ignorés et les nouvelles échéances.">
              <TextArea rows={5} value={reponse} onChange={(e) => setReponse(e.target.value)} placeholder="Texte de la réponse reçue…" />
            </Field>
            <div className="mt-3 flex gap-2">
              <Btn onClick={() => patch({ reponseAdministration: reponse })}>Enregistrer la réponse</Btn>
            </div>
            {analyseReponse && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {analyseReponse.map((r) => (
                  <p key={r.label} className={`rounded-md px-3 py-2 text-xs font-medium ${r.traite ? "bg-ok-100 text-ok-700" : "bg-warn-100 text-warn-700"}`}>
                    {r.traite ? "Semble traité" : "Argument ignoré / non traité"} : {r.label}
                  </p>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* APERÇU + SUIVI */}
        <div className="space-y-6">
          <SectionCard title="Aperçu du courrier">
            <div id="print-zone" className="letter-paper max-h-[520px] overflow-auto rounded-lg border border-line bg-white p-6 text-[13px] text-ink shadow-inner">
              {letter.body}
            </div>
            <p className="mt-3 rounded-md bg-warn-100 px-3 py-2 text-xs font-medium text-warn-700">
              Ne conservez que les affirmations que vous êtes en mesure de soutenir.
            </p>
          </SectionCard>

          <SectionCard title="Suivi de votre dossier">
            <ol className="relative space-y-4 border-l-2 border-line pl-5">
              {SUIVI_TEMPLATE.map((t) => {
                const entry = (dossier.suivi ?? []).find((e) => e.key === t.key);
                const fait = entry?.fait ?? false;
                return (
                  <li key={t.key} className="relative">
                    <span className={`absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 ${fait ? "border-ok-600 bg-ok-600" : "border-line bg-white"}`} />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className={`text-sm font-bold ${fait ? "text-ok-700" : "text-ink"}`}>{t.label}</p>
                        <p className="text-xs text-ink-soft">{fait && entry?.date ? `Le ${entry.date} — ${t.hint}` : t.hint}</p>
                      </div>
                      {!fait && t.key !== "courrier_genere" && (
                        <Btn variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => markSuivi(t.key, true)}>
                          {t.key === "courrier_envoye" ? "Marquer comme envoyé" : "Marquer fait"}
                        </Btn>
                      )}
                      {fait && <StatusBadge status="ok" />}
                    </div>
                  </li>
                );
              })}
            </ol>
          </SectionCard>

          <SectionCard title="Pièces jointes annoncées">
            <ul className="flex flex-wrap gap-2">
              {(dossier.pieces ?? []).length === 0 && <li className="text-sm text-ink-soft">Aucune pièce sélectionnée.</li>}
              {(dossier.pieces ?? []).map((p) => (
                <li key={p} className="rounded-full border border-navy-100 bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-800">
                  {labelOf(PIECES, p)}
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="rounded-xl bg-navy-950 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold">Votre situation nécessite une analyse individualisée ?</h3>
                <p className="mt-1 max-w-md text-sm text-navy-100/85">
                  SOS Citizens ASBL accompagne ses affiliés dans l'examen des dossiers, la préparation des demandes administratives et le suivi des réponses reçues.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/contact?objet=accompagnement" className="rounded-md bg-gold-400 px-4 py-2.5 text-center text-sm font-bold text-navy-950 hover:bg-gold-300">
                  Demander un accompagnement
                </Link>
                <Link href="/don" className="inline-flex items-center justify-center gap-2 rounded-md border border-gold-400/60 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/10">
                  <HeartIcon className="h-4 w-4 animate-heartbeat" /> Soutenir SOS Citizens ASBL
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
