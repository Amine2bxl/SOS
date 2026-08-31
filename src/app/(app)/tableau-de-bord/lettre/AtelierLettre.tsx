"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Field, TextInput, TextArea, SelectInput, Btn, LinkBtn, KeyBox, Check } from "@/components/ui";
import { BoutonContact } from "@/components/Contact";
import { COMMUNES, MOTIFS } from "@/lib/data";
import { construireLettre, SAISIE_VIDE, type SaisieLettre } from "@/lib/lettre";
import { enregistrerLettre } from "@/lib/dossiers-actions";

export type DossierPourLettre = {
  id: string;
  libelle: string;
  reference: string;
  plaque: string;
  montant: string;
  dateConstat: string;
  commune: string;
  motif: string;
  explication: string;
  dejaRedigee: boolean;
};

type Coordonnees = {
  prenom: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
};

/**
 * Ce que l'on sait déjà : les coordonnées du profil, plus tout ce que le scan a
 * lu sur le courrier. Personne ne devrait retaper une référence que le site
 * connaît déjà.
 */
function saisiePour(dossier: DossierPourLettre | null, profil: Coordonnees): SaisieLettre {
  const base = { ...SAISIE_VIDE, ...profil };
  if (!dossier) return base;
  return {
    ...base,
    reference: dossier.reference,
    plaque: dossier.plaque,
    montant: dossier.montant,
    dateConstat: dossier.dateConstat,
    communeConstat: dossier.commune,
    motif: dossier.motif || base.motif,
    explication: dossier.explication || base.explication,
  };
}

export function AtelierLettre({
  dossiers,
  dossierInitial,
  profil,
}: {
  dossiers: DossierPourLettre[];
  dossierInitial: string | null;
  profil: Coordonnees;
}) {
  const router = useRouter();
  const [dossierId, setDossierId] = useState<string>(dossierInitial ?? "");
  const [f, setF] = useState<SaisieLettre>(() =>
    saisiePour(dossiers.find((d) => d.id === dossierInitial) ?? null, profil),
  );
  const [copie, setCopie] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const dossier = dossiers.find((d) => d.id === dossierId) ?? null;

  /** Changer de dossier recharge la lettre avec ce qu'on sait de celui-ci. */
  const choisirDossier = (id: string) => {
    setDossierId(id);
    setF(saisiePour(dossiers.find((d) => d.id === id) ?? null, profil));
    setEnregistre(false);
    setErreur(null);
  };

  const lettre = useMemo(() => construireLettre(f), [f]);
  const motif = MOTIFS.find((m) => m.value === f.motif) ?? MOTIFS[0];

  const set =
    (k: keyof SaisieLettre) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
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

  const ranger = () => {
    if (!dossierId) return;
    setErreur(null);
    demarrer(async () => {
      const resultat = await enregistrerLettre({
        dossierId,
        lettre,
        motif: f.motif,
        explication: f.explication,
      });
      if (resultat.erreur) {
        setErreur(resultat.erreur);
        return;
      }
      setEnregistre(true);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-navy-900">
          Rédiger ma lettre de contestation
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          Renseignez ce qui vous concerne&nbsp;: la lettre s&apos;écrit à droite au fur et à mesure,
          avec les arguments et les annexes correspondant à votre motif.
        </p>
      </div>

      {/* Rattachement au dossier : c'est ce qui relie ce module au reste. */}
      <Card className="mx-auto mt-7 max-w-3xl border-navy-600/30 bg-navy-50/60">
        {dossiers.length === 0 ? (
          <div className="sm:flex sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm leading-relaxed text-ink">
              <strong className="text-navy-900">Aucun dossier ouvert.</strong> Vous pouvez rédiger
              une lettre libre, mais en scannant d&apos;abord votre courrier, tout se remplit seul et
              la lettre se range dans le dossier avec ses échéances.
            </p>
            <LinkBtn href="/tableau-de-bord/nouveau" variant="gold" className="mt-3 shrink-0 sm:mt-0">
              Scanner mon courrier
            </LinkBtn>
          </div>
        ) : (
          <Field label="Pour quel dossier écrivez-vous ?" hint="Le dossier choisi pré-remplit la lettre, et la lettre terminée s'y range.">
            <SelectInput
              value={dossierId}
              onChange={(e) => choisirDossier(e.target.value)}
              options={dossiers.map((d) => ({
                value: d.id,
                label: d.dejaRedigee ? `${d.libelle} (lettre déjà rédigée)` : d.libelle,
              }))}
              placeholder="Lettre libre, sans dossier"
            />
          </Field>
        )}
      </Card>

      <div className="mx-auto mt-6 max-w-3xl">
        <KeyBox title="Avant de commencer : vérifiez votre délai">
          Votre délai est inscrit <strong>sur le courrier que vous avez reçu</strong>, souvent 14 à
          30 jours. C&apos;est cette mention qui fait foi. S&apos;il est court ou déjà dépassé,{" "}
          <BoutonContact variante="lien">écrivez-nous</BoutonContact> : il reste presque toujours
          une carte à jouer.
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

          <Card
            title="2. Le courrier que vous avez reçu"
            subtitle={dossier ? "Repris de votre dossier — corrigez si nécessaire." : undefined}
          >
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

          <Card
            title="3. Vos coordonnées"
            subtitle="Elles apparaissent en haut de la lettre. Modifiez-les une fois pour toutes dans Mes paramètres."
          >
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
            <p className="mt-3 text-xs text-ink-soft">
              <Link href="/tableau-de-bord/compte" className="font-semibold text-navy-700 underline">
                Enregistrer mes coordonnées
              </Link>{" "}
              pour ne plus jamais les retaper.
            </p>
          </Card>
        </div>

        {/* LETTRE */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card title="Votre lettre" subtitle="Elle se met à jour à mesure que vous remplissez.">
            <div className="flex flex-wrap gap-2 print:hidden">
              {dossierId && (
                <Btn onClick={ranger} variant="gold" disabled={enCours}>
                  {enCours ? "Enregistrement…" : enregistre ? "Enregistrée ✓" : "Ranger dans mon dossier"}
                </Btn>
              )}
              <Btn onClick={copier} variant={dossierId ? "secondary" : "gold"}>
                {copie ? "Copié ✓" : "Copier la lettre"}
              </Btn>
              <Btn onClick={() => window.print()} variant="secondary">
                Imprimer / PDF
              </Btn>
            </div>

            {erreur && (
              <p role="alert" className="mt-3 rounded-md bg-danger-100 p-3 text-sm font-medium text-danger-700">
                {erreur}
              </p>
            )}
            {enregistre && dossier && (
              <p className="mt-3 rounded-md bg-ok-100 p-3 text-sm text-ok-700">
                <strong>Rangée dans {dossier.libelle}.</strong>{" "}
                <Link href={`/tableau-de-bord/${dossier.id}`} className="underline">
                  Ouvrir le dossier
                </Link>{" "}
                — il ne reste qu&apos;à envoyer et à garder une preuve.
              </p>
            )}

            <div
              id="print-zone"
              className="letter-paper mt-4 max-h-[60vh] overflow-y-auto rounded-lg border border-line bg-white p-5 text-[13.5px] text-ink"
            >
              {lettre}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Les mentions entre crochets […] sont à compléter par vos soins avant l&apos;envoi.
            </p>
          </Card>

          <Card title="Où envoyer votre lettre ?" className="mt-5 print:hidden">
            <ol className="space-y-3 text-sm text-ink">
              {[
                <>
                  Regardez sur votre courrier le canal imposé. Pour parking.brussels, c&apos;est
                  désormais <strong>uniquement le formulaire en ligne</strong> : depuis le
                  15 mars 2026, les e-mails sont rejetés automatiquement.
                </>,
                <>Collez le texte de votre lettre dans le formulaire et joignez vos pièces justificatives.</>,
                <>
                  <strong>Gardez une preuve</strong> : capture d&apos;écran de l&apos;envoi, numéro de
                  suivi ou accusé de réception. Sans preuve, votre démarche est difficile à faire
                  valoir.
                </>,
              ].map((texte, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">
                    {i + 1}
                  </span>
                  <span>{texte}</span>
                </li>
              ))}
            </ol>
            {dossierId && (
              <p className="mt-4 rounded-md bg-navy-50 p-3 text-sm text-ink">
                Une fois la lettre partie, dites-le sur la fiche du dossier : le suivi et les
                relances s&apos;ajustent automatiquement.
              </p>
            )}
          </Card>

          <div className="mt-5 rounded-xl border border-gold-400 bg-gold-100/60 p-5 text-center print:hidden">
            <p className="font-display text-base font-bold text-navy-900">Un doute sur votre dossier ?</p>
            <p className="mt-1.5 text-sm text-ink-soft">
              Nous relisons votre lettre avec vous, gratuitement.
            </p>
            <BoutonContact variante="gold" className="mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
