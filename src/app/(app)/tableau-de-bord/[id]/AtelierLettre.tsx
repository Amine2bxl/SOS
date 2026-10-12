"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redigerLettreDossier } from "@/lib/cerveau-actions";
import { enregistrerLettreDossier, marquerContestationEnvoyee } from "@/lib/dossiers-actions";
import { enregistrerProfil } from "@/lib/profile-actions";
import type { TypeLettre } from "@/cerveau/types";
import type { Lettre } from "@/lib/dossiers-format";
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
  IconeRecommande,
} from "@/components/icones";

const LETTRES: { id: TypeLettre; titre: string; quand: string; icone: string }[] = [
  { id: "contestation", titre: "Contestation", quand: "Au premier courrier ou au rappel.", icone: "lettre" },
  { id: "relance", titre: "Relance", quand: "Votre contestation est restée sans réponse.", icone: "recommande" },
  { id: "reponse_huissier", titre: "Réponse à l'huissier", quand: "Contrainte ou courrier d'huissier.", icone: "huissier" },
  { id: "demande_preuves", titre: "Demande des photos", quand: "Pour vérifier le constat, au titre du RGPD.", icone: "loupe" },
  { id: "remboursement", titre: "Arrêt et remboursement", quand: "Vous avez déjà payé cette somme.", icone: "euro" },
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
}: {
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
          <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
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

      {erreur && (
        <p role="alert" className="flex gap-2.5 rounded-2xl bg-danger-100 p-4 text-sm font-medium text-danger-700">
          <IconeAttention className="mt-0.5 h-5 w-5 shrink-0" />
          {erreur}
        </p>
      )}

      {/* ------------------------------------------------------ comment l'envoyer */}
      <section className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
            <IconeRecommande className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">Comment l&apos;envoyer</h2>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink">
              {bruxelles && type !== "demande_preuves" ? (
                <>
                  <Pas n={1}>
                    Ouvrez le formulaire de contestation en ligne de{" "}
                    <a href="https://www.parking.brussels" target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-700 underline">
                      parking.brussels
                    </a>{" "}
                    — les contestations par e-mail y sont refusées.
                  </Pas>
                  <Pas n={2}>Collez-y le texte de la lettre (bouton « Copier ») et joignez vos pièces.</Pas>
                  <Pas n={3}>Faites une capture d&apos;écran de la confirmation : c&apos;est votre preuve.</Pas>
                </>
              ) : type === "demande_preuves" ? (
                <>
                  <Pas n={1}>
                    Envoyez-la à l&apos;organisme qui vous réclame la somme, à l&apos;adresse de son courrier ou de
                    son délégué à la protection des données s&apos;il en indique un.
                  </Pas>
                  <Pas n={2}>Joignez une copie de votre carte d&apos;identité : elle prouve que vous êtes la personne concernée.</Pas>
                  <Pas n={3}>L&apos;organisme a un mois pour répondre. Gardez la preuve de l&apos;envoi.</Pas>
                </>
              ) : (
                <>
                  <Pas n={1}>
                    Envoyez-la par le canal indiqué sur votre courrier — à défaut, par recommandé à l&apos;adresse de
                    l&apos;organisme.
                  </Pas>
                  <Pas n={2}>Imprimez-la, signez-la, et joignez une copie du courrier reçu et vos pièces.</Pas>
                  <Pas n={3}>Gardez le récépissé du recommandé ou la confirmation d&apos;envoi : c&apos;est votre preuve.</Pas>
                </>
              )}
            </ol>
          </div>
        </div>

        <EnvoiFait dossierId={dossierId} dejaEnvoyee={dejaEnvoyee && type === "contestation"} libelle={type === "relance" ? "la relance" : "ma lettre"} />
      </section>

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

/** « Je l'ai envoyée » : une date, et le suivi démarre. */
function EnvoiFait({ dossierId, dejaEnvoyee, libelle }: { dossierId: string; dejaEnvoyee: boolean; libelle: string }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-semibold text-navy-900">Date d&apos;envoi</span>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[0.95rem] outline-none focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40"
            />
          </label>
          <Btn
            variant="gold"
            disabled={enCours}
            onClick={() =>
              demarrer(async () => {
                const r = await marquerContestationEnvoyee(dossierId, date);
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
