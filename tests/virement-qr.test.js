/**
 * Le texte du QR code de virement (EPC 069-12) : chaque ligne à sa place.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { payloadEpc, communicationDon } = require("../.test-build/lib/virement-qr.js");

test("QR de virement : en-tête, bénéficiaire, IBAN compact, montant et communication", () => {
  const p = payloadEpc({ beneficiaire: "SOS Citizens ASBL", iban: "BE39 0689 5382 9319", montant: 70, communication: "+++090/9337/55493+++" });
  assert.deepEqual(p.split("\n"), ["BCD", "002", "1", "SCT", "", "SOS Citizens ASBL", "BE39068953829319", "EUR70.00", "", "", "+++090/9337/55493+++"]);
});

test("QR de virement : sans montant, le donateur le choisit ; un IBAN invalide est refusé", () => {
  const p = payloadEpc({ beneficiaire: "SOS Citizens ASBL", iban: "BE39068953829319", communication: "DON 2026-11 SOS Citizens" });
  assert.equal(p.split("\n")[7], "");
  assert.throws(() => payloadEpc({ beneficiaire: "X", iban: "pas un iban", communication: "x" }));
});

test("communication de don : mois et nom, pour la comptabilité", () => {
  const d = new Date(2026, 10, 17);
  assert.equal(communicationDon("Awa Diallo", d), "DON 2026-11 Awa Diallo");
  assert.equal(communicationDon("", d), "DON 2026-11 SOS Citizens");
  assert.equal(communicationDon("<script>Awa</script>", d), "DON 2026-11 scriptAwascript");
});
