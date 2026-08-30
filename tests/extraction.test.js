/**
 * Tests du moteur d'extraction.
 *
 * C'est la partie la plus risquée du produit : une date d'échéance mal lue
 * peut faire rater un délai légal à un utilisateur. Ces cas figent le
 * comportement attendu, y compris sur des documents dégradés ou en
 * néerlandais.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { extraireDonnees, tauxDeReconnaissance } = require("../.test-build/extraction.js");

test("redevance parking.brussels en français", () => {
  const d = extraireDonnees(`parking.brussels
Agence du stationnement de la Région de Bruxelles-Capitale
REDEVANCE DE STATIONNEMENT
Référence : 2026/4471820
Votre véhicule immatriculé 1-ABC-123 a fait l'objet d'un constat
Date du constat : 12/03/2026 à 14h27
Lieu : Chaussée d'Ixelles 145, 1050 Ixelles
Montant à payer : 25,00 €
À payer avant le 11/04/2026`);

  assert.equal(d.reference.valeur, "2026/4471820");
  assert.equal(d.montant.valeur, 25);
  assert.equal(d.plaque.valeur, "1-ABC-123");
  assert.equal(d.commune.valeur, "Ixelles");
  assert.equal(d.dateConstat.valeur, "2026-03-12");
  assert.equal(d.dateEcheance.valeur, "2026-04-11");
  assert.equal(d.typeDocument.valeur, "notification");
  assert.equal(tauxDeReconnaissance(d), 100);
});

test("date écrite en toutes lettres", () => {
  const d = extraireDonnees(`COMMUNE DE SCHAERBEEK
DEUXIÈME RAPPEL
Constaté le 3 novembre 2025
Plaque : 2-XYZ-456
Total : 75,50 €`);

  assert.equal(d.dateConstat.valeur, "2025-11-03");
  assert.equal(d.montant.valeur, 75.5);
  assert.equal(d.commune.valeur, "Schaerbeek");
  assert.equal(d.typeDocument.valeur, "deuxieme_rappel");
});

test("document néerlandophone", () => {
  const d = extraireDonnees(`RETRIBUTIE PARKEREN
Kenmerk: 2026/7781234
Nummerplaat 1-QRS-789
Datum vaststelling: 05/02/2026
Te betalen bedrag: 25,00 EUR
Uiterlijk: 07/03/2026`);

  assert.equal(d.reference.valeur, "2026/7781234");
  assert.equal(d.plaque.valeur, "1-QRS-789");
  assert.equal(d.dateConstat.valeur, "2026-02-05");
  assert.equal(d.dateEcheance.valeur, "2026-03-07");
});

test("le stade le plus grave prime, même si le mot « redevance » apparaît", () => {
  const d = extraireDonnees(`ÉTUDE D'HUISSIER DE JUSTICE
Signification d'une contrainte - saisie mobilière
Concerne la redevance de stationnement référence 2024/1102938
Véhicule 1-DEF-321 - Montant total : 312,45 €
Mise en demeure restée sans suite`);

  assert.equal(d.typeDocument.valeur, "courrier_huissier");
  assert.equal(d.montant.valeur, 312.45);
});

test("texte OCR dégradé : ce qui est trouvé est signalé comme peu sûr", () => {
  const d = extraireDonnees(`parkmg brussels  RED VANCE
1 ABC 123
montant  25,00
12/03/2026`);

  assert.equal(d.plaque.valeur, "1-ABC-123");
  assert.equal(d.montant.valeur, 25);
  // Aucun libellé n'identifie cette date : elle ne doit pas être présentée
  // comme certaine.
  assert.equal(d.dateConstat.confiance, "faible");
});

test("une date impossible est rejetée plutôt que devinée", () => {
  const d = extraireDonnees("Date du constat : 31/02/2026\nMontant : 25,00 €");
  assert.equal(d.dateConstat.valeur, null);
});

test("document vide : aucun champ inventé", () => {
  const d = extraireDonnees("");
  assert.equal(d.reference.valeur, null);
  assert.equal(d.montant.valeur, null);
  assert.equal(d.plaque.valeur, null);
  assert.equal(tauxDeReconnaissance(d), 0);
});

test("le montant libellé prime sur un montant plus élevé isolé", () => {
  const d = extraireDonnees(`Redevance de stationnement
Votre compte : 1250,00
Montant à payer : 25,00 €`);
  assert.equal(d.montant.valeur, 25);
  assert.equal(d.montant.confiance, "haute");
});

test("la commune au nom composé n'est pas masquée par un nom plus court", () => {
  const d = extraireDonnees("Constat effectué à Woluwe-Saint-Pierre, avenue de Tervueren");
  assert.equal(d.commune.valeur, "Woluwe-Saint-Pierre");
});
