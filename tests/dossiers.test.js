/**
 * Tests de la « prochaine action » d'un dossier.
 *
 * C'est ce que l'utilisateur lit en premier sur son tableau de bord. Une
 * mauvaise recommandation — dire « attendez » alors que le délai file — coûte
 * un dossier. Ces cas figent l'ordre de priorité.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { prochaineAction } = require("../.test-build/lib/dossiers-format.js");

/** Date ISO située à N jours d'aujourd'hui (négatif = passé). */
function dansNJours(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const base = { id: "abc", statut: "nouveau", date_echeance: null, lettre: null };

test("un dossier neuf invite à rédiger la lettre", () => {
  const a = prochaineAction({ ...base, date_echeance: dansNJours(20) });
  assert.equal(a.action, "Rédiger votre contestation");
  assert.equal(a.lien, "/tableau-de-bord/lettre?dossier=abc");
  assert.equal(a.ton, "attention");
});

test("un délai serré fait passer le ton à l'urgence", () => {
  const a = prochaineAction({ ...base, date_echeance: dansNJours(3) });
  assert.equal(a.ton, "urgent");
  assert.match(a.raison, /3 jours/);
});

test("un délai dépassé prime sur l'étape théorique", () => {
  const a = prochaineAction({ ...base, statut: "a_contester", date_echeance: dansNJours(-4) });
  assert.equal(a.action, "Nous contacter sans attendre");
  assert.equal(a.ton, "urgent");
  assert.match(a.raison, /dépassé depuis 4 jours/);
});

test("une contestation déjà envoyée n'est pas déclarée en retard", () => {
  const a = prochaineAction({
    ...base,
    statut: "contestation_envoyee",
    date_echeance: dansNJours(-10),
  });
  assert.equal(a.action, "Attendre la réponse");
  assert.equal(a.ton, "neutre");
});

test("une lettre déjà rédigée fait passer à l'envoi", () => {
  const a = prochaineAction({ ...base, lettre: "Madame, Monsieur…", date_echeance: dansNJours(15) });
  assert.equal(a.action, "Envoyer votre contestation");
  assert.equal(a.lien, "/tableau-de-bord/abc");
});

test("un dossier accepté ou clos ne demande plus rien", () => {
  for (const statut of ["accepte", "clos"]) {
    const a = prochaineAction({ ...base, statut });
    assert.equal(a.action, "Rien à faire");
    assert.equal(a.ton, "termine");
  }
});

test("un rejet demande une décision, pas un paiement automatique", () => {
  const a = prochaineAction({ ...base, statut: "rejete" });
  assert.equal(a.action, "Décider de la suite");
  assert.equal(a.ton, "attention");
});

test("sans date d'échéance, aucune urgence n'est inventée", () => {
  const a = prochaineAction(base);
  assert.equal(a.ton, "attention");
  assert.doesNotMatch(a.raison, /jour/);
});
