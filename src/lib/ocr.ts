/**
 * Lecture d'un document (photo, capture d'écran ou PDF) dans le navigateur.
 *
 * Tout se passe côté client : le document n'est jamais envoyé à un serveur
 * tiers. Trois principes gouvernent ce module.
 *
 * 1. **Ne pas faire d'OCR quand ce n'est pas nécessaire.** Un PDF produit par
 *    une administration contient presque toujours une couche de texte : on la
 *    lit directement, sans reconnaissance de caractères. C'est instantané et
 *    sans aucune erreur de lecture.
 * 2. **Lire tout le document.** Les informations décisives — délai de
 *    contestation, voie de recours, communication structurée — sont souvent au
 *    verso ou en page 2. On lit donc toutes les pages, pas seulement la
 *    première.
 * 3. **Tenter plusieurs lectures et garder la meilleure.** Une photo peut être
 *    sombre, de travers, à l'envers. On essaie plusieurs préparations et
 *    plusieurs orientations, et on retient la lecture la plus riche et la plus
 *    sûre — pas la première venue.
 */

import {
  accentuer,
  estimerInclinaison,
  etirerContraste,
  masqueFlou,
  inverserSiSombre,
  sensDesLignes,
  detecterPage,
  redresserPerspective,
  tailleRedressee,
  type Point,
  lisser,
  normaliserEclairage,
  sauvola,
  versGris,
  versRvba,
} from "./ocr-image";

export type ProgressionOCR = { etape: string; pourcentage: number };

export type ResultatLecture = {
  /** La meilleure lecture, celle qu'on montre à l'utilisateur. */
  texte: string;
  /**
   * Toutes les lectures retenues, la meilleure en tête.
   *
   * Sur une photo, ce sont les différentes tentatives (préparations et
   * orientations) ; sur un PDF, les pages. L'extraction les combine champ par
   * champ : une tentative médiocre dans l'ensemble est parfois la seule à avoir
   * lu la plaque correctement, parce que le reflet tombait ailleurs. Ne garder
   * que la meilleure, c'était jeter cette information.
   */
  textes: string[];
  /** Confiance globale de la reconnaissance, de 0 à 100. */
  confiance: number;
  /** D'où vient le texte : la couche de texte du PDF, ou une reconnaissance d'image. */
  source: "texte-pdf" | "ocr";
  /** Nombre de pages effectivement lues. */
  pages: number;
  /** Ce que la lecture a coûté et croisé, pour l'afficher honnêtement. */
  diagnostic?: {
    /** Durée totale, en millisecondes. */
    duree: number;
    /** Lectures complètes de la page (préparations et angles). */
    lectures: number;
    /** Lignes décisives relues une à une (seconde vérification). */
    relectures: number;
    /** Inclinaison corrigée, en degrés. */
    biais: number;
    /** La feuille a été détourée et remise à plat (photo prise de biais sur une table). */
    recadree?: boolean;
  };
  /**
   * La photo telle qu'elle a été lue (détourée, redressée, en couleur), et les
   * lignes reconnues avec leur position : de quoi montrer, à côté de chaque
   * champ, l'endroit exact du courrier où il a été lu.
   */
  apercu?: HTMLCanvasElement;
  lignes?: { texte: string; x0: number; y0: number; x1: number; y1: number; mots?: { texte: string; x0: number; y0: number; x1: number; y1: number }[] }[];
};

const LANGUES = "fra+nld";

/** Au-delà, la lecture deviendrait trop longue dans un navigateur. */
const PAGES_MAX = 8;

/** En dessous, un texte est jugé trop maigre pour être exploitable. */
const SEUIL_TEXTE_MAIGRE = 180;

/* -------------------------------------------------------------------------- */
/*  Chargement et préparation des images                                      */
/* -------------------------------------------------------------------------- */

/** Charge une image depuis une URL objet, en gérant les erreurs. */
function chargerImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resoudre, rejeter) => {
    const img = new Image();
    img.onload = () => resoudre(img);
    img.onerror = () => rejeter(new Error("Image illisible."));
    img.src = url;
  });
}

/**
 * Décode un fichier image quel que soit son format.
 *
 * `createImageBitmap` couvre bien plus de formats que la balise `<img>` selon
 * les navigateurs (AVIF, HEIC sur Safari, TIFF sur certains). On l'essaie en
 * premier, et on retombe sur le décodage classique.
 */
async function decoderImage(fichier: Blob): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(fichier);
    } catch {
      // Format refusé par cette voie : on tente le décodage classique.
    }
  }
  const url = URL.createObjectURL(fichier);
  try {
    const img = await chargerImage(url);
    if (!img.naturalWidth) throw new Error("Image illisible.");
    return Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasVersBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resoudre, rejeter) =>
    canvas.toBlob(
      (blob) => (blob ? resoudre(blob) : rejeter(new Error("Préparation de l'image impossible."))),
      "image/png",
    ),
  );
}

/** Seuil d'Otsu : sépare le texte du fond, pour un rendu noir sur blanc. */
function seuilOtsu(px: Uint8ClampedArray): number {
  const histo = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) histo[px[i]]++;
  const total = px.length / 4;
  let somme = 0;
  for (let v = 0; v < 256; v++) somme += v * histo[v];

  let sommeB = 0;
  let poidsB = 0;
  let varianceMax = -1;
  let seuil = 127;
  for (let v = 0; v < 256; v++) {
    poidsB += histo[v];
    if (poidsB === 0) continue;
    const poidsF = total - poidsB;
    if (poidsF === 0) break;
    sommeB += v * histo[v];
    const moyenneB = sommeB / poidsB;
    const moyenneF = (somme - sommeB) / poidsF;
    const variance = poidsB * poidsF * (moyenneB - moyenneF) * (moyenneB - moyenneF);
    if (variance > varianceMax) {
      varianceMax = variance;
      seuil = v;
    }
  }
  return seuil;
}

/** Niveaux de gris + étalement du contraste. Base commune aux deux préparations. */
function grisEtContraste(px: Uint8ClampedArray): void {
  for (let i = 0; i < px.length; i += 4) {
    const gris = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = px[i + 1] = px[i + 2] = gris;
  }

  const histo = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) histo[px[i]]++;
  const total = px.length / 4;

  let cumul = 0;
  let bas = 0;
  for (let v = 0; v < 256; v++) {
    cumul += histo[v];
    if (cumul >= total * 0.005) {
      bas = v;
      break;
    }
  }
  cumul = 0;
  let haut = 255;
  for (let v = 255; v >= 0; v--) {
    cumul += histo[v];
    if (cumul >= total * 0.005) {
      haut = v;
      break;
    }
  }

  if (haut <= bas) return;
  const plage = haut - bas;
  const table = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    table[v] = v <= bas ? 0 : v >= haut ? 255 : Math.round(((v - bas) / plage) * 255);
  }
  for (let i = 0; i < px.length; i += 4) {
    px[i] = px[i + 1] = px[i + 2] = table[px[i]];
  }
}

export type Preparation = "binaire" | "gris" | "eclairage" | "encre" | "doux" | "net";

/**
 * Deux préparations, deux usages.
 *
 * `binaire` (Otsu) donne un noir sur blanc franc : imbattable sur un document
 * typé, une capture d'écran ou un scan propre. Mais sur une photo à
 * l'éclairage inégal, elle peut effacer des pans entiers de texte — d'où
 * `gris`, qui se contente d'accentuer le contraste et laisse Tesseract faire
 * son propre seuillage local. On essaie les deux et on garde la meilleure.
 */
function preparer(canvas: HTMLCanvasElement, mode: Preparation): HTMLCanvasElement {
  const contexte = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexte) return canvas;

  const donnees = contexte.getImageData(0, 0, canvas.width, canvas.height);
  const px = donnees.data;

  // `eclairage` : ombres et dégradés corrigés, puis seuil adaptatif (Sauvola).
  // `encre` : même chose sur la composante la plus sombre, pour une encre de
  // couleur ou un fond teinté.
  // `doux` : la photo est d'abord lissée (grain d'une photo prise dans le noir),
  // puis seuillée sur une fenêtre plus large.
  // `net` : une photo floue retrouve ses bords (masque flou large) et reste en
  // niveaux de gris : un seuil local rongerait des traits devenus fins.
  if (mode === "eclairage" || mode === "encre" || mode === "doux" || mode === "net") {
    const gris = inverserSiSombre(versGris(px, canvas.width, canvas.height, mode === "encre" ? "encre" : "luminance"));
    const propre =
      mode === "doux"
        ? sauvola(normaliserEclairage(lisser(lisser(gris))), undefined, 0.28)
        : mode === "net"
          ? etirerContraste(masqueFlou(normaliserEclairage(gris), Math.max(2, Math.round(Math.max(canvas.width, canvas.height) / 530)), 1.5))
          : sauvola(accentuer(normaliserEclairage(gris)));
    versRvba(propre, px);
    contexte.putImageData(donnees, 0, 0);
    return canvas;
  }

  grisEtContraste(px);

  if (mode === "binaire") {
    const seuil = seuilOtsu(px);
    for (let i = 0; i < px.length; i += 4) {
      const net = px[i] < seuil ? 0 : 255;
      px[i] = px[i + 1] = px[i + 2] = net;
    }
  }

  contexte.putImageData(donnees, 0, 0);
  return canvas;
}

/** Dessine une source d'image dans un canvas, à la taille et à l'angle voulus. */
function dessiner(
  source: CanvasImageSource & { width: number; height: number },
  largeur: number,
  hauteur: number,
  angle = 0,
): HTMLCanvasElement {
  // Tout angle : le canvas s'agrandit pour contenir l'image tournée, sans rien couper.
  const rad = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(largeur * cos + hauteur * sin);
  canvas.height = Math.round(largeur * sin + hauteur * cos);

  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Impossible de préparer l'image.");

  contexte.fillStyle = "#ffffff";
  contexte.fillRect(0, 0, canvas.width, canvas.height);
  // Une petite photo agrandie garde des bords doux plutôt que des escaliers.
  contexte.imageSmoothingEnabled = true;
  contexte.imageSmoothingQuality = "high";
  contexte.translate(canvas.width / 2, canvas.height / 2);
  contexte.rotate((angle * Math.PI) / 180);
  contexte.drawImage(source, -largeur / 2, -hauteur / 2, largeur, hauteur);

  return canvas;
}

/** Taille de travail : assez grande pour que Tesseract lise, pas au point de le noyer. */
function tailleDeTravail(largeur: number, hauteur: number): [number, number] {
  const plusLong = Math.max(largeur, hauteur);
  const facteur = plusLong > 2600 ? 2600 / plusLong : plusLong < 1600 ? 1600 / plusLong : 1;
  return [Math.round(largeur * facteur), Math.round(hauteur * facteur)];
}

/* -------------------------------------------------------------------------- */
/*  PDF                                                                       */
/* -------------------------------------------------------------------------- */

async function chargerPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs;
}

type ContenuPdf = { texte: string; parPage: string[]; pages: number; rendus: Blob[] };

/**
 * Lit un PDF : d'abord sa couche de texte, et seulement à défaut ses images.
 *
 * Un courrier de redevance envoyé au format PDF porte son texte en clair. Le
 * lire directement, c'est zéro erreur de reconnaissance sur la référence, le
 * montant et les dates — exactement les champs qu'on ne peut pas se permettre
 * de rater.
 */
async function lirePdf(
  fichier: File,
  surProgression?: (p: ProgressionOCR) => void,
): Promise<ContenuPdf> {
  const pdfjs = await chargerPdfjs();
  const donnees = new Uint8Array(await fichier.arrayBuffer());
  const document = await pdfjs.getDocument({ data: donnees }).promise;
  const nbPages = Math.min(document.numPages, PAGES_MAX);

  // 1) La couche de texte, page par page.
  const morceaux: string[] = [];
  for (let n = 1; n <= nbPages; n++) {
    surProgression?.({
      etape: `Lecture du texte du PDF (page ${n}/${nbPages})…`,
      pourcentage: 5 + Math.round((n / nbPages) * 25),
    });
    const page = await document.getPage(n);
    const contenu = await page.getTextContent();
    const ligne = contenu.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    morceaux.push(ligne);
  }

  const texteNatif = morceaux.join("\n").replace(/[ \t]{2,}/g, " ").trim();
  if (texteNatif.length >= SEUIL_TEXTE_MAIGRE) {
    return { texte: texteNatif, parPage: morceaux, pages: nbPages, rendus: [] };
  }

  // 2) PDF scanné (aucune couche de texte utile) : on rend les pages en image.
  const rendus: Blob[] = [];
  for (let n = 1; n <= nbPages; n++) {
    surProgression?.({
      etape: `Préparation de la page ${n}/${nbPages}…`,
      pourcentage: 30 + Math.round((n / nbPages) * 10),
    });
    const page = await document.getPage(n);
    const viewport = page.getViewport({ scale: 3 });
    const canvas = window.document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const contexte = canvas.getContext("2d");
    if (!contexte) throw new Error("Impossible de préparer l'image du PDF.");
    await page.render({ canvas, canvasContext: contexte, viewport }).promise;
    rendus.push(await canvasVersBlob(preparer(canvas, "binaire")));
  }

  return { texte: texteNatif, parPage: morceaux, pages: nbPages, rendus };
}

/* -------------------------------------------------------------------------- */
/*  Reconnaissance                                                            */
/* -------------------------------------------------------------------------- */

/** Nombre de lettres du texte : juge d'une lecture riche. */
function richesse(texte: string): number {
  return (texte.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
}

/**
 * Note d'une lecture, pour choisir entre plusieurs tentatives.
 *
 * On ne se fie pas à la seule confiance de Tesseract : elle reste haute sur un
 * texte court et propre mais incomplet. On récompense donc aussi la quantité de
 * texte reconnue, et surtout la présence des motifs qui nous intéressent
 * vraiment — une plaque, un montant, une date, une référence.
 */
function noterLecture(texte: string, confiance: number): number {
  const lettres = richesse(texte);
  // Tesseract annonce parfois 95 % de confiance sur une page qu'il n'a pas lue
  // du tout : la confiance ne compte qu'à proportion du texte reconnu.
  let note = Math.min(lettres, 3000) / 30 + confiance * Math.min(1, lettres / 150);

  const indices = [
    /\b[1-9][\s\-.]?[A-Z]{3}[\s\-.]?\d{3}\b/, // plaque belge
    /\d{1,3}[.,]\d{2}\s*(?:€|EUR)/i, // montant
    /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/, // date
    /(r[ée]f[ée]rence|dossier|kenmerk)/i,
    /\+{3}\d{3}\/\d{4}\/\d{5}\+{3}/, // communication structurée
  ];
  for (const motif of indices) if (motif.test(texte)) note += 25;

  return note;
}

type Boite = { texte: string; x0: number; y0: number; x1: number; y1: number };
type Ligne = Boite & { mots?: Boite[] };
type Tentative = {
  texte: string;
  confiance: number;
  note: number;
  lignes?: Ligne[];
  image?: HTMLCanvasElement;
  /** Angle et image source de la tentative : de quoi redessiner la photo en couleur, même cadrage. */
  angle?: number;
  source?: CanvasImageSource & { width: number; height: number };
};

/** Les motifs décisifs présents dans une lecture : plaque, montant, date, référence, communication. */
const INDICES = [
  /\b[1-9][\s\-.]?[A-Z]{3}[\s\-.]?\d{3}\b/,
  /\d{1,3}[.,]\d{2}\s*(?:€|EUR)/i,
  /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/,
  /(r[ée]f[ée]rence|dossier|kenmerk)/i,
  /\d{3}\s*\/\s*\d{4}\s*\/\s*\d{5}/,
];
const compterIndices = (texte: string) => INDICES.filter((m) => m.test(texte)).length;

/**
 * Part des mots courants (français, néerlandais) dans une lecture. Un texte lu
 * à l'envers donne un charabia sans « de », « la », « van » ; un texte flou mais
 * dans le bon sens en garde toujours quelques-uns.
 */
function partMotsCourants(texte: string): number {
  const mots = texte.match(/[A-Za-zÀ-ÿ']+/g) ?? [];
  if (mots.length === 0) return 0;
  const courants = mots.filter((m) =>
    /^(de|la|le|les|du|des|et|en|un|une|vous|votre|pour|par|sur|au|est|dans|que|qui|ce|ne|pas|van|het|een|op|te|voor|uw|met|is|niet|dat)$/.test(m),
  ).length;
  return courants / mots.length;
}

type Reconnaisseur = {
  lire: (image: Blob, psm: number, options?: { lignes?: boolean; caracteres?: string }) => Promise<Tentative>;
  fermer: () => Promise<void>;
};

/** Les lignes reconnues, avec leur position, quelle que soit la version de tesseract.js. */
function extraireLignes(data: unknown): Ligne[] {
  type BoiteBrute = { text?: string; bbox?: Omit<Boite, "texte"> };
  const lignes: Ligne[] = [];
  const blocs = (data as { blocks?: { paragraphs?: { lines?: (BoiteBrute & { words?: BoiteBrute[] })[] }[] }[] }).blocks ?? [];
  for (const b of blocs)
    for (const p of b.paragraphs ?? [])
      for (const l of p.lines ?? [])
        if (l.text && l.bbox)
          lignes.push({
            texte: l.text,
            ...l.bbox,
            mots: (l.words ?? []).filter((m) => m.text && m.bbox).map((m) => ({ texte: m.text as string, ...(m.bbox as Omit<Boite, "texte">) })),
          });
  const directes = (data as { lines?: { text?: string; bbox?: Ligne }[] }).lines ?? [];
  if (lignes.length === 0)
    for (const l of directes)
      if (l.text && l.bbox) lignes.push({ texte: l.text, x0: l.bbox.x0, y0: l.bbox.y0, x1: l.bbox.x1, y1: l.bbox.y1 });
  return lignes;
}

/** La progression va au lecteur en cours : le moteur peut avoir été préparé avant lui. */
let suiviCourant: ((progression: number) => void) | null = null;

type MoteurOcr = Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>>;
let moteurChaud: Promise<MoteurOcr> | null = null;

async function creerMoteur(): Promise<MoteurOcr> {
  const { createWorker } = await import("tesseract.js");
  return createWorker(LANGUES, 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") suiviCourant?.(m.progress);
    },
  });
}

/**
 * Prépare le moteur de lecture à l'avance.
 *
 * Le charger prend quelques secondes (le moteur et ses deux langues). On le
 * lance dès que la personne montre qu'elle va déposer un courrier — elle
 * touche la zone de dépôt, ouvre le sélecteur de fichier — et pas avant : un
 * simple visiteur de la page d'accueil ne télécharge rien. Le temps de choisir
 * la photo, le moteur est prêt, et la lecture commence tout de suite.
 */
export function prechaufferOcr(): void {
  if (typeof window === "undefined" || moteurChaud) return;
  moteurChaud = creerMoteur();
  // Un échec (réseau coupé) ne doit pas rester en mémoire : on réessaiera.
  moteurChaud.catch(() => {
    moteurChaud = null;
  });
}

async function ouvrirReconnaisseur(
  surProgression?: (p: ProgressionOCR) => void,
  base = 40,
  amplitude = 55,
): Promise<Reconnaisseur> {
  const prepare = moteurChaud;
  moteurChaud = null;
  const worker = await (prepare ?? creerMoteur()).catch(() => creerMoteur());
  suiviCourant = (progression) =>
    surProgression?.({
      etape: "Reconnaissance du texte…",
      pourcentage: base + Math.round(progression * amplitude),
    });

  return {
    lire: async (image, psm, options = {}) => {
      // Une liste de caractères permis : un champ purement numérique ne peut
      // plus être lu « O » au lieu de « 0 ».
      await worker.setParameters({
        tessedit_pageseg_mode: String(psm),
        tessedit_char_whitelist: options.caracteres ?? "",
      } as Parameters<typeof worker.setParameters>[0]);
      const { data } = await worker.recognize(
        image,
        {} as Parameters<typeof worker.recognize>[1],
        (options.lignes ? { text: true, blocks: true } : { text: true }) as Parameters<typeof worker.recognize>[2],
      );
      const texte = data.text ?? "";
      const confiance = typeof data.confidence === "number" ? data.confidence : 0;
      return {
        texte,
        confiance,
        note: noterLecture(texte, confiance),
        lignes: options.lignes ? extraireLignes(data) : undefined,
      };
    },
    fermer: async () => {
      suiviCourant = null;
      await worker.terminate();
    },
  };
}

/**
 * Estime le biais d'une photo (quelques degrés) sur une copie réduite :
 * éclairage corrigé, seuil adaptatif, puis profils de projection.
 */
function examinerPage(image: CanvasImageSource & { width: number; height: number }): { biais: number; sens: "horizontal" | "vertical" } {
  const echelle = Math.min(1, 900 / Math.max(image.width, image.height));
  const w = Math.max(1, Math.round(image.width * echelle));
  const h = Math.max(1, Math.round(image.height * echelle));
  const canvas = dessiner(image, w, h, 0);
  const contexte = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexte) return { biais: 0, sens: "horizontal" };
  const px = contexte.getImageData(0, 0, canvas.width, canvas.height).data;
  const binaire = sauvola(normaliserEclairage(inverserSiSombre(versGris(px, canvas.width, canvas.height))));
  return { biais: estimerInclinaison(binaire), sens: sensDesLignes(binaire) };
}

/**
 * Lit une photo en essayant plusieurs préparations et plusieurs orientations,
 * et garde la meilleure. On s'arrête dès qu'une lecture est franchement bonne :
 * inutile de faire tourner le téléphone pendant trente secondes.
 *
 * L'ordre compte : la préparation « éclairage » (ombres corrigées, seuil
 * adaptatif, image redressée) passe en premier, parce qu'elle réussit sur la
 * plupart des photos réelles ; les autres ne servent qu'en renfort.
 */
/**
 * Détoure la feuille et la remet à plat, quand la photo montre une lettre
 * posée de biais sur une table. `null` si la feuille remplit déjà la photo ou
 * si ses bords ne sont pas trouvés avec certitude : on ne recadre jamais au
 * hasard.
 */
function recadrerPage(image: CanvasImageSource & { width: number; height: number }): HTMLCanvasElement | null {
  const reduction = Math.min(1, 420 / Math.max(image.width, image.height));
  const petit = dessiner(image, Math.max(1, Math.round(image.width * reduction)), Math.max(1, Math.round(image.height * reduction)));
  const ctxPetit = petit.getContext("2d", { willReadFrequently: true });
  if (!ctxPetit) return null;
  const coinsPetits = detecterPage(versGris(ctxPetit.getImageData(0, 0, petit.width, petit.height).data, petit.width, petit.height));
  if (!coinsPetits) return null;

  // Travail en pleine définition, plafonnée : une photo de 12 Mpx n'apporte rien de plus.
  const plafond = Math.min(1, 3000 / Math.max(image.width, image.height));
  const grand = dessiner(image, Math.round(image.width * plafond), Math.round(image.height * plafond));
  const ctxGrand = grand.getContext("2d", { willReadFrequently: true });
  if (!ctxGrand) return null;
  const echelle = grand.width / petit.width;
  const coins = coinsPetits.map(([x, y]) => [x * echelle, y * echelle] as Point);
  const [W, H] = tailleRedressee(coins);
  if (W < 200 || H < 200) return null;
  const plat = redresserPerspective(ctxGrand.getImageData(0, 0, grand.width, grand.height).data, grand.width, grand.height, coins, W, H);
  const sortie = document.createElement("canvas");
  sortie.width = W;
  sortie.height = H;
  const ctx = sortie.getContext("2d");
  if (!ctx) return null;
  const donnees = ctx.createImageData(W, H);
  donnees.data.set(plat);
  ctx.putImageData(donnees, 0, 0);
  return sortie;
}

async function lirePhoto(
  fichier: File,
  reconnaisseur: Reconnaisseur,
  surProgression?: (p: ProgressionOCR) => void,
): Promise<{ meilleure: Tentative; toutes: Tentative[]; biais: number; recadree: boolean }> {
  const brute = await decoderImage(fichier);
  // 0. Une lettre photographiée de biais sur une table : on la détoure et on
  //    la remet à plat avant toute lecture.
  const detouree = recadrerPage(brute);
  const image = detouree ?? brute;
  const [largeur, hauteur] = tailleDeTravail(image.width, image.height);
  // Lignes qui descendent vers la droite (biais positif) : on tourne d'autant
  // dans l'autre sens pour les remettre à plat.
  const page = examinerPage(image);
  const redresser = -page.biais;

  let meilleure: Tentative = { texte: "", confiance: 0, note: -1 };
  const toutes: Tentative[] = [];
  let passes = 0;

  const essayer = async (
    preparation: Preparation,
    angle: number,
    psm = 3,
    source: CanvasImageSource & { width: number; height: number } = image,
  ): Promise<Tentative> => {
    surProgression?.({
      etape: passes === 0 ? "Lecture du courrier…" : "Lecture sous un autre angle…",
      pourcentage: Math.min(74, 15 + passes * 12),
    });
    passes++;
    const [lw, lh] = source === image ? [largeur, hauteur] : tailleDeTravail(source.width, source.height);
    const canvas = preparer(dessiner(source, lw, lh, angle), preparation);
    const tentative = await reconnaisseur.lire(await canvasVersBlob(canvas), psm, { lignes: true });
    tentative.image = canvas;
    tentative.angle = angle;
    tentative.source = source;
    // Une tentative quasi vide n'apporte rien à la fusion et ne ferait que
    // diluer le résultat : on ne garde que celles qui ont lu quelque chose.
    if (richesse(tentative.texte) >= 40 && tentative.confiance >= 35) toutes.push(tentative);
    if (tentative.note > meilleure.note) meilleure = tentative;
    return tentative;
  };

  /** Lecture complète et sûre : rien à gagner à insister. */
  const excellente = (t: Tentative) => t.confiance >= 78 && richesse(t.texte) >= 300 && compterIndices(t.texte) >= 4;

  // 1. La préparation qui réussit sur la plupart des photos : ombres
  //    corrigées, seuil adaptatif, image redressée. Une page couchée (lignes
  //    verticales) est d'abord remise debout d'un quart de tour.
  const couchee = page.sens === "vertical";
  let orientation = couchee ? 90 : 0;
  const premiere = await essayer("eclairage", couchee ? 90 : redresser);

  // 2. Une lecture peu sûre peut venir d'une photo à l'envers : un texte
  //    retourné « se lit » en charabia — beaucoup de lettres, peu de confiance,
  //    aucun mot courant. On essaie alors le demi-tour avant toute autre
  //    préparation ; une photo simplement floue, elle, garde ses « de » et ses
  //    « la » et passe directement aux renforts.
  const peutEtreRetournee = richesse(premiere.texte) < 80 || (premiere.confiance < 62 && partMotsCourants(premiere.texte) < 0.06);
  if (peutEtreRetournee) {
    const autre = couchee ? 270 : 180;
    const t = await essayer("eclairage", autre === 180 ? 180 + redresser : autre);
    // La note tient compte du texte reconnu et des motifs trouvés : si le
    // demi-tour l'emporte, c'est le bon sens.
    if (t === meilleure) {
      orientation = autre;
      // Le charabia de la première lecture ne doit pas polluer la fusion.
      const index = toutes.indexOf(premiere);
      if (index >= 0) toutes.splice(index, 1);
    }
  }

  // 3. Dans le bon sens, des préparations de renfort tant que la lecture n'est
  //    pas complète : photo floue, photo bruitée, encre de couleur, document
  //    déjà net.
  const angleFinal = orientation === 0 || orientation === 180 ? orientation + redresser : orientation;
  for (const preparation of ["net", "doux", "encre", "gris", "binaire"] as const) {
    if (excellente(meilleure) || passes >= 6) break;
    await essayer(preparation, angleFinal, preparation === "encre" ? 6 : 3);
  }

  // 4. Filet de sécurité du détourage : si la page remise à plat ne se lit pas
  //    parfaitement, la photo d'origine a aussi sa chance.
  if (detouree && !excellente(meilleure)) {
    const origine = examinerPage(brute);
    await essayer("eclairage", origine.sens === "vertical" ? 90 : -origine.biais, 3, brute);
  }

  // La meilleure d'abord : c'est l'arbitre à égalité de confiance côté
  // extraction, et c'est elle qu'on affiche.
  return {
    meilleure,
    toutes: [meilleure, ...toutes.filter((t) => t !== meilleure)],
    biais: -redresser,
    recadree: detouree !== null && meilleure.source === detouree,
  };
}

/** Les lignes qui portent un champ décisif, et ce qu'on peut y lire. */
const LIGNES_CRITIQUES: { motif: RegExp; caracteres?: string }[] = [
  { motif: /\+\s*\+|communication|mededeling|\d{3}\s*\/\s*\d{4}\s*\/\s*\d{5}/i, caracteres: "0123456789+/ " },
  { motif: /\b\d\s*[-.]?\s*[A-Z]{3}\s*[-.]?\s*\d{3}\b|plaque|immatriculation|nummerplaat|kenteken/i, caracteres: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- " },
  { motif: /€|EUR\b|montant|bedrag|total|à payer|te betalen/i },
  { motif: /\b\d{1,2}\s*[\/.\-]\s*\d{1,2}\s*[\/.\-]\s*\d{2,4}\b|date|datum|échéance|vervaldag/i },
  { motif: /r[ée]f[ée]rence|dossier|kenmerk|n[°o]\s*:/i },
  { motif: /BE\d{2}\s?\d{4}/i, caracteres: "BE0123456789 " },
];

/**
 * La seconde vérification : chaque ligne qui porte un champ décisif est
 * découpée, agrandie, et relue seule (une ligne, rien d'autre autour). Pour
 * les champs à alphabet fermé — communication structurée, plaque, IBAN — une
 * lecture supplémentaire n'autorise que les caractères possibles. Ces
 * relectures rejoignent les autres lectures : la fusion fait voter les
 * valeurs, et celles que plusieurs lectures confirment gagnent.
 */
async function relireLignesCritiques(
  meilleure: Tentative,
  reconnaisseur: Reconnaisseur,
  surProgression?: (p: ProgressionOCR) => void,
): Promise<string[]> {
  const image = meilleure.image;
  if (!image || !meilleure.lignes?.length) return [];
  const cibles: { ligne: Ligne; caracteres?: string }[] = [];
  for (const regle of LIGNES_CRITIQUES) {
    const ligne = meilleure.lignes.find((l) => regle.motif.test(l.texte) && !cibles.some((c) => c.ligne === l));
    if (ligne) cibles.push({ ligne, caracteres: regle.caracteres });
  }

  const relectures: string[] = [];
  for (const [i, { ligne, caracteres }] of cibles.slice(0, 6).entries()) {
    surProgression?.({ etape: "Vérification des chiffres…", pourcentage: 78 + Math.round((i / cibles.length) * 18) });
    const marge = Math.round((ligne.y1 - ligne.y0) * 0.35);
    const x0 = Math.max(0, ligne.x0 - marge);
    const y0 = Math.max(0, ligne.y0 - marge);
    const w = Math.min(image.width - x0, ligne.x1 - ligne.x0 + marge * 2);
    const h = Math.min(image.height - y0, ligne.y1 - ligne.y0 + marge * 2);
    if (w < 10 || h < 6) continue;
    // Agrandie pour qu'un caractère fasse une trentaine de pixels de haut.
    const facteur = Math.min(4, Math.max(1.5, 36 / Math.max(1, ligne.y1 - ligne.y0)));
    const zoom = document.createElement("canvas");
    zoom.width = Math.round(w * facteur);
    zoom.height = Math.round(h * facteur);
    const ctx = zoom.getContext("2d");
    if (!ctx) continue;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, x0, y0, w, h, 0, 0, zoom.width, zoom.height);
    const blob = await canvasVersBlob(zoom);
    const libre = await reconnaisseur.lire(blob, 7);
    if (libre.texte.trim()) relectures.push(libre.texte.trim());
    if (caracteres) {
      const fermee = await reconnaisseur.lire(blob, 7, { caracteres });
      if (fermee.texte.trim()) relectures.push(fermee.texte.trim());
    }
  }
  return relectures;
}

/**
 * L'en-tête relu en texte épars. Le haut d'une lettre mêle des blocs isolés —
 * logo, expéditeur, « Bruxelles, le 05/11/2026 » calé à droite, destinataire —
 * que l'analyse de mise en page saute parfois, surtout dans une ombre. Le mode
 * « texte épars » de Tesseract cherche chaque bloc pour lui-même. Un tiers de
 * page seulement : la relecture est courte.
 */
async function relireEntete(meilleure: Tentative, reconnaisseur: Reconnaisseur): Promise<string | null> {
  const image = meilleure.image;
  if (!image) return null;
  const haut = document.createElement("canvas");
  haut.width = image.width;
  haut.height = Math.round(image.height * 0.34);
  const ctx = haut.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, image.width, haut.height, 0, 0, haut.width, haut.height);
  const lecture = await reconnaisseur.lire(await canvasVersBlob(haut), 11);
  return lecture.texte.trim() || null;
}

/** La photo telle que la meilleure lecture l'a vue (cadrage, angle), mais en couleur. */
function apercuCouleur(t: Tentative): HTMLCanvasElement | undefined {
  if (!t.source || !t.image || t.angle === undefined) return undefined;
  const [lw, lh] = tailleDeTravail(t.source.width, t.source.height);
  const canvas = dessiner(t.source, lw, lh, t.angle);
  // Même géométrie que l'image lue : les positions des lignes s'y appliquent telles quelles.
  return canvas.width === t.image.width && canvas.height === t.image.height ? canvas : undefined;
}

export type ChampPreuve =
  | "reference"
  | "montant"
  | "dateConstat"
  | "heureConstat"
  | "dateEnvoi"
  | "dateEcheance"
  | "plaque"
  | "communication"
  | "iban"
  | "commune";

const alnum = (s: string) => s.toUpperCase().replace(/[^0-9A-Z]/g, "");

/** Les formes sous lesquelles une valeur extraite apparaît sur le courrier. */
function formesImprimees(champ: ChampPreuve, valeur: string): string[] {
  if (/^date/.test(champ)) {
    const m = valeur.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return [alnum(valeur)];
    const [, a, mo, j] = m;
    return [`${j}${mo}${a}`, `${j}${mo}${a.slice(2)}`, `${Number(j)}${mo}${a}`];
  }
  if (champ === "montant") return [alnum(valeur.replace(/[.,]00$/, "")), alnum(valeur)];
  if (champ === "heureConstat") return [alnum(valeur)];
  return [alnum(valeur)];
}

/** Plus longue sous-chaîne commune : la part de la valeur retrouvée telle quelle dans la ligne. */
function recouvrement(valeur: string, ligne: string): number {
  if (!valeur) return 0;
  let meilleur = 0;
  const prec = new Uint16Array(ligne.length + 1);
  for (let i = 1; i <= valeur.length; i++) {
    let diag = 0;
    for (let j = 1; j <= ligne.length; j++) {
      const garde = prec[j];
      prec[j] = valeur[i - 1] === ligne[j - 1] ? diag + 1 : 0;
      if (prec[j] > meilleur) meilleur = prec[j];
      diag = garde;
    }
  }
  return meilleur / valeur.length;
}

/** La suite de mots de la ligne qui ressemble le plus à la valeur. */
function motsDeLaValeur(l: Ligne, forme: string): Boite | null {
  const mots = l.mots ?? [];
  let meilleur: { score: number; i: number; j: number } | null = null;
  for (let i = 0; i < mots.length; i++) {
    let suite = "";
    for (let j = i; j < Math.min(mots.length, i + 6); j++) {
      suite += alnum(mots[j].texte);
      if (!suite) continue;
      // Part de la valeur retrouvée, rapportée à la plus longue des deux :
      // un mot de trop ou de moins fait baisser le score.
      const score = (recouvrement(forme, suite) * forme.length) / Math.max(forme.length, suite.length);
      if (!meilleur || score > meilleur.score) meilleur = { score, i, j };
    }
  }
  if (!meilleur || meilleur.score < 0.5) return null;
  const choisis = mots.slice(meilleur.i, meilleur.j + 1);
  return {
    texte: choisis.map((m) => m.texte).join(" "),
    x0: Math.min(...choisis.map((m) => m.x0)),
    y0: Math.min(...choisis.map((m) => m.y0)),
    x1: Math.max(...choisis.map((m) => m.x1)),
    y1: Math.max(...choisis.map((m) => m.y1)),
  };
}

/**
 * Pour chaque champ, l'extrait de la photo où sa valeur a été lue : la ligne,
 * en couleur, avec un peu de marge. Affiché à côté du champ, il permet de
 * confirmer d'un coup d'œil, sans chercher sur la feuille.
 */
export function decouperPreuves(
  lecture: ResultatLecture,
  valeurs: Partial<Record<ChampPreuve, string | null>>,
): Partial<Record<ChampPreuve, string>> {
  const { apercu, lignes } = lecture;
  if (!apercu || !lignes?.length) return {};
  const lignesNorm = lignes.map((l) => ({ l, n: alnum(l.texte) }));
  const preuves: Partial<Record<ChampPreuve, string>> = {};
  for (const [champ, valeur] of Object.entries(valeurs) as [ChampPreuve, string | null][]) {
    if (!valeur) continue;
    // La forme la plus précise d'abord (« 3700 » avant « 37 ») : une ligne qui
    // la contient en entier l'emporte, sans chercher plus loin.
    let retenue: { l: Ligne; score: number } | null = null;
    const formes = formesImprimees(champ, valeur).filter((f) => f.length >= 2).sort((x, y) => y.length - x.length);
    for (const forme of formes) {
      for (const { l, n } of lignesNorm) {
        const score = recouvrement(forme, n);
        if (score >= 0.7 && (!retenue || score > retenue.score)) retenue = { l, score };
      }
      if (retenue && retenue.score > 0.999) break;
    }
    if (!retenue) continue;
    // Dans la ligne, les mots qui portent la valeur : on découpe la valeur
    // elle-même, assez grande pour se lire, pas toute la ligne du tableau.
    const zone = motsDeLaValeur(retenue.l, formes[0]) ?? retenue.l;
    const marge = Math.round((zone.y1 - zone.y0) * 0.5);
    const x0 = Math.max(0, zone.x0 - marge);
    const y0 = Math.max(0, zone.y0 - marge);
    const w = Math.min(apercu.width - x0, zone.x1 - zone.x0 + marge * 2);
    const h = Math.min(apercu.height - y0, zone.y1 - zone.y0 + marge * 2);
    if (w < 8 || h < 6) continue;
    const echelle = Math.min(1, 900 / w);
    const extrait = document.createElement("canvas");
    extrait.width = Math.round(w * echelle);
    extrait.height = Math.round(h * echelle);
    const ctx = extrait.getContext("2d");
    if (!ctx) continue;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(apercu, x0, y0, w, h, 0, 0, extrait.width, extrait.height);
    preuves[champ] = extrait.toDataURL("image/jpeg", 0.85);
  }
  return preuves;
}

/* -------------------------------------------------------------------------- */

/**
 * Extrait le texte d'un fichier, à passer ensuite à `extraireDonnees`.
 */
export async function lireDocument(
  fichier: File,
  surProgression?: (p: ProgressionOCR) => void,
): Promise<ResultatLecture> {
  const estPdf =
    fichier.type === "application/pdf" || fichier.name.toLowerCase().endsWith(".pdf");

  surProgression?.({
    etape: estPdf ? "Ouverture du PDF…" : "Préparation de l'image…",
    pourcentage: 3,
  });

  if (estPdf) {
    const pdf = await lirePdf(fichier, surProgression);

    // La couche de texte suffit : lecture parfaite, aucune reconnaissance.
    if (pdf.rendus.length === 0) {
      surProgression?.({ etape: "Document lu", pourcentage: 100 });
      return {
        texte: pdf.texte,
        textes: [pdf.texte, ...pdf.parPage],
        confiance: 100,
        source: "texte-pdf",
        pages: pdf.pages,
      };
    }

    // PDF scanné : reconnaissance page par page.
    const reconnaisseur = await ouvrirReconnaisseur(surProgression, 40, 55);
    try {
      const textes: string[] = [];
      let sommeConfiance = 0;
      for (const [i, rendu] of pdf.rendus.entries()) {
        surProgression?.({
          etape: `Reconnaissance de la page ${i + 1}/${pdf.rendus.length}…`,
          pourcentage: 40 + Math.round((i / pdf.rendus.length) * 55),
        });
        const t = await reconnaisseur.lire(rendu, 3);
        textes.push(t.texte);
        sommeConfiance += t.confiance;
      }
      surProgression?.({ etape: "Document lu", pourcentage: 100 });
      const complet = textes.join("\n");
      return {
        texte: complet,
        textes: [complet, ...textes],
        confiance: Math.round(sommeConfiance / pdf.rendus.length),
        source: "ocr",
        pages: pdf.rendus.length,
      };
    } finally {
      await reconnaisseur.fermer();
    }
  }

  const debut = performance.now();
  const reconnaisseur = await ouvrirReconnaisseur(surProgression, 20, 70);
  try {
    const { meilleure, toutes, biais, recadree } = await lirePhoto(fichier, reconnaisseur, surProgression);
    const relectures = await relireLignesCritiques(meilleure, reconnaisseur, surProgression).catch((): string[] => []);
    const entete = await relireEntete(meilleure, reconnaisseur).catch(() => null);
    if (entete) relectures.push(entete);
    surProgression?.({ etape: "Document lu", pourcentage: 100 });
    return {
      texte: meilleure.texte,
      textes: [...toutes.map((t) => t.texte), ...relectures],
      confiance: Math.round(meilleure.confiance),
      source: "ocr",
      pages: 1,
      diagnostic: {
        duree: Math.round(performance.now() - debut),
        lectures: toutes.length,
        relectures: relectures.length,
        biais,
        recadree,
      },
      apercu: apercuCouleur(meilleure),
      lignes: meilleure.lignes,
    };
  } finally {
    await reconnaisseur.fermer();
  }
}

/**
 * Formats acceptés au dépôt.
 *
 * `image/*` est volontairement large : un téléphone peut produire du HEIC, de
 * l'AVIF ou du TIFF, et `createImageBitmap` en décode bien plus que la balise
 * `<img>`. Un format qu'aucune voie ne sait décoder produit un message clair
 * plutôt qu'un refus silencieux au moment de choisir le fichier.
 */
export const FORMATS_ACCEPTES = "image/*,application/pdf";
export const TAILLE_MAX_OCTETS = 20 * 1024 * 1024;
