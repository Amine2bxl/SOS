"use server";

/**
 * Les portes d'entrée du moteur SOS.
 *
 * Le moteur vit sur le serveur ; le navigateur lui parle par ces actions. Ce
 * qui voyage : des faits (dates, montant, commune, réponses aux questions),
 * jamais le document lui-même, qui reste sur l'appareil de l'utilisateur.
 *
 * Tout ce qui arrive ici est fabriqué par le client, donc suspect : chaque
 * champ est vérifié et borné avant d'atteindre le moteur (`nettoyerFaits`).
 */

import { headers } from "next/headers";
import { creerClientServeur } from "@/lib/supabase/server";
import { consommerJeton, messageQuotaAtteint } from "@/lib/limites";
import {
  analyser,
  composerLettre,
  rechercherSavoir,
  type Analyse,
  type Identite,
  type Langue,
  type LettreComposee,
  type ReponseSavoir,
  type TypeLettre,
} from "@/cerveau";
import { faitsDepuisDossier, nettoyerFaits } from "@/lib/faits";
import { estUuid } from "@/lib/validation";
import type { Dossier, Profil } from "@/lib/dossiers-format";

const TYPES_LETTRE: TypeLettre[] = [
  "contestation",
  "relance",
  "reponse_huissier",
  "demande_preuves",
  "remboursement",
];

const texte = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

const dateIso = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

/** Adresse IP du visiteur, pour limiter le débit des appels anonymes. */
async function ipVisiteur(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "inconnue";
}

export type ResultatAnalyse = { analyse?: Analyse; erreur?: string };

/**
 * Analyse d'un dossier.
 *
 * Ouverte aux visiteurs non connectés : c'est l'analyse instantanée de la page
 * d'accueil. Elle ne renvoie que des conclusions ; la rédaction de la lettre,
 * elle, demande un compte.
 */
export async function analyserFaits(faitsBruts: unknown): Promise<ResultatAnalyse> {
  if (!(await consommerJeton("analyse", await ipVisiteur()))) {
    return { erreur: messageQuotaAtteint("analyse") };
  }
  return { analyse: analyser(nettoyerFaits(faitsBruts)) };
}

export type ResultatLettre = { lettre?: LettreComposee; erreur?: string };

/**
 * Rédaction d'une lettre pour un dossier. Réservée à son propriétaire.
 *
 * Tout est relu sur le serveur — les faits dans le dossier, l'identité dans
 * le profil — : le navigateur ne dit que quelle lettre il veut, dans quelle
 * langue, et avec quels arguments.
 */
export async function redigerLettreDossier(entree: {
  dossierId: string;
  type: string;
  langue: string;
  moyens?: string[];
  explication?: string;
  ibanRemboursement?: string | null;
}): Promise<ResultatLettre> {
  const supabase = await creerClientServeur();
  if (!supabase) return { erreur: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Connectez-vous pour obtenir votre lettre." };
  if (!estUuid(entree.dossierId)) return { erreur: "Ce dossier est introuvable." };

  if (!(await consommerJeton("lettre", user.id))) {
    return { erreur: messageQuotaAtteint("lettre") };
  }

  const [{ data: dossier }, { data: profil }] = await Promise.all([
    supabase.from("dossiers").select("*").eq("id", entree.dossierId).eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);
  if (!dossier) return { erreur: "Ce dossier est introuvable." };

  const p = (profil ?? {}) as Partial<Profil>;
  const d = dossier as Dossier;
  const type = TYPES_LETTRE.includes(entree.type as TypeLettre) ? (entree.type as TypeLettre) : "contestation";
  const langue: Langue = entree.langue === "nl" ? "nl" : "fr";

  const lettre = composerLettre({
    type,
    langue,
    faits: faitsDepuisDossier(d),
    identite: {
      prenom: texte(p.prenom, 60) ?? "",
      nom: texte(p.nom, 60) ?? "",
      adresse: texte(p.adresse, 120) ?? "",
      codePostal: texte(p.code_postal, 10) ?? "",
      ville: texte(p.commune, 60) ?? "",
      email: texte(p.email, 120) ?? user.email ?? "",
      telephone: texte(p.telephone, 30) ?? "",
    },
    moyens: Array.isArray(entree.moyens)
      ? entree.moyens.filter((m): m is string => typeof m === "string").slice(0, 20)
      : undefined,
    explication: texte(entree.explication, 3000) ?? undefined,
    datePremiereContestation: dateIso(d.date_envoi_contestation),
    ibanRemboursement: texte(entree.ibanRemboursement, 40),
  });

  return { lettre };
}

export type ResultatQuestion = { reponses?: ReponseSavoir[]; erreur?: string };

/** « Demandez à SOS » : une question en langage courant, des réponses de la base. */
export async function demanderSos(question: string): Promise<ResultatQuestion> {
  const q = texte(question, 300);
  if (!q) return { reponses: [] };
  if (!(await consommerJeton("question", await ipVisiteur()))) {
    return { erreur: messageQuotaAtteint("question") };
  }
  return { reponses: rechercherSavoir(q, 5) };
}
