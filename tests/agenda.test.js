/**
 * L'agenda : événements des dossiers, grille du mois, liens d'agenda, flux ICS.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { evenementsDuDossier, evenementsFeries, grilleMois, lireMois, decalerMois, lienGoogle, lienOutlook, lienAbonnementGoogle, trier } = require("../.test-build/lib/agenda.js");
const { genererCalendrier, genererIcs } = require("../.test-build/cerveau/moteur/agenda.js");

const dossier = (extra = {}) => ({
  id: "d1", nom: "Ixelles", statut: "a_contester", date_constat: "2026-11-02",
  date_echeance: "2026-12-01", date_envoi_contestation: null, accuse_reception_le: null, ...extra,
});

test("un dossier à contester a sa date limite et sa date imprimée", () => {
  const evs = evenementsDuDossier(dossier(), { date: "2026-11-15", nature: "contestation" });
  assert.deepEqual(evs.map((e) => e.type).sort(), ["constat", "echeance", "echeance"]);
  assert.ok(evs.find((e) => e.date === "2026-11-15").titre.startsWith("Contester"));
});

test("un dossier envoyé : relance un mois plus tard, plus de date limite", () => {
  const evs = evenementsDuDossier(dossier({ statut: "contestation_envoyee", date_envoi_contestation: "2026-11-10" }), { date: "2026-11-15", nature: "contestation" }, 30);
  assert.equal(evs.find((e) => e.type === "relance").date, "2026-12-10");
  assert.equal(evs.some((e) => e.id === "d1-limite"), false);
});

test("un dossier clôturé ne garde que son histoire", () => {
  const evs = evenementsDuDossier(dossier({ statut: "clos" }), { date: "2026-11-15", nature: "contestation" });
  assert.deepEqual(evs.map((e) => e.type), ["constat"]);
});

test("les dix jours fériés de l'année", () => {
  const f = evenementsFeries(2026);
  assert.equal(f.length, 10);
  assert.ok(f.every((e) => e.type === "ferie"));
});

test("la grille commence un lundi et couvre tout le mois", () => {
  const g = grilleMois(2026, 10); // novembre 2026 : le 1er est un dimanche
  assert.equal(g[0].length, 7);
  assert.equal(g[0][0].iso, "2026-10-26");
  assert.equal(g[0][6].iso, "2026-11-01");
  const jours = g.flat().filter((j) => j.dansMois).length;
  assert.equal(jours, 30);
});

test("navigation entre les mois", () => {
  assert.deepEqual(lireMois("2026-02", new Date()), { annee: 2026, mois0: 1 });
  assert.deepEqual(lireMois("n'importe quoi", new Date(Date.UTC(2026, 10, 17))), { annee: 2026, mois0: 10 });
  assert.deepEqual(decalerMois(2026, 11, 1), { annee: 2027, mois0: 0 });
  assert.deepEqual(decalerMois(2026, 0, -1), { annee: 2025, mois0: 11 });
});

test("liens Google et Outlook : journée entière, lien vers le dossier", () => {
  const ev = { id: "x", date: "2026-11-30", type: "echeance", titre: "Contester — Ixelles", lien: "/tableau-de-bord/d1" };
  const g = new URL(lienGoogle(ev, "https://site.be"));
  assert.equal(g.searchParams.get("dates"), "20261130/20261201");
  assert.match(g.searchParams.get("details"), /https:\/\/site\.be\/tableau-de-bord\/d1/);
  const o = new URL(lienOutlook(ev, "https://site.be"));
  assert.equal(o.searchParams.get("allday"), "true");
  assert.match(lienAbonnementGoogle("https://site.be/api/agenda/abc.ics"), /cid=webcal%3A%2F%2Fsite\.be/);
});

test("le flux ICS réunit plusieurs événements et reste conforme", () => {
  const ics = genererCalendrier([
    { uid: "a", titre: "A", date: "2026-11-30", description: "x", rappels: [1] },
    { uid: "b", titre: "B", date: "2026-12-10", description: "y", rappels: [] },
  ], "SOS Citizens", new Date("2026-11-17T10:00:00Z"));
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2);
  assert.match(ics, /X-WR-CALNAME:SOS Citizens/);
  assert.ok(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75));
  // L'ancien fichier à un événement n'a pas bougé.
  assert.match(genererIcs({ uid: "c", titre: "C", date: "2026-11-30", description: "z" }), /BEGIN:VCALENDAR[\s\S]*BEGIN:VEVENT[\s\S]*END:VCALENDAR/);
});

test("tri : par date, la date limite avant le reste", () => {
  const t = trier([
    { id: "1", date: "2026-11-30", type: "ferie", titre: "f" },
    { id: "2", date: "2026-11-30", type: "echeance", titre: "e" },
    { id: "3", date: "2026-11-01", type: "regle", titre: "r" },
  ]);
  assert.deepEqual(t.map((e) => e.id), ["3", "2", "1"]);
});
