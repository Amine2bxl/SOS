/**
 * Les lettres s'adaptent au cas : ton, enjeu, retard, points relevés,
 * nouveaux courriers, version courte.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { composerLettre } = require("../.test-build/cerveau/moteur/lettres.js");
const { lireScenario } = require("../.test-build/cerveau/moteur/scenario.js");

const identite = { prenom: "Awa", nom: "Diallo", adresse: "Rue Haute 1", codePostal: "1000", ville: "Bruxelles" };
const faits = (extra = {}) => ({
  region: "bruxelles", commune: "Ixelles", lieu: "Rue du Bailli", crediteur: "parking.brussels",
  stade: "notification", montant: 37, dateConstat: "2026-11-03", heureConstat: "14:10",
  dateEnvoi: "2026-11-05", reference: "2026/0091234", plaque: "1-ABC-123", aujourdhui: "2026-11-08", ...extra,
});
const lettre = (f, extra = {}) => composerLettre({ type: "contestation", langue: "fr", faits: f, identite, date: "2026-11-08", ...extra });

test("une petite redevance : ton courtois, trois demandes", () => {
  const l = lettre(faits());
  assert.equal(l.ton, "courtois");
  assert.match(l.texte, /me permets de contester/);
  const demandes = l.texte.split("\n").filter((x) => /^\d\. /.test(x));
  assert.equal(demandes.length, 3);
});

test("une mise en demeure lourde : ton ferme, examen redevance par redevance", () => {
  const l = lettre(faits({ stade: "mise_en_demeure", montant: 420 }));
  assert.equal(l.ton, "ferme");
  assert.match(l.texte, /réponds à votre mise en demeure/);
  assert.match(l.texte, /examen individualisé/);
});

test("un délai dépassé est reconnu et l'examen au fond demandé", () => {
  const l = lettre(faits({ dateEnvoi: "2026-10-01", aujourdhui: "2026-11-08" }));
  assert.match(l.texte, /délai indiqué pour contester est dépassé/);
});

test("un constat un dimanche devient un point relevé, formulé prudemment", () => {
  const l = lettre(faits({ dateConstat: "2026-11-01" }));
  assert.match(l.texte, /POINTS RELEVÉS SUR LE COURRIER/);
  assert.match(l.texte, /je vous saurais gré de vérifier/);
});

test("un écart de montant est chiffré dans la lettre", () => {
  const s = lireScenario(faits({ stade: "premier_rappel", montant: 60, montantInitial: 25 }));
  assert.equal(s.ecart, 20);
  const l = lettre(faits({ stade: "premier_rappel", montant: 60, montantInitial: 25 }));
  assert.match(l.texte, /excède de 20,00 €/);
});

test("plan de paiement : mensualités calculées, pas de réserve de dette", () => {
  const l = composerLettre({ type: "echelonnement", langue: "fr", faits: faits({ montant: 300 }), identite, date: "2026-11-08" });
  assert.match(l.texte, /6 mensualités de 50 €/);
  assert.doesNotMatch(l.texte, /reconnaissance de dette/);
});

test("annulation gracieuse : la carte de riverain oubliée est expliquée", () => {
  const l = composerLettre({ type: "bonne_foi", langue: "nl", faits: faits({ reponses: { carte: "riverain" } }), identite, date: "2026-11-08" });
  assert.match(l.texte, /kwijtschelding uit coulance/);
  assert.match(l.texte, /bewonerskaart/);
});

test("la version courte tient dans un formulaire en ligne", () => {
  const l = lettre(faits({ reponses: { paiement: "app" } }));
  assert.ok(l.texteCourt.length < 1500, `${l.texteCourt.length} caractères`);
  assert.match(l.texteCourt, /Je sollicite/);
  assert.match(l.texteCourt, /Awa Diallo$/);
});
