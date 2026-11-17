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
