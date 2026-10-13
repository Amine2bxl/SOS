/**
 * Tests du gabarit d'e-mail de confirmation.
 *
 * L'enjeu est simple mais critique : si le code à 6 chiffres n'apparaît pas
 * dans le message, personne ne peut activer son compte — c'est exactement la
 * panne qui a motivé ce travail. Ces cas figent le contrat du gabarit.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { emailConfirmation } = require("../.test-build/lib/mail/gabarits.js");

const BASE = { code: "482913", urlSite: "https://sos-citizens.be" };

test("le code figure dans l'objet, le HTML et la version texte", () => {
  const { sujet, html, texte } = emailConfirmation({ ...BASE, prenom: "Amine" });
  assert.ok(sujet.includes("482913"), "objet sans le code");
  assert.ok(html.includes("482913"), "HTML sans le code");
  assert.ok(texte.includes("482913"), "texte sans le code");
});

test("le prénom personnalise le message", () => {
  const { html, texte } = emailConfirmation({ ...BASE, prenom: "Amine" });
  assert.ok(html.includes("Bonjour Amine"));
  assert.ok(texte.startsWith("Bonjour Amine"));
});

test("sans prénom, la formule reste correcte", () => {
  const { html } = emailConfirmation({ ...BASE, prenom: null });
  assert.ok(html.includes("Bonjour, bienvenue"));
  assert.ok(!html.includes("Bonjour null"));
});

test("l'identité de l'association et le lien du site sont présents", () => {
  const { html } = emailConfirmation({ ...BASE, prenom: "Amine" });
  assert.ok(html.includes("SOS Citizens ASBL"));
  assert.ok(html.includes("Rue Émile Feron 153"));
  assert.ok(html.includes("https://sos-citizens.be/logo-email.png"));
});

test("un prénom contenant du HTML est échappé", () => {
  const { html } = emailConfirmation({
    ...BASE,
    prenom: '<script>alert("x")</script>',
  });
  assert.ok(!html.includes("<script>"), "balise injectée telle quelle");
  assert.ok(html.includes("&lt;script&gt;"));
});

test("le lien de secours n'apparaît que s'il est fourni", () => {
  const avec = emailConfirmation({
    ...BASE,
    lienConfirmation: "https://sos-citizens.be/auth/confirm?token_hash=abc&type=signup",
  });
  assert.ok(avec.html.includes("token_hash=abc"));
  assert.ok(avec.texte.includes("token_hash=abc"));

  const sans = emailConfirmation({ ...BASE });
  assert.ok(!sans.html.includes("token_hash"));
  assert.ok(!sans.texte.includes("simple clic"));
});

/* ------------------------------------------------ par où partent les e-mails */

const { canalEnvoi } = require("../.test-build/lib/mail/canal.js");

test("sans configuration, aucun canal : l'appelant retombe sur Supabase", () => {
  assert.equal(canalEnvoi({}), null);
  assert.equal(canalEnvoi({ SMTP_USER: "asbl@gmail.com" }), null, "mot de passe manquant");
  assert.equal(canalEnvoi({ SMTP_USER: "  ", SMTP_PASSWORD: "  " }), null, "valeurs vides");
});

test("Gmail : un compte et un mot de passe d'application suffisent", () => {
  const canal = canalEnvoi({ SMTP_USER: "sos.citizens@gmail.com", SMTP_PASSWORD: "abcd efgh ijkl mnop" });
  assert.deepEqual(canal, {
    type: "smtp",
    hote: "smtp.gmail.com",
    port: 465,
    securise: true,
    utilisateur: "sos.citizens@gmail.com",
    // Les espaces affichés par Google ne font pas partie du mot de passe.
    motDePasse: "abcdefghijklmnop",
    expediteur: { name: "SOS Citizens ASBL", address: "sos.citizens@gmail.com" },
  });
});

test("un autre serveur SMTP garde son mot de passe tel quel et passe par STARTTLS", () => {
  const canal = canalEnvoi({
    SMTP_HOST: "smtp-relay.brevo.com",
    SMTP_PORT: "587",
    SMTP_USER: "compte@brevo",
    SMTP_PASSWORD: "cle avec espace",
  });
  assert.equal(canal.type, "smtp");
  assert.equal(canal.port, 587);
  assert.equal(canal.securise, false);
  assert.equal(canal.motDePasse, "cle avec espace");
});

test("un port invalide retombe sur 465, chiffré d'emblée", () => {
  const canal = canalEnvoi({ SMTP_USER: "a@gmail.com", SMTP_PASSWORD: "x", SMTP_PORT: "abc" });
  assert.equal(canal.port, 465);
  assert.equal(canal.securise, true);
});

test("Resend, quand il est configuré, passe avant le SMTP", () => {
  const canal = canalEnvoi({ RESEND_API_KEY: "re_123", SMTP_USER: "a@gmail.com", SMTP_PASSWORD: "x" });
  assert.equal(canal.type, "resend");
  assert.equal(canal.expediteur, "SOS Citizens ASBL <onboarding@resend.dev>");
  assert.equal(canalEnvoi({ RESEND_API_KEY: "re_123", EMAIL_EXPEDITEUR: "SOS <code@sos.be>" }).expediteur, "SOS <code@sos.be>");
});

test("un code à 8 chiffres tient sur une ligne et figure partout", () => {
  const { sujet, html, texte } = emailConfirmation({ ...BASE, code: "48291375", nouveau: false });
  assert.ok(sujet.includes("48291375") && html.includes("48291375") && texte.includes("48291375"));
  assert.ok(html.includes("font-size:32px"), "taille réduite pour 8 chiffres");
});
