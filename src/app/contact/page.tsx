"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHead, SectionCard, Field, TextInput, TextArea, SelectInput, Btn } from "@/components/ui";

function ContactForm() {
  const sp = useSearchParams();
  const initial = sp.get("objet") === "accompagnement" ? "accompagnement" : sp.get("objet") === "suppression" ? "suppression" : "contact";
  const [form, setForm] = useState({ type: initial, nom: "", email: "", sujet: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setState("done");
  };

  if (state === "done") {
    return (
      <SectionCard className="mt-10 border-ok-600/40 bg-ok-100/40 text-center">
        <p className="font-display text-xl font-bold text-ok-700">Message enregistré ✓</p>
        <p className="mt-2 text-sm text-ink">
          Merci. SOS Citizens ASBL vous répondra dans les meilleurs délais aux coordonnées officielles
          confirmées. Conservez une copie de votre demande.
        </p>
      </SectionCard>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10">
      <SectionCard title="Écrivez-nous">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Objet de la demande">
            <SelectInput
              options={[
                { value: "contact", label: "Question générale" },
                { value: "accompagnement", label: "Demander un accompagnement" },
                { value: "suppression", label: "Suppression de mes données" },
              ]}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
          </Field>
          <Field label="E-mail" required><TextInput type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Nom complet"><TextInput value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></Field>
          <Field label="Sujet"><TextInput value={form.sujet} onChange={(e) => setForm({ ...form, sujet: e.target.value })} /></Field>
          <Field label="Message" required className="sm:col-span-2">
            <TextArea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Décrivez votre situation, en indiquant la référence du dossier le cas échéant." />
          </Field>
        </div>
        <div className="mt-5">
          <Btn type="submit" disabled={state === "sending"} variant="gold">{state === "sending" ? "Envoi…" : "Envoyer le message"}</Btn>
        </div>
        <p className="mt-4 text-xs text-ink-soft">
          Coordonnées officielles de l'association : [numéro et adresse à confirmer]. Aucune coordonnée non
          confirmée n'est publiée.
        </p>
      </SectionCard>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Contact"
        title="Contacter SOS Citizens ASBL"
        intro="Question, demande d'accompagnement ou exercice de vos droits sur vos données : écrivez-nous."
      />
      <Suspense fallback={null}>
        <ContactForm />
      </Suspense>
    </div>
  );
}
