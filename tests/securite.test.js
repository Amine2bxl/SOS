/**
 * Tests des garde-fous d'entrée et du refus des mots de passe faibles.
 *
 * Ces vérifications doublent des contraintes posées en base. Elles sont testées
 * ici parce que ce sont elles qui décident du message affiché : une contrainte
 * Postgres qui remonte à l'écran est incompréhensible pour la personne qui
 * vient de scanner son courrier.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  estUuid,
  nombreOuNull,
  STATUTS_DOSSIER,
  TYPES_DOCUMENT,
} = require("../.test-build/lib/validation.js");
const { motDePasseTropFaible } = require("../.test-build/lib/mot-de-passe.js");
const { ibanValide, formaterIban } = require("../.test-build/lib/iban.js");

/* ------------------------------------------------------------------ UUID */

test("estUuid accepte un identifiant de dossier réel", () => {
  assert.equal(estUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301"), true);
  assert.equal(estUuid("3F2504E0-4F89-41D3-9A0C-0305E82C3301"), true);
});

test("estUuid refuse ce qui n'en est pas un", () => {
  for (const faux of [
    "",
    "3f2504e0",
    "3f2504e0-4f89-41d3-9a0c-0305e82c330",
    "3f2504e0-4f89-41d3-9a0c-0305e82c33011",
    "'; drop table dossiers; --",
    null,
    undefined,
    42,
  ]) {
    assert.equal(estUuid(faux), false, `devrait refuser ${JSON.stringify(faux)}`);
  }
});

/* --------------------------------------------------------------- nombres */

test("nombreOuNull lit les montants écrits à la belge", () => {
  assert.equal(nombreOuNull("25,00"), 25);
  assert.equal(nombreOuNull("312,45"), 312.45);
  assert.equal(nombreOuNull("1.250,00"), 1250);
  assert.equal(nombreOuNull(" 60 "), 60);
  assert.equal(nombreOuNull(42), 42);
});

test("nombreOuNull refuse hors bornes plutôt que de ramener à la borne", () => {
  // Un montant aberrant doit rester vide et être ressaisi : le ramener au
  // plafond produirait un chiffre faux présenté comme sûr.
  assert.equal(nombreOuNull("999999999", { min: 0, max: 100000 }), null);
  assert.equal(nombreOuNull("-5", { min: 0 }), null);
  assert.equal(nombreOuNull("", {}), null);
  assert.equal(nombreOuNull("abc", {}), null);
  assert.equal(nombreOuNull(null), null);
});

/* ---------------------------------------------------------------- listes */

test("les listes de valeurs correspondent aux contraintes de la base", () => {
  // Si ces listes s'écartent des contraintes SQL, l'insertion échoue en
  // production sur une erreur Postgres. Elles sont figées ici volontairement.
  assert.deepEqual(
    [...STATUTS_DOSSIER],
    [
      "nouveau",
      "a_contester",
      "contestation_envoyee",
      "en_attente_reponse",
      "accepte",
      "rejete",
      "clos",
    ],
  );
  assert.deepEqual(
    [...TYPES_DOCUMENT],
    [
      "notification",
      "premier_rappel",
      "deuxieme_rappel",
      "mise_en_demeure",
      "contrainte",
      "courrier_huissier",
    ],
  );
});

/* ---------------------------------------------------------- mots de passe */

test("les mots de passe les plus courants sont refusés", () => {
  for (const faible of ["12345678", "password", "motdepasse", "azerty123", "P@ssw0rd"]) {
    assert.ok(motDePasseTropFaible(faible), `devrait refuser « ${faible} »`);
  }
});

test("les suites et répétitions sont refusées", () => {
  assert.ok(motDePasseTropFaible("12345678"));
  assert.ok(motDePasseTropFaible("87654321"));
  assert.ok(motDePasseTropFaible("aaaaaaaa"));
});

test("un mot de passe qui reprend le nom ou l'adresse est refusé", () => {
  assert.ok(
    motDePasseTropFaible("azouzi2024!", { nom: "Azouzi" }),
    "le nom de famille ne doit pas servir de mot de passe",
  );
  assert.ok(motDePasseTropFaible("mohamed-bruxelles", { prenom: "Mohamed" }));
  // Trois lettres, c'est trop court pour conclure : on ne refuse pas.
  assert.equal(motDePasseTropFaible("lesptitsbateaux", { prenom: "Ali" }), null);
});

test("une phrase de passe ordinaire est acceptée", () => {
  for (const bon of [
    "le chat dort sur le toit",
    "Tr0is-Chameaux-Verts",
    "jaimelesfritesaucheddar",
  ]) {
    assert.equal(motDePasseTropFaible(bon), null, `devrait accepter « ${bon} »`);
  }
});

test("un mot de passe trop court est refusé avant tout le reste", () => {
  assert.match(motDePasseTropFaible("court1"), /8 caractères/);
});

/* ------------------------------------------------------------------ IBAN */

test("ibanValide accepte des IBAN dont la clé tombe juste", () => {
  // Numéros d'exemple issus de la documentation publique de la norme.
  assert.equal(ibanValide("BE68539007547034"), true);
  assert.equal(ibanValide("BE68 5390 0754 7034"), true);
  assert.equal(ibanValide("be68-5390-0754-7034"), true);
  assert.equal(ibanValide("FR1420041010050500013M02606"), true);
  assert.equal(ibanValide("NL91ABNA0417164300"), true);
});

test("ibanValide détecte un chiffre mal lu", () => {
  // C'est le cas qui compte : l'OCR confond un caractère, la forme reste
  // correcte, et seule la clé de contrôle révèle l'erreur.
  assert.equal(ibanValide("BE68539007547035"), false);
  assert.equal(ibanValide("BE68539007547043"), false);
  assert.equal(ibanValide("BE00539007547034"), false);
  assert.equal(ibanValide(""), false);
  assert.equal(ibanValide("BE68"), false);
});

test("formaterIban regroupe par quatre", () => {
  assert.equal(formaterIban("BE68539007547034"), "BE68 5390 0754 7034");
  assert.equal(formaterIban("be68 5390-0754.7034"), "BE68 5390 0754 7034");
});
