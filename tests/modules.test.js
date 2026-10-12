/**
 * Tests de la navigation de l'espace membre.
 *
 * `moduleActif` décide de l'entrée surlignée et du titre de page. Un mauvais
 * choix et l'utilisateur ne sait plus où il se trouve.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { moduleActif, MODULES } = require("../.test-build/components/app/modules.js");

test("cinq entrées, pas une de plus", () => {
  assert.equal(MODULES.length, 5);
});

test("l'accueil n'avale pas les autres pages", () => {
  assert.equal(moduleActif("/tableau-de-bord").titre, "Accueil");
  assert.equal(moduleActif("/tableau-de-bord/aide").titre, "Aide");
  assert.equal(moduleActif("/tableau-de-bord/compte").titre, "Mon compte");
  assert.equal(moduleActif("/tableau-de-bord/nouveau").titre, "Nouveau courrier");
});

test("une fiche de dossier reste rattachée à Mes dossiers", () => {
  assert.equal(moduleActif("/tableau-de-bord/dossiers").titre, "Mes dossiers");
  assert.equal(moduleActif("/tableau-de-bord/3f2504e0-4f89-41d3-9a0c-0305e82c3301").titre, "Mes dossiers");
});

test("l'adhésion appartient au compte", () => {
  assert.equal(moduleActif("/adherer").titre, "Mon compte");
});

test("aucune entrée ne sort de l'application", () => {
  for (const m of MODULES) {
    assert.ok(m.href.startsWith("/tableau-de-bord"), `${m.titre} pointe hors de l'application : ${m.href}`);
  }
});

test("une seule action principale, et chaque entrée explique à quoi elle sert", () => {
  assert.equal(MODULES.filter((m) => m.principal).length, 1);
  const adresses = MODULES.map((m) => m.href);
  assert.equal(new Set(adresses).size, adresses.length, "adresse en double");
  for (const m of MODULES) {
    assert.ok(m.phrase.length > 20, `${m.href} sans phrase d'explication`);
    assert.ok(m.court.length <= 9, `${m.href} : titre court trop long pour l'onglet`);
  }
});
