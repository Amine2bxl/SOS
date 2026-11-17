/** Les chiffres de l'association : totaux, taux, communes, mois — sans donnée personnelle. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculerStatistiques } = require("../.test-build/lib/statistiques.js");

test("statistiques : statuts, taux de réussite, montants, communes et mois", () => {
  const d = (statut, montant, commune, created_at) => ({ statut, montant, commune, created_at });
  const s = calculerStatistiques(
    [
      d("accepte", 37, "Ixelles", "2026-11-03T10:00:00Z"),
      d("accepte", 50, "Ixelles", "2026-10-03T10:00:00Z"),
      d("rejete", 25, "Uccle", "2026-10-15T10:00:00Z"),
      d("a_contester", 37, null, "2026-11-10T10:00:00Z"),
      d("en_attente_reponse", 15, "Uccle", "2025-01-01T10:00:00Z"),
    ],
    [{ plan: "gratuit", created_at: "2026-11-01T00:00:00Z" }, { plan: "membre", created_at: "2026-02-01T00:00:00Z" }],
    [{ statut: "payee", montant: 70 }, { statut: "en_attente", montant: 400 }],
    new Date("2026-11-17T12:00:00Z"),
  );
  assert.deepEqual(s.dossiers, { total: 5, enCours: 1, envoyes: 1, annules: 2, rejetes: 1, clos: 0 });
  assert.equal(Math.round(s.tauxReussite * 100), 67);
  assert.deepEqual(s.montants, { conteste: 164, annule: 87 });
  assert.deepEqual(s.communes, [{ nom: "Ixelles", n: 2 }, { nom: "Uccle", n: 2 }]);
  assert.equal(s.parMois.length, 12);
  assert.equal(s.parMois[11].cle, "2026-11");
  assert.equal(s.parMois[11].n, 2);
  assert.equal(s.parMois[10].n, 2);
  assert.deepEqual(s.membres, { comptes: 2, payants: 1, nouveauxCeMois: 1 });
  assert.deepEqual(s.adhesions, { enAttente: 1, payees: 1, encaisse: 70 });
});

test("statistiques : sans réponse connue, pas de taux inventé", () => {
  assert.equal(calculerStatistiques([], [], []).tauxReussite, null);
});
