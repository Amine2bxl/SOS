/**
 * Tests de la navigation des modules de l'espace membre.
 *
 * `moduleActif` décide de l'entrée surlignée dans la barre latérale et du
 * titre affiché en haut de l'application. Un mauvais choix et l'utilisateur ne
 * sait plus où il se trouve — exactement le défaut que cette refonte corrige.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  moduleActif,
  TOUS_LES_MODULES,
  MODULES_DOSSIERS,
  MODULES_OUTILS,
  MODULES_COMPTE,
} = require("../.test-build/components/app/modules.js");

test("une fiche de dossier reste rattachée au tableau de bord", () => {
  assert.equal(moduleActif("/tableau-de-bord").titre, "Tableau de bord");
  // Sans cela, l'utilisateur ouvrant un dossier ne serait plus nulle part :
  // aucune entrée surlignée et un titre générique en haut de l'application.
  assert.equal(moduleActif("/tableau-de-bord/abc-123").titre, "Tableau de bord");
});

test("le chemin le plus précis l'emporte sur le tableau de bord", () => {
  assert.equal(moduleActif("/tableau-de-bord/nouveau").titre, "Scanner un courrier");
  assert.equal(moduleActif("/tableau-de-bord/lettre").titre, "Rédiger ma lettre");
  assert.equal(moduleActif("/tableau-de-bord/regles").titre, "Règles de ma commune");
  assert.equal(moduleActif("/tableau-de-bord/abonnement").titre, "Mon abonnement");
  assert.equal(moduleActif("/tableau-de-bord/compte").titre, "Mes paramètres");
});

test("une sous-page reste rattachée à son module", () => {
  assert.equal(moduleActif("/tableau-de-bord/compte/securite").titre, "Mes paramètres");
});

test("chaque module a une adresse unique et une phrase d'explication", () => {
  const adresses = TOUS_LES_MODULES.map((m) => m.href);
  assert.equal(new Set(adresses).size, adresses.length, "adresse en double");
  for (const m of TOUS_LES_MODULES) {
    assert.ok(m.titre.length > 0, `${m.href} sans titre`);
    assert.ok(m.phrase.length > 20, `${m.href} sans phrase d'explication`);
  }
});

test("les trois groupes couvrent tous les modules, sans recouvrement", () => {
  assert.equal(
    MODULES_DOSSIERS.length + MODULES_OUTILS.length + MODULES_COMPTE.length,
    TOUS_LES_MODULES.length,
  );
});
