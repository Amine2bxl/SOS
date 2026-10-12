/**
 * Le brouillon d'analyse d'un visiteur, gardé le temps de créer son compte.
 *
 * Un visiteur peut tout faire sans compte : scanner, répondre, lire l'analyse.
 * Au moment d'obtenir sa lettre, on lui demande son adresse e-mail — et il ne
 * doit surtout pas avoir à tout recommencer après. Le brouillon tient dans le
 * navigateur, quelques heures, et ne contient que les champs confirmés : ni
 * l'image, ni le texte brut du document.
 */

const CLE = "sos:brouillon";
const DUREE_DE_VIE_MS = 6 * 3600 * 1000;

export type Formulaire = {
  reference: string;
  typeDocument: string;
  crediteur: string;
  commune: string;
  region: string;
  langue: string;
  plaque: string;
  montant: string;
  dateConstat: string;
  heureConstat: string;
  dateEcheance: string;
  dateEnvoi: string;
  lieuConstat: string;
  zone: string;
  communication: string;
  iban: string;
};

export const FORMULAIRE_VIDE: Formulaire = {
  reference: "",
  typeDocument: "notification",
  crediteur: "",
  commune: "",
  region: "",
  langue: "fr",
  plaque: "",
  montant: "",
  dateConstat: "",
  heureConstat: "",
  dateEcheance: "",
  dateEnvoi: "",
  lieuConstat: "",
  zone: "",
  communication: "",
  iban: "",
};

export type Brouillon = {
  form: Formulaire;
  reponses: Record<string, string>;
  ocrConfiance: Record<string, string>;
  enregistreLe: number;
};

export function enregistrerBrouillon(b: Omit<Brouillon, "enregistreLe">) {
  try {
    localStorage.setItem(CLE, JSON.stringify({ ...b, enregistreLe: Date.now() }));
  } catch {
    // Navigation privée, stockage plein : le visiteur recommencera, rien de grave.
  }
}

export function lireBrouillon(): Brouillon | null {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return null;
    const b = JSON.parse(brut) as Brouillon;
    if (!b?.form || Date.now() - (b.enregistreLe ?? 0) > DUREE_DE_VIE_MS) {
      localStorage.removeItem(CLE);
      return null;
    }
    return { ...b, form: { ...FORMULAIRE_VIDE, ...b.form }, reponses: b.reponses ?? {}, ocrConfiance: b.ocrConfiance ?? {} };
  } catch {
    return null;
  }
}

export function effacerBrouillon() {
  try {
    localStorage.removeItem(CLE);
  } catch {
    // rien à faire
  }
}
