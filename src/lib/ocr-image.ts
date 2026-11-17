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

/* -------------------------------------------------------------------------- */
/*  La feuille dans la photo : recadrage et perspective                       */
/* -------------------------------------------------------------------------- */

export type Point = [number, number];

/** Seuil d'Otsu : le niveau qui sépare le mieux les pixels en deux familles. */
export function seuilOtsuGris(g: Gris): number {
  const histo = new Float64Array(256);
  for (const v of g.px) histo[v]++;
  const total = g.px.length;
  let somme = 0;
  for (let i = 0; i < 256; i++) somme += i * histo[i];
  let sommeFond = 0;
  let poidsFond = 0;
  let meilleure = -1;
  let seuil = 127;
  for (let t = 0; t < 256; t++) {
    poidsFond += histo[t];
    if (!poidsFond) continue;
    const poidsForme = total - poidsFond;
    if (!poidsForme) break;
    sommeFond += t * histo[t];
    const ecart = sommeFond / poidsFond - (somme - sommeFond) / poidsForme;
    const variance = poidsFond * poidsForme * ecart * ecart;
    if (variance > meilleure) {
      meilleure = variance;
      seuil = t;
    }
  }
  return seuil;
}

const aireQuadrilatere = (q: Point[]) =>
  Math.abs(q.reduce((s, [x, y], i) => s + x * q[(i + 1) % 4][1] - q[(i + 1) % 4][0] * y, 0)) / 2;

function convexe(q: Point[]): boolean {
  let signe = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = q[i];
    const [bx, by] = q[(i + 1) % 4];
    const [cx, cy] = q[(i + 2) % 4];
    const z = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
    if (z === 0) return false;
    if (signe === 0) signe = Math.sign(z);
    else if (Math.sign(z) !== signe) return false;
  }
  return true;
}

function dansQuadrilatere(q: Point[], x: number, y: number): boolean {
  let signe = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = q[i];
    const [bx, by] = q[(i + 1) % 4];
    const z = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
    if (z === 0) continue;
    if (signe === 0) signe = z;
    else if (z !== signe) return false;
  }
  return true;
}

/**
 * Les quatre coins de la feuille dans une photo (haut gauche, haut droit, bas
 * droit, bas gauche), ou `null` quand on ne les trouve pas avec certitude.
 *
 * Une lettre photographiée sur une table est un quadrilatère clair sur un fond
 * plus sombre. On sépare le clair du sombre (Otsu, après lissage), on garde la
 * plus grande zone claire d'un seul tenant, et ses points extrêmes en donnent
 * les coins. Prudence d'abord : la zone doit être nettement plus claire que
 * son entourage, bien remplie, convexe, et ne pas déjà occuper toute l'image.
 * Dans le doute, on ne recadre pas — un recadrage faux couperait du texte.
 *
 * À appeler sur une version réduite (quelques centaines de pixels de côté).
 */
export function detecterPage(g: Gris): Point[] | null {
  const { largeur: w, hauteur: h } = g;
  const n = w * h;
  const doux = lisser(lisser(g));
  const seuil = seuilOtsuGris(doux);
  const clair = new Uint8Array(n);
  let nClair = 0;
  for (let i = 0; i < n; i++)
    if (doux.px[i] > seuil) {
      clair[i] = 1;
      nClair++;
    }
  if (nClair > 0.96 * n || nClair < 0.15 * n) return null;

  // Plus grande zone claire d'un seul tenant (4 voisins), parcours en largeur.
  const zone = new Int32Array(n).fill(-1);
  const file = new Int32Array(n);
  let retenue = -1;
  let tailleMax = 0;
  for (let depart = 0, id = 0; depart < n; depart++) {
    if (!clair[depart] || zone[depart] !== -1) continue;
    let tete = 0;
    let queue = 0;
    file[queue++] = depart;
    zone[depart] = id;
    while (tete < queue) {
      const p = file[tete++];
      const x = p % w;
      const voisins = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p >= w ? p - w : -1, p < n - w ? p + w : -1];
      for (const v of voisins)
        if (v >= 0 && clair[v] && zone[v] === -1) {
          zone[v] = id;
          file[queue++] = v;
        }
    }
    if (queue > tailleMax) {
      tailleMax = queue;
      retenue = id;
    }
    id++;
  }
  if (tailleMax < 0.2 * n) return null;

  // Coins : les points extrêmes selon x + y et x − y.
  let hg: Point = [0, 0], hd: Point = [0, 0], bd: Point = [0, 0], bg: Point = [0, 0];
  let sMin = Infinity, sMax = -Infinity, dMin = Infinity, dMax = -Infinity;
  for (let p = 0; p < n; p++) {
    if (zone[p] !== retenue) continue;
    const x = p % w;
    const y = (p - x) / w;
    const s = x + y;
    const d = x - y;
    if (s < sMin) { sMin = s; hg = [x, y]; }
    if (s > sMax) { sMax = s; bd = [x, y]; }
    if (d > dMax) { dMax = d; hd = [x, y]; }
    if (d < dMin) { dMin = d; bg = [x, y]; }
  }
  const coins: Point[] = [hg, hd, bd, bg];

  // La feuille occupe déjà toute la photo : rien à recadrer.
  const cadre: Point[] = [[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]];
  const marge = 0.04 * Math.max(w, h);
  if (coins.every((c, k) => Math.hypot(c[0] - cadre[k][0], c[1] - cadre[k][1]) < marge)) return null;

  const aire = aireQuadrilatere(coins);
  if (aire < 0.2 * n || !convexe(coins)) return null;
  for (let k = 0; k < 4; k++) {
    const [ax, ay] = coins[k];
    const [bx, by] = coins[(k + 1) % 4];
    if (Math.hypot(bx - ax, by - ay) < 0.2 * Math.min(w, h)) return null;
  }
  // Bien remplie : le texte fait des trous, une ombre en ferait de trop grands.
  if (tailleMax < 0.72 * aire) return null;

  // Nettement plus claire que son entourage.
  let dedans = 0, nDedans = 0, dehors = 0, nDehors = 0;
  for (let y = 0; y < h; y += 2)
    for (let x = 0; x < w; x += 2) {
      const v = g.px[y * w + x];
      if (dansQuadrilatere(coins, x, y)) { dedans += v; nDedans++; }
      else { dehors += v; nDehors++; }
    }
  if (nDehors < 0.03 * (nDedans + nDehors) || dedans / nDedans - dehors / nDehors < 35) return null;

  // Un vrai bord de feuille : de part et d'autre de chaque côté (hors bord de
  // la photo), un saut de luminosité franc, sur presque toute sa longueur.
  // Une ombre en dégradé coupe aussi l'image en clair et sombre, mais sans
  // bord net : elle échoue ici.
  if (!bordsFrancs(doux, coins)) return null;
  return coins;
}

function bordsFrancs(g: Gris, coins: Point[]): boolean {
  const { largeur: w, hauteur: h, px } = g;
  const cx = coins.reduce((s, c) => s + c[0], 0) / 4;
  const cy = coins.reduce((s, c) => s + c[1], 0) / 4;
  const pres = 3;
  const surLeBord = (a: Point, b: Point) =>
    (a[0] < pres && b[0] < pres) || (a[1] < pres && b[1] < pres) || (a[0] > w - 1 - pres && b[0] > w - 1 - pres) || (a[1] > h - 1 - pres && b[1] > h - 1 - pres);
  const val = (x: number, y: number) => px[Math.min(h - 1, Math.max(0, Math.round(y))) * w + Math.min(w - 1, Math.max(0, Math.round(x)))];
  let interieurs = 0;
  for (let k = 0; k < 4; k++) {
    const a = coins[k];
    const b = coins[(k + 1) % 4];
    if (surLeBord(a, b)) continue;
    interieurs++;
    const lx = b[0] - a[0], ly = b[1] - a[1];
    const L = Math.hypot(lx, ly);
    let nx = -ly / L, ny = lx / L;
    // Normale tournée vers l'intérieur de la feuille.
    if ((cx - (a[0] + b[0]) / 2) * nx + (cy - (a[1] + b[1]) / 2) * ny < 0) { nx = -nx; ny = -ny; }
    let francs = 0;
    const N = 40;
    for (let i = 0; i < N; i++) {
      const t = 0.1 + (0.8 * i) / (N - 1);
      const x = a[0] + lx * t, y = a[1] + ly * t;
      if (val(x + nx * 3, y + ny * 3) - val(x - nx * 3, y - ny * 3) > 25) francs++;
    }
    if (francs < 0.75 * N) return false;
  }
  return interieurs >= 2;
}

/**
 * L'homographie (3 × 3, dernier terme à 1) qui envoie les quatre points `de`
 * sur les quatre points `vers` : huit équations, huit inconnues, résolues par
 * élimination de Gauss avec pivot.
 */
export function homographie(de: Point[], vers: Point[]): number[] {
  const m: number[][] = [];
  for (let k = 0; k < 4; k++) {
    const [x, y] = de[k];
    const [u, v] = vers[k];
    m.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    m.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let pivot = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(m[r][c]) > Math.abs(m[pivot][c])) pivot = r;
    [m[c], m[pivot]] = [m[pivot], m[c]];
    if (Math.abs(m[c][c]) < 1e-12) throw new Error("Points alignés : pas d'homographie.");
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k < 9; k++) m[r][k] -= f * m[c][k];
    }
  }
  return [...m.map((r, i) => r[8] / r[i]), 1];
}

/** Dimensions naturelles de la feuille redressée : ses côtés les plus longs. */
export function tailleRedressee(coins: Point[]): [number, number] {
  const d = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [hg, hd, bd, bg] = coins;
  return [Math.round(Math.max(d(hg, hd), d(bg, bd))), Math.round(Math.max(d(hg, bg), d(hd, bd)))];
}

/**
 * Remet la feuille à plat : chaque pixel du rectangle de sortie va chercher sa
 * couleur à l'endroit correspondant de la photo (interpolation bilinéaire).
 * Ce qui tombe hors de la photo devient blanc.
 */
export function redresserPerspective(src: Uint8ClampedArray, w: number, h: number, coins: Point[], W: number, H: number): Uint8ClampedArray {
  const m = homographie([[0, 0], [W - 1, 0], [W - 1, H - 1], [0, H - 1]], coins);
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = m[6] * x + m[7] * y + m[8];
      const sx = (m[0] * x + m[1] * y + m[2]) / d;
      const sy = (m[3] * x + m[4] * y + m[5]) / d;
      const o = (y * W + x) * 4;
      if (sx < 0 || sy < 0 || sx > w - 1 || sy > h - 1) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 255;
        continue;
      }
      const x0 = Math.floor(sx), y0 = Math.floor(sy);
      const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
      const fx = sx - x0, fy = sy - y0;
      for (let c = 0; c < 3; c++) {
        const a = src[(y0 * w + x0) * 4 + c], b = src[(y0 * w + x1) * 4 + c];
        const e = src[(y1 * w + x0) * 4 + c], f = src[(y1 * w + x1) * 4 + c];
        out[o + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (e * (1 - fx) + f * fx) * fy;
      }
      out[o + 3] = 255;
    }
  }
  return out;
}
