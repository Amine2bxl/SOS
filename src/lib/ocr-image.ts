/**
 * Traitements d'image pour la lecture des courriers, sur des pixels bruts.
 *
 * Une photo de courrier prise au téléphone cumule les ennuis : ombre de la
 * main, lampe d'un côté, papier gris, encre de couleur, léger biais. Tesseract
 * lit très bien un noir sur blanc droit ; tout le travail est de lui en donner
 * un, quel que soit l'environnement. Chaque fonction ici est pure (tableaux
 * d'octets en entrée et en sortie), linéaire en nombre de pixels grâce aux
 * images intégrales, et testée directement, sans navigateur.
 *
 * Une image en niveaux de gris est un `Uint8ClampedArray` de `largeur × hauteur`
 * octets (un par pixel).
 */

export type Gris = { px: Uint8ClampedArray; largeur: number; hauteur: number };

/**
 * RVBA → gris. `luminance` : la perception humaine ; `encre` : la plus sombre
 * des trois composantes, qui fait ressortir une encre rouge ou bleue sur papier
 * clair aussi nettement qu'une encre noire.
 */
export function versGris(rvba: Uint8ClampedArray, largeur: number, hauteur: number, mode: "luminance" | "encre" = "luminance"): Gris {
  const px = new Uint8ClampedArray(largeur * hauteur);
  for (let i = 0, j = 0; j < px.length; i += 4, j++) {
    px[j] =
      mode === "encre"
        ? Math.min(rvba[i], rvba[i + 1], rvba[i + 2])
        : 0.299 * rvba[i] + 0.587 * rvba[i + 1] + 0.114 * rvba[i + 2];
  }
  return { px, largeur, hauteur };
}

/** Image intégrale (somme, et somme des carrés si demandé), en Float64 pour éviter tout débordement. */
function integrale(g: Gris, carres = false): { s: Float64Array; s2: Float64Array | null } {
  const { px, largeur: w, hauteur: h } = g;
  const s = new Float64Array((w + 1) * (h + 1));
  const s2 = carres ? new Float64Array((w + 1) * (h + 1)) : null;
  for (let y = 0; y < h; y++) {
    let ligne = 0;
    let ligne2 = 0;
    for (let x = 0; x < w; x++) {
      const v = px[y * w + x];
      ligne += v;
      s[(y + 1) * (w + 1) + x + 1] = s[y * (w + 1) + x + 1] + ligne;
      if (s2) {
        ligne2 += v * v;
        s2[(y + 1) * (w + 1) + x + 1] = s2[y * (w + 1) + x + 1] + ligne2;
      }
    }
  }
  return { s, s2 };
}

function sommeFenetre(s: Float64Array, w: number, x0: number, y0: number, x1: number, y1: number): number {
  const W = w + 1;
  return s[y1 * W + x1] - s[y0 * W + x1] - s[y1 * W + x0] + s[y0 * W + x0];
}

/**
 * Corrige l'éclairage : chaque pixel est divisé par le fond estimé autour de
 * lui (moyenne sur une large fenêtre). Une ombre portée ou un dégradé de lampe
 * disparaissent ; le texte, plus sombre que son voisinage, reste.
 */
export function normaliserEclairage(g: Gris, rayon = Math.max(8, Math.round(Math.max(g.largeur, g.hauteur) / 30))): Gris {
  const { largeur: w, hauteur: h, px } = g;
  const { s } = integrale(g);
  const sortie = new Uint8ClampedArray(px.length);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - rayon);
    const y1 = Math.min(h, y + rayon + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - rayon);
      const x1 = Math.min(w, x + rayon + 1);
      const fond = sommeFenetre(s, w, x0, y0, x1, y1) / ((x1 - x0) * (y1 - y0));
      sortie[y * w + x] = Math.min(255, (px[y * w + x] / Math.max(1, fond)) * 235);
    }
  }
  return { px: sortie, largeur: w, hauteur: h };
}

/**
 * Seuillage adaptatif de Sauvola : le seuil suit la moyenne et l'écart-type
 * locaux. Là où Otsu (un seuil unique) efface la moitié d'une photo mal
 * éclairée, Sauvola garde le texte partout.
 */
export function sauvola(g: Gris, fenetre = Math.max(15, Math.round(Math.min(g.largeur, g.hauteur) / 40) | 1), k = 0.34): Gris {
  const { largeur: w, hauteur: h, px } = g;
  const { s, s2 } = integrale(g, true);
  const r = Math.floor(fenetre / 2);
  const sortie = new Uint8ClampedArray(px.length);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w, x + r + 1);
      const n = (x1 - x0) * (y1 - y0);
      const moyenne = sommeFenetre(s, w, x0, y0, x1, y1) / n;
      const variance = Math.max(0, sommeFenetre(s2 as Float64Array, w, x0, y0, x1, y1) / n - moyenne * moyenne);
      const seuil = moyenne * (1 + k * (Math.sqrt(variance) / 128 - 1));
      sortie[y * w + x] = px[y * w + x] > seuil ? 255 : 0;
    }
  }
  return { px: sortie, largeur: w, hauteur: h };
}

/** Accentuation légère (masque flou 3×3) : une photo un peu floue retrouve des bords nets. */
export function accentuer(g: Gris, force = 0.6): Gris {
  const { largeur: w, hauteur: h, px } = g;
  const sortie = new Uint8ClampedArray(px.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let somme = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          somme += px[yy * w + xx];
          n++;
        }
      }
      const v = px[y * w + x];
      sortie[y * w + x] = v + force * (v - somme / n);
    }
  }
  return { px: sortie, largeur: w, hauteur: h };
}

/**
 * Masque flou à large rayon : rend des bords nets à une photo floue (mise au
 * point ratée, document photographié de loin). Le 3×3 d'`accentuer` ne voit
 * qu'un pixel autour ; un flou de bougé s'étale sur plusieurs. Chaque pixel
 * s'écarte de la moyenne de son voisinage, calculée par image intégrale.
 */
export function masqueFlou(g: Gris, rayon = 3, force = 1.5): Gris {
  const { largeur: w, hauteur: h, px } = g;
  const { s } = integrale(g);
  const sortie = new Uint8ClampedArray(px.length);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - rayon);
    const y1 = Math.min(h, y + rayon + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - rayon);
      const x1 = Math.min(w, x + rayon + 1);
      const moyenne = sommeFenetre(s, w, x0, y0, x1, y1) / ((x1 - x0) * (y1 - y0));
      const v = px[y * w + x];
      sortie[y * w + x] = v + force * (v - moyenne);
    }
  }
  return { px: sortie, largeur: w, hauteur: h };
}

/** Lissage 3×3 : atténue le grain d'une photo prise en faible lumière avant le seuillage. */
export function lisser(g: Gris): Gris {
  return accentuer(g, -1);
}

/** Étale l'histogramme entre les 0,5 % les plus sombres et les plus clairs. */
export function etirerContraste(g: Gris): Gris {
  const histo = new Uint32Array(256);
  for (const v of g.px) histo[v]++;
  const total = g.px.length;
  let cumul = 0;
  let bas = 0;
  for (let v = 0; v < 256; v++) {
    cumul += histo[v];
    if (cumul >= total * 0.005) { bas = v; break; }
  }
  cumul = 0;
  let haut = 255;
  for (let v = 255; v >= 0; v--) {
    cumul += histo[v];
    if (cumul >= total * 0.005) { haut = v; break; }
  }
  if (haut <= bas) return g;
  const sortie = new Uint8ClampedArray(g.px.length);
  const plage = haut - bas;
  for (let i = 0; i < g.px.length; i++) sortie[i] = ((g.px[i] - bas) / plage) * 255;
  return { ...g, px: sortie };
}

/**
 * Une capture d'écran en mode sombre : texte clair sur fond foncé. On l'inverse.
 *
 * Le test n'est pas « l'image est-elle sombre ? » : une photo prise dans une
 * pièce mal éclairée est sombre, et son texte reste plus foncé que le papier.
 * L'inverser effacerait tout. On regarde la polarité du texte, localement :
 * chaque pixel est comparé à la moyenne de son voisinage (une ombre ou un
 * dégradé de lampe s'annulent ainsi). Le texte, ce sont les pixels nettement
 * à l'écart de leur voisinage ; s'ils sont surtout plus clairs, le texte est
 * clair, et on inverse.
 */
export function inverserSiSombre(g: Gris): Gris {
  const { largeur: w, hauteur: h, px } = g;
  const { s } = integrale(g);
  const rayon = Math.max(8, Math.round(Math.max(w, h) / 30));
  let clairs = 0;
  let fonces = 0;
  let n = 0;
  // Un pixel sur deux dans chaque sens suffit à décider.
  for (let y = 0; y < h; y += 2) {
    const y0 = Math.max(0, y - rayon);
    const y1 = Math.min(h, y + rayon + 1);
    for (let x = 0; x < w; x += 2) {
      const x0 = Math.max(0, x - rayon);
      const x1 = Math.min(w, x + rayon + 1);
      const ecart = px[y * w + x] - sommeFenetre(s, w, x0, y0, x1, y1) / ((x1 - x0) * (y1 - y0));
      if (ecart > 35) clairs++;
      else if (ecart < -35) fonces++;
      n++;
    }
  }
  if (clairs <= fonces * 2 || clairs < n * 0.002) return g;
  const sortie = new Uint8ClampedArray(px.length);
  for (let i = 0; i < px.length; i++) sortie[i] = 255 - px[i];
  return { ...g, px: sortie };
}

/**
 * Estime l'inclinaison du texte, en degrés (−8 à +8), par la méthode des
 * profils de projection : à l'angle juste, les lignes de texte s'alignent et la
 * somme des pixels noirs par rangée varie le plus. Calculée sur une version
 * réduite de l'image binaire : quelques millisecondes.
 */
export function estimerInclinaison(binaire: Gris, max = 8, pas = 0.5): number {
  const echelle = Math.min(1, 700 / binaire.largeur);
  const w = Math.max(1, Math.round(binaire.largeur * echelle));
  const h = Math.max(1, Math.round(binaire.hauteur * echelle));
  const noirs: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    const sy = Math.min(binaire.hauteur - 1, Math.round(y / echelle));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(binaire.largeur - 1, Math.round(x / echelle));
      if (binaire.px[sy * binaire.largeur + sx] < 128) noirs.push([x - w / 2, y - h / 2]);
    }
  }
  if (noirs.length < 50) return 0;

  let meilleurAngle = 0;
  let meilleureVariance = -1;
  const rangees = new Float64Array(h * 2 + 2);
  for (let a = -max; a <= max + 1e-9; a += pas) {
    const t = Math.tan((a * Math.PI) / 180);
    rangees.fill(0);
    for (const [x, y] of noirs) {
      const r = Math.round(y - x * t + h);
      if (r >= 0 && r < rangees.length) rangees[r]++;
    }
    let somme = 0;
    let somme2 = 0;
    for (const v of rangees) {
      somme += v;
      somme2 += v * v;
    }
    const variance = somme2 / rangees.length - (somme / rangees.length) ** 2;
    if (variance > meilleureVariance) {
      meilleureVariance = variance;
      meilleurAngle = a;
    }
  }
  return Math.round(meilleurAngle * 10) / 10;
}

/**
 * Le sens des lignes de texte : couchées (photo tournée d'un quart de tour) ou
 * à plat. Des lignes à plat font alterner rangées pleines et rangées vides ;
 * les colonnes, elles, restent uniformes. On compare les deux variances.
 * Pas de lecture pour rien : une photo à plat n'est jamais essayée couchée.
 */
export function sensDesLignes(binaire: Gris): "horizontal" | "vertical" {
  const { largeur: w, hauteur: h, px } = binaire;
  const rangees = new Float64Array(h);
  const colonnes = new Float64Array(w);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (px[y * w + x] < 128) {
        rangees[y]++;
        colonnes[x]++;
      }
  const variance = (v: Float64Array, n: number) => {
    let s = 0;
    let s2 = 0;
    for (const x of v) {
      s += x / n;
      s2 += (x / n) ** 2;
    }
    return s2 / v.length - (s / v.length) ** 2;
  };
  // Normalisées par la longueur de la ligne : une page en portrait n'avantage pas les rangées.
  return variance(colonnes, h) > variance(rangees, w) * 1.3 ? "vertical" : "horizontal";
}

/** Gris → RVBA, pour repasser dans un canvas. */
export function versRvba(g: Gris, rvba: Uint8ClampedArray): void {
  for (let i = 0, j = 0; j < g.px.length; i += 4, j++) {
    rvba[i] = rvba[i + 1] = rvba[i + 2] = g.px[j];
    rvba[i + 3] = 255;
  }
}
