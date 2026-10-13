/**
 * Tests des règles des communes : ce que la carte et la fiche affichent à
 * partir de la base, et le filet quand la base se tait.
 *
 * L'enjeu : une règle corrigée en base doit s'afficher telle quelle, une
 * règle votée mais pas encore en vigueur ne doit pas remplacer celle du jour,
 * et un lien douteux ne doit jamais devenir cliquable.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  aujourdhuiBruxelles,
  champsModifies,
  changementsRecents,
  communesModifiees,
  dateLisible,
  decalerDate,
  differences,
  ficheCommune,
  lireRegistre,
  normaliserChangements,
  selectionnerRegles,
  trouverCommune,
  urlSure,
} = require("../.test-build/lib/communes-regles.js");
const { COMMUNES } = require("../.test-build/lib/data.js");
const { CARTE_BRUXELLES } = require("../.test-build/lib/carte-bruxelles.js");

const AUJOURDHUI = "2026-10-13";
const ixelles = COMMUNES.find((c) => c.slug === "ixelles");

const ligne = (champs) => ({
  commune_slug: "ixelles",
  version: 1,
  en_vigueur_depuis: "2026-01-01",
  en_vigueur_jusque: null,
  zones: null,
  horaires: null,
  gratuite: null,
  paiement: null,
  cartes: null,
  tarifs: null,
  contestation: null,
  a_savoir: null,
  source_url: null,
  mis_a_jour_le: "2026-10-13T08:00:00+00:00",
  ...champs,
});

const lecture = (champs = {}) => ({
  regles: {},
  prochaines: {},
  registre: {},
  changements: [],
  enDirect: true,
  luLe: "2026-10-13T10:00:00.000Z",
  aujourdhui: AUJOURDHUI,
  ...champs,
});

/* ------------------------------------------------------------ la carte */

test("la carte dessine exactement les 19 communes du site", () => {
  const surLaCarte = Object.keys(CARTE_BRUXELLES.communes).sort();
  assert.deepEqual(surLaCarte, COMMUNES.map((c) => c.slug).sort());
  for (const forme of Object.values(CARTE_BRUXELLES.communes)) {
    assert.match(forme.d, /^M[\d. L]+Z/);
    assert.ok(forme.x > 0 && forme.x < CARTE_BRUXELLES.largeur);
    assert.ok(forme.y > 0 && forme.y < CARTE_BRUXELLES.hauteur);
  }
});

test("chaque commune a son nom néerlandais, son code INS et ses codes postaux", () => {
  const ins = new Set();
  for (const c of COMMUNES) {
    assert.ok(c.nl, `${c.slug} sans nom néerlandais`);
    assert.match(c.ins, /^210\d\d$/, `${c.slug} : code INS bruxellois attendu`);
    assert.ok(c.codesPostaux.length > 0 && c.codesPostaux.every((cp) => /^1\d{3}$/.test(cp)));
    ins.add(c.ins);
  }
  assert.equal(ins.size, 19, "deux communes partagent un code INS");
});

/* --------------------------------------------------- choisir la règle */

test("la version la plus récente déjà en vigueur l'emporte", () => {
  const { regles } = selectionnerRegles(
    [ligne({ version: 1, zones: "ancienne" }), ligne({ version: 2, en_vigueur_depuis: "2026-06-01", zones: "nouvelle" })],
    AUJOURDHUI,
  );
  assert.equal(regles.ixelles.version, 2);
  assert.equal(regles.ixelles.zones, "nouvelle");
});

test("un règlement voté pour plus tard est annoncé, sans remplacer celui du jour", () => {
  const { regles, prochaines } = selectionnerRegles(
    [ligne({ version: 1, zones: "en vigueur" }), ligne({ version: 2, en_vigueur_depuis: "2027-01-01", zones: "à venir" })],
    AUJOURDHUI,
  );
  assert.equal(regles.ixelles.zones, "en vigueur");
  assert.equal(prochaines.ixelles.version, 2);
  assert.equal(prochaines.ixelles.enVigueurDepuis, "2027-01-01");
});

test("une version clôturée n'est plus affichée", () => {
  const { regles } = selectionnerRegles([ligne({ en_vigueur_jusque: "2026-09-30" })], AUJOURDHUI);
  assert.equal(regles.ixelles, undefined);
});

test("le jour de bascule, la nouvelle version s'applique", () => {
  const { regles, prochaines } = selectionnerRegles(
    [ligne({ version: 1 }), ligne({ version: 2, en_vigueur_depuis: AUJOURDHUI })],
    AUJOURDHUI,
  );
  assert.equal(regles.ixelles.version, 2);
  assert.equal(prochaines.ixelles, undefined);
});

/* ------------------------------------------------------- la fiche */

test("la base l'emporte champ par champ, le repère du site comble les vides", () => {
  const { regles } = selectionnerRegles([ligne({ horaires: "  Payant de 9 h à 21 h.  ", zones: "" })], AUJOURDHUI);
  const fiche = ficheCommune(ixelles, lecture({ regles }));
  assert.equal(fiche.horaires, "Payant de 9 h à 21 h.");
  assert.equal(fiche.zones, ixelles.zones, "une colonne vide retombe sur le repère");
  assert.equal(fiche.origine, "base");
  assert.equal(fiche.tarifs, null, "aucun tarif inventé");
});

test("sans base, la fiche reste complète avec les repères du site", () => {
  const fiche = ficheCommune(ixelles, lecture({ enDirect: false }));
  assert.equal(fiche.origine, "reference");
  assert.equal(fiche.horaires, ixelles.heures);
  assert.equal(fiche.parking, ixelles.parking);
  assert.deepEqual(fiche.codesPostaux, ["1050"]);
  assert.equal(fiche.nl, "Elsene");
  assert.equal(fiche.ouverte, true);
});

test("le registre peut fermer une commune et changer ses liens", () => {
  const registre = lireRegistre([
    {
      slug: "ixelles",
      nom_nl: "Elsene",
      codes_postaux: ["1050", "pas un code"],
      site_officiel: "https://www.ixelles.be/nouveau",
      page_parking: "javascript:alert(1)",
      ouverte: false,
    },
  ]);
  const fiche = ficheCommune(ixelles, lecture({ registre }));
  assert.equal(fiche.ouverte, false);
  assert.equal(fiche.siteOfficiel, "https://www.ixelles.be/nouveau");
  assert.equal(fiche.parking, ixelles.parking, "un lien douteux retombe sur le lien vérifié");
  assert.deepEqual(fiche.codesPostaux, ["1050"]);
});

test("seuls les liens https deviennent cliquables", () => {
  assert.equal(urlSure("https://www.parking.brussels/fr"), "https://www.parking.brussels/fr");
  assert.equal(urlSure("http://exemple.be"), null);
  assert.equal(urlSure("javascript:alert(1)"), null);
  assert.equal(urlSure("data:text/html,<b>x</b>"), null);
  assert.equal(urlSure("pas une adresse"), null);
  assert.equal(urlSure(null), null);
});

/* ------------------------------------------------------- changements */

const changement = (champs) => ({
  id: champs.id ?? "c1",
  commune_slug: null,
  titre: "Un changement",
  resume: "Ce qui change.",
  importance: "info",
  publie_le: "2026-09-01",
  source_url: null,
  ...champs,
});

test("les changements arrivent du plus récent au plus ancien, sans ceux de demain", () => {
  const liste = normaliserChangements(
    [
      changement({ id: "a", publie_le: "2026-03-15" }),
      changement({ id: "b", publie_le: "2026-10-01" }),
      changement({ id: "demain", publie_le: "2026-10-14" }),
      changement({ id: "sans-titre", titre: "  " }),
    ],
    AUJOURDHUI,
  );
  assert.deepEqual(
    liste.map((c) => c.id),
    ["b", "a"],
  );
});

test("une importance inconnue devient une simple information", () => {
  const [c] = normaliserChangements([changement({ importance: "catastrophe" })], AUJOURDHUI);
  assert.equal(c.importance, "info");
});

test("une commune reste signalée sur la carte pendant un an", () => {
  const liste = normaliserChangements(
    [
      changement({ id: "recent", commune_slug: "ixelles", publie_le: "2026-02-01" }),
      changement({ id: "ancien", commune_slug: "uccle", publie_le: "2025-09-01" }),
      changement({ id: "region", commune_slug: null, publie_le: "2026-03-15" }),
    ],
    AUJOURDHUI,
  );
  const recents = changementsRecents(liste, AUJOURDHUI);
  assert.deepEqual(
    recents.map((c) => c.id),
    ["region", "recent"],
  );
  assert.deepEqual([...communesModifiees(recents)], ["ixelles"]);
});

/* ------------------------------------------------- en direct */

test("une fiche corrigée pendant que la page est ouverte est repérée", () => {
  const avant = lecture({ regles: selectionnerRegles([ligne({ horaires: "avant" })], AUJOURDHUI).regles });
  const apres = lecture({
    regles: selectionnerRegles([ligne({ horaires: "après", mis_a_jour_le: "2026-10-13T10:05:00+00:00" })], AUJOURDHUI)
      .regles,
    changements: normaliserChangements([changement({ id: "neuf", commune_slug: "uccle" })], AUJOURDHUI),
  });
  const diff = differences(avant, apres);
  assert.deepEqual([...diff.communes].sort(), ["ixelles", "uccle"]);
  assert.deepEqual([...diff.changements], ["neuf"]);
});

test("seule la case qui a changé est signalée dans la fiche", () => {
  const avant = ficheCommune(ixelles, lecture({ regles: selectionnerRegles([ligne({ horaires: "avant" })], AUJOURDHUI).regles }));
  const apres = ficheCommune(
    ixelles,
    lecture({ regles: selectionnerRegles([ligne({ horaires: "après", a_savoir: "nouveau conseil" })], AUJOURDHUI).regles }),
  );
  assert.deepEqual(champsModifies(avant, apres), ["horaires", "aSavoir"]);
  assert.deepEqual(champsModifies(apres, apres), []);
});

test("rien ne clignote quand la base revient après une absence", () => {
  const sansBase = lecture({ enDirect: false });
  const avecBase = lecture({ regles: selectionnerRegles([ligne({})], AUJOURDHUI).regles });
  const diff = differences(sansBase, avecBase);
  assert.equal(diff.communes.size, 0);
  assert.equal(diff.changements.size, 0);
});

test("deux lectures identiques ne signalent rien", () => {
  const a = lecture({ regles: selectionnerRegles([ligne({})], AUJOURDHUI).regles });
  const b = lecture({ regles: selectionnerRegles([ligne({})], AUJOURDHUI).regles });
  assert.equal(differences(a, b).communes.size, 0);
});

/* ------------------------------------------------------- recherche */

test("on retrouve sa commune par code postal, en français ou en néerlandais", () => {
  assert.equal(trouverCommune(COMMUNES, "1050")?.slug, "ixelles");
  assert.equal(trouverCommune(COMMUNES, "1020")?.slug, "bruxelles-ville");
  assert.equal(trouverCommune(COMMUNES, "Elsene")?.slug, "ixelles");
  assert.equal(trouverCommune(COMMUNES, "schaarbeek")?.slug, "schaerbeek");
  assert.equal(trouverCommune(COMMUNES, "st gilles")?.slug, "saint-gilles");
  assert.equal(trouverCommune(COMMUNES, "St-Josse")?.slug, "saint-josse-ten-noode");
  assert.equal(trouverCommune(COMMUNES, "ukkel")?.slug, "uccle");
  assert.equal(trouverCommune(COMMUNES, "watermael")?.slug, "watermael-boitsfort");
});

test("une saisie qui désigne plusieurs communes ne choisit rien", () => {
  assert.equal(trouverCommune(COMMUNES, "woluwe"), null);
  assert.equal(trouverCommune(COMMUNES, "saint"), null);
  assert.equal(trouverCommune(COMMUNES, "9999"), null);
  assert.equal(trouverCommune(COMMUNES, ""), null);
});

/* ---------------------------------------------------------- dates */

test("les dates se lisent à la belge, et le 1er s'écrit 1er", () => {
  assert.equal(dateLisible("2026-01-01"), "1er janvier 2026");
  assert.equal(dateLisible("2026-03-15"), "15 mars 2026");
  assert.equal(decalerDate("2026-03-01", -1), "2026-02-28");
  // 23 h 30 à Bruxelles le 13 octobre : 21 h 30 UTC. Le jour reste le 13.
  assert.equal(aujourdhuiBruxelles(new Date("2026-10-13T21:30:00Z")), "2026-10-13");
  // 0 h 30 à Bruxelles le 14 : encore le 13 en UTC.
  assert.equal(aujourdhuiBruxelles(new Date("2026-10-13T22:30:00Z")), "2026-10-14");
});

/* ------------------------------------------------------- périmètre */

const { regionOuverte, messageHorsPerimetre, REGIONS_A_VENIR } = require("../.test-build/lib/perimetre.js");

test("Bruxelles est ouverte ; la Flandre puis la Wallonie attendent leur tour", () => {
  assert.equal(regionOuverte("bruxelles"), true);
  assert.equal(regionOuverte("flandre"), false);
  assert.equal(regionOuverte("wallonie"), false);
  assert.equal(regionOuverte(""), false);
  assert.equal(regionOuverte(null), false);
  assert.deepEqual(
    REGIONS_A_VENIR.map((r) => r.id),
    ["flandre", "wallonie"],
  );
});

test("un courrier hors de Bruxelles reçoit une orientation, dans l'ordre du plan", () => {
  assert.match(messageHorsPerimetre("flandre"), /La Flandre arrive bientôt/);
  assert.match(messageHorsPerimetre("wallonie"), /La Wallonie arrivera après la Flandre/);
  assert.match(messageHorsPerimetre("wallonie"), /écrivez-nous/);
});
