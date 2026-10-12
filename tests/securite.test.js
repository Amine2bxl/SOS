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

/* ------------------------------------------------------- e-mail canonique */

const { canoniserEmail, domaineJetable, emailValide } = require("../.test-build/lib/email-canonique.js");

test("la forme canonique ramène les variantes Gmail à une seule adresse", () => {
  // Mêmes entrées que celles vérifiées sur la fonction SQL public.canoniser_email :
  // les deux implémentations doivent rester identiques.
  assert.equal(canoniserEmail("Jean.Dupont+sos@GoogleMail.com"), "jeandupont@gmail.com");
  assert.equal(canoniserEmail("jean.dupont@gmail.com"), "jeandupont@gmail.com");
  assert.equal(canoniserEmail("marie+test@proton.me"), "marie@proton.me");
  // Hors Gmail, les points comptent : on ne les retire pas.
  assert.equal(canoniserEmail("a.b@outlook.be"), "a.b@outlook.be");
});

test("les boîtes jetables sont refusées, les vraies acceptées", () => {
  assert.equal(domaineJetable("x@yopmail.com"), true);
  assert.equal(domaineJetable("x@mailinator.com"), true);
  assert.equal(domaineJetable("x@gmail.com"), false);
  assert.equal(domaineJetable("x@skynet.be"), false);
});

test("la forme d'adresse est vérifiée sans excès de zèle", () => {
  assert.equal(emailValide("jeanne@exemple.be"), true);
  assert.equal(emailValide("j.d+tag@sous.domaine.org"), true);
  assert.equal(emailValide("pas-une-adresse"), false);
  assert.equal(emailValide("a@b"), false);
  assert.equal(emailValide("a..b@exemple.be"), false);
});

/* ------------------------------------------------- adresse de retour */

const { cheminSur } = require("../.test-build/lib/chemin-sur.js");

test("l'adresse de retour reste sur le site", () => {
  assert.equal(cheminSur("/tableau-de-bord/nouveau?reprise=1"), "/tableau-de-bord/nouveau?reprise=1");
  assert.equal(cheminSur("/adherer"), "/adherer");
  // Adresses absolues déguisées : un navigateur les suivrait hors du site.
  for (const piege of ["//exemple.com", "/\\exemple.com", "/\texemple.com", "/\t/exemple.com", "https://exemple.com", "exemple.com", "", null, 42]) {
    assert.equal(cheminSur(piege), "/tableau-de-bord", `devrait refuser ${JSON.stringify(piege)}`);
  }
});
