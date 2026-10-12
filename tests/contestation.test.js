/**
 * Tests de la complétude d'un dossier de contestation.
 *
 * Une contestation rejetée sur la forme est un dossier perdu pour rien. Ces
 * cas figent ce que le site considère comme bloquant, et le calcul du délai —
 * dix jours, qui passent vite.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  evaluerDossier,
  echeanceContestation,
  EXIGENCES,
  DELAI_CONTESTATION_JOURS,
} = require("../.test-build/lib/contestation.js");

/** Saisie vierge : chaque champ présent, aucun rempli. */
const SAISIE_VIDE = {
  prenom: "", nom: "", adresse: "", codePostal: "", ville: "", email: "", telephone: "",
  plaque: "", titulaireAutre: "", reference: "", communication: "", dateConstat: "", heureConstat: "",
  lieuConstat: "", communeConstat: "", montant: "", motif: "", explication: "", dejaPaye: false,
  ibanRemboursement: "",
};

/** Un dossier auquel il ne manque rien de bloquant. */
const COMPLET = {
  ...SAISIE_VIDE,
  prenom: "Amine", nom: "Azouzi",
  adresse: "Rue Émile Feron 153", codePostal: "1060", ville: "Saint-Gilles",
  email: "a@example.com", telephone: "+32470000000",
  plaque: "1-ABC-123",
  reference: "2026/123456", communication: "+++123/4567/89012+++",
  dateConstat: "2026-03-12", heureConstat: "14:10",
  lieuConstat: "Rue du Bailli 42", communeConstat: "Ixelles",
  montant: "25", explication: "J'avais payé depuis l'application à 14h02.",
};

test("un dossier vide n'est pas envoyable et le dit", () => {
  const e = evaluerDossier(SAISIE_VIDE);
  assert.equal(e.envoyable, false);
  assert.ok(e.bloquants.length > 0);
  assert.ok(e.score < 20);
});

test("un dossier complet est envoyable et marque 100", () => {
  const e = evaluerDossier(COMPLET);
  assert.equal(e.envoyable, true);
  assert.deepEqual(e.bloquants, []);
  assert.equal(e.score, 100);
});

test("la plaque manquante bloque l'envoi", () => {
  const e = evaluerDossier({ ...COMPLET, plaque: "" });
  assert.equal(e.envoyable, false);
  assert.ok(e.bloquants.some((b) => b.cle === "plaque"));
});

test("un recommandé manquant n'empêche pas l'envoi mais est signalé", () => {
  const e = evaluerDossier({ ...COMPLET, telephone: "" });
  assert.equal(e.envoyable, true);
  assert.ok(e.recommandes.some((r) => r.cle === "telephone"));
  assert.ok(e.score < 100 && e.score > 90);
});

test("chaque exigence explique pourquoi elle est demandée", () => {
  for (const x of EXIGENCES) {
    assert.ok(x.pourquoi.length > 20, `${x.cle} sans justification`);
    assert.ok(["bloquant", "recommande"].includes(x.niveau));
  }
});

test("les pièces attendues suivent le motif retenu", () => {
  const paiement = evaluerDossier({ ...COMPLET, motif: "paiement" });
  const plaque = evaluerDossier({ ...COMPLET, motif: "erreur_plaque" });
  assert.notDeepEqual(paiement.pieces, plaque.pieces);
  assert.ok(paiement.pieces.includes("Copie du courrier reçu"));
});

test("un paiement déjà effectué ajoute la preuve à joindre", () => {
  const e = evaluerDossier({ ...COMPLET, dejaPaye: true });
  assert.ok(e.pieces.includes("Preuve du paiement déjà effectué"));
});

test("le délai de contestation court sur dix jours", () => {
  const e = echeanceContestation("2026-03-10", new Date("2026-03-12T09:00:00Z"));
  assert.equal(e.limite, "2026-03-20");
  assert.equal(e.joursRestants, 8);
  assert.equal(e.depasse, false);
  assert.equal(DELAI_CONTESTATION_JOURS, 10);
});

test("un délai dépassé est signalé comme tel", () => {
  const e = echeanceContestation("2026-03-01", new Date("2026-03-20T09:00:00Z"));
  assert.equal(e.depasse, true);
  assert.ok(e.joursRestants < 0);
});

test("sans date d'envoi, aucune échéance n'est inventée", () => {
  assert.equal(echeanceContestation(""), null);
  assert.equal(echeanceContestation("pas une date"), null);
});

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
