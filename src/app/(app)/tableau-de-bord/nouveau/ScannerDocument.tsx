"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  lireDocument,
  FORMATS_ACCEPTES,
  TAILLE_MAX_OCTETS,
  type ProgressionOCR,
  type ResultatLecture,
} from "@/lib/ocr";
import {
  extraireDonnees,
  tauxDeReconnaissance,
  champsAVerifier,
  type DonneesExtraites,
  type Confiance,
} from "@/lib/extraction";
import { echeanceContestation, DELAI_CONTESTATION_JOURS } from "@/lib/contestation";
import { creerDossier } from "@/lib/dossiers-actions";
import { Card, Field, TextInput, SelectInput, Btn, LinkBtn, KeyBox } from "@/components/ui";
import { COMMUNES } from "@/lib/data";
import { TYPES_DOCUMENT, formatDate } from "@/lib/dossiers-format";

type Etape = "depot" | "analyse" | "verification";

const CONFIANCE_STYLE: Record<Confiance, { texte: string; classe: string }> = {
  haute: { texte: "Lu avec certitude", classe: "bg-ok-100 text-ok-700" },
  moyenne: { texte: "À vérifier", classe: "bg-warn-100 text-warn-700" },
  faible: { texte: "Peu sûr — vérifiez", classe: "bg-danger-100 text-danger-700" },
};

const ZONES = ["Rouge", "Verte", "Bleue", "Grise", "Jaune", "Événement"];

/** Champ du formulaire de vérification, avec son indice de confiance. */
function ChampVerifie({
  label,
  confiance,
  contexte,
  aide,
  children,
}: {
  label: string;
  confiance?: Confiance;
  contexte?: string;
  aide?: string;
  children: React.ReactNode;
}) {
  const style = confiance ? CONFIANCE_STYLE[confiance] : null;
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-navy-900">{label}</span>
        {style && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${style.classe}`}>
            {style.texte}
          </span>
        )}
      </div>
      {children}
      {aide && <p className="mt-1 text-xs text-ink-soft">{aide}</p>}
      {contexte && (
        <p className="mt-1 truncate text-xs italic text-ink-soft" title={contexte}>
          Lu sur votre document : « {contexte} »
        </p>
      )}
    </div>
  );
}

const FORM_VIDE = {
  reference: "", typeDocument: "notification", autorite: "", commune: "",
  plaque: "", montant: "", dateConstat: "", heureConstat: "", dateEcheance: "",
  dateEnvoi: "", lieuConstat: "", zone: "", communication: "", iban: "",
};

export function ScannerDocument({ formule }: { formule: string; profil: { prenom: string; nom: string } }) {
  const router = useRouter();
  const fichierRef = useRef<HTMLInputElement>(null);

  const [etape, setEtape] = useState<Etape>("depot");
  const [progression, setProgression] = useState<ProgressionOCR>({ etape: "", pourcentage: 0 });
  const [erreur, setErreur] = useState<string | null>(null);
  const [extrait, setExtrait] = useState<DonneesExtraites | null>(null);
  const [lecture, setLecture] = useState<ResultatLecture | null>(null);
  const [nomFichier, setNomFichier] = useState("");
  const [enregistrement, demarrerEnregistrement] = useTransition();

  // Valeurs confirmées par l'utilisateur : pré-remplies par la lecture, modifiables.
  const [form, setForm] = useState(FORM_VIDE);

  const traiterFichier = async (fichier: File) => {
    setErreur(null);

    if (fichier.size > TAILLE_MAX_OCTETS) {
      setErreur("Ce fichier dépasse 20 Mo. Reprenez la photo en qualité un peu moindre.");
      return;
    }

    setNomFichier(fichier.name);
    setEtape("analyse");
    setProgression({ etape: "Préparation…", pourcentage: 0 });

    try {
      const resultat = await lireDocument(fichier, setProgression);

      if (resultat.texte.trim().length < 20) {
        setErreur(
          "Nous n'avons pas réussi à lire ce document. Reprenez la photo à plat, bien éclairée et sans reflet — ou saisissez les informations vous-même, juste en dessous.",
        );
      }

      const donnees = extraireDonnees(resultat.texte);
      setLecture(resultat);
      setExtrait(donnees);
      setForm({
        reference: donnees.reference.valeur ?? "",
        typeDocument: donnees.typeDocument.valeur ?? "notification",
        autorite: donnees.autorite.valeur ?? "",
        commune: donnees.commune.valeur ?? "",
        plaque: donnees.plaque.valeur ?? "",
        montant: donnees.montant.valeur !== null ? String(donnees.montant.valeur) : "",
        dateConstat: donnees.dateConstat.valeur ?? "",
        heureConstat: donnees.heureConstat.valeur ?? "",
        dateEcheance: donnees.dateEcheance.valeur ?? "",
        dateEnvoi: donnees.dateEnvoi.valeur ?? "",
        lieuConstat: donnees.lieuConstat.valeur ?? "",
        zone: donnees.zone.valeur ?? "",
        communication: donnees.communication.valeur ?? "",
        iban: donnees.iban.valeur ?? "",
      });
      setEtape("verification");
    } catch {
      setErreur(
        "La lecture a échoué. Si le fichier vient d'un iPhone, exportez-le en JPEG — ou saisissez les informations vous-même.",
      );
      setEtape("depot");
    }
  };

  // Toujours pointer vers la dernière version de traiterFichier dans l'écouteur.
  const traiterFichierRef = useRef(traiterFichier);
  useEffect(() => {
    traiterFichierRef.current = traiterFichier;
  });

  // Copier-coller d'image ou de capture d'écran (Ctrl+V / Cmd+V).
  useEffect(() => {
    if (etape !== "depot") return;

    const coller = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      const fichier = item?.getAsFile();
      if (fichier) {
        e.preventDefault();
        traiterFichierRef.current(new File([fichier], "capture.png", { type: fichier.type }));
      }
    };

    window.addEventListener("paste", coller);
    return () => window.removeEventListener("paste", coller);
  }, [etape, traiterFichierRef]);

  const saisirALaMain = () => {
    setExtrait(null);
    setLecture(null);
    setForm(FORM_VIDE);
    setEtape("verification");
  };

  const enregistrer = () => {
    setErreur(null);
    demarrerEnregistrement(async () => {
      const resultat = await creerDossier({
        ...form,
        ocrTexte: lecture?.texte ?? "",
        ocrConfiance: extrait
          ? Object.fromEntries(
              Object.entries(extrait).map(([cle, champ]) => [cle, champ.confiance]),
            )
          : {},
      });

      if (resultat.erreur) {
        setErreur(resultat.erreur);
        return;
      }
      router.push(`/tableau-de-bord/${resultat.id}`);
    });
  };

  /* ---------------------------------------------------------------- dépôt */
  if (etape === "depot") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold text-navy-900">
          Ajoutez votre document
        </h2>
        <p className="mt-3 text-center leading-relaxed text-ink-soft">
          Photographiez votre courrier, collez une capture d&apos;écran (Ctrl+V) ou déposez un PDF.
          Nous en extrayons <strong className="text-navy-900">tout</strong> : référence, montant,
          dates, heure, lieu, plaque, communication structurée. Vous n&apos;avez plus qu&apos;à
          vérifier.
        </p>

        <button
          type="button"
          onClick={() => fichierRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("border-navy-900", "bg-navy-100");
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-navy-900", "bg-navy-100");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-navy-900", "bg-navy-100");
            const fichier = e.dataTransfer.files?.[0];
            if (fichier) traiterFichier(fichier);
          }}
          className="mt-8 flex w-full flex-col items-center rounded-xl border-2 border-dashed border-navy-600/40 bg-card p-10 text-center transition hover:border-navy-700 hover:bg-navy-50"
        >
          <svg viewBox="0 0 24 24" className="h-12 w-12 text-navy-700" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 15v3a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-3" strokeLinecap="round" />
          </svg>
          <span className="mt-4 font-display text-lg font-bold text-navy-900">
            Choisir, coller ou déposer un document
          </span>
          <span className="mt-1 text-sm text-ink-soft">
            Photo, capture d&apos;écran, PDF de plusieurs pages — 20 Mo maximum
          </span>
        </button>

        <input
          ref={fichierRef}
          type="file"
          accept={FORMATS_ACCEPTES}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) traiterFichier(f);
          }}
        />

        {erreur && (
          <p role="alert" className="mt-4 rounded-md bg-danger-100 p-3 text-sm font-medium text-danger-700">
            {erreur}
          </p>
        )}

        <div className="mt-6 text-center">
          <button onClick={saisirALaMain} className="text-sm font-semibold text-navy-700 underline">
            Je préfère saisir les informations moi-même
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-card p-4">
            <p className="font-display text-sm font-bold text-navy-900">Un PDF ? C&apos;est parfait</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Nous lisons son texte directement, sans reconnaissance d&apos;image : aucune erreur
              possible sur la référence ou le montant. Toutes les pages sont lues, pas seulement la
              première.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <p className="font-display text-sm font-bold text-navy-900">Une photo de travers ?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Nous essayons plusieurs réglages et plusieurs orientations, et gardons la meilleure
              lecture. Un document à l&apos;envers ou mal éclairé passe quand même.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <KeyBox title="Votre document ne quitte pas votre appareil">
            La lecture se fait dans votre navigateur. Le fichier ne part vers aucun serveur : seules
            les informations que vous confirmez à l&apos;écran rejoignent votre dossier.
          </KeyBox>
        </div>

        <p className="mt-6 text-center text-xs text-ink-soft">Formule {formule}</p>
      </div>
    );
  }

  /* -------------------------------------------------------------- analyse */
  if (etape === "analyse") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-navy-100 border-t-navy-800" />
        <h2 className="mt-8 font-display text-xl font-bold text-navy-900">{progression.etape}</h2>
        <p className="mt-2 truncate text-sm text-ink-soft">{nomFichier}</p>

        <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-line-soft">
          <div
            className="h-full rounded-full bg-navy-800 transition-[width] duration-300"
            style={{ width: `${progression.pourcentage}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-navy-800">{progression.pourcentage} %</p>
        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          Sur une photo, la première lecture télécharge le moteur de reconnaissance : comptez une
          trentaine de secondes. Les suivantes sont bien plus rapides. Un PDF, lui, est lu
          instantanément.
        </p>
      </div>
    );
  }

  /* --------------------------------------------------------- vérification */
  const taux = extrait ? tauxDeReconnaissance(extrait) : 0;
  const aVerifier = extrait ? champsAVerifier(extrait) : [];
  const echeance = echeanceContestation(form.dateEnvoi);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h2 className="font-display text-3xl font-bold text-navy-900">Vérifiez les informations</h2>

      {extrait && lecture ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                lecture.source === "texte-pdf" ? "bg-ok-100 text-ok-700" : "bg-navy-50 text-navy-700"
              }`}
            >
              {lecture.source === "texte-pdf"
                ? `Texte lu directement dans le PDF — aucune erreur de reconnaissance`
                : `Reconnaissance d'image — confiance ${lecture.confiance} %`}
            </span>
            {lecture.pages > 1 && (
              <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-700">
                {lecture.pages} pages lues
              </span>
            )}
            <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-700">
              {taux} % des champs clés trouvés
            </span>
          </div>

          <p className="mt-3 leading-relaxed text-ink-soft">
            {aVerifier.length > 0 ? (
              <>
                Regardez en priorité <strong className="text-navy-900">{aVerifier.join(", ")}</strong>{" "}
                : ces valeurs ont été lues, mais sans certitude. Une date mal lue vous ferait rater
                un délai.
              </>
            ) : (
              <>
                Tout a été lu avec certitude. Un coup d&apos;œil de contrôle et vous pouvez
                enregistrer.
              </>
            )}
          </p>
        </>
      ) : (
        <p className="mt-3 text-ink-soft">
          Recopiez les informations qui figurent sur votre courrier. Tout ce que vous saisissez ici
          se retrouvera dans votre lettre, vous ne le retaperez pas une seconde fois.
        </p>
      )}

      {erreur && (
        <div role="alert" className="mt-5 rounded-md bg-danger-100 p-4 text-sm text-danger-700">
          <p className="font-semibold">{erreur}</p>
          {erreur.includes("gratuites") && (
            <LinkBtn href="/tarifs" variant="gold" className="mt-3">Voir les formules</LinkBtn>
          )}
        </div>
      )}

      {/* Le délai, calculé et expliqué : c'est l'information la plus périssable. */}
      {echeance && (
        <div
          className={`mt-5 rounded-xl border-2 p-4 ${
            echeance.depasse
              ? "border-danger-600/40 bg-danger-100"
              : echeance.joursRestants <= 3
                ? "border-warn-600/40 bg-warn-100"
                : "border-navy-600/25 bg-navy-50"
          }`}
        >
          <p className="text-sm font-bold text-navy-900">
            {echeance.depasse
              ? `Le délai de contestation semble dépassé depuis ${-echeance.joursRestants} jour${-echeance.joursRestants > 1 ? "s" : ""}`
              : `Il vous resterait ${echeance.joursRestants} jour${echeance.joursRestants > 1 ? "s" : ""} pour contester`}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            Calcul indicatif : {DELAI_CONTESTATION_JOURS} jours à compter du{" "}
            {formatDate(form.dateEnvoi)}, soit jusqu&apos;au {formatDate(echeance.limite)}.{" "}
            <strong>C&apos;est la mention portée sur votre courrier qui fait foi</strong> — les
            délais varient d&apos;une commune à l&apos;autre.
          </p>
        </div>
      )}

      <Card title="Le constat" className="mt-6">
        <div className="space-y-5">
          <ChampVerifie
            label="Référence du dossier"
            confiance={extrait?.reference.confiance}
            contexte={extrait?.reference.contexte}
            aide="En haut de votre courrier."
          >
            <TextInput
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Ex. 2026/4471820"
            />
          </ChampVerifie>

          <ChampVerifie
            label="Communication structurée"
            confiance={extrait?.communication.confiance}
            contexte={extrait?.communication.contexte}
            aide="Elle identifie votre dossier plus sûrement qu'une référence recopiée."
          >
            <TextInput
              value={form.communication}
              onChange={(e) => setForm({ ...form, communication: e.target.value })}
              placeholder="+++000/0000/00000+++"
            />
          </ChampVerifie>

          <ChampVerifie
            label="Type de document"
            confiance={extrait?.typeDocument.confiance}
            contexte={extrait?.typeDocument.contexte}
            aide="Il dit où vous en êtes dans la procédure, et donc ce qui presse."
          >
            <SelectInput
              options={Object.entries(TYPES_DOCUMENT).map(([value, label]) => ({ value, label }))}
              value={form.typeDocument}
              onChange={(e) => setForm({ ...form, typeDocument: e.target.value })}
            />
          </ChampVerifie>

          <div className="grid gap-5 sm:grid-cols-2">
            <ChampVerifie
              label="Montant réclamé (€)"
              confiance={extrait?.montant.confiance}
              contexte={extrait?.montant.contexte}
            >
              <TextInput
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                inputMode="decimal"
                placeholder="25"
              />
            </ChampVerifie>

            <ChampVerifie
              label="Plaque d'immatriculation"
              confiance={extrait?.plaque.confiance}
              contexte={extrait?.plaque.contexte}
            >
              <TextInput
                value={form.plaque}
                onChange={(e) => setForm({ ...form, plaque: e.target.value })}
                placeholder="1-ABC-123"
              />
            </ChampVerifie>

            <ChampVerifie
              label="Date du constat"
              confiance={extrait?.dateConstat.confiance}
              contexte={extrait?.dateConstat.contexte}
            >
              <TextInput
                type="date"
                value={form.dateConstat}
                onChange={(e) => setForm({ ...form, dateConstat: e.target.value })}
              />
            </ChampVerifie>

            <ChampVerifie
              label="Heure du constat"
              confiance={extrait?.heureConstat.confiance}
              contexte={extrait?.heureConstat.contexte}
              aide="Décisive si vous aviez payé."
            >
              <TextInput
                type="time"
                value={form.heureConstat}
                onChange={(e) => setForm({ ...form, heureConstat: e.target.value })}
              />
            </ChampVerifie>

            <ChampVerifie
              label="Date d'envoi du courrier"
              confiance={extrait?.dateEnvoi.confiance}
              contexte={extrait?.dateEnvoi.contexte}
              aide="C'est d'elle que court le délai de contestation."
            >
              <TextInput
                type="date"
                value={form.dateEnvoi}
                onChange={(e) => setForm({ ...form, dateEnvoi: e.target.value })}
              />
            </ChampVerifie>

            <ChampVerifie
              label="Date limite pour réagir"
              confiance={extrait?.dateEcheance.confiance}
              contexte={extrait?.dateEcheance.contexte}
            >
              <TextInput
                type="date"
                value={form.dateEcheance}
                onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })}
              />
            </ChampVerifie>
          </div>
        </div>
      </Card>

      <Card title="Le lieu" subtitle="C'est lui qui détermine la règle qu'on vous oppose." className="mt-5">
        <div className="space-y-5">
          <ChampVerifie
            label="Rue et numéro du constat"
            confiance={extrait?.lieuConstat.confiance}
            contexte={extrait?.lieuConstat.contexte}
          >
            <TextInput
              value={form.lieuConstat}
              onChange={(e) => setForm({ ...form, lieuConstat: e.target.value })}
              placeholder="Ex. Chaussée d'Ixelles 145"
            />
          </ChampVerifie>

          <div className="grid gap-5 sm:grid-cols-2">
            <ChampVerifie
              label="Commune du constat"
              confiance={extrait?.commune.confiance}
              contexte={extrait?.commune.contexte}
            >
              <SelectInput
                options={COMMUNES.map((c) => ({ value: c.nom, label: c.nom }))}
                placeholder="Choisissez la commune…"
                value={form.commune}
                onChange={(e) => setForm({ ...form, commune: e.target.value })}
              />
            </ChampVerifie>

            <ChampVerifie
              label="Zone de stationnement"
              confiance={extrait?.zone.confiance}
              contexte={extrait?.zone.contexte}
            >
              <SelectInput
                options={ZONES.map((z) => ({ value: z, label: z }))}
                placeholder="Non précisée"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
              />
            </ChampVerifie>
          </div>
        </div>
      </Card>

      <Card title="Qui vous réclame la somme" className="mt-5">
        <div className="space-y-5">
          <ChampVerifie confiance={extrait?.autorite.confiance} contexte={extrait?.autorite.contexte} label="Autorité ou service">
            <TextInput
              value={form.autorite}
              onChange={(e) => setForm({ ...form, autorite: e.target.value })}
              placeholder="parking.brussels, commune, huissier…"
            />
          </ChampVerifie>

          <Field label="IBAN indiqué sur le courrier" hint="Utile pour prouver un paiement ou en demander le remboursement.">
            <TextInput
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value })}
              placeholder="BE00 0000 0000 0000"
            />
          </Field>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Btn onClick={enregistrer} variant="gold" className="flex-1" disabled={enregistrement}>
            {enregistrement ? "Enregistrement…" : "Confirmer et créer le dossier"}
          </Btn>
          <Btn onClick={() => setEtape("depot")} variant="secondary" disabled={enregistrement}>
            Recommencer
          </Btn>
        </div>
      </Card>

      {lecture?.texte && (
        <details className="mt-5 rounded-xl border border-line bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Voir le texte lu sur le document
          </summary>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-ink-soft">
            {lecture.texte}
          </pre>
        </details>
      )}
    </div>
  );
}
