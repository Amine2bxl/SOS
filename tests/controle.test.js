/**
 * Tests du calendrier belge, du contrôle du courrier et du solde reconstruit.
 *
 * Le contrôle dit à quelqu'un, point par point, ce qui a été vérifié. Un
 * verdict « établi » donné à tort serait pire qu'aucun contrôle : ces tests
 * figent en particulier les cas où le moteur DOIT répondre « indéterminé ».
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  dimancheDePaques,
  joursFeries,
  jourFerie,
  estJourOuvrable,
  jourOuvrablePrecedent,
} = require("../.test-build/cerveau/moteur/calendrier.js");
const {
  verifierCourrier,
  reconstruireSolde,
  communicationValide,
  plaqueBelge,
  bilanControles,
} = require("../.test-build/cerveau/moteur/controle.js");
const { analyser, calculerDelai } = require("../.test-build/cerveau/moteur/analyse.js");

const base = (extra = {}) => ({
  region: "bruxelles",
  commune: "Saint-Gilles",
  lieu: "Rue Émile Feron",
  crediteur: "parking.brussels",
  stade: "notification",
  montant: 25,
  dateConstat: "2026-03-12",
  heureConstat: "14:10",
  dateEnvoi: "2026-03-14",
  dateEcheance: "2026-04-14",
  reference: "2026/0041234",
  plaque: "1-ABC-123",
  aujourdhui: "2026-03-20",
  ...extra,
});

const point = (faits, id) => verifierCourrier(faits).find((p) => p.id === id);

/* -------------------------------------------------------------- calendrier */

test("Pâques tombe aux dates connues", () => {
  assert.equal(dimancheDePaques(2024), "2024-03-31");
  assert.equal(dimancheDePaques(2025), "2025-04-20");
  assert.equal(dimancheDePaques(2026), "2026-04-05");
  assert.equal(dimancheDePaques(2027), "2027-03-28");
});

test("dix jours fériés légaux, dont les trois mobiles", () => {
  const f = joursFeries(2026);
  assert.equal(f.length, 10);
  assert.equal(jourFerie("2026-04-06"), "Lundi de Pâques");
  assert.equal(jourFerie("2026-05-14"), "Ascension");
  assert.equal(jourFerie("2026-05-25"), "Lundi de Pentecôte");
  assert.equal(jourFerie("2026-07-21"), "Fête nationale");
  assert.equal(jourFerie("2026-07-22"), null);
});

test("jours ouvrables : ni week-end ni férié", () => {
  assert.equal(estJourOuvrable("2026-03-20"), true); // vendredi
  assert.equal(estJourOuvrable("2026-03-21"), false); // samedi
  assert.equal(estJourOuvrable("2026-11-11"), false); // Armistice
  assert.equal(jourOuvrablePrecedent("2026-11-01"), "2026-10-30"); // Toussaint un dimanche
});

/* ------------------------------------------------------------ trace du délai */

test("le délai calculé montre son calcul pas à pas", () => {
  const d = calculerDelai(base(), "notification");
  assert.equal(d.origine, "calcule");
  assert.ok(d.trace.length >= 3);
  assert.ok(d.trace.some((e) => /samedi 14 mars 2026/.test(e.valeur)));
  assert.ok(d.trace.some((e) => /10 jours calendrier/.test(e.valeur)));
});

test("un dernier jour férié est signalé sans déplacer la date", () => {
  // Envoi le 11 juillet + 10 jours = mardi 21 juillet, Fête nationale.
  const d = calculerDelai(base({ dateEnvoi: "2026-07-11" }), "notification");
  assert.equal(d.limite, "2026-07-21");
  const note = d.trace.find((e) => e.libelle === "Calendrier");
  assert.ok(note, "la trace signale le jour férié");
  assert.match(note.valeur, /Fête nationale/);
  assert.match(note.valeur, /lundi 20 juillet 2026/);
});

test("sans date calculable, aucune trace n'est inventée", () => {
  const d = calculerDelai(base({ dateEnvoi: null, dateEcheance: null }), "notification");
  assert.equal(d.origine, "inconnu");
  assert.deepEqual(d.trace, []);
});

/* --------------------------------------------------------------- contrôles */

test("communication structurée : la clé modulo 97 est vérifiée", () => {
  assert.equal(communicationValide("+++090/9337/55493+++"), true);
  assert.equal(communicationValide("+++090/9337/55494+++"), false);
  assert.equal(communicationValide("123"), null);
});

test("plaques belges : nouveau et ancien format", () => {
  assert.equal(plaqueBelge("1-ABC-123"), true);
  assert.equal(plaqueBelge("abc 123"), true);
  assert.equal(plaqueBelge("B-123-AB"), false);
});

test("un courrier complet donne des points établis", () => {
  const b = bilanControles(verifierCourrier(base()));
  assert.equal(b.anomalie, 0);
  assert.ok(b.etabli >= 8);
});

test("un constat un dimanche est une anomalie potentielle", () => {
  assert.equal(point(base({ dateConstat: "2026-03-15" }), "jour").statut, "anomalie");
  assert.equal(point(base({ dateConstat: "2026-11-11" }), "jour").statut, "anomalie");
});

test("l'heure : la nuit est une anomalie, la soirée reste indéterminée", () => {
  assert.equal(point(base({ heureConstat: "07:30" }), "heure").statut, "anomalie");
  assert.equal(point(base({ heureConstat: "19:15" }), "heure").statut, "indetermine");
  assert.equal(point(base({ heureConstat: null }), "heure").statut, "indetermine");
});

test("ce qui n'a pas été lu reste indéterminé, jamais établi", () => {
  const f = base({ reference: null, plaque: null, lieu: null, crediteur: null });
  for (const id of ["reference", "plaque", "lieu", "crediteur"]) {
    assert.equal(point(f, id).statut, "indetermine", id);
  }
});

test("des dates dans le désordre sont signalées", () => {
  assert.equal(point(base({ dateEnvoi: "2026-03-10" }), "chronologie").statut, "anomalie");
});

test("un délai laissé plus court que la procédure est une anomalie", () => {
  assert.equal(point(base({ dateEcheance: "2026-03-20" }), "delai").statut, "anomalie");
});

test("un véhicule vendu rend la plaque anomale", () => {
  assert.equal(point(base({ reponses: { vehicule: "vendu" } }), "plaque").statut, "anomalie");
});

/* --------------------------------------------------------- solde reconstruit */

test("au premier courrier, le solde est la redevance", () => {
  const s = reconstruireSolde(base());
  assert.equal(s.statut, "etabli");
  assert.equal(s.reconstruit, 25);
  assert.equal(s.ecart, 0);
});

test("rappel parking.brussels : redevance + 15 € de frais", () => {
  const ok = reconstruireSolde(base({ stade: "premier_rappel", montant: 40, montantInitial: 25 }));
  assert.equal(ok.statut, "etabli");
  assert.equal(ok.reconstruit, 40);

  const trop = reconstruireSolde(base({ stade: "premier_rappel", montant: 55, montantInitial: 25 }));
  assert.equal(trop.statut, "anomalie");
  assert.equal(trop.ecart, 15);
});

test("ce qui a déjà été payé est déduit", () => {
  const s = reconstruireSolde(base({ stade: "premier_rappel", montant: 40, montantInitial: 25, dejaPaye: 25 }));
  assert.equal(s.reconstruit, 15);
  assert.equal(s.statut, "anomalie");
  assert.equal(s.ecart, 25);
});

test("des frais sans base connue sont isolés, pas déclarés abusifs", () => {
  const s = reconstruireSolde(base({ stade: "courrier_huissier", montant: 180, montantInitial: 25 }));
  assert.equal(s.statut, "indetermine");
  const frais = s.lignes.find((l) => /huissier/.test(l.libelle));
  assert.equal(frais.montant, 155);
  assert.doesNotMatch(s.conclusion, /abusi|illégal/i);
});

test("sans le montant d'origine, le solde d'un rappel est indéterminé", () => {
  const s = reconstruireSolde(base({ stade: "premier_rappel", montant: 40 }));
  assert.equal(s.statut, "indetermine");
  assert.equal(s.reconstruit, null);
});

test("l'analyse embarque les contrôles et les compte", () => {
  const a = analyser(base());
  assert.ok(a.controles.length >= 9);
  assert.ok(a.verifications > a.controles.length);
});
