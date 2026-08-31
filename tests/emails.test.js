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
