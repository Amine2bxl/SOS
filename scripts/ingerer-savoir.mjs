#!/usr/bin/env node
/**
 * Ingestion du savoir de l'association dans le moteur SOS.
 *
 * Usage :
 *   1. Déposez vos documents dans `savoir/sources/` (sous-dossiers permis) :
 *      .md, .txt ou .pdf. Un document Word s'enregistre en PDF depuis Word.
 *   2. Lancez :  node scripts/ingerer-savoir.mjs
 *   3. Relisez le résumé affiché, puis committez
 *      `src/cerveau/corpus/corpus.genere.ts`.
 *
 * Chaque document est découpé en passages d'un à deux paragraphes, rattachés
 * à leur intertitre. Ce découpage compte : la recherche renvoie un passage,
 * pas un document de quarante pages, et l'utilisateur doit y lire la réponse
 * tout de suite.
 *
 * Aucun service extérieur n'est appelé : tout se passe sur cette machine.
 * Les PDF scannés (images sans texte) ne sont pas lus par ce script : passez-
 * les d'abord par un logiciel d'OCR, ou recopiez l'essentiel dans un .md.
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, relative, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const SOURCES = join(RACINE, "savoir", "sources");
const SORTIE = join(RACINE, "src", "cerveau", "corpus", "corpus.genere.ts");

/** Taille visée d'un passage, en caractères. */
const CIBLE = 900;
const MAXIMUM = 1600;

async function listerFichiers(dossier) {
  let entrees;
  try {
    entrees = await readdir(dossier);
  } catch {
    return [];
  }
  const fichiers = [];
  for (const nom of entrees) {
    if (nom.startsWith(".")) continue;
    const chemin = join(dossier, nom);
    const info = await stat(chemin);
    if (info.isDirectory()) fichiers.push(...(await listerFichiers(chemin)));
    else if ([".md", ".txt", ".pdf"].includes(extname(nom).toLowerCase())) fichiers.push(chemin);
  }
  return fichiers.sort();
}

async function lirePdf(chemin) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const donnees = new Uint8Array(await readFile(chemin));
  const doc = await getDocument({ data: donnees, useSystemFonts: true }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const contenu = await page.getTextContent();
    // Reconstitue les lignes : pdf.js renvoie des fragments, avec un indicateur
    // de fin de ligne qu'on transforme en vrai retour.
    let texte = "";
    for (const item of contenu.items) {
      if (!("str" in item)) continue;
      texte += item.str + (item.hasEOL ? "\n" : " ");
    }
    pages.push(texte);
  }
  return pages.join("\n\n");
}

/** Nettoie le texte : espaces, césures de fin de ligne, lignes vides en série. */
function nettoyer(texte) {
  return texte
    .replace(/\r/g, "")
    .replace(/ /g, " ")
    .replace(/(\w)-\n(\w)/g, "$1$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Découpe en passages, en respectant les intertitres (lignes « # … » en
 * Markdown, ou lignes courtes en capitales / sans point final dans un PDF).
 */
function decouper(texte, titreDocument) {
  const lignes = texte.split("\n");
  const passages = [];
  let titre = titreDocument;
  let tampon = [];

  const estIntertitre = (l) => {
    const s = l.trim();
    if (/^#{1,6}\s/.test(s)) return true;
    return s.length > 3 && s.length < 80 && !/[.;:,]$/.test(s) && (s === s.toUpperCase() || /^\d+(\.\d+)*[.)]?\s+\S/.test(s));
  };

  const vider = () => {
    const contenu = tampon.join(" ").replace(/\s+/g, " ").trim();
    tampon = [];
    if (contenu.length < 60) return;
    if (contenu.length <= MAXIMUM) {
      passages.push({ titre, texte: contenu });
      return;
    }
    // Trop long : on coupe aux fins de phrase, autour de la taille visée.
    const phrases = contenu.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [contenu];
    let courant = "";
    for (const p of phrases) {
      if ((courant + p).length > CIBLE && courant.length > 200) {
        passages.push({ titre, texte: courant.trim() });
        courant = "";
      }
      courant += p;
    }
    if (courant.trim().length >= 60) passages.push({ titre, texte: courant.trim() });
  };

  for (const ligne of lignes) {
    if (!ligne.trim()) {
      if (tampon.join(" ").length >= CIBLE) vider();
      continue;
    }
    if (estIntertitre(ligne)) {
      vider();
      titre = ligne.replace(/^#{1,6}\s*/, "").trim();
      continue;
    }
    tampon.push(ligne.trim());
  }
  vider();
  return passages;
}

function identifiant(chemin, i) {
  const base = relative(SOURCES, chemin)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${i + 1}`;
}

async function principal() {
  const fichiers = await listerFichiers(SOURCES);
  if (fichiers.length === 0) {
    console.log(`Aucun document dans ${relative(RACINE, SOURCES)}/ — rien à ingérer.`);
    console.log("Déposez-y des fichiers .md, .txt ou .pdf, puis relancez.");
    return;
  }

  const corpus = [];
  for (const chemin of fichiers) {
    const extension = extname(chemin).toLowerCase();
    let brut;
    try {
      brut = extension === ".pdf" ? await lirePdf(chemin) : await readFile(chemin, "utf8");
    } catch (e) {
      console.warn(`⚠  Illisible, ignoré : ${relative(RACINE, chemin)} (${e.message})`);
      continue;
    }
    const texte = nettoyer(brut);
    if (texte.length < 100) {
      console.warn(`⚠  Presque vide (PDF scanné ?), ignoré : ${relative(RACINE, chemin)}`);
      continue;
    }
    const titreDocument = basename(chemin, extension).replace(/[-_]+/g, " ");
    const passages = decouper(texte, titreDocument);
    passages.forEach((p, i) =>
      corpus.push({ id: identifiant(chemin, i), titre: p.titre, texte: p.texte, source: relative(SOURCES, chemin) }),
    );
    console.log(`✓ ${relative(RACINE, chemin)} — ${passages.length} passage(s)`);
  }

  const entete = `/**
 * Corpus de l'association — FICHIER GÉNÉRÉ, ne pas modifier à la main.
 *
 * Produit par \`node scripts/ingerer-savoir.mjs\` à partir des documents déposés
 * dans \`savoir/sources/\`. Voir \`src/cerveau/corpus/README.md\`.
 *
 * Ce fichier n'est importé que par du code serveur : le corpus n'est jamais
 * envoyé au navigateur. Seuls des extraits, en réponse à une question, le sont.
 */

export type PassageCorpus = {
  id: string;
  /** Titre du passage : intertitre du document, ou nom du fichier. */
  titre: string;
  texte: string;
  /** Document d'origine. */
  source: string;
};

`;
  await writeFile(SORTIE, `${entete}export const CORPUS: PassageCorpus[] = ${JSON.stringify(corpus, null, 2)};\n`);
  console.log(`\n${corpus.length} passages écrits dans ${relative(RACINE, SORTIE)}.`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
