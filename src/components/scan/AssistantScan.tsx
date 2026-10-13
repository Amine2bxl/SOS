"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  lireDocument,
  FORMATS_ACCEPTES,
  TAILLE_MAX_OCTETS,
  type ProgressionOCR,
  type ResultatLecture,
} from "@/lib/ocr";
import { extraireDeTextes, type Confiance, type DonneesExtraites } from "@/lib/extraction";
import { detecterLieu } from "@/cerveau/moteur/region";
import { questionsAPoser } from "@/cerveau/base/questions";
import type { Analyse, Faits, MoyenRetenu, Region, Stade } from "@/cerveau/types";
import { analyserFaits } from "@/lib/cerveau-actions";
import { creerDossier } from "@/lib/dossiers-actions";
import { nombreOuNull } from "@/lib/validation";
import { COMMUNES } from "@/lib/data";
import { messageHorsPerimetre, regionOuverte } from "@/lib/perimetre";
import { BoutonContact } from "@/components/Contact";
import { TYPES_DOCUMENT, formatDate, formatMontant } from "@/lib/dossiers-format";
import { Btn, LinkBtn, Pastille } from "@/components/ui";
import { CompteARebours, JaugeSolidite, FriseProcedure } from "@/components/dossier-ui";
import {
  IconeAttention,
  IconeCadenas,
  IconeCerveau,
  IconeChevron,
  IconeFleche,
  IconeFlecheGauche,
  IconeLibre,
  IconeLoupe,
  IconePreuve,
  IconeScanDoc,
  IconeTelecharger,
} from "@/components/icones";
import {
  FORMULAIRE_VIDE,
  effacerBrouillon,
  enregistrerBrouillon,
  lireBrouillon,
  type Formulaire,
} from "./brouillon";

type Etape = "depot" | "lecture" | "verification" | "questions" | "verdict";

const ETAPES_VISIBLES: { id: Etape; libelle: string }[] = [
  { id: "depot", libelle: "Courrier" },
  { id: "verification", libelle: "Vérification" },
  { id: "questions", libelle: "Questions" },
  { id: "verdict", libelle: "Résultat" },
];

// Dans l'ordre du plan : Bruxelles est ouverte, la Flandre puis la Wallonie suivront.
const REGIONS: { id: Region; nom: string }[] = [
  { id: "bruxelles", nom: "Bruxelles" },
  { id: "flandre", nom: "Flandre" },
  { id: "wallonie", nom: "Wallonie" },
];

/**
 * Dans l'espace membre, l'assistant est la page : ses titres sont des h1. Sur
 * la page d'accueil du site, il vit dans une section qui a déjà son titre : ils
 * descendent d'un cran, pour garder un seul h1 par page.
 */
const NiveauTitre = createContext<"h1" | "h3">("h1");

function Titre({ className, children }: { className: string; children: React.ReactNode }) {
  return useContext(NiveauTitre) === "h1" ? (
    <h1 data-titre-etape="" className={className}>
      {children}
    </h1>
  ) : (
    <h3 data-titre-etape="" className={className}>
      {children}
    </h3>
  );
}

/** Les faits, tels que le moteur les attend, depuis le formulaire. */
function faitsDuFormulaire(form: Formulaire, reponses: Record<string, string>): Faits {
  const region = REGIONS.some((r) => r.id === form.region) ? (form.region as Region) : null;
  const vide = (v: string) => v.trim() || null;
  return {
    region,
    commune: vide(form.commune),
    crediteur: vide(form.crediteur),
    stade: (form.typeDocument || "notification") as Stade,
    montant: nombreOuNull(form.montant, { min: 0, max: 100000 }),
    dateConstat: vide(form.dateConstat),
    heureConstat: vide(form.heureConstat),
    dateEnvoi: vide(form.dateEnvoi),
    dateEcheance: vide(form.dateEcheance),
    plaque: vide(form.plaque),
    lieu: vide(form.lieuConstat),
    zone: vide(form.zone),
    reference: vide(form.reference),
    communication: vide(form.communication),
    langueDocument: form.langue === "nl" ? "nl" : "fr",
    reponses,
  };
}

/**
 * L'assistant : du courrier à l'analyse, en quatre écrans.
 *
 * 1. On dépose le courrier (photo, capture, PDF). Il est lu sur l'appareil.
 * 2. On vérifie ce qui a été lu — seuls les champs douteux sont signalés.
 * 3. On répond à quelques questions, une à la fois, d'un geste. Le moteur ne
 *    pose que celles dont la réponse peut changer l'analyse.
 * 4. Le moteur rend son avis : quoi faire, avant quand, avec quels arguments.
 *
 * Le même assistant sert le visiteur (page d'accueil du site : analyse
 * gratuite, sans compte) et le membre (création du dossier). Le visiteur qui
 * veut sa lettre crée son compte, et retrouve tout à son retour.
 */
export function AssistantScan({ mode }: { mode: "membre" | "visiteur" }) {
  const router = useRouter();
  const parametres = useSearchParams();

  const [etape, setEtape] = useState<Etape>("depot");
  const [form, setForm] = useState<Formulaire>(FORMULAIRE_VIDE);
  const [extrait, setExtrait] = useState<DonneesExtraites | null>(null);
  const [lecture, setLecture] = useState<ResultatLecture | null>(null);
  const [regionCertaine, setRegionCertaine] = useState(false);
  const [progression, setProgression] = useState<ProgressionOCR>({ etape: "", pourcentage: 0 });
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [historique, setHistorique] = useState<string[]>([]);
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [quotaAtteint, setQuotaAtteint] = useState(false);
  const [enAnalyse, demarrerAnalyse] = useTransition();
  const [enCreation, demarrerCreation] = useTransition();
  const haut = useRef<HTMLDivElement>(null);

  const allerA = useCallback((e: Etape) => {
    setEtape(e);
    setErreur(null);
    haut.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const faits = useMemo(() => faitsDuFormulaire(form, reponses), [form, reponses]);
  const restantes = useMemo(() => questionsAPoser(faits), [faits]);

  /* ------------------------------------------------------------ analyse */
  const lancerAnalyse = useCallback(
    (f: Faits) => {
      demarrerAnalyse(async () => {
        const r = await analyserFaits(f);
        if (r.erreur || !r.analyse) {
          setErreur(r.erreur ?? "L'analyse n'a pas abouti. Réessayez dans un instant.");
          return;
        }
        setAnalyse(r.analyse);
        allerA("verdict");
      });
    },
    [allerA],
  );

  // Reprise après création de compte : le visiteur avait demandé sa lettre.
  // Son brouillon devient directement un dossier, et il atterrit sur sa lettre
  // — sans rien lui redemander. Si la création échoue (plafond atteint), on
  // lui montre au moins son analyse.
  const repris = useRef(false);
  useEffect(() => {
    if (repris.current || mode !== "membre" || parametres.get("reprise") !== "1") return;
    repris.current = true;
    const b = lireBrouillon();
    if (!b) return;
    demarrerCreation(async () => {
      const r = await creerDossier({ ...b.form, reponses: b.reponses, ocrTexte: "", ocrConfiance: b.ocrConfiance });
      if (r.erreur || !r.id) {
        setForm(b.form);
        setReponses(b.reponses);
        setEtape("verdict");
        setErreur(r.erreur ?? "Le dossier n'a pas pu être enregistré.");
        setQuotaAtteint(!!r.quotaAtteint);
        lancerAnalyse(faitsDuFormulaire(b.form, b.reponses));
        return;
      }
      effacerBrouillon();
      router.push(`/tableau-de-bord/${r.id}?nouveau=1#lettre`);
    });
  }, [mode, parametres, lancerAnalyse, router]);

  /* ------------------------------------------------------------- lecture */
  const traiterFichier = async (fichier: File) => {
    setErreur(null);
    if (fichier.size > TAILLE_MAX_OCTETS) {
      setErreur("Ce fichier dépasse 20 Mo. Reprenez la photo en qualité un peu moindre.");
      return;
    }
    allerA("lecture");
    setProgression({ etape: "Préparation…", pourcentage: 2 });

    try {
      const resultat = await lireDocument(fichier, setProgression);
      const donnees = extraireDeTextes(resultat.textes);
      const lieu = detecterLieu(resultat.texte, donnees.commune.valeur);

      setLecture(resultat);
      setExtrait(donnees);
      setRegionCertaine(lieu.certaine);
      setForm({
        reference: donnees.reference.valeur ?? "",
        typeDocument: donnees.typeDocument.valeur ?? "notification",
        crediteur: donnees.autorite.valeur ?? "",
        commune: donnees.commune.valeur ?? lieu.commune ?? "",
        region: lieu.region ?? "",
        langue: lieu.langue ?? "fr",
        plaque: donnees.plaque.valeur ?? "",
        montant: donnees.montant.valeur !== null ? donnees.montant.valeur.toFixed(2).replace(".", ",") : "",
        dateConstat: donnees.dateConstat.valeur ?? "",
        heureConstat: donnees.heureConstat.valeur ?? "",
        dateEcheance: donnees.dateEcheance.valeur ?? "",
        dateEnvoi: donnees.dateEnvoi.valeur ?? "",
        lieuConstat: donnees.lieuConstat.valeur ?? "",
        zone: donnees.zone.valeur ?? "",
        communication: donnees.communication.valeur ?? "",
        iban: donnees.iban.valeur ?? "",
      });
      if (resultat.texte.trim().length < 20) {
        setErreur(
          "Le document est très peu lisible. Complétez les champs ci-dessous, ou reprenez la photo à plat, bien éclairée.",
        );
      }
      setEtape("verification");
    } catch {
      setErreur(
        "La lecture a échoué. Une photo d'iPhone ? Exportez-la en JPEG — ou saisissez les informations vous-même.",
      );
      setEtape("depot");
    }
  };

  const traiterRef = useRef(traiterFichier);
  useEffect(() => {
    traiterRef.current = traiterFichier;
  });

  // Coller une capture d'écran (Ctrl+V) : le geste le plus rapide sur ordinateur.
  useEffect(() => {
    if (etape !== "depot") return;
    const coller = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      const fichier = item?.getAsFile();
      if (fichier) {
        e.preventDefault();
        traiterRef.current(new File([fichier], "capture.png", { type: fichier.type }));
      }
    };
    window.addEventListener("paste", coller);
    return () => window.removeEventListener("paste", coller);
  }, [etape]);

  /* ----------------------------------------------------------- questions */
  const repondre = (idQuestion: string, idOption: string) => {
    setReponses((r) => ({ ...r, [idQuestion]: idOption }));
    setHistorique((h) => [...h, idQuestion]);
  };

  const revenir = () => {
    const dernier = historique[historique.length - 1];
    if (!dernier) {
      allerA("verification");
      return;
    }
    setHistorique((h) => h.slice(0, -1));
    setReponses((r) => {
      const copie = { ...r };
      delete copie[dernier];
      return copie;
    });
  };

  // Plus de question utile : l'analyse part d'elle-même.
  useEffect(() => {
    if (etape === "questions" && restantes.length === 0 && !enAnalyse && !erreur) lancerAnalyse(faits);
  }, [etape, restantes.length, enAnalyse, erreur, faits, lancerAnalyse]);

  /* ------------------------------------------------------------ création */
  const ocrConfiance = useMemo(
    () => (extrait ? Object.fromEntries(Object.entries(extrait).map(([cle, champ]) => [cle, champ.confiance])) : {}),
    [extrait],
  );

  const creer = () => {
    setErreur(null);
    if (mode === "visiteur") {
      enregistrerBrouillon({ form, reponses, ocrConfiance });
      router.push(`/connexion?suite=${encodeURIComponent("/tableau-de-bord/nouveau?reprise=1")}`);
      return;
    }
    demarrerCreation(async () => {
      const r = await creerDossier({
        ...form,
        reponses,
        ocrTexte: lecture?.texte ?? "",
        ocrConfiance,
      });
      if (r.erreur || !r.id) {
        setErreur(r.erreur ?? "Le dossier n'a pas pu être enregistré.");
        setQuotaAtteint(!!r.quotaAtteint);
        return;
      }
      effacerBrouillon();
      router.push(`/tableau-de-bord/${r.id}?nouveau=1#lettre`);
    });
  };

  /* -------------------------------------------------------------- rendu */
  const indexVisible = ETAPES_VISIBLES.findIndex((e) => e.id === (etape === "lecture" ? "depot" : etape));

  return (
    <NiveauTitre.Provider value={mode === "membre" ? "h1" : "h3"}>
      <div ref={haut} className="mx-auto w-full max-w-2xl scroll-mt-24">
        <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Progression">
          {ETAPES_VISIBLES.map((e, i) => (
            <li key={e.id} aria-current={i === indexVisible ? "step" : undefined}>
              <span
                className={`block h-1.5 rounded-full transition-colors ${
                  i < indexVisible ? "bg-navy-900" : i === indexVisible ? "bg-gold-400" : "bg-line"
                }`}
              />
              <span
                className={`mt-1.5 block text-[11px] sm:text-xs ${i === indexVisible ? "font-bold text-navy-900" : "text-ink-faint"}`}
              >
                {e.libelle}
              </span>
            </li>
          ))}
        </ol>

        {etape === "depot" && enCreation && <Patience texte="Création de votre dossier et de votre lettre…" />}

        {etape === "depot" && !enCreation && (
          <EtapeDepot
            erreur={erreur}
            surFichier={traiterFichier}
            saisirALaMain={() => {
              setExtrait(null);
              setLecture(null);
              setForm(FORMULAIRE_VIDE);
              allerA("verification");
            }}
          />
        )}

        {etape === "lecture" && <EtapeLecture progression={progression} />}

        {etape === "verification" && (
          <EtapeVerification
            form={form}
            setForm={setForm}
            extrait={extrait}
            lecture={lecture}
            regionCertaine={regionCertaine}
            erreur={erreur}
            retour={() => allerA("depot")}
            suite={() => {
              setHistorique([]);
              setReponses({});
              allerA("questions");
            }}
          />
        )}

        {etape === "questions" && (
          <EtapeQuestions
            question={restantes[0] ?? null}
            rang={historique.length + 1}
            restantes={restantes.length}
            enAnalyse={enAnalyse}
            erreur={erreur}
            repondre={repondre}
            revenir={revenir}
            reessayer={() => {
              setErreur(null);
              lancerAnalyse(faits);
            }}
          />
        )}

        {etape === "verdict" && analyse && (
          <EtapeVerdict
            analyse={analyse}
            form={form}
            mode={mode}
            erreur={erreur}
            quotaAtteint={quotaAtteint}
            enCreation={enCreation}
            creer={creer}
            modifier={() => allerA("verification")}
          />
        )}
        {etape === "verdict" && !analyse && (enAnalyse || enCreation) && (
          <Patience texte={enCreation ? "Création de votre dossier et de votre lettre…" : "Le moteur reprend votre analyse…"} />
        )}
        {etape === "verdict" && !analyse && !enAnalyse && !enCreation && (
          <div className="animate-rise">
            <Erreur texte={erreur ?? "L'analyse n'a pas pu reprendre."} />
            <div className="mt-4 flex flex-wrap gap-3">
              <Btn onClick={() => lancerAnalyse(faits)}>Relancer l&apos;analyse</Btn>
              <Btn variant="ghost" onClick={() => allerA("verification")}>
                Revoir les informations
              </Btn>
            </div>
          </div>
        )}
      </div>
    </NiveauTitre.Provider>
  );
}

/* ========================================================================== */
/*  1. Dépôt                                                                  */
/* ========================================================================== */

function EtapeDepot({
  erreur,
  surFichier,
  saisirALaMain,
}: {
  erreur: string | null;
  surFichier: (f: File) => void;
  saisirALaMain: () => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const fichierRef = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);

  return (
    <div className="animate-rise">
      <Titre className="font-display text-[1.9rem] font-extrabold leading-tight text-navy-900 sm:text-4xl">
        Montrez-nous votre courrier
      </Titre>
      <p className="mt-2 text-[1.05rem] text-ink-soft">
        Une photo suffit. Le moteur lit les dates, le montant, la plaque — vous n&apos;avez rien à retaper.
      </p>

      {/* Sur téléphone : deux gros boutons, l'appareil photo d'abord. */}
      <div className="mt-6 grid gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-gold-400 text-lg font-bold text-navy-950 shadow-bouton active:scale-[0.98]"
        >
          <IconeScanDoc className="h-7 w-7 [--icone-accent:transparent]" />
          Prendre une photo
        </button>
        <button
          type="button"
          onClick={() => fichierRef.current?.click()}
          className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-line bg-card font-semibold text-navy-900 active:scale-[0.98]"
        >
          <IconeTelecharger className="h-6 w-6" />
          Choisir une photo ou un PDF
        </button>
      </div>

      {/* Sur ordinateur : une zone de dépôt, et le copier-coller. */}
      <button
        type="button"
        onClick={() => fichierRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          const f = e.dataTransfer.files?.[0];
          if (f) surFichier(f);
        }}
        className={`group relative mt-7 hidden w-full overflow-hidden rounded-[1.75rem] border-2 border-dashed p-10 text-center transition sm:block ${
          survol ? "border-navy-900 bg-gold-50" : "border-navy-200 bg-card hover:border-navy-600 hover:bg-navy-50/60"
        }`}
      >
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-navy-900 text-white shadow-flotte transition group-hover:-translate-y-1">
          <IconeScanDoc className="h-11 w-11" />
        </span>
        <span className="mt-5 block font-display text-xl font-bold text-navy-900">
          Déposez votre courrier ici
        </span>
        <span className="mt-1 block text-sm text-ink-soft">
          ou cliquez pour le choisir · ou collez une capture d&apos;écran (Ctrl+V)
        </span>
        <span className="mt-4 inline-flex flex-wrap justify-center gap-2 text-xs font-semibold text-ink-soft">
          <span className="rounded-full bg-paper px-3 py-1">Photo</span>
          <span className="rounded-full bg-paper px-3 py-1">Capture d&apos;écran</span>
          <span className="rounded-full bg-paper px-3 py-1">PDF, toutes les pages</span>
        </span>
      </button>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) surFichier(f);
          e.target.value = "";
        }}
      />
      <input
        ref={fichierRef}
        type="file"
        accept={FORMATS_ACCEPTES}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) surFichier(f);
          e.target.value = "";
        }}
      />

      {erreur && <Erreur texte={erreur} />}

      <ul className="mt-7 grid gap-3 sm:grid-cols-3">
        <Conseil icone={<IconeLoupe className="h-6 w-6" />} titre="À plat, bien éclairé">
          Sans reflet, le courrier entier dans le cadre.
        </Conseil>
        <Conseil icone={<IconePreuve className="h-6 w-6" />} titre="Un PDF ? Idéal">
          Lu sans aucune erreur, toutes les pages.
        </Conseil>
        <Conseil icone={<IconeCadenas className="h-6 w-6" />} titre="Lu sur votre appareil">
          Le document n&apos;est envoyé nulle part.
        </Conseil>
      </ul>

      <p className="mt-6 text-center">
        <button
          type="button"
          onClick={saisirALaMain}
          className="text-sm font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4 hover:text-navy-900"
        >
          Pas de document sous la main ? Saisir les informations
        </button>
      </p>
    </div>
  );
}

function Conseil({ icone, titre, children }: { icone: React.ReactNode; titre: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-line/80 bg-card p-3.5">
      <span className="text-navy-900">{icone}</span>
      <span>
        <span className="block text-sm font-bold text-navy-900">{titre}</span>
        <span className="block text-xs leading-relaxed text-ink-soft">{children}</span>
      </span>
    </li>
  );
}

/* ========================================================================== */
/*  2. Lecture                                                                */
/* ========================================================================== */

function EtapeLecture({ progression }: { progression: ProgressionOCR }) {
  return (
    <div className="animate-rise py-6 text-center">
      <div className="relative mx-auto h-56 w-44 overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-flotte">
        <div className="space-y-2.5" aria-hidden="true">
          <div className="h-3 w-16 rounded bg-navy-900" />
          <div className="h-2 w-24 rounded bg-line" />
          <div className="mt-5 h-2 w-full rounded bg-line" />
          <div className="h-2 w-5/6 rounded bg-line" />
          <div className="h-2 w-full rounded bg-line" />
          <div className="mt-4 flex justify-between">
            <div className="h-2 w-12 rounded bg-line" />
            <div className="h-3 w-10 rounded bg-gold-300" />
          </div>
          <div className="h-2 w-2/3 rounded bg-line" />
          <div className="h-2 w-full rounded bg-line" />
          <div className="mt-4 h-5 w-20 rounded border-2 border-plaque/60" />
        </div>
        <div
          className="animate-balayage absolute inset-x-0 top-0 h-16 bg-linear-to-b from-transparent via-gold-300/50 to-transparent"
          aria-hidden="true"
        >
          <div className="absolute inset-x-0 bottom-1/2 h-0.5 bg-gold-500" />
        </div>
      </div>

      <p className="mt-8 font-display text-xl font-bold text-navy-900" aria-live="polite">
        {progression.etape || "Lecture du courrier…"}
      </p>
      <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-navy-900 transition-[width] duration-300"
          style={{ width: `${Math.max(4, progression.pourcentage)}%` }}
        />
      </div>
      <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
        La première photo prend une trentaine de secondes : le lecteur se charge dans votre navigateur. Un PDF
        est lu instantanément.
      </p>
    </div>
  );
}

/* ========================================================================== */
/*  3. Vérification                                                           */
/* ========================================================================== */

const BADGE: Record<Confiance, { texte: string; classe: string } | null> = {
  haute: null,
  moyenne: { texte: "À vérifier", classe: "bg-warn-100 text-warn-700" },
  faible: { texte: "Peu sûr", classe: "bg-danger-100 text-danger-700" },
};

function Champ({
  label,
  confiance,
  aide,
  children,
  className = "",
}: {
  label: string;
  confiance?: Confiance;
  aide?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const badge = confiance ? BADGE[confiance] : null;
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-2">
        <span className="text-sm font-semibold text-navy-900">{label}</span>
        {badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.classe}`}>{badge.texte}</span>}
      </span>
      {children}
      {aide && <span className="mt-1 block text-xs text-ink-soft">{aide}</span>}
    </label>
  );
}

const champCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] text-ink outline-none transition placeholder:text-ink-faint focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40";

function EtapeVerification({
  form,
  setForm,
  extrait,
  lecture,
  regionCertaine,
  erreur,
  retour,
  suite,
}: {
  form: Formulaire;
  setForm: React.Dispatch<React.SetStateAction<Formulaire>>;
  extrait: DonneesExtraites | null;
  lecture: ResultatLecture | null;
  regionCertaine: boolean;
  erreur: string | null;
  retour: () => void;
  suite: () => void;
}) {
  const [details, setDetails] = useState(false);
  const maj = (cle: keyof Formulaire) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [cle]: e.target.value }));
  const c = (cle: keyof DonneesExtraites) => (extrait && extrait[cle].valeur !== null ? extrait[cle].confiance : undefined);

  const douteux = extrait
    ? (["reference", "montant", "dateConstat", "dateEnvoi", "dateEcheance", "plaque"] as const).filter(
        (k) => extrait[k].valeur !== null && extrait[k].confiance !== "haute",
      ).length
    : 0;
  const sansDate = !form.dateEnvoi && !form.dateEcheance;
  const horsPerimetre = form.region !== "" && !regionOuverte(form.region);

  return (
    <div className="animate-rise">
      <Titre className="font-display text-[1.9rem] font-extrabold leading-tight text-navy-900 sm:text-4xl">
        {extrait ? "Voici ce que nous avons lu" : "Les informations du courrier"}
      </Titre>
      <p className="mt-2 text-[1.05rem] text-ink-soft">
        {!extrait
          ? "Recopiez ce qui figure sur le courrier. Le reste se fera tout seul."
          : douteux > 0
            ? `Jetez un œil aux ${douteux} champ${douteux > 1 ? "s" : ""} signalé${douteux > 1 ? "s" : ""} : une date mal lue fausserait votre délai.`
            : "Tout a été lu avec certitude. Un coup d'œil, et on continue."}
      </p>
      {lecture && (
        <p className="mt-3">
          <Pastille ton={lecture.source === "texte-pdf" ? "ok" : "neutre"}>
            {lecture.source === "texte-pdf"
              ? "PDF lu directement — aucune erreur de lecture possible"
              : `Photo lue · fiabilité ${lecture.confiance} %`}
          </Pastille>
        </p>
      )}

      {erreur && <Erreur texte={erreur} />}

      <div className="mt-6 overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
        <div className="motif-marquage h-1.5" aria-hidden="true" />
        <div className="space-y-5 p-5 sm:p-6">
          <Champ label="Type de courrier" confiance={c("typeDocument")}>
            <select value={form.typeDocument} onChange={maj("typeDocument")} className={champCls}>
              {Object.entries(TYPES_DOCUMENT).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Champ>
          <FriseProcedure stade={form.typeDocument} />

          <fieldset>
            <legend className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-navy-900">
              Où s&apos;est passé le stationnement ?
              {form.region && regionCertaine && (
                <span className="rounded-full bg-ok-100 px-2 py-0.5 text-[10px] font-bold text-ok-700">Détecté</span>
              )}
              {(!form.region || !regionCertaine) && extrait && (
                <span className="rounded-full bg-warn-100 px-2 py-0.5 text-[10px] font-bold text-warn-700">À confirmer</span>
              )}
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={form.region === r.id}
                  onClick={() => setForm((f) => ({ ...f, region: r.id, langue: r.id === "flandre" ? "nl" : f.langue }))}
                  className={`flex h-12 flex-col items-center justify-center rounded-xl border text-sm font-bold leading-tight transition ${
                    form.region === r.id
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-line bg-white text-navy-900 hover:border-navy-200 hover:bg-navy-50"
                  }`}
                >
                  {r.nom}
                  {!regionOuverte(r.id) && (
                    <span className={`text-[10px] font-semibold ${form.region === r.id ? "text-gold-300" : "text-ink-faint"}`}>
                      bientôt
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-soft">
              SOS Citizens couvre aujourd&apos;hui les 19 communes de Bruxelles-Capitale. La Flandre, puis la Wallonie,
              suivront.
            </p>
          </fieldset>

          {horsPerimetre && (
            <div role="status" className="rounded-2xl border-l-4 border-azur-600 bg-azur-50 p-4">
              <p className="text-sm leading-relaxed text-ink">{messageHorsPerimetre(form.region)}</p>
              <div className="mt-3">
                <BoutonContact variante="secondaire">Écrire à l&apos;association</BoutonContact>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Référence" confiance={c("reference")} aide="En haut du courrier.">
              <input value={form.reference} onChange={maj("reference")} className={champCls} placeholder="Ex. 2026/4471820" />
            </Champ>
            <Champ label="Montant réclamé" confiance={c("montant")}>
              <div className="relative">
                <input
                  value={form.montant}
                  onChange={maj("montant")}
                  inputMode="decimal"
                  className={`${champCls} pr-10`}
                  placeholder="25,00"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-soft">
                  €
                </span>
              </div>
            </Champ>
            <Champ label="Commune" confiance={c("commune")}>
              <input
                value={form.commune}
                onChange={maj("commune")}
                className={champCls}
                list="communes-bruxelloises"
                autoComplete="off"
                placeholder="Ex. Ixelles, Schaerbeek"
              />
              <datalist id="communes-bruxelloises">
                {COMMUNES.map((commune) => (
                  <option key={commune.slug} value={commune.nom} />
                ))}
              </datalist>
            </Champ>
            <Champ label="Plaque" confiance={c("plaque")}>
              <input
                value={form.plaque}
                onChange={(e) => setForm((f) => ({ ...f, plaque: e.target.value.toUpperCase() }))}
                className={`${champCls} font-mono tracking-wider`}
                placeholder="1-ABC-123"
              />
            </Champ>
            <Champ label="Date du constat" confiance={c("dateConstat")}>
              <input type="date" value={form.dateConstat} onChange={maj("dateConstat")} className={champCls} />
            </Champ>
            <Champ label="Date du courrier" confiance={c("dateEnvoi")} aide="Le délai pour contester court depuis elle.">
              <input type="date" value={form.dateEnvoi} onChange={maj("dateEnvoi")} className={champCls} />
            </Champ>
            <Champ label="Date limite imprimée" confiance={c("dateEcheance")} className="sm:col-span-2">
              <input type="date" value={form.dateEcheance} onChange={maj("dateEcheance")} className={champCls} />
            </Champ>
          </div>

          {sansDate && (
            <p className="flex items-start gap-2 rounded-xl bg-warn-100 p-3 text-sm text-warn-700">
              <IconeAttention className="mt-0.5 h-4 w-4 shrink-0" />
              Sans aucune date, nous ne pourrons pas calculer votre délai. Indiquez au moins la date du courrier.
            </p>
          )}

          <button
            type="button"
            onClick={() => setDetails((d) => !d)}
            aria-expanded={details}
            className="flex w-full items-center justify-between rounded-xl bg-paper px-4 py-3 text-sm font-semibold text-navy-900"
          >
            Heure, rue, zone, organisme, paiement
            <IconeChevron className={`h-4 w-4 transition ${details ? "rotate-180" : ""}`} />
          </button>
          {details && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Champ label="Heure du constat" confiance={c("heureConstat")}>
                <input type="time" value={form.heureConstat} onChange={maj("heureConstat")} className={champCls} />
              </Champ>
              <Champ label="Zone" confiance={c("zone")}>
                <input value={form.zone} onChange={maj("zone")} className={champCls} placeholder="Rouge, verte, bleue…" />
              </Champ>
              <Champ label="Rue du constat" confiance={c("lieuConstat")} className="sm:col-span-2">
                <input value={form.lieuConstat} onChange={maj("lieuConstat")} className={champCls} placeholder="Rue et numéro" />
              </Champ>
              <Champ label="Organisme qui réclame" confiance={c("autorite")} className="sm:col-span-2">
                <input value={form.crediteur} onChange={maj("crediteur")} className={champCls} placeholder="parking.brussels, commune de…" />
              </Champ>
              <Champ label="Communication structurée" confiance={c("communication")}>
                <input value={form.communication} onChange={maj("communication")} className={`${champCls} font-mono`} placeholder="+++000/0000/00000+++" />
              </Champ>
              <Champ label="IBAN du créancier" confiance={c("iban")}>
                <input value={form.iban} onChange={maj("iban")} className={`${champCls} font-mono`} placeholder="BE.." />
              </Champ>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Btn variant="ghost" onClick={retour}>
          <IconeFlecheGauche className="h-5 w-5" />
          Changer de document
        </Btn>
        <Btn variant="gold" taille="lg" onClick={suite} disabled={horsPerimetre}>
          C&apos;est bon, continuer
          <IconeFleche className="h-5 w-5" />
        </Btn>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  4. Questions                                                              */
/* ========================================================================== */

type QuestionAffichee = ReturnType<typeof questionsAPoser>[number];

function EtapeQuestions({
  question,
  rang,
  restantes,
  enAnalyse,
  erreur,
  repondre,
  revenir,
  reessayer,
}: {
  question: QuestionAffichee | null;
  rang: number;
  restantes: number;
  enAnalyse: boolean;
  erreur: string | null;
  repondre: (q: string, o: string) => void;
  revenir: () => void;
  reessayer: () => void;
}) {
  if (!question || enAnalyse) {
    return erreur ? (
      <div className="animate-rise">
        <Erreur texte={erreur} />
        <div className="mt-4 flex gap-3">
          <Btn variant="ghost" onClick={revenir}>
            <IconeFlecheGauche className="h-5 w-5" /> Retour
          </Btn>
          <Btn onClick={reessayer}>Relancer l&apos;analyse</Btn>
        </div>
      </div>
    ) : (
      <Patience texte="Le moteur confronte votre cas à sa base…" />
    );
  }

  return (
    <div key={question.id} className="animate-rise">
      <p className="text-sm font-semibold text-ink-soft">
        Question {rang}
        {restantes > 1 && <span className="text-ink-faint"> · encore {restantes - 1} au plus</span>}
      </p>
      <Titre className="mt-2 font-display text-[1.7rem] font-extrabold leading-tight text-navy-900 sm:text-[2.1rem]">
        {question.intitule}
      </Titre>
      <p className="mt-2 text-[0.95rem] text-ink-soft">{question.pourquoi}</p>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {question.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => repondre(question.id, o.id)}
            className="group flex min-h-16 items-center gap-4 rounded-2xl border border-line bg-card px-4 py-3 text-left shadow-carte transition hover:-translate-y-0.5 hover:border-navy-600 hover:shadow-flotte active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900 transition group-hover:bg-gold-100">
              <IconeLibre nom={o.icone ?? "ticket"} className="h-8 w-8" />
            </span>
            <span className="flex-1 text-[1.02rem] font-semibold text-navy-900">{o.libelle}</span>
            <IconeFleche className="h-5 w-5 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-navy-900" />
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Btn variant="ghost" onClick={revenir}>
          <IconeFlecheGauche className="h-5 w-5" />
          {rang === 1 ? "Revenir aux informations" : "Question précédente"}
        </Btn>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  5. Verdict                                                                */
/* ========================================================================== */

const FORCE: Record<MoyenRetenu["force"], { texte: string; ton: "ok" | "signal" | "neutre" }> = {
  solide: { texte: "Argument solide", ton: "ok" },
  serieux: { texte: "Argument sérieux", ton: "signal" },
  possible: { texte: "À étayer", ton: "neutre" },
};

function EtapeVerdict({
  analyse,
  form,
  mode,
  erreur,
  quotaAtteint,
  enCreation,
  creer,
  modifier,
}: {
  analyse: Analyse;
  form: Formulaire;
  mode: "membre" | "visiteur";
  erreur: string | null;
  quotaAtteint: boolean;
  enCreation: boolean;
  creer: () => void;
  modifier: () => void;
}) {
  const payer = analyse.strategie.code === "payer";
  const montant = nombreOuNull(form.montant, { min: 0, max: 100000 });

  return (
    <div className="animate-rise space-y-4">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-navy-900 text-white shadow-flotte">
        <div className="motif-points absolute inset-0" aria-hidden="true" />
        <div className={`h-1.5 ${payer ? "bg-azur-600" : "motif-marquage"}`} aria-hidden="true" />
        <div className="relative p-6 sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gold-400">
            <IconeCerveau className="h-5 w-5 text-white [--icone-accent:transparent]" />
            L&apos;avis du moteur
          </p>
          <Titre className="mt-3 font-display text-[2rem] font-extrabold leading-tight sm:text-[2.6rem]">
            {analyse.strategie.titre}
          </Titre>
          <p className="mt-3 max-w-xl leading-relaxed text-navy-100">{analyse.strategie.explication}</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <CompteARebours jours={analyse.delai.joursRestants} taille="lg" surFonce />
            <div>
              <p className="font-bold">
                {analyse.delai.limite
                  ? `${analyse.delai.nature === "contestation" ? "Contester" : analyse.delai.nature === "paiement" ? "Agir" : "Répondre"} avant le ${formatDate(analyse.delai.limite)}`
                  : "Date limite à vérifier sur le courrier"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-navy-100">{analyse.delai.explication}</p>
            </div>
          </div>
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

      <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy-900">
            {analyse.moyens.length > 0 ? "Vos arguments" : "Aucun argument pour l'instant"}
          </h2>
          <JaugeSolidite niveau={analyse.solidite.niveau} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">{analyse.solidite.explication}</p>
        {analyse.moyens.length > 0 && (
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
                  {m.fiabilite === "a_confirmer" && (
                    <p className="mt-1.5 text-xs text-ink-faint">
                      La règle varie selon les communes : la lettre le formule avec prudence.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {analyse.inaction && !payer && (
        <section className="rounded-[var(--radius-carte)] border border-danger-600/20 bg-danger-50 p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-danger-700">Si vous ne faites rien</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            <strong>{analyse.inaction.etape}</strong> — {analyse.inaction.quand}. {analyse.inaction.surcout}
          </p>
        </section>
      )}

      <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">La marche à suivre</h2>
        <ol className="mt-3 space-y-2.5">
          {analyse.etapes.map((e, i) => (
            <li key={e} className="flex gap-3 text-sm leading-relaxed text-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-400">
                {i + 1}
              </span>
              {e}
            </li>
          ))}
        </ol>
        {analyse.pieces.length > 0 && !payer && (
          <>
            <h3 className="mt-5 text-sm font-bold text-navy-900">Pièces à joindre</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {analyse.pieces.map((p) => (
                <li key={p} className="rounded-full bg-paper px-3 py-1.5 text-xs font-medium text-navy-800">
                  {p}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {erreur && (
        <div>
          <Erreur texte={erreur} />
          {quotaAtteint && (
            <div className="mt-3">
              <LinkBtn href="/adherer" variant="gold">
                Adhérer — 70 € / an
              </LinkBtn>
            </div>
          )}
        </div>
      )}

      <div
        className={`sticky z-20 rounded-[1.5rem] border border-line bg-card p-4 shadow-flotte lg:bottom-4 ${
          mode === "membre" ? "bottom-24" : "bottom-4"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-bold text-navy-900">
              {mode === "visiteur"
                ? payer
                  ? "Votre demande de photos est prête"
                  : "Votre lettre est prête"
                : payer
                  ? "Ouvrir le dossier pour suivre le paiement"
                  : "Votre lettre est prête"}
            </p>
            <p className="text-xs text-ink-soft">
              {mode === "visiteur"
                ? "Créez votre compte avec votre e-mail : vous la retrouvez aussitôt."
                : montant !== null
                  ? `${formatMontant(montant)} en jeu · ${analyse.verifications} vérifications effectuées`
                  : `${analyse.verifications} vérifications effectuées`}
            </p>
          </div>
          <Btn variant="gold" taille="lg" onClick={creer} disabled={enCreation} className="shrink-0">
            {enCreation
              ? "Création du dossier…"
              : mode === "visiteur"
                ? "Obtenir ma lettre"
                : "Créer mon dossier"}
            <IconeFleche className="h-5 w-5" />
          </Btn>
        </div>
      </div>

      <p className="text-center">
        <button type="button" onClick={modifier} className="text-sm font-semibold text-navy-700 underline underline-offset-4">
          Corriger une information
        </button>
      </p>
    </div>
  );
}

/* ========================================================================== */

function Patience({ texte }: { texte: string }) {
  return (
    <div className="animate-rise py-16 text-center" role="status">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-navy-900 text-white shadow-flotte">
        <IconeCerveau className="animate-pulse-doux h-11 w-11" />
      </span>
      <p className="mt-6 font-display text-xl font-bold text-navy-900">{texte}</p>
      <p className="mt-2 text-sm text-ink-soft">Délai, procédure, arguments, pièces : quelques secondes.</p>
    </div>
  );
}

function Erreur({ texte }: { texte: string }) {
  return (
    <p role="alert" className="mt-4 flex gap-2.5 rounded-2xl bg-danger-100 p-4 text-sm font-medium text-danger-700">
      <IconeAttention className="mt-0.5 h-5 w-5 shrink-0" />
      {texte}
    </p>
  );
}
