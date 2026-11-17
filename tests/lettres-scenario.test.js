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
  assert.match(l.texte, /me permets de contester|vous écris pour contester|souhaite contester/);
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
  assert.match(l.texteCourt, /Je sollicite|Je demande|Ma demande/);
  assert.match(l.texteCourt, /Awa Diallo$/);
});

/* ------------------------------------------------- les embranchements */

const { cheminDesReponses, lirePosture, recitDesFaits, plumePour } = require("../.test-build/cerveau/moteur/redaction.js");

const corpsSeul = (l) => l.texte.split("Madame, Monsieur,")[1];

test("chaque chemin de réponses écrit sa propre lettre", () => {
  const chemins = [
    { paiement: "app", signalisation: "claire" },
    { paiement: "app", signalisation: "illisible" },
    { paiement: "non", signalisation: "illisible" },
    { paiement: "non", tentative_paiement: "horodateur_panne" },
    { paiement: "non", tentative_paiement: "non", duree: "arret" },
    { paiement: "non", tentative_paiement: "non", duree: "long", signalisation: "claire" },
    { paiement: "incertain", signalisation: "incertain" },
    { vehicule: "vendu" },
    { carte: "riverain", paiement: "non" },
    { paiement: "horodateur", doublon: "oui", deja_conteste: "sans_reponse" },
  ];
  const textes = chemins.map((r) => corpsSeul(lettre(faits({ reponses: r }))));
  assert.equal(new Set(textes).size, chemins.length, "deux chemins ont donné la même lettre");
  // Le fond change, pas seulement la forme : la demande principale suit la posture.
  assert.match(textes[7], /ne me concerne pas/);
  assert.match(textes[0], /le stationnement ayant été payé/);
  assert.match(textes[4], /simple arrêt/);
});

test("une même réponse pèse différemment selon ce qui l'entoure", () => {
  // Payé + signalisation illisible : la signalisation devient subsidiaire.
  const payeIllisible = lettre(faits({ reponses: { paiement: "app", signalisation: "illisible" } }));
  assert.match(payeIllisible.texte, /À titre subsidiaire|Quand bien même ce point ne serait pas retenu|À supposer même le contraire/);
  // Pas payé + signalisation illisible : elle devient la cause du non-paiement.
  const nonIllisible = lettre(faits({ reponses: { paiement: "non", signalisation: "illisible" } }));
  assert.match(nonIllisible.texte, /faute d'avoir pu comprendre que la zone était payante|c'est la raison pour laquelle je n'ai pas payé/);
  assert.doesNotMatch(nonIllisible.texte, /À titre subsidiaire/);
});

test("hors de cause : le reste du récit est écarté", () => {
  const f = faits({ reponses: { vehicule: "vendu", paiement: "non", signalisation: "illisible" } });
  assert.equal(lirePosture(f.reponses), "hors_cause");
  const recit = recitDesFaits(f, plumePour(f, "contestation")).map((p) => p.fr).join(" ");
  assert.match(recit, /vendu/);
  assert.doesNotMatch(recit, /signalisation/);
});

test("quand on doute, les photos sont demandées en premier", () => {
  const l = lettre(faits({ reponses: { paiement: "incertain" } }));
  const demandes = l.texte.split("\n").filter((x) => /^\d\. /.test(x));
  assert.match(demandes[0], /photographies originales/);
});

test("deux dossiers au même chemin ne se ressemblent pas, et chacun se régénère à l'identique", () => {
  const r = { paiement: "non", tentative_paiement: "non", duree: "long", signalisation: "claire" };
  const refs = ["530329628051", "530329628052", "530329628053", "530329628054", "2026/0091234"];
  const lettres = refs.map((reference) => lettre(faits({ reference, reponses: r })).texte.replace(new RegExp(reference.replace("/", "\\/"), "g"), "REF"));
  assert.ok(new Set(lettres).size >= 3, `seulement ${new Set(lettres).size} rédactions pour 5 dossiers`);
  assert.equal(lettre(faits({ reference: refs[0], reponses: r })).texte, lettre(faits({ reference: refs[0], reponses: r })).texte);
});

test("le chemin des réponses suit l'ordre du récit", () => {
  assert.equal(cheminDesReponses({ signalisation: "illisible", paiement: "non" }), "paiement=non;signalisation=illisible");
});

test("la version courte, celle du formulaire de parking.brussels, raconte aussi ce cas-ci", () => {
  const a = lettre(faits({ reponses: { paiement: "non", tentative_paiement: "horodateur_panne" } }));
  const b = lettre(faits({ reponses: { paiement: "non", duree: "arret" } }));
  assert.match(a.texteCourt, /horodateur/);
  assert.match(b.texteCourt, /quelques minutes|arrêt/);
  assert.notEqual(a.texteCourt, b.texteCourt);
  assert.ok(a.texteCourt.length < 1500 && b.texteCourt.length < 1500);
});

test("la lettre néerlandaise du chemin « pas payé + horodateur en panne » reste entièrement en néerlandais", () => {
  const l = composerLettre({
    type: "contestation",
    langue: "nl",
    faits: faits({ reponses: { paiement: "non", tentative_paiement: "horodateur_panne", signalisation: "illisible" } }),
    identite,
    date: "2026-11-08",
  });
  assert.match(l.texte, /parkeerautomaat/);
  assert.doesNotMatch(l.texte, /redevance|horodateur|Madame/);
});

test("une lettre néerlandaise annonce chaque pièce en néerlandais", () => {
  const { MOYENS } = require("../.test-build/cerveau/base/moyens.js");
  const l = composerLettre({ type: "contestation", langue: "nl", faits: faits(), identite, date: "2026-11-08", moyens: MOYENS.map((m) => m.id) });
  for (const a of l.annexes) assert.doesNotMatch(a, /Copie|Photo|Preuve|Relevé|Tout élément|Acte|Attestation/, a);
});
