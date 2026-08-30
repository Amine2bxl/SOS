/**
 * Lecture d'un document (photo ou PDF) dans le navigateur.
 *
 * Tout se passe côté client : le document n'est jamais envoyé à un serveur
 * tiers, et la solution ne coûte rien (ni clé API, ni facturation à l'usage).
 * Les modules lourds sont importés dynamiquement pour ne pas alourdir les
 * pages qui n'en ont pas besoin.
 *
 * Avant la reconnaissance, l'image est préparée : redimensionnée si besoin,
 * mise en niveaux de gris et étirée en contraste — ce qui améliore nettement
 * la lecture d'un courrier photographié (reflets, ombres, faible contraste).
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

function canvasVersBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resoudre, rejeter) =>
    canvas.toBlob(
      (blob) => (blob ? resoudre(blob) : rejeter(new Error("Préparation de l'image impossible."))),
      "image/png",
    ),
  );
}

/**
 * Niveaux de gris puis étalement du contraste (5–95 %). Le texte ressort
 * mieux, et Tesseract se trompe moins — surtout sur des photos de courrier.
 */
function appliquerAmeliorations(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const contexte = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexte) return canvas;

  const donnees = contexte.getImageData(0, 0, canvas.width, canvas.height);
  const px = donnees.data;

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

  if (haut > bas) {
    const table = new Uint8ClampedArray(256);
    const plage = haut - bas;
    for (let v = 0; v < 256; v++) {
      table[v] = v <= bas ? 0 : v >= haut ? 255 : Math.round(((v - bas) / plage) * 255);
    }
    for (let i = 0; i < px.length; i += 4) {
      px[i] = px[i + 1] = px[i + 2] = table[px[i]];
    }
  }

  contexte.putImageData(donnees, 0, 0);
  return canvas;
}

/**
 * Prépare une photo ou une capture d'écran : décode, redimensionne vers une
 * zone de travail raisonnable, puis améliore le contraste. Renvoie un PNG.
 */
async function preparerPhoto(fichier: File): Promise<Blob> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await chargerImage(url);
    if (!img.naturalWidth) throw new Error("Image illisible.");

    let largeur = img.naturalWidth;
    let hauteur = img.naturalHeight;
    const plusLong = Math.max(largeur, hauteur);
    // Trop petite, les lettres se perdent ; trop grande, l'OCR devient lent.
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

    // Fond blanc d'abord : évite les marges sombres autour d'une photo.
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

  // Le worker est fourni par le bundle : pas de dépendance à un CDN externe.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const donnees = new Uint8Array(await fichier.arrayBuffer());
  const document = await pdfjs.getDocument({ data: donnees }).promise;
  const page = await document.getPage(1);

  // Une échelle élevée améliore la reconnaissance des petits caractères.
  const viewport = page.getViewport({ scale: 3 });
  const canvas = window.document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Impossible de préparer l'image du PDF.");

  await page.render({ canvas, canvasContext: contexte, viewport }).promise;

  return canvasVersBlob(appliquerAmeliorations(canvas));
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
          // 15 % à 95 % : la reconnaissance occupe l'essentiel du temps.
          pourcentage: 15 + Math.round(m.progress * 80),
        });
      }
    },
  });

  try {
    const { data } = await worker.recognize(source);
    surProgression?.({ etape: "Analyse terminée", pourcentage: 100 });
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

export const FORMATS_ACCEPTES = "image/jpeg,image/png,image/webp,image/heic,application/pdf";
export const TAILLE_MAX_OCTETS = 15 * 1024 * 1024;