/**
 * Lecture d'un document (photo ou PDF) dans le navigateur.
 *
 * Tout se passe côté client : le document n'est jamais envoyé à un serveur
 * tiers. La chaîne de préparation est conçue pour une reconnaissance la plus
 * solide possible, quel que soit le document :
 *  1. redimensionnement vers une zone de travail confortable ;
 *  2. niveaux de gris + étalement du contraste (5-95 %) ;
 *  3. binarisation d'Otsu : texte net noir sur blanc (captures d'écran, scans) ;
 *  4. si le texte lu paraît trop court, nouvelle tentative à 180° et en PSM
 *     « bloc uniforme » — on garde la lecture la plus riche.
 */

export type ProgressionOCR = { etape: string; pourcentage: number };

const LANGUES = "fra+nld";

/** Charge une image depuis une URL objet, en gérant les erreurs. */
function chargerImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resoudre, rejeter) => {
    const img = new Image();
    img.onload = () => resoudre(img);
    img.onerror = () => rejeter(new Error("Image illisible."));
    img.src = url;
  });
}

/** Charge une image en mémoire pour pouvoir la redessiner (rotation…). */
async function blobVersImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await chargerImage(url);
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

/**
 * Préparation complète : niveaux de gris, contraste, puis noir et blanc
 * net. Un texte typé ressort immédiatement, quel que soit le capteur.
 */
function appliquerAmeliorations(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const contexte = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexte) return canvas;

  const donnees = contexte.getImageData(0, 0, canvas.width, canvas.height);
  const px = donnees.data;

  // Niveaux de gris (luminosité perceptuelle).
  for (let i = 0; i < px.length; i += 4) {
    const gris = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = px[i + 1] = px[i + 2] = gris;
  }

  // Étalement du contraste (percentiles 0,5 %-99,5 %), puis binarisation Otsu.
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

  let table: Uint8ClampedArray | null = null;
  if (haut > bas) {
    table = new Uint8ClampedArray(256);
    const plage = haut - bas;
    for (let v = 0; v < 256; v++) {
      table[v] = v <= bas ? 0 : v >= haut ? 255 : Math.round(((v - bas) / plage) * 255);
    }
  }

  const seuil = seuilOtsu(px);
  for (let i = 0; i < px.length; i += 4) {
    const valeur = table ? table[px[i]] : px[i];
    const net = valeur < seuil ? 0 : 255;
    px[i] = px[i + 1] = px[i + 2] = net;
  }

  contexte.putImageData(donnees, 0, 0);
  return canvas;
}

/**
 * Prépare une photo ou une capture d'écran : redimensionne puis améliore le
 * contraste et binarise. Renvoie un PNG net, prêt pour l'OCR.
 */
async function preparerPhoto(fichier: File): Promise<Blob> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await chargerImage(url);
    if (!img.naturalWidth) throw new Error("Image illisible.");

    let largeur = img.naturalWidth;
    let hauteur = img.naturalHeight;
    const plusLong = Math.max(largeur, hauteur);
    if (plusLong > 2600) {
      const facteur = 2600 / plusLong;
      largeur = Math.round(largeur * facteur);
      hauteur = Math.round(hauteur * facteur);
    } else if (plusLong < 1500) {
      const facteur = 1500 / plusLong;
      largeur = Math.round(largeur * facteur);
      hauteur = Math.round(hauteur * facteur);
    }

    const canvas = document.createElement("canvas");
    canvas.width = largeur;
    canvas.height = hauteur;
    const contexte = canvas.getContext("2d");
    if (!contexte) throw new Error("Impossible de préparer l'image.");

    contexte.fillStyle = "#ffffff";
    contexte.fillRect(0, 0, largeur, hauteur);
    contexte.drawImage(img, 0, 0, largeur, hauteur);

    return canvasVersBlob(appliquerAmeliorations(canvas));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Rend la première page d'un PDF dans un canvas amélioré, pour l'OCR. */
async function pdfVersImage(fichier: File): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const donnees = new Uint8Array(await fichier.arrayBuffer());
  const document = await pdfjs.getDocument({ data: donnees }).promise;
  const page = await document.getPage(1);

  const viewport = page.getViewport({ scale: 3 });
  const canvas = window.document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Impossible de préparer l'image du PDF.");

  await page.render({ canvas, canvasContext: contexte, viewport }).promise;

  return canvasVersBlob(appliquerAmeliorations(canvas));
}

/** Version tournée de 180° d'une image : utile pour les photos « à l'envers ». */
async function pivoter180(blob: Blob): Promise<Blob> {
  const img = await blobVersImage(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Rotation impossible.");
  contexte.translate(canvas.width, canvas.height);
  contexte.rotate(Math.PI);
  contexte.drawImage(img, 0, 0);
  return canvasVersBlob(canvas);
}

/** Nombre approximatif de lettres du texte : juge d'une bonne reconnaissance. */
function richesse(texte: string): number {
  return (texte.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
}

/**
 * Extrait le texte d'un fichier. Renvoie le texte brut, à passer ensuite à
 * `extraireDonnees` pour identifier les champs.
 */
export async function lireDocument(
  fichier: File,
  surProgression?: (p: ProgressionOCR) => void,
): Promise<string> {
  const estPdf =
    fichier.type === "application/pdf" || fichier.name.toLowerCase().endsWith(".pdf");

  surProgression?.({
    etape: estPdf ? "Ouverture du PDF…" : "Préparation de l'image…",
    pourcentage: 5,
  });

  const source: Blob = estPdf ? await pdfVersImage(fichier) : await preparerPhoto(fichier);

  surProgression?.({ etape: "Lecture du document…", pourcentage: 15 });

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(LANGUES, 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        surProgression?.({
          etape: "Lecture du document…",
          pourcentage: 15 + Math.round(m.progress * 80),
        });
      }
    },
  });

  try {
    let { data } = await worker.recognize(
      source,
      { psm: 3 } as Parameters<typeof worker.recognize>[1],
    );

    // Texte trop maigre pour une photo : on retente en 180° et en PSM bloc
    // uniforme, et on garde la lecture la plus riche.
    if (!estPdf && data.text.trim().length < 25) {
      const retourne = await pivoter180(source);
      const { data: retour } = await worker.recognize(
        retourne,
        { psm: 6 } as Parameters<typeof worker.recognize>[1],
      );
      if (richesse(retour.text) > richesse(data.text)) {
        data = retour;
        surProgression?.({ etape: "Lecture du document…", pourcentage: 95 });
      }
    }

    surProgression?.({ etape: "Analyse terminée", pourcentage: 100 });
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

export const FORMATS_ACCEPTES = "image/jpeg,image/png,image/webp,image/heic,application/pdf";
export const TAILLE_MAX_OCTETS = 15 * 1024 * 1024;