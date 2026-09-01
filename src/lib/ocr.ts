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

export type ProgressionOCR = { etape: string; pourcentage: number };

export type ResultatLecture = {
  texte: string;
  /** Confiance globale de la reconnaissance, de 0 à 100. */
  confiance: number;
  /** D'où vient le texte : la couche de texte du PDF, ou une reconnaissance d'image. */
  source: "texte-pdf" | "ocr";
  /** Nombre de pages effectivement lues. */
  pages: number;
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

export type Preparation = "binaire" | "gris";

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
  angle: 0 | 90 | 180 | 270 = 0,
): HTMLCanvasElement {
  const pivote = angle === 90 || angle === 270;
  const canvas = document.createElement("canvas");
  canvas.width = pivote ? hauteur : largeur;
  canvas.height = pivote ? largeur : hauteur;

  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Impossible de préparer l'image.");

  contexte.fillStyle = "#ffffff";
  contexte.fillRect(0, 0, canvas.width, canvas.height);
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

type ContenuPdf = { texte: string; pages: number; rendus: Blob[] };

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
    return { texte: texteNatif, pages: nbPages, rendus: [] };
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

  return { texte: texteNatif, pages: nbPages, rendus };
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
  let note = Math.min(lettres, 3000) / 30 + confiance;

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

type Tentative = { texte: string; confiance: number; note: number };

type Reconnaisseur = {
  lire: (image: Blob, psm: number) => Promise<Tentative>;
  fermer: () => Promise<void>;
};

async function ouvrirReconnaisseur(
  surProgression?: (p: ProgressionOCR) => void,
  base = 40,
  amplitude = 55,
): Promise<Reconnaisseur> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(LANGUES, 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        surProgression?.({
          etape: "Reconnaissance du texte…",
          pourcentage: base + Math.round(m.progress * amplitude),
        });
      }
    },
  });

  return {
    lire: async (image, psm) => {
      const { data } = await worker.recognize(
        image,
        { psm } as Parameters<typeof worker.recognize>[1],
      );
      const texte = data.text ?? "";
      const confiance = typeof data.confidence === "number" ? data.confidence : 0;
      return { texte, confiance, note: noterLecture(texte, confiance) };
    },
    fermer: async () => {
      await worker.terminate();
    },
  };
}

/**
 * Lit une photo en essayant plusieurs préparations et plusieurs orientations,
 * et garde la meilleure. On s'arrête dès qu'une lecture est franchement bonne :
 * inutile de faire tourner le téléphone pendant trente secondes.
 */
async function lirePhoto(
  fichier: File,
  reconnaisseur: Reconnaisseur,
  surProgression?: (p: ProgressionOCR) => void,
): Promise<Tentative> {
  const image = await decoderImage(fichier);
  const [largeur, hauteur] = tailleDeTravail(image.width, image.height);

  const essais: { preparation: Preparation; angle: 0 | 90 | 180 | 270; psm: number }[] = [
    { preparation: "binaire", angle: 0, psm: 3 },
    { preparation: "gris", angle: 0, psm: 3 },
    { preparation: "binaire", angle: 0, psm: 6 },
    { preparation: "binaire", angle: 180, psm: 3 },
    { preparation: "binaire", angle: 90, psm: 3 },
    { preparation: "binaire", angle: 270, psm: 3 },
  ];

  let meilleure: Tentative = { texte: "", confiance: 0, note: -1 };

  for (const [i, essai] of essais.entries()) {
    surProgression?.({
      etape: i === 0 ? "Reconnaissance du texte…" : "Nouvelle tentative de lecture…",
      pourcentage: 20 + Math.round((i / essais.length) * 70),
    });

    const canvas = preparer(dessiner(image, largeur, hauteur, essai.angle), essai.preparation);
    const tentative = await reconnaisseur.lire(await canvasVersBlob(canvas), essai.psm);
    if (tentative.note > meilleure.note) meilleure = tentative;

    // Lecture franchement bonne : on ne cherche pas plus loin.
    if (meilleure.confiance >= 75 && richesse(meilleure.texte) >= 400) break;
    // Après les deux premiers essais, une lecture correcte suffit : les
    // rotations ne servent que pour un document manifestement mal orienté.
    if (i >= 1 && richesse(meilleure.texte) >= 250) break;
  }

  return meilleure;
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
      return { texte: pdf.texte, confiance: 100, source: "texte-pdf", pages: pdf.pages };
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
      return {
        texte: textes.join("\n"),
        confiance: Math.round(sommeConfiance / pdf.rendus.length),
        source: "ocr",
        pages: pdf.rendus.length,
      };
    } finally {
      await reconnaisseur.fermer();
    }
  }

  const reconnaisseur = await ouvrirReconnaisseur(surProgression, 20, 70);
  try {
    const meilleure = await lirePhoto(fichier, reconnaisseur, surProgression);
    surProgression?.({ etape: "Document lu", pourcentage: 100 });
    return {
      texte: meilleure.texte,
      confiance: Math.round(meilleure.confiance),
      source: "ocr",
      pages: 1,
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
