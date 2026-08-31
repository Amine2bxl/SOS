"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { lireDocument, FORMATS_ACCEPTES, TAILLE_MAX_OCTETS, type ProgressionOCR } from "@/lib/ocr";
import { extraireDonnees, tauxDeReconnaissance, type DonneesExtraites, type Confiance } from "@/lib/extraction";
import { creerDossier } from "@/lib/dossiers-actions";
import { Card, Field, TextInput, SelectInput, Btn, LinkBtn, KeyBox } from "@/components/ui";
import { COMMUNES } from "@/lib/data";
import { TYPES_DOCUMENT } from "@/lib/dossiers-format";

type Etape = "depot" | "analyse" | "verification";

const CONFIANCE_STYLE: Record<Confiance, { texte: string; classe: string }> = {
  haute: { texte: "Lu avec certitude", classe: "bg-ok-100 text-ok-700" },
  moyenne: { texte: "À vérifier", classe: "bg-warn-100 text-warn-700" },
  faible: { texte: "Peu sûr — vérifiez", classe: "bg-danger-100 text-danger-700" },
};

/** Champ du formulaire de vérification, avec son indice de confiance. */
function ChampVerifie({
  label,
  confiance,
  contexte,
  obligatoire,
  children,
}: {
  label: string;
  confiance?: Confiance;
  contexte?: string;
  obligatoire?: boolean;
  children: React.ReactNode;
}) {
  const style = confiance ? CONFIANCE_STYLE[confiance] : null;
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-navy-900">
          {label} {obligatoire && <span className="text-danger-600">*</span>}
        </span>
        {style && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${style.classe}`}>
            {style.texte}
          </span>
        )}
      </div>
      {children}
      {contexte && (
        <p className="mt-1 truncate text-xs italic text-ink-soft" title={contexte}>
          Lu sur votre document : « {contexte} »
        </p>
      )}
    </div>
  );
}

export function ScannerDocument({ formule }: { formule: string; profil: { prenom: string; nom: string } }) {
  const router = useRouter();
  const fichierRef = useRef<HTMLInputElement>(null);

  const [etape, setEtape] = useState<Etape>("depot");
  const [progression, setProgression] = useState<ProgressionOCR>({ etape: "", pourcentage: 0 });
  const [erreur, setErreur] = useState<string | null>(null);
  const [extrait, setExtrait] = useState<DonneesExtraites | null>(null);
  const [texteBrut, setTexteBrut] = useState("");
  const [nomFichier, setNomFichier] = useState("");
  const [enregistrement, demarrerEnregistrement] = useTransition();

  // Valeurs confirmées par l'utilisateur : pré-remplies par l'OCR, modifiables.
  const [form, setForm] = useState({
    reference: "", typeDocument: "notification", autorite: "", commune: "",
    plaque: "", montant: "", dateConstat: "", dateEcheance: "",
  });

  const traiterFichier = async (fichier: File) => {
    setErreur(null);

    if (fichier.size > TAILLE_MAX_OCTETS) {
      setErreur("Ce fichier dépasse 15 Mo. Prenez une photo un peu moins lourde.");
      return;
    }

    setNomFichier(fichier.name);
    setEtape("analyse");
    setProgression({ etape: "Préparation…", pourcentage: 0 });

    try {
      const texte = await lireDocument(fichier, setProgression);

      if (texte.trim().length < 20) {
        setErreur(
          "Nous n'avons pas réussi à lire ce document. Reprenez la photo à plat, bien éclairée et sans reflet. Ou saisissez les informations vous-même, juste en dessous.",
        );
      }

      const donnees = extraireDonnees(texte);
      setTexteBrut(texte);
      setExtrait(donnees);
      setForm({
        reference: donnees.reference.valeur ?? "",
        typeDocument: donnees.typeDocument.valeur ?? "notification",
        autorite: donnees.autorite.valeur ?? "",
        commune: donnees.commune.valeur ?? "",
        plaque: donnees.plaque.valeur ?? "",
        montant: donnees.montant.valeur !== null ? String(donnees.montant.valeur) : "",
        dateConstat: donnees.dateConstat.valeur ?? "",
        dateEcheance: donnees.dateEcheance.valeur ?? "",
      });
      setEtape("verification");
    } catch {
      setErreur(
        "La lecture a échoué. Réessayez avec une photo, ou saisissez les informations vous-même.",
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
    setTexteBrut("");
    setEtape("verification");
  };

  const enregistrer = () => {
    setErreur(null);
    demarrerEnregistrement(async () => {
      const resultat = await creerDossier({
        ...form,
        ocrTexte: texteBrut,
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
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-center font-display text-3xl font-bold text-navy-900">
          Ajoutez votre document
        </h1>
        <p className="mt-3 text-center text-ink-soft">
          Photographiez votre courrier, collez une capture d&apos;écran (Ctrl+V) ou déposez une photo
          ou un PDF. Nous en extrayons la référence, le montant, les dates et la plaque. Vous
          vérifiez, puis c&apos;est enregistré.
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
            Photo, capture d&apos;écran (Ctrl+V) ou PDF — 15 Mo maximum
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

        <div className="mt-8">
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
        <h1 className="mt-8 font-display text-xl font-bold text-navy-900">{progression.etape}</h1>
        <p className="mt-2 truncate text-sm text-ink-soft">{nomFichier}</p>

        <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-line-soft">
          <div
            className="h-full rounded-full bg-navy-800 transition-[width] duration-300"
            style={{ width: `${progression.pourcentage}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-navy-800">{progression.pourcentage} %</p>
        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          La première lecture télécharge le moteur de reconnaissance, comptez une trentaine de
          secondes. Les suivantes sont bien plus rapides.
        </p>
      </div>
    );
  }

  /* --------------------------------------------------------- vérification */
  const taux = extrait ? tauxDeReconnaissance(extrait) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-navy-900">Vérifiez les informations</h1>

      {extrait ? (
        <p className="mt-3 leading-relaxed text-ink-soft">
          Nous avons reconnu <strong className="text-navy-900">{taux} %</strong> des informations.
          <strong className="text-navy-900"> Relisez chaque champ</strong> et corrigez ce qui cloche :
          une date d&apos;échéance mal lue vous ferait rater un délai.
        </p>
      ) : (
        <p className="mt-3 text-ink-soft">
          Recopiez les informations qui figurent sur votre courrier.
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

      <Card className="mt-6">
        <div className="space-y-5">
          <ChampVerifie label="Référence du dossier" confiance={extrait?.reference.confiance} contexte={extrait?.reference.contexte}>
            <TextInput
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Ex. 2026/4471820"
            />
          </ChampVerifie>

          <ChampVerifie label="Type de document" confiance={extrait?.typeDocument.confiance} contexte={extrait?.typeDocument.contexte}>
            <SelectInput
              options={Object.entries(TYPES_DOCUMENT).map(([value, label]) => ({ value, label }))}
              value={form.typeDocument}
              onChange={(e) => setForm({ ...form, typeDocument: e.target.value })}
            />
          </ChampVerifie>

          <div className="grid gap-5 sm:grid-cols-2">
            <ChampVerifie label="Montant réclamé (€)" confiance={extrait?.montant.confiance} contexte={extrait?.montant.contexte}>
              <TextInput
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                inputMode="decimal"
                placeholder="25"
              />
            </ChampVerifie>

            <ChampVerifie label="Plaque d'immatriculation" confiance={extrait?.plaque.confiance} contexte={extrait?.plaque.contexte}>
              <TextInput
                value={form.plaque}
                onChange={(e) => setForm({ ...form, plaque: e.target.value })}
                placeholder="1-ABC-123"
              />
            </ChampVerifie>

            <ChampVerifie label="Date du constat" confiance={extrait?.dateConstat.confiance} contexte={extrait?.dateConstat.contexte}>
              <TextInput
                type="date"
                value={form.dateConstat}
                onChange={(e) => setForm({ ...form, dateConstat: e.target.value })}
              />
            </ChampVerifie>

            <ChampVerifie label="Date limite pour réagir" confiance={extrait?.dateEcheance.confiance} contexte={extrait?.dateEcheance.contexte}>
              <TextInput
                type="date"
                value={form.dateEcheance}
                onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })}
              />
            </ChampVerifie>
          </div>

          <ChampVerifie label="Commune du constat" confiance={extrait?.commune.confiance} contexte={extrait?.commune.contexte}>
            <SelectInput
              options={COMMUNES.map((c) => ({ value: c.nom, label: c.nom }))}
              placeholder="Choisissez la commune…"
              value={form.commune}
              onChange={(e) => setForm({ ...form, commune: e.target.value })}
            />
          </ChampVerifie>

          <ChampVerifie label="Qui vous réclame la somme" confiance={extrait?.autorite.confiance} contexte={extrait?.autorite.contexte}>
            <TextInput
              value={form.autorite}
              onChange={(e) => setForm({ ...form, autorite: e.target.value })}
              placeholder="parking.brussels, commune, huissier…"
            />
          </ChampVerifie>
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

      {texteBrut && (
        <details className="mt-5 rounded-xl border border-line bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Voir le texte brut lu sur le document
          </summary>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-ink-soft">
            {texteBrut}
          </pre>
        </details>
      )}
    </div>
  );
}
