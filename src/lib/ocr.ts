/**
 * Lecture d'un document (photo ou PDF) dans le navigateur.
 *
 * Tout se passe côté client : le document n'est jamais envoyé à un serveur
 * tiers, et la solution ne coûte rien (ni clé API, ni facturation à l'usage).
 * Les modules lourds sont importés dynamiquement pour ne pas alourdir les
 * pages qui n'en ont pas besoin.
 */

export type ProgressionOCR = { etape: string; pourcentage: number };

const LANGUES = "fra+nld";

/** Rend la première page d'un PDF dans un canvas, pour la donner à l'OCR. */
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

  // Une échelle élevée améliore nettement la reconnaissance des petits
  // caractères (références, numéros de plaque).
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = window.document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Impossible de préparer l'image du PDF.");

  await page.render({ canvas, canvasContext: contexte, viewport }).promise;

  return new Promise((resoudre, rejeter) =>
    canvas.toBlob(
      (blob) => (blob ? resoudre(blob) : rejeter(new Error("Conversion du PDF impossible."))),
      "image/png",
    ),
  );
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

  surProgression?.({ etape: estPdf ? "Ouverture du PDF…" : "Préparation de l'image…", pourcentage: 5 });

  const source: Blob = estPdf ? await pdfVersImage(fichier) : fichier;

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
