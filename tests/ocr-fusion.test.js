/**
 * Tests de la fusion des lectures et du contrôle de cohérence.
 *
 * Deux mécanismes qui servent le même but : qu'un champ faux ne soit jamais
 * présenté comme sûr. L'utilisateur valide ce que l'écran affiche ; si une date
 * d'échéance mal lue sort en confiance « haute », elle est validée sans être
 * relue, et c'est un délai raté.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extraireDonnees,
  extraireDeTextes,
  fusionnerExtractions,
  verifierCoherence,
} = require("../.test-build/lib/extraction.js");

/* ---------------------------------------------------------------- fusion */

test("la fusion récupère un champ absent de la meilleure lecture", () => {
  // Cas réel : le reflet du flash efface la plaque sur la tentative la plus
  // riche, mais pas sur celle prise à 180°.
  const riche = extraireDonnees(`parking.brussels
REDEVANCE DE STATIONNEMENT
Référence : 2026/0041234
Montant total : 25,00 EUR
Date du constat : 12/03/2026
Commune : Saint-Gilles`);

  const pauvre = extraireDonnees(`Plaque : 1-ABC-123
Rue Émile Feron 153`);

  assert.equal(riche.plaque.valeur, null, "la lecture riche n'a pas vu la plaque");

  const fusion = fusionnerExtractions([riche, pauvre]);
  assert.equal(fusion.plaque.valeur, "1-ABC-123");
  // Et elle ne perd rien de ce que la première avait trouvé.
  assert.equal(fusion.reference.valeur, "2026/0041234");
  assert.equal(fusion.montant.valeur, 25);
});

test("la fusion préfère la valeur la plus sûre", () => {
  const avecLibelle = extraireDonnees("Date du constat : 12/03/2026");
  const sansLibelle = extraireDonnees("04/01/2026 quelque part dans le document");

  assert.equal(avecLibelle.dateConstat.confiance, "haute");
  assert.equal(sansLibelle.dateConstat.confiance, "faible");

  // L'ordre d'arrivée ne doit rien changer : c'est la confiance qui tranche.
  for (const liste of [
    [avecLibelle, sansLibelle],
    [sansLibelle, avecLibelle],
  ]) {
    assert.equal(fusionnerExtractions(liste).dateConstat.valeur, "2026-03-12");
  }
});

test("à confiance égale, la première lecture l'emporte", () => {
  // La première est celle que la note globale de l'OCR a désignée comme la
  // meilleure : à égalité, c'est elle qui doit gagner.
  const a = extraireDonnees("Date du constat : 12/03/2026");
  const b = extraireDonnees("Date du constat : 03/05/2026");
  assert.equal(fusionnerExtractions([a, b]).dateConstat.valeur, "2026-03-12");
  assert.equal(fusionnerExtractions([b, a]).dateConstat.valeur, "2026-05-03");
});

test("la fusion d'une liste vide ou unique ne casse rien", () => {
  assert.equal(fusionnerExtractions([]).montant.valeur, null);
  const seule = extraireDonnees("Montant total : 25,00 EUR");
  assert.equal(fusionnerExtractions([seule]).montant.valeur, 25);
});

test("extraireDeTextes rapproche un libellé et sa valeur situés sur deux pages", () => {
  // Un PDF de redevance met régulièrement le libellé en bas d'une page et la
  // valeur en haut de la suivante. Seule la concaténation les rapproche.
  const d = extraireDeTextes(["Payer avant le", "15/04/2026\nIBAN BE68 5390 0754 7034"]);
  assert.equal(d.dateEcheance.valeur, "2026-04-15");
  assert.equal(d.iban.valeur, "BE68 5390 0754 7034");
});

test("extraireDeTextes supporte l'absence totale de texte", () => {
  const d = extraireDeTextes(["", "   "]);
  assert.equal(d.montant.valeur, null);
  assert.equal(d.plaque.valeur, null);
});

/* ------------------------------------------------------------- cohérence */

test("une échéance antérieure au constat fait tomber la confiance", () => {
  const brut = extraireDonnees(`Date du constat : 12/03/2026
Payer avant le 04/01/2026`);
  assert.equal(brut.dateEcheance.confiance, "haute", "prise seule, elle paraît sûre");

  const verifie = verifierCoherence(brut);
  assert.equal(verifie.dateEcheance.confiance, "faible");
  assert.equal(verifie.dateConstat.confiance, "faible");
  // Les valeurs sont conservées : on signale, on ne devine pas à la place.
  assert.equal(verifie.dateEcheance.valeur, "2026-01-04");
});

test("un ordre de dates cohérent garde sa confiance", () => {
  const verifie = verifierCoherence(
    extraireDonnees(`Date du constat : 12/03/2026
Payer avant le 15/04/2026`),
  );
  assert.equal(verifie.dateConstat.confiance, "haute");
  assert.equal(verifie.dateEcheance.confiance, "haute");
});

test("un montant hors de la plage plausible est signalé", () => {
  // Trop grand : un chiffre collé à un autre, ou une référence prise pour un
  // montant. Aucune redevance de stationnement bruxelloise n'atteint ce niveau,
  // frais de recouvrement compris.
  const trop = verifierCoherence(extraireDonnees("Montant total à payer : 9999,00 EUR"));
  assert.equal(trop.montant.valeur, 9999);
  assert.equal(trop.montant.confiance, "faible");

  // Trop petit : un montant tronqué.
  const peu = verifierCoherence(extraireDonnees("Montant total à payer : 0,50 EUR"));
  assert.equal(peu.montant.confiance, "faible");
});

test("un montant de redevance ordinaire n'est pas signalé", () => {
  const verifie = verifierCoherence(extraireDonnees("Montant total à payer : 25,00 EUR"));
  assert.equal(verifie.montant.valeur, 25);
  assert.equal(verifie.montant.confiance, "haute");
});

test("un tarif de base sur un courrier d'huissier est suspect", () => {
  // À ce stade de la procédure, des frais s'ajoutent toujours : 25 € est le
  // tarif rappelé, pas la somme réclamée.
  const verifie = verifierCoherence(
    extraireDonnees(`EXPLOIT D'HUISSIER DE JUSTICE
Montant total à payer : 25,00 EUR`),
  );
  assert.equal(verifie.typeDocument.valeur, "courrier_huissier");
  assert.equal(verifie.montant.confiance, "faible");
});

/* ------------------------------------------------------------------ IBAN */

test("un IBAN dont la clé est fausse sort en confiance faible", () => {
  const juste = extraireDonnees("IBAN : BE68 5390 0754 7034");
  assert.equal(juste.iban.valeur, "BE68 5390 0754 7034");
  assert.equal(juste.iban.confiance, "haute");

  // Un chiffre mal lu : la forme est intacte, seule la clé le révèle.
  const faux = extraireDonnees("IBAN : BE68 5390 0754 7035");
  assert.equal(faux.iban.confiance, "faible");
});

/* ---------------------------------------------------------------- plaque */

test("une pseudo-plaque hors série belge est signalée", () => {
  // La série européenne belge va de 1 à 2 : un « 7-ABC-123 » n'existe pas, et
  // c'est presque toujours un numéro de dossier mal découpé.
  assert.equal(extraireDonnees("1-ABC-123").plaque.confiance, "haute");
  assert.equal(extraireDonnees("2-XYZ-987").plaque.confiance, "haute");
  assert.equal(extraireDonnees("7-ABC-123").plaque.confiance, "faible");
});
