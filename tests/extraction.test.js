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
const {
  extraireDonnees,
  tauxDeReconnaissance,
  champsAVerifier,
} = require("../.test-build/lib/extraction.js");

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

/* -------------------------------------------------------------------------- */
/*  Les champs que le formulaire de contestation réclame                      */
/* -------------------------------------------------------------------------- */

test("heure, lieu, zone et communication structurée sont extraits du courrier", () => {
  const d = extraireDonnees(`parking.brussels
REDEVANCE DE STATIONNEMENT
Référence : 2026/4471820
Véhicule 1-ABC-123
Date du constat : 12/03/2026 à 14h27
Lieu du constat : Chaussée d'Ixelles 145, 1050 Ixelles
Zone verte
Montant à payer : 25,00 €
Virement sur le compte BE68 5390 0754 7034
Communication : +++090/9337/55493+++`);

  assert.equal(d.heureConstat.valeur, "14:27");
  assert.ok(d.lieuConstat.valeur.includes("Chaussée d'Ixelles 145"));
  assert.equal(d.zone.valeur, "Verte");
  assert.equal(d.communication.valeur, "+++090/9337/55493+++");
  assert.equal(d.iban.valeur, "BE68 5390 0754 7034");
});

test("une communication structurée valide est reconnue comme sûre", () => {
  // 090933755493 : 0909337554 modulo 97 vaut bien 93.
  const bonne = extraireDonnees("Communication +++090/9337/55493+++");
  assert.equal(bonne.communication.confiance, "haute");

  // Même forme, clé de contrôle fausse : la valeur est gardée mais signalée.
  const douteuse = extraireDonnees("Communication +++090/9337/55401+++");
  assert.equal(douteuse.communication.valeur, "+++090/9337/55401+++");
  assert.equal(douteuse.communication.confiance, "moyenne");
});

test("la date d'envoi du courrier est distinguée de celle du constat", () => {
  const d = extraireDonnees(`Fait à Bruxelles, le 20/03/2026
Date du constat : 12/03/2026
Véhicule 1-ABC-123`);

  assert.equal(d.dateEnvoi.valeur, "2026-03-20");
  assert.equal(d.dateConstat.valeur, "2026-03-12");
});

test("le format de date ISO des documents générés est lu", () => {
  const d = extraireDonnees("Date du constat : 2026-03-12\nPlaque 1-ABC-123");
  assert.equal(d.dateConstat.valeur, "2026-03-12");
});

test("aucune heure n'est inventée quand le document n'en porte pas", () => {
  const d = extraireDonnees("Référence 2026/1234567\nPlaque 1-ABC-123\nMontant : 25,00 €");
  assert.equal(d.heureConstat.valeur, null);
  assert.equal(d.communication.valeur, null);
  assert.equal(d.iban.valeur, null);
});

test("les champs peu sûrs sont listés pour être vérifiés en priorité", () => {
  const d = extraireDonnees(`RED VANCE
1 ABC 123
12/03/2026
25,00`);
  const aVerifier = champsAVerifier(d);
  assert.ok(Array.isArray(aVerifier));
  // Une date sans libellé est retenue mais signalée comme peu sûre.
  assert.ok(aVerifier.includes("la date du constat"));
});
