/**
 * Tests des rappels automatiques.
 *
 * Un rappel qui ne part pas, c'est un délai raté ; un rappel qui part deux
 * fois, c'est un e-mail qu'on finit par ignorer. Ces cas figent les deux.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { rappelDu, TITRES_RAPPEL } = require("../.test-build/lib/rappels.js");
const { emailRappel } = require("../.test-build/lib/mail/gabarits.js");

function ilYa(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
const rien = new Set();
const actif = { statut: "nouveau", date_envoi_contestation: null };

test("trois jours avant l'échéance, un premier rappel", () => {
  const r = rappelDu(actif, 3, rien);
  assert.equal(r.cle, "echeance-3");
  assert.match(r.sujet, /3 jours/);
  assert.equal(r.ancre, "lettre");
});

test("la veille et le jour même, le dernier rappel", () => {
  assert.equal(rappelDu(actif, 1, rien).cle, "echeance-1");
  assert.equal(rappelDu(actif, 0, rien).cle, "echeance-1");
  assert.match(rappelDu(actif, 0, rien).sujet, /Dernier jour/);
});

test("un rappel déjà parti ne repart pas", () => {
  assert.equal(rappelDu(actif, 3, new Set([TITRES_RAPPEL["echeance-3"]])), null);
  assert.equal(rappelDu(actif, 1, new Set([TITRES_RAPPEL["echeance-1"]])), null);
  // Le rappel de la veille déjà parti rend celui des trois jours inutile.
  assert.equal(rappelDu(actif, 2, new Set([TITRES_RAPPEL["echeance-1"]])), null);
});

test("hors fenêtre, ou sans date connue, aucun rappel n'est inventé", () => {
  assert.equal(rappelDu(actif, 10, rien), null);
  assert.equal(rappelDu(actif, -2, rien), null);
  assert.equal(rappelDu(actif, null, rien), null);
});

test("une contestation sans réponse depuis un mois appelle la relance, une fois", () => {
  const envoye = { statut: "contestation_envoyee", date_envoi_contestation: ilYa(31) };
  const r = rappelDu(envoye, null, rien);
  assert.equal(r.cle, "relance");
  assert.match(r.message, /31 jours/);
  assert.equal(rappelDu(envoye, null, new Set([TITRES_RAPPEL.relance])), null);
  assert.equal(rappelDu({ ...envoye, date_envoi_contestation: ilYa(10) }, null, rien), null);
});

test("un dossier clos ou gagné ne reçoit plus rien", () => {
  for (const statut of ["accepte", "rejete", "clos"]) {
    assert.equal(rappelDu({ statut, date_envoi_contestation: ilYa(40) }, 1, rien), null);
  }
});

test("l'e-mail de rappel mène droit au dossier et échappe ce qu'il affiche", () => {
  const g = emailRappel({
    prenom: "Jeanne",
    sujet: "Plus que 3 jours pour contester",
    message: "Il reste 3 jours.",
    dossier: "Ixelles · 2026/<b>1</b>",
    lien: "https://sos-citizens.be/tableau-de-bord/abc#lettre",
    libelleLien: "Voir ma lettre",
    urlSite: "https://sos-citizens.be",
  });
  assert.match(g.sujet, /Plus que 3 jours/);
  assert.match(g.html, /tableau-de-bord\/abc#lettre/);
  assert.doesNotMatch(g.html, /<b>1<\/b>/);
  assert.match(g.texte, /Voir ma lettre : https:\/\/sos-citizens\.be\/tableau-de-bord\/abc#lettre/);
});
