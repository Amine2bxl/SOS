"use client";

import { useMemo, useState } from "react";
import { PageHead, Card, Field, TextInput, TextArea, LinkBtn, Check } from "@/components/ui";
import { PhoneIcon, MailIcon } from "@/components/Logo";
import { ASSO } from "@/lib/data";

/** Ce qu'il est utile de préparer avant de nous écrire. */
const A_PREPARER = [
  "Une photo ou un scan du courrier que vous avez reçu",
  "La référence du dossier et la date du constat",
  "Vos preuves : reçu, capture de l'application, photos du lieu",
  "En une phrase : ce qui s'est passé selon vous",
];

export default function ContactPage() {
  const [nom, setNom] = useState("");
  const [message, setMessage] = useState("");

  // Sans serveur, le formulaire prépare simplement un e-mail dans le client du visiteur.
  const mailto = useMemo(() => {
    const sujet = `Demande d'aide — ${nom.trim() || "stationnement"}`;
    const corps = [
      `Bonjour,`,
      ``,
      message.trim() || "Je vous écris au sujet d'une redevance de stationnement.",
      ``,
      `Cordialement,`,
      nom.trim(),
    ].join("\n");
    return `mailto:${ASSO.email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  }, [nom, message]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHead
        kicker="Contact"
        title="Parlons de votre dossier"
        intro="Un appel ou un e-mail suffit. Nous sommes une petite association : nous répondons nous-mêmes, et notre aide est gratuite."
      />

      {/* CONTACT DIRECT — mis en avant avant tout formulaire. */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={`tel:${ASSO.telephoneLien}`}
          className="group rounded-xl border-2 border-gold-400 bg-gold-100/60 p-6 text-center transition hover:bg-gold-100"
        >
          <PhoneIcon className="mx-auto h-7 w-7 text-gold-600" />
          <p className="mt-3 font-display text-lg font-bold text-navy-900">Appelez-nous</p>
          <p className="mt-1 font-semibold text-navy-800 group-hover:underline">{ASSO.telephone}</p>
          <p className="mt-2 text-sm text-ink-soft">Le plus rapide, surtout si votre délai est court.</p>
        </a>

        <a
          href={`mailto:${ASSO.email}`}
          className="group rounded-xl border border-line bg-card p-6 text-center shadow-sm transition hover:border-navy-600/50"
        >
          <MailIcon className="mx-auto h-7 w-7 text-navy-700" />
          <p className="mt-3 font-display text-lg font-bold text-navy-900">Écrivez-nous</p>
          <p className="mt-1 break-all font-semibold text-navy-800 group-hover:underline">{ASSO.email}</p>
          <p className="mt-2 text-sm text-ink-soft">Idéal pour joindre une photo de votre courrier.</p>
        </a>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Ce qu'il faut nous préparer" subtitle="Avec ces éléments, nous pouvons vous aider tout de suite.">
          <ul className="space-y-2.5">
            {A_PREPARER.map((x) => (
              <li key={x} className="flex gap-2.5 text-sm text-ink">
                <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ok-600" />
                {x}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            Vous n&apos;avez pas tout sous la main ? Écrivez-nous quand même : nous vous dirons ce qui
            manque.
          </p>
        </Card>

        <Card title="Rédiger votre message" subtitle="Ce formulaire ouvre simplement votre messagerie, pré-remplie.">
          <div className="space-y-4">
            <Field label="Votre nom">
              <TextInput value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Votre message">
              <TextArea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre situation en quelques lignes : type de courrier, commune, date, montant…"
              />
            </Field>
          </div>
          <LinkBtn href={mailto} variant="gold" className="mt-4 w-full">
            <MailIcon className="h-4 w-4" />
            Ouvrir mon e-mail
          </LinkBtn>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            Rien n&apos;est envoyé depuis ce site et rien n&apos;y est enregistré : le message part de votre
            propre messagerie, où vous pouvez encore joindre vos documents.
          </p>
        </Card>
      </div>

      {/* L'ASSOCIATION */}
      <Card title="L'association" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          {ASSO.nom} est une association sans but lucratif bruxelloise, créée le {ASSO.constitution}. Beaucoup
          de personnes sont renvoyées vers un avocat sans en avoir les moyens ni l&apos;envie : notre rôle est
          de leur permettre de se défendre elles-mêmes. Avec un simple numéro de téléphone et une adresse
          e-mail, nous avons déjà accompagné entre 220 et 250 dossiers.
        </p>

        <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-navy-900">Dénomination</dt>
            <dd className="text-ink-soft">{ASSO.nom}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Forme juridique</dt>
            <dd className="text-ink-soft">{ASSO.formeJuridique}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Numéro d&apos;entreprise</dt>
            <dd className="text-ink-soft">{ASSO.bce}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Date de constitution</dt>
            <dd className="text-ink-soft">{ASSO.constitution}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Président</dt>
            <dd className="text-ink-soft">{ASSO.president}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy-900">Administrateurs</dt>
            <dd className="text-ink-soft">{ASSO.administrateurs.join(", ")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-navy-900">Siège social</dt>
            <dd className="text-ink-soft">
              {ASSO.rue}, {ASSO.codePostal} {ASSO.ville}, {ASSO.pays}
            </dd>
          </div>
        </dl>
      </Card>

      {/* DONNÉES PERSONNELLES */}
      <Card title="Vos données personnelles" className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Ce site ne collecte aucune donnée : il n&apos;y a ni compte, ni base de données, ni formulaire
          enregistré. Les informations que vous saisissez dans l&apos;outil de contestation restent dans
          votre navigateur et disparaissent lorsque vous fermez la page.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Si vous nous écrivez, nous conservons votre message uniquement le temps de vous accompagner. Vous
          pouvez demander sa suppression à tout moment en écrivant à{" "}
          <a href={`mailto:${ASSO.email}`} className="font-semibold text-navy-700 underline">
            {ASSO.email}
          </a>
          .
        </p>
      </Card>

      <div className="mt-8 text-center">
        <LinkBtn href="/contester" variant="secondary">
          Préparer ma lettre de contestation →
        </LinkBtn>
      </div>
    </div>
  );
}
