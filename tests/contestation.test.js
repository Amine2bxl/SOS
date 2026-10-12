/**
 * Tests de la complétude du profil.
 *
 * Les coordonnées du profil s'inscrivent dans chaque lettre : un profil
 * incomplet produit une lettre à trous. Ces cas figent ce qui est exigé.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");

/* -------------------------------------------------------------------------- */
/*  Le profil                                                                 */
/* -------------------------------------------------------------------------- */

const { completudeProfil, CHAMPS_PROFIL } = require("../.test-build/lib/contestation.js");

test("un profil vide n'est pas complet", () => {
  const c = completudeProfil(null);
  assert.equal(c.complet, false);
  assert.equal(c.score, 0);
  assert.equal(c.manquants.length, CHAMPS_PROFIL.length);
});

test("un profil entièrement rempli marque 100", () => {
  const c = completudeProfil({
    prenom: "Amine", nom: "Azouzi", adresse: "Rue Émile Feron 153",
    code_postal: "1060", commune: "Saint-Gilles", telephone: "+32470000000",
  });
  assert.equal(c.complet, true);
  assert.equal(c.score, 100);
  assert.deepEqual(c.manquants, []);
});

test("un champ rempli d'espaces compte comme manquant", () => {
  const c = completudeProfil({ prenom: "   ", nom: "Azouzi" });
  assert.ok(c.manquants.some((m) => m.cle === "prenom"));
});
