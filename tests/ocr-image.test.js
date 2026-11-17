/**
 * Traitements d'image de l'OCR, sur des images synthétiques : ombre, encre de
 * couleur, biais. Pas de navigateur : des tableaux d'octets.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { versGris, normaliserEclairage, sauvola, estimerInclinaison, inverserSiSombre, etirerContraste, sensDesLignes, masqueFlou } = require("../.test-build/lib/ocr-image.js");

/** Une page : fond éclairé en dégradé (de 250 à 120, comme une ombre), « texte » en barres sombres. */
function page(w = 300, h = 200, { biais = 0, encre = [20, 20, 20] } = {}) {
  const rvba = new Uint8ClampedArray(w * h * 4);
  const t = Math.tan((biais * Math.PI) / 180);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const fond = 250 - (130 * x) / w;
      const yl = y - (x - w / 2) * t; // lignes inclinées
      const texte = x > 20 && x < w - 20 && (Math.floor(yl) % 20) < 4 && Math.floor(yl / 20) % 2 === 0;
      const i = (y * w + x) * 4;
      const c = texte ? encre.map((e) => (e * fond) / 250) : [fond, fond, fond];
      rvba[i] = c[0]; rvba[i + 1] = c[1]; rvba[i + 2] = c[2]; rvba[i + 3] = 255;
    }
  return { rvba, w, h };
}

const proportionNoire = (g) => g.px.reduce((n, v) => n + (v < 128 ? 1 : 0), 0) / g.px.length;

test("l'ombre disparaît : le fond corrigé devient uniforme", () => {
  const { rvba, w, h } = page();
  const g = versGris(rvba, w, h);
  const n = normaliserEclairage(g);
  // Fond à gauche et à droite, sur une rangée sans texte.
  const y = 12;
  const ecartAvant = Math.abs(g.px[y * w + 25] - g.px[y * w + w - 25]);
  const ecartApres = Math.abs(n.px[y * w + 25] - n.px[y * w + w - 25]);
  assert.ok(ecartApres < ecartAvant / 3, `${ecartAvant} → ${ecartApres}`);
});

test("Sauvola garde le texte des deux côtés de l'ombre", () => {
  const { rvba, w, h } = page();
  const b = sauvola(normaliserEclairage(versGris(rvba, w, h)));
  const ligneTexte = 1; // rangée dans une barre de texte
  assert.equal(b.px[ligneTexte * w + 40], 0, "texte à gauche");
  assert.equal(b.px[ligneTexte * w + w - 40], 0, "texte dans l'ombre");
  assert.equal(b.px[12 * w + 40], 255, "fond à gauche");
  assert.equal(b.px[12 * w + w - 40], 255, "fond dans l'ombre");
});

test("une encre rouge ressort en mode « encre »", () => {
  const { rvba, w, h } = page(300, 200, { encre: [220, 40, 40] });
  const lum = sauvola(normaliserEclairage(versGris(rvba, w, h, "luminance")));
  const enc = sauvola(normaliserEclairage(versGris(rvba, w, h, "encre")));
  assert.ok(proportionNoire(enc) >= proportionNoire(lum));
  assert.equal(enc.px[1 * w + 40], 0);
});

test("le biais d'une page est estimé à moins d'un degré près", () => {
  for (const biais of [0, 3, -4]) {
    const { rvba, w, h } = page(400, 300, { biais });
    const b = sauvola(normaliserEclairage(versGris(rvba, w, h)));
    const estime = estimerInclinaison(b);
    assert.ok(Math.abs(estime - biais) <= 1, `biais ${biais} → estimé ${estime}`);
  }
});

test("le sens des lignes distingue une page à plat d'une page couchée", () => {
  const { rvba, w, h } = page(400, 300, {});
  const aPlat = sauvola(normaliserEclairage(versGris(rvba, w, h)));
  assert.equal(sensDesLignes(aPlat), "horizontal");
  // La même page tournée d'un quart de tour.
  const px = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[x * h + (h - 1 - y)] = aPlat.px[y * w + x];
  assert.equal(sensDesLignes({ px, largeur: h, hauteur: w }), "vertical");
});

test("le masque flou redonne un bord net à une transition floue", () => {
  // Une rampe douce de 200 à 40 sur 8 pixels : un bord de lettre flou.
  const px = new Uint8ClampedArray(Array.from({ length: 40 }, (_, x) => (x < 16 ? 200 : x >= 24 ? 40 : 200 - (x - 16) * 20)));
  const g = { px, largeur: 40, hauteur: 1 };
  const n = masqueFlou(g, 3, 1.5);
  const pente = (im) => Math.max(...Array.from({ length: 39 }, (_, x) => Math.abs(im.px[x + 1] - im.px[x])));
  assert.ok(pente(n) > pente(g) * 1.3, `${pente(g)} → ${pente(n)}`);
  // Loin du bord, rien ne bouge.
  assert.equal(n.px[2], 200);
});

test("mode sombre inversé, contraste étiré", () => {
  // Mode sombre : fond noir, quelques pixels de texte clair.
  const ecran = { px: new Uint8ClampedArray(Array.from({ length: 1600 }, (_, i) => (i % 20 === 0 ? 230 : 15))), largeur: 40, hauteur: 40 };
  assert.equal(inverserSiSombre(ecran).px[1], 240);
  // Photo prise dans le noir : papier gris foncé, texte encore plus foncé. Rien à inverser.
  const nuit = { px: new Uint8ClampedArray(Array.from({ length: 1600 }, (_, i) => (i % 20 === 0 ? 20 : 90))), largeur: 40, hauteur: 40 };
  assert.equal(inverserSiSombre(nuit), nuit);
  const terne = { px: new Uint8ClampedArray(Array.from({ length: 400 }, (_, i) => 100 + (i % 50))), largeur: 20, hauteur: 20 };
  const e = etirerContraste(terne);
  assert.ok(Math.max(...e.px) - Math.min(...e.px) > 200);
});

/* ------------------------------------------- réparation par clé de contrôle */

const { reparerCommunication, reparerIbanBelge } = require("../.test-build/lib/ocr-reparation.js");
const { extraireDonnees } = require("../.test-build/lib/extraction.js");

test("communication : lettres lues à la place de chiffres, corrigées par la clé", () => {
  assert.deepEqual(reparerCommunication("090933755493"), { valeur: "090933755493", repare: false });
  // O pour 0, S pour 5, I pour 1 : mêmes chiffres une fois convertis.
  assert.deepEqual(reparerCommunication("O9O9337SS493"), { valeur: "090933755493", repare: true });
});

test("communication : un chiffre confondu est réparé s'il n'y a qu'une solution", () => {
  // 3 lu 8 en 4e position : 090833755493.
  const r = reparerCommunication("090833755493");
  assert.ok(r === null || r.valeur === "090933755493", JSON.stringify(r));
  // Une suite sans clé plausible ne s'invente pas.
  assert.equal(reparerCommunication("123"), null);
});

test("IBAN belge : clé vérifiée, O/0 corrigé", () => {
  assert.deepEqual(reparerIbanBelge("BE68 5390 0754 7034"), { valeur: "BE68539007547034", repare: false });
  assert.deepEqual(reparerIbanBelge("BE68 539O O754 7O34"), { valeur: "BE68539007547034", repare: true });
});

test("extraction : une communication mal lue ressort corrigée, « à confirmer »", () => {
  const d = extraireDonnees("Communication : +++O9O/9337/SS493+++\nMontant : 37,00 EUR");
  assert.equal(d.communication.valeur, "+++090/9337/55493+++");
  assert.equal(d.communication.confiance, "moyenne");
  const juste = extraireDonnees("Communication : +++090/9337/55493+++");
  assert.equal(juste.communication.confiance, "haute");
});

test("IBAN : clé IBAN mal lue, recalculée depuis le numéro de compte", () => {
  // « BE68 » lu « BESS » : le compte passe sa propre clé, la clé IBAN s'en déduit.
  assert.deepEqual(reparerIbanBelge("BESS 5390 0754 7034"), { valeur: "BE68539007547034", repare: true });
  assert.deepEqual(extraireDonnees("IBAN : BESS 5390 0754 7034").iban.valeur, "BE68 5390 0754 7034");
  // « GE68 » : le B lu G. Même longueur qu'un IBAN belge, compte valable : c'en est un.
  assert.equal(extraireDonnees("IBAN : GE68 5390 0754 7034").iban.valeur, "BE68 5390 0754 7034");
  // Compte faux et clé fausse : rien de sûr, rien d'inventé.
  assert.equal(reparerIbanBelge("BESS 5390 0754 7035"), null);
});

test("commune : le code postal du lieu tranche quand le nom est mal lu", () => {
  const lu = "Madame Ava Diallo\nRue Haute 1\n1000 Bruxelles\nLieu du constat Rue du Bailli 12, 1050 helios\n";
  const d = extraireDonnees(lu);
  assert.equal(d.commune.valeur, "Ixelles");
  // Nom et code postal concordent : sûr, même si l'adresse du destinataire cite une autre commune.
  const net = extraireDonnees("1000 Bruxelles\nLieu du constat : Rue du Bailli 12, 1050 Ixelles\n");
  assert.equal(net.commune.valeur, "Ixelles");
  assert.equal(net.commune.confiance, "haute");
});

/* ------------------------------------------------------ feuille et perspective */

const { detecterPage, homographie, redresserPerspective, tailleRedressee } = require("../.test-build/lib/ocr-image.js");

/** Une table sombre, une feuille claire posée de biais, des lignes de texte dessus. */
function photoSurTable(w, h, coins) {
  const px = new Uint8ClampedArray(w * h).fill(55);
  const Hm = homographie([[0, 0], [199, 0], [199, 279], [0, 279]], coins);
  // On peint la feuille point par point, dans son repère à elle.
  for (let v = 0; v < 280; v += 0.5)
    for (let u = 0; u < 200; u += 0.5) {
      const d = Hm[6] * u + Hm[7] * v + Hm[8];
      const x = Math.round((Hm[0] * u + Hm[1] * v + Hm[2]) / d);
      const y = Math.round((Hm[3] * u + Hm[4] * v + Hm[5]) / d);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const texte = u > 20 && u < 180 && v > 30 && Math.floor(v) % 14 < 3;
      px[y * w + x] = texte ? 40 : 228;
    }
  return { px, largeur: w, hauteur: h };
}

test("la feuille posée de biais sur une table est trouvée, coins à quelques pixels près", () => {
  const vrais = [[70, 40], [250, 62], [262, 300], [52, 286]];
  const coins = detecterPage(photoSurTable(320, 340, vrais));
  assert.ok(coins, "feuille non trouvée");
  coins.forEach((c, k) => assert.ok(Math.hypot(c[0] - vrais[k][0], c[1] - vrais[k][1]) <= 6, `coin ${k} : ${c} au lieu de ${vrais[k]}`));
});

test("une ombre en dégradé sur une feuille n'est pas prise pour un bord de feuille", () => {
  // Feuille plein cadre, éclairée à gauche, dans l'ombre à droite, avec du texte.
  const w = 320, h = 400;
  const px = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const fond = 245 - (150 * x) / w;
      const texte = x > 20 && x < w - 20 && y % 16 < 3;
      px[y * w + x] = texte ? fond * 0.2 : fond;
    }
  assert.equal(detecterPage({ px, largeur: w, hauteur: h }), null);
});

test("pas de recadrage quand la feuille remplit déjà la photo, ni sur une image uniforme", () => {
  assert.equal(detecterPage(photoSurTable(200, 280, [[0, 0], [199, 0], [199, 279], [0, 279]])), null);
  assert.equal(detecterPage({ px: new Uint8ClampedArray(200 * 200).fill(200), largeur: 200, hauteur: 200 }), null);
});

test("l'homographie envoie chaque coin sur son image, et la feuille redressée est droite", () => {
  const de = [[0, 0], [99, 0], [99, 59], [0, 59]];
  const vers = [[10, 5], [120, 20], [110, 90], [3, 70]];
  const m = homographie(de, vers);
  de.forEach(([x, y], k) => {
    const d = m[6] * x + m[7] * y + m[8];
    assert.ok(Math.abs((m[0] * x + m[1] * y + m[2]) / d - vers[k][0]) < 1e-6);
    assert.ok(Math.abs((m[3] * x + m[4] * y + m[5]) / d - vers[k][1]) < 1e-6);
  });
  const vrais = [[70, 40], [250, 62], [262, 300], [52, 286]];
  const g = photoSurTable(320, 340, vrais);
  const rvba = new Uint8ClampedArray(g.px.length * 4);
  for (let i = 0; i < g.px.length; i++) { rvba[i * 4] = rvba[i * 4 + 1] = rvba[i * 4 + 2] = g.px[i]; rvba[i * 4 + 3] = 255; }
  const [W, H] = tailleRedressee(vrais);
  const plat = redresserPerspective(rvba, 320, 340, vrais, W, H);
  // Redressée, la feuille est claire jusque dans ses coins : plus de table autour.
  const coin = (x, y) => plat[(y * W + x) * 4];
  for (const [x, y] of [[4, 4], [W - 5, 4], [W - 5, H - 5], [4, H - 5]]) assert.ok(coin(x, y) > 180, `coin (${x},${y}) = ${coin(x, y)}`);
});
