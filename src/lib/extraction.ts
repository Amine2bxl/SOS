/**
 * Extraction des informations d'un courrier de redevance ou d'amende.
 *
 * Le texte fourni provient soit de la couche de texte d'un PDF (lecture
 * parfaite), soit de l'OCR (Tesseract, exécuté dans le navigateur). L'OCR se
 * trompe : ce module ne prétend donc pas être infaillible. Chaque champ ressort
 * avec un indice de confiance, et l'interface impose à l'utilisateur de
 * confirmer les valeurs avant de créer le dossier — un montant ou surtout une
 * date d'échéance mal lus auraient des conséquences réelles.
 *
 * L'objectif : que l'utilisateur n'ait rien à retaper. Tout ce que le courrier
 * contient et que la contestation exige doit être ressorti d'ici — y compris
 * l'heure et le lieu du constat, la communication structurée et l'IBAN, que les
 * formulaires de contestation réclament et qu'on retapait jusqu'ici à la main.
 *
 * Bruxelles étant bilingue, les libellés français et néerlandais sont reconnus.
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
  /** Heure du constat : le formulaire de contestation la demande. */
  heureConstat: Champ<string>;
  dateEcheance: Champ<string>;
  /** Date d'envoi du courrier : c'est d'elle que court le délai de contestation. */
  dateEnvoi: Champ<string>;
  plaque: Champ<string>;
  commune: Champ<string>;
  /** Rue et numéro où le véhicule était stationné. */
  lieuConstat: Champ<string>;
  autorite: Champ<string>;
  typeDocument: Champ<string>;
  /** Communication structurée du virement : identifie le dossier à coup sûr. */
  communication: Champ<string>;
  iban: Champ<string>;
  /** Zone de stationnement mentionnée sur le document (rouge, verte, bleue…). */
  zone: Champ<string>;
};

const champVide = <T,>(): Champ<T> => ({ valeur: null, confiance: "faible" });

/** Normalise le texte : espaces, apostrophes, confusions fréquentes de l'OCR. */
function normaliser(texte: string): string {
  return texte
    .replace(/ /g, " ")
    .replace(/[’`´]/g, "'")
    .replace(/[|]/g, "l")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Renvoie un court extrait autour d'une position, pour affichage. */
function contexteAutour(texte: string, index: number, longueur = 70): string {
  const debut = Math.max(0, index - longueur / 2);
  return texte.slice(debut, index + longueur).replace(/\s+/g, " ").trim();
}

/* -------------------------------------------------------------------------- */
/*  Dates et heures                                                           */
/* -------------------------------------------------------------------------- */

const MOIS: Record<string, number> = {
  janvier: 1, januari: 1,
  fevrier: 2, février: 2, februari: 2,
  mars: 3, maart: 3,
  avril: 4, april: 4,
  mai: 5, mei: 5,
  juin: 6, juni: 6,
  juillet: 7, juli: 7,
  aout: 8, août: 8, augustus: 8,
  septembre: 9, september: 9,
  octobre: 10, oktober: 10,
  novembre: 11, november: 11,
  decembre: 12, décembre: 12, december: 12,
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

/** Toutes les dates du texte, sous forme numérique, ISO ou littérale. */
function trouverDates(texte: string): DateTrouvee[] {
  const dates: DateTrouvee[] = [];

  // 12/03/2026, 12-03-26, 12.03.2026
  for (const m of texte.matchAll(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g)) {
    const iso = versISO(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) dates.push({ iso, index: m.index ?? 0 });
  }

  // 2026-03-12 (format ISO, fréquent sur les documents générés)
  for (const m of texte.matchAll(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g)) {
    const iso = versISO(Number(m[3]), Number(m[2]), Number(m[1]));
    if (iso) dates.push({ iso, index: m.index ?? 0 });
  }

  // 12 mars 2026 / 12 maart 2026
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
  portee = 120,
): Champ<string> {
  const m = texte.match(libelles);
  if (m?.index === undefined) return champVide<string>();

  const candidate = dates.find((d) => d.index >= m.index! && d.index - m.index! < portee);
  if (!candidate) return champVide<string>();

  return {
    valeur: candidate.iso,
    confiance: "haute",
    contexte: contexteAutour(texte, m.index),
  };
}

/** Heure du constat : 14h10, 14:10, 14.10 u. */
function extraireHeure(texte: string): Champ<string> {
  const libelle =
    /(heure|à\s+|om\s+|uur|tijdstip|constat[ée]?\s+(?:à|le)?[^0-9]{0,20})(\d{1,2})\s*[h:.]\s*(\d{2})\b/i;
  const m = texte.match(libelle);
  if (m) {
    const h = Number(m[2]);
    const min = Number(m[3]);
    if (h < 24 && min < 60) {
      return {
        valeur: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
        confiance: "haute",
        contexte: contexteAutour(texte, m.index ?? 0),
      };
    }
  }

  // À défaut, la première heure plausible du document.
  for (const x of texte.matchAll(/\b(\d{1,2})\s*[h:]\s*(\d{2})\b/g)) {
    const h = Number(x[1]);
    const min = Number(x[2]);
    if (h < 24 && min < 60) {
      return {
        valeur: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
        confiance: "moyenne",
        contexte: contexteAutour(texte, x.index ?? 0),
      };
    }
  }

  return champVide<string>();
}

/* -------------------------------------------------------------------------- */
/*  Champs                                                                    */
/* -------------------------------------------------------------------------- */

function extraireMontant(texte: string): Champ<number> {
  // Un montant précédé d'un libellé explicite est bien plus fiable.
  // « redevance de » est volontairement absent de cette liste : sur un courrier
  // intitulé « REDEVANCE DE STATIONNEMENT », il capturait le début de la
  // référence qui suit. Le négatif final protège du même piège : un montant
  // n'est jamais suivi d'un chiffre ni d'une barre oblique.
  const libelle =
    /(montant\s+(?:total|d[ûu]|r[ée]clam[ée])?|total\s+[àa]\s+payer|[àa]\s+payer|somme\s+due|bedrag|te\s+betalen|totaal|verschuldigd)[^0-9€]{0,40}(\d{1,3}(?:[ .]\d{3})*(?:[.,]\d{2})?)(?![\d/])/i;
  const m = texte.match(libelle);
  if (m) {
    const valeur = parseFloat(m[2].replace(/[ .](?=\d{3})/g, "").replace(",", "."));
    if (!Number.isNaN(valeur) && valeur > 0) {
      return { valeur, confiance: "haute", contexte: contexteAutour(texte, m.index ?? 0) };
    }
  }

  // Sinon, le plus gros montant en euros de la page — c'est presque toujours
  // le total réclamé, frais compris.
  const tous = [...texte.matchAll(/(?:€\s*)?(\d{1,4}(?:[.,]\d{2}))\s*(?:€|EUR)?/gi)]
    .map((x) => ({ valeur: parseFloat(x[1].replace(",", ".")), index: x.index ?? 0 }))
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
  // Format belge actuel : 1-ABC-123. L'OCR confond O/0 et I/1 : on ne corrige
  // que la partie lettres, jamais les chiffres.
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
    /(r[ée]f[ée]rence|dossier|n[°o]\s*de\s*dossier|kenmerk|dossiernummer|referentie|notre\s+r[ée]f)\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\/\-.]{4,24})/i;
  const m = texte.match(libelle);
  if (m) {
    return { valeur: m[2].trim(), confiance: "haute", contexte: contexteAutour(texte, m.index ?? 0) };
  }

  // Motif fréquent : une année séparée d'un long numéro, avec ou sans tiret.
  const motif = /\b(20\d{2}[\/\- ]?\d{4,10})\b/;
  const s = texte.match(motif);
  if (s) {
    return {
      valeur: s[1].replace(/\s+/g, "-"),
      confiance: "moyenne",
      contexte: contexteAutour(texte, s.index ?? 0),
    };
  }

  return champVide<string>();
}

/**
 * Communication structurée belge : +++123/4567/89012+++.
 *
 * C'est l'identifiant le plus fiable d'un dossier — bien plus qu'une référence
 * recopiée à la main. Le service de contestation le reconnaît immédiatement.
 */
function extraireCommunication(texte: string): Champ<string> {
  const m = texte.match(/\+{0,3}\s*(\d{3})\s*\/\s*(\d{4})\s*\/\s*(\d{5})\s*\+{0,3}/);
  if (!m) return champVide<string>();

  // Contrôle de validité : le nombre formé par les 10 premiers chiffres doit
  // être congruent au reste modulo 97 (97 quand le reste vaut 0). Le calcul se
  // fait chiffre par chiffre pour rester exact sans dépendre de BigInt.
  const chiffres = `${m[1]}${m[2]}${m[3]}`;
  let reste = 0;
  for (const c of chiffres.slice(0, 10)) reste = (reste * 10 + Number(c)) % 97;
  const controle = Number(chiffres.slice(10, 12));
  const attendu = reste || 97;

  return {
    valeur: `+++${m[1]}/${m[2]}/${m[3]}+++`,
    confiance: controle === attendu ? "haute" : "moyenne",
    contexte: contexteAutour(texte, m.index ?? 0),
  };
}

/** IBAN du bénéficiaire : utile pour la preuve de paiement et le remboursement. */
function extraireIban(texte: string): Champ<string> {
  const m = texte.match(/\b(BE\d{2}(?:\s?\d{4}){3})\b/i);
  if (!m) return champVide<string>();
  const compact = m[1].replace(/\s+/g, "").toUpperCase();
  return {
    valeur: compact.replace(/(.{4})/g, "$1 ").trim(),
    confiance: "haute",
    contexte: contexteAutour(texte, m.index ?? 0),
  };
}

function extraireCommune(texte: string): Champ<string> {
  const enMajuscules = texte.toUpperCase();
  // Correspondance la plus longue, pour qu'un nom court ne masque pas un nom
  // composé (« Woluwe-Saint-Pierre » vs « Woluwe »).
  const trouvees = COMMUNES.filter((c) => enMajuscules.includes(c.nom.toUpperCase())).sort(
    (a, b) => b.nom.length - a.nom.length,
  );

  if (trouvees.length === 0) return champVide<string>();
  const index = enMajuscules.indexOf(trouvees[0].nom.toUpperCase());
  return {
    valeur: trouvees[0].nom,
    confiance: trouvees.length === 1 ? "haute" : "moyenne",
    contexte: contexteAutour(texte, index),
  };
}

/**
 * Lieu du constat : la rue et le numéro où le véhicule était stationné.
 *
 * Le formulaire de contestation le réclame, et c'est souvent la seule donnée
 * qui permet de rattacher le constat à une zone tarifaire précise.
 */
function extraireLieuConstat(texte: string): Champ<string> {
  const libelle =
    /(lieu\s+du\s+constat|lieu|adresse\s+du\s+constat|stationn[ée]\s+(?:à|au|rue)|plaats|locatie|straat)\s*[:.\-]?\s*([A-ZÀ-Ÿ][^\n,;]{4,60})/i;
  const m = texte.match(libelle);
  if (m) {
    return {
      valeur: m[2].trim().replace(/\s{2,}/g, " "),
      confiance: "haute",
      contexte: contexteAutour(texte, m.index ?? 0),
    };
  }

  // À défaut : un odonyme suivi d'un numéro (« Rue Émile Feron 153 »).
  const odonyme =
    /\b((?:rue|avenue|boulevard|chauss[ée]e|place|square|quai|all[ée]e|drève|straat|laan|steenweg|plein)[^\n,;]{3,50}?\s+\d{1,4}[A-Za-z]?)\b/i;
  const o = texte.match(odonyme);
  if (o) {
    return {
      valeur: o[1].trim().replace(/\s{2,}/g, " "),
      confiance: "moyenne",
      contexte: contexteAutour(texte, o.index ?? 0),
    };
  }

  return champVide<string>();
}

/** Zone de stationnement mentionnée : elle dicte le tarif et les règles. */
function extraireZone(texte: string): Champ<string> {
  const zones: [RegExp, string][] = [
    [/zone\s+rouge|rode\s+zone/i, "Rouge"],
    [/zone\s+verte|groene\s+zone/i, "Verte"],
    [/zone\s+bleue|blauwe\s+zone/i, "Bleue"],
    [/zone\s+grise|grijze\s+zone/i, "Grise"],
    [/zone\s+jaune|gele\s+zone/i, "Jaune"],
    [/zone\s+[ée]v[ée]nement|evenementenzone/i, "Événement"],
  ];
  for (const [motif, nom] of zones) {
    const m = texte.match(motif);
    if (m) return { valeur: nom, confiance: "haute", contexte: contexteAutour(texte, m.index ?? 0) };
  }
  return champVide<string>();
}

function extraireAutorite(texte: string): Champ<string> {
  const connues: [RegExp, string][] = [
    [/parking\.?\s?brussels|parkeeragentschap|bruxelles\s+stationnement/i, "parking.brussels"],
    [/agence\s+du\s+stationnement/i, "Agence du stationnement"],
    [/soci[ée]t[ée]\s+bruxelloise|bruce/i, "BRUCE"],
    [/fonctionnaire\s+sanctionnateur|sanctionerend\s+ambtenaar/i, "Fonctionnaire sanctionnateur"],
    [/huissier|gerechtsdeurwaarder|deurwaarder/i, "Huissier de justice"],
    [/rammp|recouvrement/i, "Service de recouvrement"],
  ];
  for (const [motif, nom] of connues) {
    const m = texte.match(motif);
    if (m) return { valeur: nom, confiance: "haute", contexte: contexteAutour(texte, m.index ?? 0) };
  }
  return champVide<string>();
}

/** Détermine le stade de la procédure : c'est lui qui dicte l'urgence. */
function extraireTypeDocument(texte: string): Champ<string> {
  // L'ordre est délibéré : du plus grave au plus doux, car un courrier
  // d'huissier mentionne aussi le mot « redevance ».
  const stades: [RegExp, string][] = [
    [/huissier|exploit|saisie|gerechtsdeurwaarder|deurwaarder/i, "courrier_huissier"],
    [/contrainte|titre\s+ex[ée]cutoire|dwangbevel/i, "contrainte"],
    [/mise\s+en\s+demeure|ingebrekestelling|sommatie/i, "mise_en_demeure"],
    [/(second|2e|deuxi[èe]me)\s+rappel|tweede\s+herinnering|tweede\s+aanmaning/i, "deuxieme_rappel"],
    [/rappel|herinnering|aanmaning/i, "premier_rappel"],
    [/redevance|notification|r[ée]tribution|retributie/i, "notification"],
  ];
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
    /(date\s+du\s+constat|constat[ée]?\s+le|constatation|date\s+de\s+l'infraction|vaststelling|datum\s+vaststelling|gecontroleerd\s+op|inbreuk\s+op|datum\s+van\s+het\s+feit)/i,
  );

  const dateEcheance = dateApresLibelle(
    texte,
    dates,
    /([ée]ch[ée]ance|avant\s+le|payer\s+avant|au\s+plus\s+tard|date\s+limite|vervaldatum|uiterlijk|betaal\s+voor|laatste\s+datum|moet\s+betaald|deadline)/i,
  );

  const dateEnvoi = dateApresLibelle(
    texte,
    dates,
    /(date\s+d'envoi|envoy[ée]\s+le|fait\s+[àa]\s+\w+,?\s+le|verzonden\s+op|datum\s+verzending)/i,
  );

  // À défaut de libellé, la première date du document est le plus souvent
  // celle du constat : utile, mais signalée comme peu sûre.
  const constatRetenu: Champ<string> =
    dateConstat.valeur === null && dates.length > 0
      ? { valeur: dates[0].iso, confiance: "faible", contexte: contexteAutour(texte, dates[0].index) }
      : dateConstat;

  return {
    reference: extraireReference(texte),
    montant: extraireMontant(texte),
    dateConstat: constatRetenu,
    heureConstat: extraireHeure(texte),
    dateEcheance,
    dateEnvoi,
    plaque: extrairePlaque(texte),
    commune: extraireCommune(texte),
    lieuConstat: extraireLieuConstat(texte),
    autorite: extraireAutorite(texte),
    typeDocument: extraireTypeDocument(texte),
    communication: extraireCommunication(texte),
    iban: extraireIban(texte),
    zone: extraireZone(texte),
  };
}

/** Champs qui décident de la qualité d'une lecture, pour informer l'utilisateur. */
const CHAMPS_IMPORTANTS = [
  "reference",
  "montant",
  "dateConstat",
  "plaque",
  "commune",
  "typeDocument",
] as const;

/** Part des champs importants effectivement reconnus. */
export function tauxDeReconnaissance(d: DonneesExtraites): number {
  const trouves = CHAMPS_IMPORTANTS.filter((c) => d[c].valeur !== null).length;
  return Math.round((trouves / CHAMPS_IMPORTANTS.length) * 100);
}

/** Champs lus mais peu sûrs : ceux que l'utilisateur doit regarder en premier. */
export function champsAVerifier(d: DonneesExtraites): string[] {
  const libelles: Record<string, string> = {
    reference: "la référence",
    montant: "le montant",
    dateConstat: "la date du constat",
    heureConstat: "l'heure du constat",
    dateEcheance: "la date limite",
    plaque: "la plaque",
    commune: "la commune",
    lieuConstat: "le lieu du constat",
  };
  return Object.entries(libelles)
    .filter(([cle]) => {
      const champ = d[cle as keyof DonneesExtraites];
      return champ.valeur !== null && champ.confiance !== "haute";
    })
    .map(([, libelle]) => libelle);
}
