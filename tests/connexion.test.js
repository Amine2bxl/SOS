/**
 * Connexion par téléphone : numéros et signature du crochet SMS de Supabase.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const {
  normaliserTelephone,
  masquerTelephone,
  masquerEmail,
  emailTechnique,
  estEmailTechnique,
  emailAffichable,
  gsmBelge,
} = require("../.test-build/lib/telephone.js");
const { verifierSignatureWebhook } = require("../.test-build/lib/signature-webhook.js");

test("numéros : saisie libre, format international en sortie", () => {
  assert.equal(normaliserTelephone("0470 12 34 56"), "+32470123456");
  assert.equal(normaliserTelephone("+32 470/12.34.56"), "+32470123456");
  assert.equal(normaliserTelephone("0032470123456"), "+32470123456");
  assert.equal(normaliserTelephone("02 512 34 56"), "+3225123456");
  assert.equal(normaliserTelephone("+33 6 12 34 56 78"), "+33612345678");
});

test("numéros : ce qui n'en est pas est refusé", () => {
  assert.equal(normaliserTelephone("470123456"), null);
  assert.equal(normaliserTelephone("0470 12 34"), null);
  assert.equal(normaliserTelephone("bonjour"), null);
  assert.equal(normaliserTelephone("+32 4701234567"), null);
});

test("numéros : GSM belge et masquage", () => {
  assert.equal(gsmBelge("+32470123456"), true);
  assert.equal(gsmBelge("+3225123456"), false);
  assert.equal(masquerTelephone("+32470123456"), "+32 470 •• •• 56");
  assert.equal(masquerEmail("amine@gmail.com"), "a•••@gmail.com");
});

test("adresse technique : jamais affichée, jamais écrite", () => {
  const e = emailTechnique("1234");
  assert.ok(e.endsWith(".invalid"));
  assert.equal(estEmailTechnique(e), true);
  assert.equal(emailAffichable(e), null);
  assert.equal(emailAffichable("vrai@exemple.be"), "vrai@exemple.be");
});

/* --------------------------------------------------- signature du crochet */

const cle = crypto.randomBytes(24);
const secret = `v1,whsec_${cle.toString("base64")}`;
const signer = (id, t, corps) => `v1,${crypto.createHmac("sha256", cle).update(`${id}.${t}.${corps}`).digest("base64")}`;

test("crochet SMS : une signature valable passe", () => {
  const t = String(Math.floor(Date.now() / 1000));
  const corps = JSON.stringify({ user: { phone: "32470123456" }, sms: { otp: "123456" } });
  assert.equal(verifierSignatureWebhook({ secret, id: "msg_1", horodatage: t, signature: signer("msg_1", t, corps), corps }), true);
});

test("crochet SMS : corps modifié, vieux message ou mauvais secret refusés", () => {
  const t = String(Math.floor(Date.now() / 1000));
  const corps = '{"sms":{"otp":"123456"}}';
  const sig = signer("msg_1", t, corps);
  assert.equal(verifierSignatureWebhook({ secret, id: "msg_1", horodatage: t, signature: sig, corps: corps + " " }), false);
  const vieux = String(Math.floor(Date.now() / 1000) - 3600);
  assert.equal(verifierSignatureWebhook({ secret, id: "msg_1", horodatage: vieux, signature: signer("msg_1", vieux, corps), corps }), false);
  assert.equal(verifierSignatureWebhook({ secret: "", id: "msg_1", horodatage: t, signature: sig, corps }), false);
});
