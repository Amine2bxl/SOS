"use client";

import { useMemo, useState } from "react";
import { Card, Field, TextInput, TextArea, SelectInput, Btn, LinkBtn, KeyBox, Check } from "@/components/ui";
import { PhoneIcon } from "@/components/Logo";
import { ASSO, COMMUNES, MOTIFS } from "@/lib/data";
import { construireLettre, SAISIE_VIDE, type SaisieLettre } from "@/lib/lettre";

export default function ContesterPage() {
  const [f, setF] = useState<SaisieLettre>(SAISIE_VIDE);
  const [copie, setCopie] = useState(false);

  const lettre = useMemo(() => construireLettre(f), [f]);
  const motif = MOTIFS.find((m) => m.value === f.motif) ?? MOTIFS[0];

  const set = (k: keyof SaisieLettre) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lettre);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      setCopie(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Outil gratuit</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
          Préparez votre lettre de contestation
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Remplissez ce qui vous concerne : la lettre s&apos;écrit toute seule à droite. Vous pouvez ensuite
          la copier ou l&apos;imprimer. Rien n&apos;est enregistré, rien n&apos;est envoyé : tout reste sur
          votre appareil.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        <KeyBox title="Avant de commencer : vérifiez votre délai">
          Le délai pour contester est indiqué <strong>sur le courrier que vous avez reçu</strong> (souvent 14
          à 30 jours). C&apos;est cette mention qui fait foi. Si le délai est court ou déjà dépassé,{" "}
          <a href={`tel:${ASSO.telephoneLien}`} className="font-semibold underline">
            appelez-nous
          </a>{" "}
          : il reste souvent quelque chose à faire.
        </KeyBox>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* FORMULAIRE */}
        <div className="space-y-5 print:hidden">
          <Card title="1. Votre situation" subtitle="Choisissez ce qui correspond le mieux.">
            <Field label="Pourquoi contestez-vous ?" required>
              <SelectInput
                options={MOTIFS.map((m) => ({ value: m.value, label: m.label }))}
                value={f.motif}
                onChange={set("motif")}
              />
            </Field>

            <div className="mt-4 rounded-lg bg-navy-50 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-navy-700">
                Pièces à joindre pour ce motif
              </p>
              <ul className="mt-2 space-y-1.5">
                {motif.pieces.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <Field
              label="Expliquez votre situation avec vos mots"
              className="mt-4"
              hint="Facultatif mais recommandé : dites ce qui s'est passé, dans l'ordre, avec les heures."
            >
              <TextArea
                rows={4}
                value={f.explication}
                onChange={set("explication")}
                placeholder="Exemple : je me suis garé rue X à 14h10 et j'ai lancé la session de paiement à 14h12 depuis l'application…"
              />
            </Field>
          </Card>

          <Card title="2. Le courrier que vous avez reçu">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Référence du dossier" hint="En haut de votre courrier.">
                <TextInput value={f.reference} onChange={set("reference")} placeholder="Ex. 2026/123456" />
              </Field>
              <Field label="Montant réclamé (€)">
                <TextInput value={f.montant} onChange={set("montant")} placeholder="Ex. 25" inputMode="decimal" />
              </Field>
              <Field label="Date du constat">
                <TextInput type="date" value={f.dateConstat} onChange={set("dateConstat")} />
              </Field>
              <Field label="Plaque d'immatriculation">
                <TextInput value={f.plaque} onChange={set("plaque")} placeholder="Ex. 1-ABC-123" />
              </Field>
              <Field label="Commune du constat" className="sm:col-span-2">
                <SelectInput
                  options={COMMUNES.map((c) => ({ value: c.nom, label: c.nom }))}
                  placeholder="Choisissez la commune…"
                  value={f.communeConstat}
                  onChange={set("communeConstat")}
                />
              </Field>
            </div>
          </Card>

          <Card title="3. Vos coordonnées" subtitle="Elles apparaissent en haut de la lettre.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom">
                <TextInput value={f.prenom} onChange={set("prenom")} autoComplete="given-name" />
              </Field>
              <Field label="Nom">
                <TextInput value={f.nom} onChange={set("nom")} autoComplete="family-name" />
              </Field>
              <Field label="Rue et numéro" className="sm:col-span-2">
                <TextInput value={f.adresse} onChange={set("adresse")} autoComplete="street-address" />
              </Field>
              <Field label="Code postal">
                <TextInput value={f.codePostal} onChange={set("codePostal")} autoComplete="postal-code" />
              </Field>
              <Field label="Commune">
                <TextInput value={f.ville} onChange={set("ville")} autoComplete="address-level2" />
              </Field>
              <Field label="Adresse e-mail" className="sm:col-span-2">
                <TextInput type="email" value={f.email} onChange={set("email")} autoComplete="email" />
              </Field>
            </div>
          </Card>
        </div>

        {/* LETTRE */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Card title="Votre lettre" subtitle="Elle se met à jour à mesure que vous remplissez.">
            <div className="flex flex-wrap gap-2 print:hidden">
              <Btn onClick={copier} variant="gold">
                {copie ? "Copié ✓" : "Copier la lettre"}
              </Btn>
              <Btn onClick={() => window.print()} variant="secondary">
                Imprimer / PDF
              </Btn>
            </div>

            <div
              id="print-zone"
              className="letter-paper mt-4 max-h-[65vh] overflow-y-auto rounded-lg border border-line bg-white p-5 text-[13.5px] text-ink"
            >
              {lettre}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Les mentions entre crochets […] sont à compléter par vos soins avant l&apos;envoi.
            </p>
          </Card>

          <Card title="Où envoyer votre lettre ?" className="mt-5 print:hidden">
            <ol className="space-y-3 text-sm text-ink">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">
                  1
                </span>
                <span>
                  Regardez sur votre courrier le canal imposé. Pour parking.brussels, c&apos;est désormais{" "}
                  <strong>uniquement le formulaire en ligne</strong> : depuis le 15 mars 2026, les e-mails
                  sont rejetés automatiquement.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">
                  2
                </span>
                <span>
                  Collez le texte de votre lettre dans le formulaire et joignez vos pièces justificatives.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">
                  3
                </span>
                <span>
                  <strong>Gardez une preuve</strong> : capture d&apos;écran de l&apos;envoi, numéro de suivi,
                  ou accusé de réception. Sans preuve, votre démarche est difficile à faire valoir.
                </span>
              </li>
            </ol>
          </Card>

          <div className="mt-5 rounded-xl border border-gold-400 bg-gold-100/60 p-5 text-center print:hidden">
            <p className="font-display text-base font-bold text-navy-900">Un doute sur votre dossier ?</p>
            <p className="mt-1.5 text-sm text-ink-soft">
              Nous relisons votre lettre avec vous, gratuitement.
            </p>
            <LinkBtn href={`tel:${ASSO.telephoneLien}`} variant="gold" className="mt-4">
              <PhoneIcon className="h-4 w-4" />
              {ASSO.telephone}
            </LinkBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
