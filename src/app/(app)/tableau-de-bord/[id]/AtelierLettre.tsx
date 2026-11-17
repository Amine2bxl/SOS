"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redigerLettreDossier } from "@/lib/cerveau-actions";
import { enregistrerLettreDossier, marquerContestationEnvoyee } from "@/lib/dossiers-actions";
import { envoyerLettreParEmail } from "@/lib/envoi-actions";
import { enregistrerProfil } from "@/lib/profile-actions";
import type { TypeLettre } from "@/cerveau/types";
import { MODES_ENVOI, type Lettre } from "@/lib/dossiers-format";
import { CopierTexte } from "@/components/CopierTexte";
import { Btn, Pastille } from "@/components/ui";
import {
  IconeAttention,
  IconeChevron,
  IconeCopier,
  IconeCrayon,
  IconeEnvoyer,
  IconeImprimer,
  IconeLibre,
  IconeOk,
  IconeFleche,
  IconeRecommande,
} from "@/components/icones";

const LETTRES: { id: TypeLettre; titre: string; quand: string; icone: string }[] = [
  { id: "contestation", titre: "Contestation", quand: "Au premier courrier ou au rappel.", icone: "lettre" },
  { id: "relance", titre: "Relance", quand: "Votre contestation est restée sans réponse.", icone: "recommande" },
  { id: "reponse_huissier", titre: "Réponse à l'huissier", quand: "Contrainte ou courrier d'huissier.", icone: "huissier" },
  { id: "demande_preuves", titre: "Demande des photos", quand: "Pour vérifier le constat, au titre du RGPD.", icone: "loupe" },
  { id: "remboursement", titre: "Arrêt et remboursement", quand: "Vous avez déjà payé cette somme.", icone: "euro" },
  { id: "bonne_foi", titre: "Annulation à titre gracieux", quand: "Une erreur de bonne foi : carte oubliée, première fois.", icone: "main-tendue" },
  { id: "echelonnement", titre: "Plan de paiement", quand: "Vous devez payer, mais pas tout d'un coup.", icone: "agenda" },
];

/** Les lettres qui reposent sur des arguments : on peut choisir lesquels. */
const AVEC_ARGUMENTS: TypeLettre[] = ["contestation", "relance", "reponse_huissier"];

export type ProfilLettre = {
  prenom: string;
  nom: string;
  adresse: string;
  code_postal: string;
  commune: string;
  telephone: string;
};

/**
 * L'atelier de la lettre : elle est déjà écrite quand on arrive.
 *
 * Le moteur la rédige pour ce dossier — les faits, les arguments, la langue —
 * et l'utilisateur n'a plus qu'à la relire. Ce qui manque reste visible entre
 * crochets, surligné : une lettre ne part jamais avec un trou silencieux.
 * Copier, imprimer ou télécharger la range dans le dossier ; « Je l'ai
 * envoyée » lance le suivi.
 */
export function AtelierLettre({
  dossierId,
  typeConseille,
  langueConseillee,
  lettres,
  moyens,
  profil,
  manquants,
  region,
  crediteur,
  statut,
  dossierInfos,
}: {
  /** Ce que le formulaire officiel demande, prêt à copier. */
  dossierInfos: { reference: string; plaque: string; email: string };
  dossierId: string;
  typeConseille: TypeLettre;
  langueConseillee: "fr" | "nl";
  lettres: Lettre[];
  moyens: { id: string; titre: string }[];
  profil: ProfilLettre;
  manquants: string[];
  region: string | null;
  crediteur: string | null;
  statut: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<TypeLettre>(typeConseille);
  const [langue, setLangue] = useState<"fr" | "nl">(langueConseillee);
  const [choixType, setChoixType] = useState(false);
  const [moyensChoisis, setMoyensChoisis] = useState<string[]>(moyens.map((m) => m.id));
  const [explication, setExplication] = useState("");
  const [iban, setIban] = useState("");
  // La dernière version enregistrée de la lettre conseillée, s'il y en a une :
  // elle s'affiche d'emblée, sans attendre une nouvelle rédaction.
  const [initiale] = useState(() => lettres.find((l) => l.type === typeConseille && l.langue === langueConseillee));
  const [texte, setTexte] = useState(initiale?.contenu ?? "");
  const [texteCourt, setTexteCourt] = useState<string | null>(null);
  const [ton, setTon] = useState<string | null>(null);
  const [chemin, setChemin] = useState<string[]>([]);
  const [enregistree, setEnregistree] = useState(!!initiale);
  const [edition, setEdition] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [generation, demarrerGeneration] = useTransition();
  const [sauvegarde, demarrerSauvegarde] = useTransition();

  const montrerToast = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 2200);
  };

  const generer = useCallback(
    (options?: { type?: TypeLettre; langue?: "fr" | "nl"; moyens?: string[]; explication?: string; iban?: string }) => {
      const t = options?.type ?? type;
      demarrerGeneration(async () => {
        const r = await redigerLettreDossier({
          dossierId,
          type: t,
          langue: options?.langue ?? langue,
          moyens: AVEC_ARGUMENTS.includes(t) ? (options?.moyens ?? moyensChoisis) : undefined,
          explication: options?.explication ?? explication,
          ibanRemboursement: options?.iban ?? iban,
        });
        if (r.erreur || !r.lettre) {
          setErreur(r.erreur ?? "La lettre n'a pas pu être rédigée.");
          return;
        }
        setErreur(null);
        setTexte(r.lettre.texte);
        setTexteCourt(r.lettre.texteCourt ?? null);
        setTon(r.lettre.ton ?? null);
        setChemin(r.lettre.chemin ?? []);
        setEnregistree(false);
        setEdition(false);
      });
    },
    [dossierId, type, langue, moyensChoisis, explication, iban],
  );

  /** Une autre lettre ou une autre langue : la version gardée si elle existe, sinon une rédaction neuve. */
  const charger = (t: TypeLettre, l: "fr" | "nl") => {
    const sauvee = lettres.find((x) => x.type === t && x.langue === l);
    if (sauvee) {
      setTexte(sauvee.contenu);
      setEnregistree(true);
      setEdition(false);
    } else {
      generer({ type: t, langue: l });
    }
  };
  const changerType = (t: TypeLettre) => {
    setType(t);
    setChoixType(false);
    charger(t, langue);
  };
  const changerLangue = (l: "fr" | "nl") => {
    setLangue(l);
    charger(type, l);
  };

  // À l'arrivée, sans lettre gardée : le moteur la rédige aussitôt.
  const premiereRedaction = useRef(false);
  useEffect(() => {
    if (premiereRedaction.current || initiale) return;
    premiereRedaction.current = true;
    generer();
  }, [initiale, generer]);

  const trous = useMemo(() => Array.from(new Set(texte.match(/\[[^\]\n]{2,80}\]/g) ?? [])), [texte]);

  const sauver = (apres?: () => void) => {
    if (enregistree) {
      apres?.();
      return;
    }
    demarrerSauvegarde(async () => {
      const r = await enregistrerLettreDossier({ dossierId, type, langue, contenu: texte });
      if (r.erreur) {
        setErreur(r.erreur);
        return;
      }
      setEnregistree(true);
      apres?.();
      router.refresh();
    });
  };

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(texte);
      montrerToast("Lettre copiée");
    } catch {
      setErreur("La copie a échoué : sélectionnez le texte et copiez-le à la main.");
    }
    sauver();
  };

  const imprimer = () => sauver(() => window.setTimeout(() => window.print(), 50));

  const avecArguments = AVEC_ARGUMENTS.includes(type) && moyens.length > 0;
  const lettreChoisie = LETTRES.find((l) => l.id === type)!;
  const bruxelles = region === "bruxelles" || /parking\.?brussels/i.test(crediteur ?? "");
  const dejaEnvoyee = ["contestation_envoyee", "en_attente_reponse", "accepte", "rejete", "clos"].includes(statut);

  return (
    <div className="space-y-4">
      {/* -------------------------------------------- quelle lettre, quelle langue */}
      <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-4 shadow-carte sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setChoixType((c) => !c)}
            aria-expanded={choixType}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
              <IconeLibre nom={lettreChoisie.icone} className="h-7 w-7" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="font-display text-lg font-bold text-navy-900">{lettreChoisie.titre}</span>
                {type === typeConseille && <Pastille ton="signal">Conseillée</Pastille>}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold text-navy-700">
                Changer de lettre <IconeChevron className={`h-3.5 w-3.5 transition ${choixType ? "rotate-180" : ""}`} />
              </span>
            </span>
          </button>

          <div className="inline-flex rounded-full border border-line bg-paper p-1" role="group" aria-label="Langue de la lettre">
            {(["fr", "nl"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={langue === l}
                onClick={() => changerLangue(l)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                  langue === l ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-white"
                }`}
              >
                {l === "fr" ? "Français" : "Nederlands"}
              </button>
            ))}
          </div>
        </div>

        {choixType && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {LETTRES.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => changerType(l.id)}
                  aria-pressed={type === l.id}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                    type === l.id ? "border-navy-900 bg-navy-50" : "border-line hover:border-navy-200 hover:bg-paper"
                  }`}
                >
                  <IconeLibre nom={l.icone} className="h-7 w-7 shrink-0 text-navy-900" />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-bold text-navy-900">
                      {l.titre}
                      {l.id === typeConseille && <Pastille ton="signal">Conseillée</Pastille>}
                    </span>
                    <span className="block text-xs text-ink-soft">{l.quand}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {langue !== langueConseillee && (
          <p className="mt-3 text-xs text-ink-soft">
            {langueConseillee === "nl"
              ? "En Flandre, l'administration travaille en néerlandais : une lettre dans sa langue est traitée plus vite."
              : "Le courrier reçu est en français : une réponse en français est conseillée."}
          </p>
        )}
      </section>

      {/* ------------------------------------------------ coordonnées manquantes */}
      {manquants.length > 0 && <CoordonneesManquantes profil={profil} manquants={manquants} apres={() => generer()} />}

      {/* ---------------------------------------------------------- arguments */}
      {(avecArguments || type === "remboursement") && (
        <details className="group rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5">
            <span>
              <span className="block font-bold text-navy-900">
                {type === "remboursement" ? "Votre IBAN et votre récit" : "Arguments et récit"}
              </span>
              <span className="block text-sm text-ink-soft">
                {type === "remboursement"
                  ? "Pour être remboursé, et pour expliquer en vos mots."
                  : `${moyensChoisis.length} argument${moyensChoisis.length > 1 ? "s" : ""} retenu${moyensChoisis.length > 1 ? "s" : ""} · ajoutez votre récit si vous le souhaitez`}
              </span>
            </span>
            <IconeChevron className="h-4 w-4 shrink-0 text-navy-700 transition group-open:rotate-180" />
          </summary>
          <div className="space-y-4 border-t border-line px-4 pb-5 pt-4 sm:px-5">
            {avecArguments && (
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-semibold text-navy-900">Arguments utilisés dans la lettre</legend>
                {moyens.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-paper p-3">
                    <input
                      type="checkbox"
                      checked={moyensChoisis.includes(m.id)}
                      onChange={(e) =>
                        setMoyensChoisis((c) => (e.target.checked ? [...c, m.id] : c.filter((x) => x !== m.id)))
                      }
                      className="mt-0.5 h-5 w-5 accent-navy-900"
                    />
                    <span className="text-sm font-medium text-navy-900">{m.titre}</span>
                  </label>
                ))}
              </fieldset>
            )}
            {type === "remboursement" && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-navy-900">Votre IBAN, pour le remboursement</span>
                <input
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  placeholder="BE.. .... .... ...."
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-3 font-mono text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-navy-900">Votre récit, en quelques mots (facultatif)</span>
              <textarea
                value={explication}
                onChange={(e) => setExplication(e.target.value)}
                maxLength={3000}
                rows={3}
                placeholder="Ex. J'ai payé par l'application à 14 h 02, la capture est jointe."
                className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
              />
            </label>
            <Btn variant="secondary" onClick={() => generer()} disabled={generation}>
              {generation ? "Rédaction…" : "Mettre à jour la lettre"}
            </Btn>
          </div>
        </details>
      )}

      {/* ------------------------------------------------------------ la lettre */}
      <section className="overflow-hidden rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper/60 px-4 py-3 sm:px-5">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy-900">
            {ton && !generation && (
              <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-bold text-navy-700">
                Ton {ton === "courtois" ? "courtois" : ton === "ferme" ? "ferme" : "pressant"}
              </span>
            )}
            {chemin.length > 0 && !generation && (
              <span
                className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-navy-900"
                title={`Rédigée d'après vos réponses : ${chemin.join(" · ")}`}
              >
                Écrite pour votre cas · {chemin.slice(0, 2).join(" · ")}
                {chemin.length > 2 ? ` +${chemin.length - 2}` : ""}
              </span>
            )}
            {enregistree ? (
              <>
                <IconeOk className="h-4 w-4 text-ok-600" /> Rangée dans votre dossier
              </>
            ) : generation ? (
              "Rédaction en cours…"
            ) : (
              "Prête à relire"
            )}
          </p>
          <button
            type="button"
            onClick={() => setEdition((e) => !e)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-navy-700 hover:bg-white"
          >
            <IconeCrayon className="h-4 w-4" />
            {edition ? "Terminer" : "Modifier"}
          </button>
        </div>

        {trous.length > 0 && (
          <p className="flex items-start gap-2 border-b border-gold-300 bg-gold-50 px-4 py-3 text-sm text-navy-900 sm:px-5">
            <IconeAttention className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
            <span>
              <strong>
                {trous.length} information{trous.length > 1 ? "s" : ""} à compléter
              </strong>{" "}
              — surlignée{trous.length > 1 ? "s" : ""} en jaune. Touchez « Modifier » pour les remplacer.
            </span>
          </p>
        )}

        <div className={`relative ${generation ? "opacity-50" : ""}`}>
          {edition ? (
            <textarea
              value={texte}
              onChange={(e) => {
                setTexte(e.target.value);
                setEnregistree(false);
              }}
              aria-label="Texte de la lettre"
              className="letter-paper block min-h-[34rem] w-full resize-y bg-white p-5 text-[0.92rem] text-ink outline-none sm:p-8"
            />
          ) : (
            <div className="letter-paper max-h-[38rem] overflow-y-auto bg-white p-5 text-[0.92rem] text-ink sm:p-8">
              {texte ? <TexteSurligne texte={texte} /> : <span className="text-ink-faint">La lettre arrive…</span>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-line p-3 sm:flex sm:justify-end sm:p-4">
          <Btn variant="secondary" onClick={copier} disabled={!texte || generation} className="px-3">
            <IconeCopier className="h-5 w-5" /> Copier
          </Btn>
          <Btn variant="secondary" onClick={imprimer} disabled={!texte || generation} className="px-3">
            <IconeImprimer className="h-5 w-5" /> <span className="hidden sm:inline">Imprimer ou</span>PDF
          </Btn>
          <Btn variant="primary" onClick={() => sauver(() => montrerToast("Lettre rangée dans le dossier"))} disabled={!texte || enregistree || sauvegarde} className="px-3">
            <IconeOk className="hidden h-5 w-5 sm:block" /> {sauvegarde ? "…" : "Enregistrer"}
          </Btn>
        </div>
      </section>

      {texteCourt && !generation && (
        <details className="group rounded-[var(--radius-carte)] border border-line/80 bg-card shadow-carte">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-navy-900 sm:px-5">
            Version courte, pour un formulaire en ligne ou un e-mail
            <IconeChevron className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-line p-4 sm:px-5">
            <pre className="whitespace-pre-wrap rounded-2xl bg-paper p-4 font-sans text-sm leading-relaxed text-ink">{texteCourt}</pre>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-ink-soft">{texteCourt.length} caractères</span>
              <CopierTexte valeur={texteCourt} libelle="Copier la version courte" />
            </div>
          </div>
        </details>
      )}

      {erreur && (
        <p role="alert" className="flex gap-2.5 rounded-2xl bg-danger-100 p-4 text-sm font-medium text-danger-700">
          <IconeAttention className="mt-0.5 h-5 w-5 shrink-0" />
          {erreur}
        </p>
      )}

      {/* ------------------------------------------------------ l'envoyer, depuis l'app */}
      <EnvoiAssiste
        dossierId={dossierId}
        bruxelles={bruxelles}
        type={type}
        texteCourt={texteCourt}
        pret={!!texte && !generation && trous.length === 0}
        champs={[
          ["Référence de la redevance", dossierInfos.reference],
          ["Plaque", dossierInfos.plaque],
          ["Prénom", profil.prenom],
          ["Nom", profil.nom],
          ["Adresse", profil.adresse],
          ["Code postal", profil.code_postal],
          ["Commune", profil.commune],
          ["E-mail", dossierInfos.email],
          ["Téléphone", profil.telephone],
        ]}
        avantEnvoi={sauver}
        imprimer={imprimer}
        dejaEnvoyee={dejaEnvoyee && type === "contestation"}
        libelle={type === "relance" ? "la relance" : "ma lettre"}
      />

      {/* La zone d'impression : la lettre seule, sans l'interface. */}
      <div id="print-zone" className="letter-paper hidden print:block">
        {texte}
      </div>

      {toast && (
        <div role="status" className="animate-pop fixed inset-x-0 bottom-28 z-50 mx-auto w-fit rounded-full bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-flotte lg:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}

function Pas({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-400">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

/** Le texte de la lettre, avec les informations manquantes surlignées. */
function TexteSurligne({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\[[^\]\n]{2,80}\])/g);
  return (
    <>
      {morceaux.map((m, i) =>
        /^\[[^\]\n]{2,80}\]$/.test(m) ? (
          <mark key={i} className="rounded bg-gold-300 px-0.5 text-navy-950">
            {m}
          </mark>
        ) : (
          <span key={i}>{m}</span>
        ),
      )}
    </>
  );
}

const URL_FORMULAIRE_PARKING =
  "https://parking.brussels/fr/stationner-sa-voiture/redevances-reclamations-et-contestations/reclamation-ou-contestation";

/**
 * Envoyer la lettre sans quitter l'app.
 *
 * Trois canaux, celui qui convient en premier : le formulaire officiel de
 * parking.brussels (qui refuse les e-mails depuis le 15 mars 2026), guidé
 * champ par champ ; l'e-mail, envoyé d'ici au nom du membre, pour les
 * organismes qui l'acceptent ; le recommandé, à imprimer. Quel que soit le
 * canal, l'envoi est noté et le suivi démarre.
 */
function EnvoiAssiste({
  dossierId,
  bruxelles,
  type,
  texteCourt,
  pret,
  champs,
  avantEnvoi,
  imprimer,
  dejaEnvoyee,
  libelle,
}: {
  dossierId: string;
  bruxelles: boolean;
  type: TypeLettre;
  texteCourt: string | null;
  pret: boolean;
  champs: [string, string][];
  avantEnvoi: (apres?: () => void) => void;
  imprimer: () => void;
  dejaEnvoyee: boolean;
  libelle: string;
}) {
  const router = useRouter();
  const formulaireConseille = bruxelles && type !== "demande_preuves";
  const [canal, setCanal] = useState<"formulaire" | "email" | "recommande">(formulaireConseille ? "formulaire" : "email");
  const [destinataire, setDestinataire] = useState("");
  const [accord, setAccord] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [envoi, demarrerEnvoi] = useTransition();

  const CANAUX = [
    ...(bruxelles ? [{ id: "formulaire" as const, libelle: "Formulaire officiel" }] : []),
    { id: "email" as const, libelle: "E-mail" },
    { id: "recommande" as const, libelle: "Recommandé" },
  ];

  const envoyer = () =>
    avantEnvoi(() =>
      demarrerEnvoi(async () => {
        setMessage(null);
        const r = await envoyerLettreParEmail(dossierId, destinataire, accord);
        if (r.erreur) return setMessage({ ok: false, texte: r.erreur });
        setMessage({ ok: true, texte: `Lettre envoyée à ${destinataire}. Vous êtes en copie : gardez cet e-mail, c'est votre preuve.` });
        router.refresh();
      }),
    );

  return (
    <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-navy-900">Envoyer la lettre</h2>
        <div role="tablist" aria-label="Canal d'envoi" className="inline-flex rounded-full bg-paper p-1">
          {CANAUX.map((c) => (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={canal === c.id}
              onClick={() => setCanal(c.id)}
              className={`h-9 rounded-full px-3.5 text-sm font-semibold transition ${
                canal === c.id ? "bg-navy-900 text-white shadow-sm" : "text-navy-900 hover:bg-navy-50"
              }`}
            >
              {c.libelle}
            </button>
          ))}
        </div>
      </div>

      {canal === "formulaire" && (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-relaxed text-ink-soft">
            parking.brussels n&apos;accepte que son formulaire en ligne (« réclamation » pour un avis ou un rappel,
            « contestation » pour une mise en demeure). Ouvrez-le à côté : tout ce qu&apos;il demande est ici, prêt à copier.
          </p>
          <a
            href={URL_FORMULAIRE_PARKING}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-gold-400 px-5 text-sm font-bold text-navy-950 shadow-bouton transition hover:bg-gold-300 active:scale-[0.97]"
          >
            Ouvrir le formulaire officiel
            <IconeFleche className="h-4 w-4" />
          </a>
          <dl className="grid gap-x-4 sm:grid-cols-2">
            {champs.map(([nom, valeur]) => (
              <div key={nom} className="flex items-center justify-between gap-2 border-b border-line py-2.5">
                <span className="min-w-0">
                  <dt className="text-xs text-ink-soft">{nom}</dt>
                  <dd className={`truncate text-sm font-semibold ${valeur ? "text-navy-900" : "text-ink-faint"}`}>{valeur || "à compléter dans « Mon compte »"}</dd>
                </span>
                {valeur && <CopierTexte valeur={valeur} libelle={`Copier : ${nom}`} />}
              </div>
            ))}
          </dl>
          {texteCourt && (
            <div className="rounded-2xl bg-paper p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy-900">Le motif, à coller dans le formulaire</p>
                <CopierTexte valeur={texteCourt} libelle="Copier le motif" />
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{texteCourt}</p>
            </div>
          )}
          <p className="text-sm text-ink-soft">
            Joignez la lettre complète en PDF{" "}
            <button type="button" onClick={imprimer} className="font-semibold text-navy-700 underline underline-offset-4">
              (la télécharger)
            </button>{" "}
            et vos pièces, puis faites une capture de la confirmation : c&apos;est votre preuve.
          </p>
        </div>
      )}

      {canal === "email" && (
        <div className="mt-4 space-y-3">
          {bruxelles && (
            <p className="flex items-start gap-2 rounded-xl bg-warn-100 p-3 text-sm text-warn-700">
              <IconeAttention className="mt-0.5 h-4 w-4 shrink-0" />
              parking.brussels refuse les e-mails depuis le 15 mars 2026 : pour eux, utilisez le formulaire officiel. L&apos;e-mail
              convient à une commune, une société de recouvrement ou un huissier qui l&apos;indique sur son courrier.
            </p>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy-900">Adresse de l&apos;organisme</span>
            <input
              type="email"
              value={destinataire}
              onChange={(e) => setDestinataire(e.target.value)}
              placeholder="Celle indiquée sur votre courrier"
              autoComplete="off"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
            />
          </label>
          <label className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
            <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-navy-900" />
            J&apos;autorise SOS Citizens à envoyer cette lettre en mon nom. Je suis en copie, et l&apos;organisme me répond directement.
          </label>
          <Btn variant="gold" onClick={envoyer} disabled={!pret || !accord || !destinataire || envoi || dejaEnvoyee}>
            <IconeEnvoyer className="h-5 w-5" />
            {envoi ? "Envoi…" : "Envoyer la lettre"}
          </Btn>
          {!pret && <p className="text-xs text-ink-soft">Complétez d&apos;abord la lettre (plus aucun passage entre crochets).</p>}
          {message && (
            <p role="status" className={`text-sm font-medium ${message.ok ? "text-ok-700" : "text-danger-700"}`}>
              {message.texte}
            </p>
          )}
        </div>
      )}

      {canal === "recommande" && (
        <ol className="mt-4 space-y-2 text-sm leading-relaxed text-ink">
          <Pas n={1}>
            Téléchargez la lettre{" "}
            <button type="button" onClick={imprimer} className="font-semibold text-navy-700 underline underline-offset-4">
              en PDF
            </button>
            , imprimez-la et signez-la.
          </Pas>
          <Pas n={2}>Joignez une copie du courrier reçu et vos pièces, puis envoyez-la en recommandé à l&apos;adresse de l&apos;organisme.</Pas>
          <Pas n={3}>Gardez le récépissé : son numéro est votre preuve.</Pas>
        </ol>
      )}

      {canal !== "email" && <EnvoiFait dossierId={dossierId} dejaEnvoyee={dejaEnvoyee} libelle={libelle} />}
    </section>
  );
}

/** « Je l'ai envoyée » : une date, et le suivi démarre. */
function EnvoiFait({ dossierId, dejaEnvoyee, libelle }: { dossierId: string; dejaEnvoyee: boolean; libelle: string }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState("");
  const [reference, setReference] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);
  const [enCours, demarrer] = useTransition();

  if (dejaEnvoyee || fait) {
    return (
      <p className="mt-5 flex items-center gap-2 rounded-2xl bg-ok-50 p-4 text-sm font-semibold text-ok-700">
        <IconeOk className="h-5 w-5" /> Envoi noté. Le suivi est dans l&apos;onglet « Suivi ».
      </p>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border-2 border-dashed border-navy-200 p-4">
      {!ouvert ? (
        <Btn variant="gold" onClick={() => setOuvert(true)} className="w-full sm:w-auto">
          <IconeEnvoyer className="h-5 w-5" />
          J&apos;ai envoyé {libelle}
        </Btn>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy-900">Date d&apos;envoi</span>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy-900">Envoyée par</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
            >
              <option value="">Je préfère ne pas préciser</option>
              {Object.entries(MODES_ENVOI).map(([id, m]) => (
                <option key={id} value={id}>
                  {m.libelle}
                </option>
              ))}
            </select>
          </label>
          {mode && mode !== "courrier" && (
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-navy-900">Preuve de l&apos;envoi (facultatif)</span>
              <input
                value={reference}
                maxLength={80}
                onChange={(e) => setReference(e.target.value)}
                placeholder={MODES_ENVOI[mode].preuve}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
              />
            </label>
          )}
          {mode === "courrier" && (
            <p className="text-xs leading-relaxed text-warn-700 sm:col-span-2">{MODES_ENVOI.courrier.preuve}.</p>
          )}
          <div className="sm:col-span-2">
          <Btn
            variant="gold"
            disabled={enCours}
            onClick={() =>
              demarrer(async () => {
                const r = await marquerContestationEnvoyee(dossierId, date, { mode, reference });
                if (r.erreur) {
                  setErreur(r.erreur);
                  return;
                }
                setFait(true);
                router.refresh();
              })
            }
          >
            {enCours ? "Enregistrement…" : "Confirmer l'envoi"}
          </Btn>
          </div>
        </div>
      )}
      {erreur && <p className="mt-2 text-sm font-medium text-danger-700">{erreur}</p>}
      <p className="mt-2 text-xs text-ink-soft">Nous vous dirons quand relancer si l&apos;administration ne répond pas.</p>
    </div>
  );
}

/** Les coordonnées qui manquent à la lettre, saisies une fois pour toutes. */
function CoordonneesManquantes({
  profil,
  manquants,
  apres,
}: {
  profil: ProfilLettre;
  manquants: string[];
  apres: () => void;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const champ =
    "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40";

  return (
    <section className="rounded-[var(--radius-carte)] border border-gold-300 bg-gold-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-navy-900">Votre nom et votre adresse manquent</p>
          <p className="text-sm text-ink-soft">
            {manquants.join(", ")} — saisis une fois, ils s&apos;inscrivent dans toutes vos lettres.
          </p>
        </div>
        {!ouvert && (
          <Btn variant="primary" taille="sm" onClick={() => setOuvert(true)}>
            Compléter
          </Btn>
        )}
      </div>
      {ouvert && (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const donnees = new FormData(e.currentTarget);
            demarrer(async () => {
              const r = await enregistrerProfil({}, donnees);
              if (r.erreur) {
                setErreur(r.erreur);
                return;
              }
              setOuvert(false);
              router.refresh();
              apres();
            });
          }}
        >
          <input name="prenom" defaultValue={profil.prenom} placeholder="Prénom" aria-label="Prénom" required className={champ} />
          <input name="nom" defaultValue={profil.nom} placeholder="Nom" aria-label="Nom" required className={champ} />
          <input name="adresse" defaultValue={profil.adresse} placeholder="Rue et numéro" aria-label="Rue et numéro" className={`${champ} sm:col-span-2`} />
          <input name="codePostal" defaultValue={profil.code_postal} placeholder="Code postal" aria-label="Code postal" inputMode="numeric" className={champ} />
          <input name="commune" defaultValue={profil.commune} placeholder="Commune" aria-label="Commune" className={champ} />
          <input name="telephone" defaultValue={profil.telephone} placeholder="Téléphone (facultatif)" aria-label="Téléphone" inputMode="tel" className={`${champ} sm:col-span-2`} />
          {erreur && <p className="text-sm font-medium text-danger-700 sm:col-span-2">{erreur}</p>}
          <div className="sm:col-span-2">
            <Btn type="submit" variant="gold" disabled={enCours}>
              {enCours ? "Enregistrement…" : "Enregistrer et mettre la lettre à jour"}
            </Btn>
          </div>
        </form>
      )}
    </section>
  );
}
