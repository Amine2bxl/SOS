/**
 * Extraction des informations d'un courrier de redevance ou d'amende.
 *
 * Le texte fourni provient de l'OCR (Tesseract, exécuté dans le navigateur).
 * L'OCR se trompe : ce module ne prétend donc pas être infaillible. Chaque
 * champ ressort avec un indice de confiance, et l'interface impose à
 * l'utilisateur de confirmer les valeurs avant de créer le dossier — un
 * montant ou surtout une date d'échéance mal lus auraient des conséquences
 * réelles.
 *
 * Bruxelles étant bilingue, les libellés français et néerlandais sont
 * reconnus.
 */

import { COMMUNES } from "./data";

export type Confiance = "haute" | "moyenne" | "faible";

export type Champ<T> = {
  valeur: T | null;
  confiance: Confiance;
  /** Extrait du document d'où provient la valeur, pour que l'utilisateur vérifie. */
  contexte?: string;
};

export type DonneesExtraites = {
  reference: Champ<string>;
  montant: Champ<number>;
  dateConstat: Champ<string>;
  dateEcheance: Champ<string>;
  plaque: Champ<string>;
  commune: Champ<string>;
  autorite: Champ<string>;
  typeDocument: Champ<string>;
};

const champVide = <T,>(): Champ<T> => ({ valeur: null, confiance: "faible" });

/** Normalise le texte OCR : espaces, ligatures, caractères parasites. */
function normaliser(texte: string): string {
  return texte
    .replace(/ /g, " ")
    .replace(/[’`´]/g, "'")
    .replace(/[|]/g, "l")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n");
}

/** Renvoie un court extrait autour d'une position, pour affichage. */
function contexteAutour(texte: string, index: number, longueur = 60): string {
  const debut = Math.max(0, index - longueur / 2);
  return texte.slice(debut, index + longueur).replace(/\n/g, " ").trim();
}

/* -------------------------------------------------------------------------- */
/*  Dates                                                                     */
/* -------------------------------------------------------------------------- */

const MOIS: Record<string, number> = {
  janvier: 1, februari: 2, fevrier: 2, février: 2, mars: 3, maart: 3,
  avril: 4, april: 4, mai: 5, mei: 5, juin: 6, juni: 6,
  juillet: 7, juli: 7, aout: 8, août: 8, augustus: 8,
  septembre: 9, september: 9, octobre: 10, oktober: 10,
  novembre: 11, november: 11, decembre: 12, décembre: 12, december: 12,
  januari: 1, janvier_: 1,
};

/** Convertit jour/mois/année en ISO, en refusant les dates impossibles. */
function versISO(jour: number, mois: number, annee: number): string | null {
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
  if (annee < 100) annee += 2000;
  if (annee < 2000 || annee > 2100) return null;
  const d = new Date(Date.UTC(annee, mois - 1, jour));
  // Rejette les dates qui « débordent » (31 février par exemple).
  if (d.getUTCMonth() !== mois - 1 || d.getUTCDate() !== jour) return null;
  return d.toISOString().slice(0, 10);
}

type DateTrouvee = { iso: string; index: number };

/** Toutes les dates du texte, sous forme numérique ou littérale. */
function trouverDates(texte: string): DateTrouvee[] {
  const dates: DateTrouvee[] = [];

  const numerique = /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g;
  for (const m of texte.matchAll(numerique)) {
    const iso = versISO(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) dates.push({ iso, index: m.index ?? 0 });
  }

  const litterale = new RegExp(
    `\\b(\\d{1,2})\\s+(${Object.keys(MOIS).join("|")})\\s+(\\d{4})\\b`,
    "gi",
  );
  for (const m of texte.matchAll(litterale)) {
    const iso = versISO(Number(m[1]), MOIS[m[2].toLowerCase()] ?? 0, Number(m[3]));
    if (iso) dates.push({ iso, index: m.index ?? 0 });
  }

  return dates.sort((a, b) => a.index - b.index);
}

/** Date la plus proche d'un libellé donné, en aval de celui-ci. */
function dateApresLibelle(
  texte: string,
  dates: DateTrouvee[],
  libelles: RegExp,
): Champ<string> {
  const m = texte.match(libelles);
  if (m?.index === undefined) return champVide<string>();

  // On accepte une date située dans les 120 caractères suivant le libellé.
  const candidate = dates.find((d) => d.index >= m.index! && d.index - m.index! < 120);
  if (!candidate) return champVide<string>();

  return {
    valeur: candidate.iso,
    confiance: "haute",
    contexte: contexteAutour(texte, m.index),
  };
}

/* -------------------------------------------------------------------------- */
/*  Champs                                                                    */
/* -------------------------------------------------------------------------- */

function extraireMontant(texte: string): Champ<number> {
  // Un montant précédé d'un libellé explicite est bien plus fiable.
  const libelle =
    /(montant|total|à payer|a payer|somme due|bedrag|te betalen|totaal)[^0-9€]{0,40}(\d{1,3}(?:[ .]\d{3})*(?:[.,]\d{2})?)/i;
  const m = texte.match(libelle);
  if (m) {
    const valeur = parseFloat(m[2].replace(/[ .](?=\d{3})/g, "").replace(",", "."));
    if (!Number.isNaN(valeur) && valeur > 0) {
      return { valeur, confiance: "haute", contexte: contexteAutour(texte, m.index ?? 0) };
    }
  }

  // Sinon, on retient le plus gros montant en euros trouvé dans la page.
  const tous = [...texte.matchAll(/(?:€\s*)?(\d{1,3}(?:[.,]\d{2}))\s*(?:€|EUR)?/gi)]
    .map((x) => ({
      valeur: parseFloat(x[1].replace(",", ".")),
      index: x.index ?? 0,
    }))
    .filter((x) => !Number.isNaN(x.valeur) && x.valeur > 0 && x.valeur < 100000);

  if (tous.length === 0) return champVide<number>();
  const max = tous.reduce((a, b) => (b.valeur > a.valeur ? b : a));
  return {
    valeur: max.valeur,
    confiance: tous.length === 1 ? "moyenne" : "faible",
    contexte: contexteAutour(texte, max.index),
  };
}

function extrairePlaque(texte: string): Champ<string> {
  // Format belge actuel : 1-ABC-123. L'OCR confond O/0 et I/1 : on corrige
  // uniquement dans la partie lettres, jamais dans les chiffres.
  const moderne = /\b([1-9])[\s\-.]?([A-Z]{3})[\s\-.]?(\d{3})\b/g;
  const m = [...texte.matchAll(moderne)][0];
  if (m) {
    return {
      valeur: `${m[1]}-${m[2].toUpperCase()}-${m[3]}`,
      confiance: "haute",
      contexte: contexteAutour(texte, m.index ?? 0),
    };
  }

  const ancien = /\b([A-Z]{3})[\s\-.]?(\d{3})\b/g;
  const a = [...texte.matchAll(ancien)][0];
  if (a) {
    return {
      valeur: `${a[1].toUpperCase()}-${a[2]}`,
      confiance: "moyenne",
      contexte: contexteAutour(texte, a.index ?? 0),
    };
  }

  return champVide<string>();
}

function extraireReference(texte: string): Champ<string> {
  const libelle =
    /(r[ée]f[ée]rence|dossier|n[°o]\s*de\s*dossier|kenmerk|dossiernummer|referentie)\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\/\-.]{4,24})/i;
  const m = texte.match(libelle);
  if (m) {
    return { valeur: m[2].trim(), confiance: "haute", contexte: contexteAutour(texte, m.index ?? 0) };
  }

  // Motif fréquent : une année suivie d'un séparateur et d'un long numéro.
  const motif = /\b(20\d{2}[\/\-]\d{4,10})\b/;
  const s = texte.match(motif);
  if (s) {
    return { valeur: s[1], confiance: "moyenne", contexte: contexteAutour(texte, s.index ?? 0) };
  }

  return champVide<string>();
}

function extraireCommune(texte: string): Champ<string> {
  const enMajuscules = texte.toUpperCase();
  // On cherche la correspondance la plus longue pour éviter qu'un nom court
  // masque un nom composé (« Woluwe-Saint-Pierre » vs « Woluwe »).
  const trouvees = COMMUNES.filter((c) =>
    enMajuscules.includes(c.nom.toUpperCase()),
  ).sort((a, b) => b.nom.length - a.nom.length);

  if (trouvees.length === 0) return champVide<string>();
  const index = enMajuscules.indexOf(trouvees[0].nom.toUpperCase());
  return {
    valeur: trouvees[0].nom,
    confiance: trouvees.length === 1 ? "haute" : "moyenne",
    contexte: contexteAutour(texte, index),
  };
}

function extraireAutorite(texte: string): Champ<string> {
  const connues: [RegExp, string][] = [
    [/parking\.?\s?brussels/i, "parking.brussels"],
    [/agence\s+du\s+stationnement/i, "Agence du stationnement"],
    [/parkeeragentschap/i, "Parkeeragentschap"],
    [/fonctionnaire\s+sanctionnateur/i, "Fonctionnaire sanctionnateur"],
    [/huissier/i, "Huissier de justice"],
  ];
  for (const [motif, nom] of connues) {
    const m = texte.match(motif);
    if (m) return { valeur: nom, confiance: "haute", contexte: contexteAutour(texte, m.index ?? 0) };
  }
  return champVide<string>();
}

/** Détermine le stade de la procédure : c'est lui qui dicte l'urgence. */
function extraireTypeDocument(texte: string): Champ<string> {
  const stades: [RegExp, string][] = [
    [/huissier|exploit|saisie/i, "courrier_huissier"],
    [/contrainte|titre\s+ex[ée]cutoire|dwangbevel/i, "contrainte"],
    [/mise\s+en\s+demeure|ingebrekestelling/i, "mise_en_demeure"],
    [/(second|2e|deuxi[èe]me)\s+rappel|tweede\s+herinnering/i, "deuxieme_rappel"],
    [/rappel|herinnering|aanmaning/i, "premier_rappel"],
    [/redevance|notification|retribution|retributie/i, "notification"],
  ];
  // L'ordre est délibéré : du plus grave au plus doux, car un courrier
  // d'huissier mentionne aussi le mot « redevance ».
  for (const [motif, type] of stades) {
    const m = texte.match(motif);
    if (m) return { valeur: type, confiance: "haute", contexte: contexteAutour(texte, m.index ?? 0) };
  }
  return champVide<string>();
}

/* -------------------------------------------------------------------------- */

export function extraireDonnees(texteBrut: string): DonneesExtraites {
  const texte = normaliser(texteBrut);
  const dates = trouverDates(texte);

  const dateConstat = dateApresLibelle(
    texte,
    dates,
    /(date\s+du\s+constat|constat[ée]?\s+le|constatation|vaststelling|datum\s+vaststelling)/i,
  );

  const dateEcheance = dateApresLibelle(
    texte,
    dates,
    /([ée]ch[ée]ance|avant\s+le|payer\s+avant|au\s+plus\s+tard|vervaldatum|uiterlijk|betaal\s+voor)/i,
  );

  // À défaut de libellé, la première date du document est le plus souvent
  // celle du constat : utile, mais signalée comme peu sûre.
  const constatDeSecours: Champ<string> =
    dateConstat.valeur === null && dates.length > 0
      ? { valeur: dates[0].iso, confiance: "faible", contexte: contexteAutour(texte, dates[0].index) }
      : dateConstat;

  return {
    reference: extraireReference(texte),
    montant: extraireMontant(texte),
    dateConstat: constatDeSecours,
    dateEcheance,
    plaque: extrairePlaque(texte),
    commune: extraireCommune(texte),
    autorite: extraireAutorite(texte),
    typeDocument: extraireTypeDocument(texte),
  };
}

/** Part des champs importants effectivement reconnus, pour informer l'utilisateur. */
export function tauxDeReconnaissance(d: DonneesExtraites): number {
  const importants = [d.reference, d.montant, d.dateConstat, d.plaque, d.commune, d.typeDocument];
  const trouves = importants.filter((c) => c.valeur !== null).length;
  return Math.round((trouves / importants.length) * 100);
}
