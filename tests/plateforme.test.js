/**
 * Tests des briques ajoutées après l'audit : formulaire de contact, mandat,
 * versions des documents juridiques, revue de presse.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { validerMessage, sujetValide, DUREE_MINIMALE_MS } = require("../.test-build/lib/contact.js");
const { validerMandat, etatMandat } = require("../.test-build/lib/mandats.js");
const { documentsManquants, DOCUMENTS_LEGAUX } = require("../.test-build/lib/versions-legales.js");
const { ARTICLES, ARTICLES_TRIES, articleParSlug, referenceSource } = require("../.test-build/lib/presse.js");

/* ---------------------------------------------------------------- contact */

const message = (extra = {}) => ({
  nom: "Awa Diallo",
  email: "awa@example.be",
  sujet: "redevance",
  message: "J'ai reçu une redevance à Ixelles alors que j'avais payé par l'application.",
  consentement: "on",
  site_web: "",
  ouvert_le: String(Date.now() - 60_000),
  ...extra,
});

test("contact : un message complet passe", () => {
  const r = validerMessage(message());
  assert.equal(r.ok, true);
  assert.equal(r.valeur.email, "awa@example.be");
});

test("contact : le champ piège trahit un robot, sans message d'erreur", () => {
  const r = validerMessage(message({ site_web: "http://spam.example" }));
  assert.equal(r.ok, false);
  assert.equal(r.robot, true);
});

test("contact : un envoi en moins de trois secondes est un robot", () => {
  const maintenant = Date.now();
  const r = validerMessage(message({ ouvert_le: String(maintenant - DUREE_MINIMALE_MS + 500) }), maintenant);
  assert.equal(r.robot, true);
});

test("contact : chaque champ manquant nomme le problème", () => {
  assert.equal(validerMessage(message({ email: "pas-une-adresse" })).champ, "email");
  assert.equal(validerMessage(message({ sujet: "piratage" })).champ, "sujet");
  assert.equal(validerMessage(message({ message: "Trop court" })).champ, "message");
  assert.equal(validerMessage(message({ consentement: undefined })).champ, "consentement");
});

test("contact : seuls les sujets connus passent", () => {
  assert.equal(sujetValide("sac"), true);
  assert.equal(sujetValide("autre"), true);
  assert.equal(sujetValide("<script>"), false);
});

/* ----------------------------------------------------------------- mandat */

test("mandat : sans accord explicite, rien", () => {
  const r = validerMandat({ portee: ["consulter"], jours: 90 });
  assert.equal(r.ok, false);
});

test("mandat : la consultation est toujours comprise, l'inconnu ignoré", () => {
  const r = validerMandat({ portee: ["correspondre", "tout"], jours: 30, accord: true });
  assert.equal(r.ok, true);
  assert.deepEqual(r.valeur.portee, ["consulter", "correspondre"]);
});

test("mandat : une durée hors liste est refusée", () => {
  assert.equal(validerMandat({ portee: [], jours: 9999, accord: true }).ok, false);
});

test("mandat : actif, échu, retiré", () => {
  const m = { id: "1", dossier_id: "d", portee: ["consulter"], message: null, accorde_le: "2026-01-01T00:00:00Z", expire_le: "2026-12-31T00:00:00Z", revoque_le: null };
  assert.equal(etatMandat(null), "aucun");
  assert.equal(etatMandat(m, Date.parse("2026-06-01")), "actif");
  assert.equal(etatMandat(m, Date.parse("2027-01-02")), "expire");
  assert.equal(etatMandat({ ...m, revoque_le: "2026-02-01T00:00:00Z" }, Date.parse("2026-06-01")), "revoque");
});

/* --------------------------------------------------- documents juridiques */

test("consentements : seule la version en vigueur compte", () => {
  assert.deepEqual(documentsManquants([]).sort(), ["cgu", "confidentialite"]);
  const anciens = [{ document: "cgu", version: "CGU-2020-01-01" }];
  assert.ok(documentsManquants(anciens).includes("cgu"));
  const a_jour = [
    { document: "cgu", version: DOCUMENTS_LEGAUX.cgu.version },
    { document: "confidentialite", version: DOCUMENTS_LEGAUX.confidentialite.version },
  ];
  assert.deepEqual(documentsManquants(a_jour), []);
});

/* -------------------------------------------------------- revue de presse */

test("presse : des slugs uniques, des sources complètes", () => {
  const slugs = new Set(ARTICLES.map((a) => a.slug));
  assert.equal(slugs.size, ARTICLES.length);
  for (const a of ARTICLES) {
    assert.match(a.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(a.source.titre && a.source.journal, a.slug);
    assert.ok(a.resume.length >= 1, a.slug);
  }
});

test("presse : du plus récent au plus ancien, référence lisible", () => {
  assert.ok(ARTICLES_TRIES[0].date >= ARTICLES_TRIES[ARTICLES_TRIES.length - 1].date);
  const a = articleParSlug("2026-10-anderlecht-33-redevances-annulees");
  assert.match(referenceSource(a), /La DH Les Sports\+.*7 octobre 2026, p\. 6, annoncé en une/);
  assert.equal(articleParSlug("inconnu"), null);
});
