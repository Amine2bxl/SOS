"use client";

import { useState } from "react";
import { PageHead, SectionCard, Field, TextInput, TextArea, Btn } from "@/components/ui";
import { HeartIcon } from "@/components/Logo";

const MONTANTS = ["10", "25", "50", "100"];

export default function DonPage() {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", montant: "25", frequence: "ponctuel", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    await fetch("/api/dons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setState("done");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Solidarité"
        title="Soutenez l'accompagnement des citoyens"
        intro="Votre don contribue au développement d'outils accessibles, documentés et indépendants pour défendre un accès équitable à l'information."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <SectionCard title="La mission de l'association">
            <p className="text-sm leading-relaxed text-ink-soft">
              SOS Citizens ASBL analyse les dossiers, assure la veille réglementaire sur les 19 communes,
              rédige des guides et accompagne les citoyens face aux administrations. Tout cela demande du temps
              et des moyens.
            </p>
          </SectionCard>
          <SectionCard title="Affectation générale des dons">
            <ul className="space-y-1.5 text-sm text-ink-soft">
              <li>• Développement et maintenance de la plateforme</li>
              <li>• Veille réglementaire et vérification des fiches communales</li>
              <li>• Rédaction de guides pédagogiques et de modèles</li>
              <li>• Accompagnement des affiliés</li>
            </ul>
          </SectionCard>
          <SectionCard title="Moyens de paiement">
            <p className="text-sm text-ink-soft">
              Virement bancaire sur le compte de l'association (coordonnées communiquées après confirmation
              officielle). Don ponctuel ou régulier, au choix.
            </p>
            <p className="mt-3 rounded-md bg-paper p-3 text-xs text-ink-soft">
              Mentions légales et fiscales : les avantages fiscaux éventuels dépendent de la réglementation en
              vigueur et seront mentionnés exactement lorsqu'ils sont applicables.
            </p>
          </SectionCard>
        </div>

        <SectionCard title="Faire un don" className="border-gold-400/60 bg-gold-100/30">
          {state === "done" ? (
            <div className="py-8 text-center">
              <HeartIcon className="mx-auto h-10 w-10 animate-heartbeat text-gold-500" />
              <p className="mt-4 font-display text-xl font-bold text-navy-900">Merci pour votre soutien !</p>
              <p className="mt-2 text-sm text-ink-soft">
                Votre intention de don a été enregistrée. Les modalités de paiement vous seront communiquées
                aux coordonnées officielles de l'association.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <p className="mb-2 text-[13px] font-semibold text-navy-900">Montant (€)</p>
                <div className="grid grid-cols-4 gap-2">
                  {MONTANTS.map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setForm({ ...form, montant: m })}
                      className={`rounded-md border px-2 py-2.5 text-sm font-bold transition ${
                        form.montant === m ? "border-navy-800 bg-navy-900 text-gold-300" : "border-line bg-white text-ink hover:border-navy-600/50"
                      }`}
                    >
                      {m} €
                    </button>
                  ))}
                </div>
                <TextInput className="mt-2" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} aria-label="Montant libre" />
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold text-navy-900">Fréquence</p>
                <div className="grid grid-cols-2 gap-2">
                  {[["ponctuel", "Don ponctuel"], ["regulier", "Don régulier"]].map(([v, l]) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setForm({ ...form, frequence: v })}
                      className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                        form.frequence === v ? "border-navy-800 bg-navy-50 text-navy-900" : "border-line bg-white text-ink"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Prénom"><TextInput value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></Field>
                <Field label="Nom"><TextInput value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></Field>
              </div>
              <Field label="E-mail"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Message (facultatif)"><TextArea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
              <Btn type="submit" variant="gold" className="w-full" disabled={state === "sending"}>
                <HeartIcon className="h-4 w-4 animate-heartbeat" />
                {state === "sending" ? "Enregistrement…" : "Confirmer mon intention de don"}
              </Btn>
            </form>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
