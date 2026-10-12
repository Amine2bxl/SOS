/**
 * Tests du moteur SOS.
 *
 * Le moteur décide de ce qu'on conseille à quelqu'un qui risque des frais
 * d'huissier : chaque règle importante est figée ici par un cas réaliste. Un
 * changement de la base qui ferait, par exemple, conseiller de payer à
 * quelqu'un qui avait une session d'application active casserait ces tests.
 *
 * Lancer avec : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { analyser, calculerDelai } = require("../.test-build/cerveau/moteur/analyse.js");
const { composerLettre, typeLettreConseille } = require("../.test-build/cerveau/moteur/lettres.js");
const { questionsAPoser } = require("../.test-build/cerveau/base/questions.js");
const { detecterLieu, regionDuCodePostal, detecterLangue } = require("../.test-build/cerveau/moteur/region.js");
const { IndexRecherche, jetons } = require("../.test-build/cerveau/moteur/recherche.js");
const { FICHES } = require("../.test-build/cerveau/base/savoir.js");
const { MOYENS } = require("../.test-build/cerveau/base/moyens.js");
const { genererIcs } = require("../.test-build/cerveau/moteur/agenda.js");

const AUJ = "2026-03-20";
const base = (extra = {}) => ({
  region: "bruxelles",
  commune: "Saint-Gilles",
  crediteur: "parking.brussels",
  stade: "notification",
  montant: 25,
  dateConstat: "2026-03-12",
  heureConstat: "14:10",
  dateEnvoi: "2026-03-14",
  reference: "2026/0041234",
  plaque: "1-ABC-123",
  aujourdhui: AUJ,
  ...extra,
});

/* ----------------------------------------------------------------- délai */

test("au premier courrier bruxellois, le délai est de 10 jours après l'envoi", () => {
  const d = calculerDelai(base(), "notification");
  assert.equal(d.nature, "contestation");
  assert.equal(d.limite, "2026-03-24");
  assert.equal(d.joursRestants, 4);
  assert.equal(d.origine, "calcule");
});

test("sans date d'envoi, la date imprimée sert de repère", () => {
  const d = calculerDelai(base({ dateEnvoi: null, dateEcheance: "2026-04-10" }), "notification");
  assert.equal(d.nature, "paiement");
  assert.equal(d.origine, "document");
  assert.equal(d.limite, "2026-04-10");
});

test("en Wallonie, le délai n'est jamais inventé", () => {
  const d = calculerDelai(base({ region: "wallonie", dateEcheance: null }), "notification");
  assert.equal(d.limite, null);
  assert.equal(d.origine, "inconnu");
  assert.match(d.explication, /règlement de la commune/);
});

test("l'urgence suit les jours restants", () => {
  assert.equal(analyser(base({ dateEnvoi: "2026-03-01" })).urgence, "depasse");
  assert.equal(analyser(base({ dateEnvoi: "2026-03-11" })).urgence, "critique");
  assert.equal(analyser(base({ dateEnvoi: "2026-03-14" })).urgence, "haute");
  assert.equal(analyser(base({ dateEnvoi: "2026-03-19" })).urgence, "normale");
});

test("une contrainte est toujours critique, même sans date", () => {
  const a = analyser(base({ stade: "contrainte", dateEcheance: null }));
  assert.equal(a.urgence, "critique");
  assert.equal(a.delai.nature, "recours");
});

/* ---------------------------------------------------------------- moyens */

test("une session d'application active donne un dossier solide et une contestation", () => {
  const a = analyser(base({ reponses: { paiement: "app", vehicule: "oui" } }));
  assert.equal(a.strategie.code, "contester");
  assert.equal(a.moyens[0].id, "paiement_app");
  assert.equal(a.solidite.niveau, "solide");
  assert.ok(a.pieces.some((p) => /capture/i.test(p)));
});

test("sans aucun argument, le moteur le dit et conseille de payer", () => {
  const a = analyser(
    base({
      reponses: { paiement: "non", carte: "non", vehicule: "oui", tentative_paiement: "non", duree: "long", signalisation: "claire", doublon: "non" },
    }),
  );
  assert.equal(a.moyens.length, 0);
  assert.equal(a.strategie.code, "payer");
  assert.equal(a.solidite.niveau, "fragile");
  // Et la lettre proposée n'est pas une contestation vouée à l'échec, mais la
  // demande des photos du contrôle.
  assert.equal(typeLettreConseille({ reponses: {} }, a.strategie.code), "demande_preuves");
});

test("les moyens sont classés du plus solide au plus fragile", () => {
  const a = analyser(base({ reponses: { paiement: "non", signalisation: "illisible", duree: "arret", vehicule: "oui" } }));
  const forces = a.moyens.map((m) => m.force);
  assert.deepEqual(forces, ["serieux", "possible"]);
});

test("un véhicule vendu ou volé suffit, quel que soit le reste", () => {
  for (const vehicule of ["vendu", "vole"]) {
    const a = analyser(base({ reponses: { paiement: "non", vehicule } }));
    assert.equal(a.strategie.code, "contester");
    assert.equal(a.moyens[0].force, "solide");
  }
});

test("au rappel, sans argument de fond, on conteste au moins les frais", () => {
  const a = analyser(
    base({ stade: "premier_rappel", dateEcheance: "2026-04-01", reponses: { paiement: "non", carte: "non", vehicule: "oui", courrier_initial: "oui", deja_conteste: "non", deja_paye: "non" } }),
  );
  assert.equal(a.strategie.code, "contester_frais");
  assert.ok(a.moyens.some((m) => m.id === "frais_ajoutes"));
});

test("si l'utilisateur a déjà payé, on demande l'arrêt et le remboursement", () => {
  const a = analyser(base({ stade: "mise_en_demeure", reponses: { deja_paye: "oui" } }));
  assert.equal(a.strategie.code, "rembourser");
  assert.equal(typeLettreConseille({ reponses: {} }, a.strategie.code), "remboursement");
});

test("face à l'huissier, la stratégie est de répondre par écrit", () => {
  const a = analyser(base({ stade: "courrier_huissier", reponses: { paiement: "app" } }));
  assert.equal(a.strategie.code, "repondre_huissier");
});

test("le coût de l'inaction annonce l'étape suivante et son prix", () => {
  const a = analyser(base());
  assert.equal(a.inaction.etape, "Le rappel");
  assert.match(a.inaction.surcout, /15 €/);
});

test("tous les moyens ont un paragraphe dans les deux langues", () => {
  for (const m of MOYENS) {
    const p = m.paragraphe(base());
    assert.ok(p.fr.length > 60, `${m.id} : paragraphe français trop court`);
    assert.ok(p.nl.length > 60, `${m.id} : paragraphe néerlandais trop court`);
    assert.ok(m.pieces.length > 0, `${m.id} : aucune pièce`);
  }
});

/* ------------------------------------------------------------- questions */

test("on ne demande pas combien de temps on est resté à quelqu'un qui a payé", () => {
  const ids = questionsAPoser({ stade: "notification", reponses: { paiement: "app" } }).map((q) => q.id);
  assert.ok(!ids.includes("duree"));
  assert.ok(!ids.includes("tentative_paiement"));
  assert.ok(!ids.includes("carte"));
});

test("les questions de procédure n'apparaissent qu'après le premier courrier", () => {
  const avant = questionsAPoser({ stade: "notification", reponses: {} }).map((q) => q.id);
  const apres = questionsAPoser({ stade: "premier_rappel", reponses: {} }).map((q) => q.id);
  assert.ok(!avant.includes("deja_conteste"));
  assert.ok(apres.includes("deja_conteste"));
  assert.ok(apres.includes("courrier_initial"));
});

test("une question déjà répondue n'est pas reposée", () => {
  const ids = questionsAPoser({ stade: "notification", reponses: { paiement: "non", vehicule: "oui" } }).map((q) => q.id);
  assert.ok(!ids.includes("paiement"));
  assert.ok(!ids.includes("vehicule"));
  assert.ok(ids.includes("carte"));
});

/* -------------------------------------------------------------- lettres */

const identite = {
  prenom: "Jeanne",
  nom: "Dupont",
  adresse: "Rue Émile Feron 153",
  codePostal: "1060",
  ville: "Saint-Gilles",
  email: "jeanne@example.be",
};

test("la contestation reprend les références, les moyens et les annexes", () => {
  const faits = base({ reponses: { paiement: "app" }, communication: "+++202/6000/00192+++" });
  const l = composerLettre({ type: "contestation", langue: "fr", faits, identite, date: AUJ });
  assert.match(l.texte, /2026\/0041234/);
  assert.match(l.texte, /\+\+\+202\/6000\/00192\+\+\+/);
  assert.match(l.texte, /1-ABC-123/);
  assert.match(l.texte, /session de stationnement était active/);
  assert.match(l.texte, /12 mars 2026/);
  assert.match(l.texte, /ne constitue en aucune manière une reconnaissance de dette/);
  assert.ok(l.annexes.some((a) => /Capture/i.test(a)));
  assert.ok(l.annexes.includes("Copie du courrier reçu"));
});

test("la lettre néerlandaise est entièrement en néerlandais", () => {
  const faits = base({ region: "flandre", commune: "Gent", reponses: { paiement: "app" } });
  const l = composerLettre({ type: "contestation", langue: "nl", faits, identite, date: AUJ });
  assert.match(l.texte, /Geachte mevrouw, geachte heer/);
  assert.match(l.texte, /Betreft: betwisting van de parkeerretributie/);
  assert.match(l.texte, /actieve parkeersessie/);
  assert.match(l.texte, /12 maart 2026/);
  assert.doesNotMatch(l.texte, /Madame|redevance|Objet/);
});

test("un champ inconnu reste visible entre crochets", () => {
  const l = composerLettre({
    type: "contestation",
    langue: "fr",
    faits: base({ reference: null }),
    identite: { prenom: "", nom: "", adresse: "", codePostal: "", ville: "" },
    date: AUJ,
  });
  assert.match(l.texte, /\[Prénom\] \[Nom\]/);
  assert.match(l.texte, /\[référence figurant sur votre courrier\]/);
});

test("la demande de photos cite l'article 15 du RGPD et le délai d'un mois", () => {
  const l = composerLettre({ type: "demande_preuves", langue: "fr", faits: base(), identite, date: AUJ });
  assert.match(l.texte, /article 15 du règlement \(UE\) 2016\/679/);
  assert.match(l.texte, /délai d'un mois/);
});

test("la réponse à l'huissier exige le titre et le décompte détaillé", () => {
  const l = composerLettre({
    type: "reponse_huissier",
    langue: "fr",
    faits: base({ stade: "courrier_huissier" }),
    identite,
    datePremiereContestation: "2026-01-10",
    date: AUJ,
  });
  assert.match(l.texte, /titre sur lequel se fonde votre intervention/);
  assert.match(l.texte, /décompte détaillé/);
  assert.match(l.texte, /10 janvier 2026/);
});

/* -------------------------------------------------------------- région */

test("les codes postaux suivent les provinces", () => {
  assert.equal(regionDuCodePostal(1060), "bruxelles");
  assert.equal(regionDuCodePostal(1348), "wallonie");
  assert.equal(regionDuCodePostal(1800), "flandre");
  assert.equal(regionDuCodePostal(2000), "flandre");
  assert.equal(regionDuCodePostal(3500), "flandre");
  assert.equal(regionDuCodePostal(4000), "wallonie");
  assert.equal(regionDuCodePostal(6700), "wallonie");
  assert.equal(regionDuCodePostal(9000), "flandre");
});

test("un courrier parking.brussels est reconnu comme bruxellois", () => {
  const l = detecterLieu(`parking.brussels
Agence du stationnement de la Région de Bruxelles-Capitale
Lieu du constat : Rue de la Victoire 12, 1060 Saint-Gilles
Montant : 25,00 EUR`);
  assert.equal(l.region, "bruxelles");
  assert.equal(l.certaine, true);
  assert.equal(l.langue, "fr");
});

test("un courrier gantois en néerlandais est reconnu comme flamand", () => {
  const l = detecterLieu(`Stad Gent — Mobiliteitsbedrijf
Parkeerretributie
Plaats van de vaststelling: Korenmarkt, 9000 Gent
Het bedrag van de retributie moet betaald worden voor de vervaldatum.`);
  assert.equal(l.region, "flandre");
  assert.equal(l.commune, "Gent");
  assert.equal(l.langue, "nl");
});

test("une rue de Namur à Bruxelles ne fait pas un dossier namurois", () => {
  const l = detecterLieu(`parking.brussels
Lieu du constat : Rue de Namur 40, 1000 Bruxelles`);
  assert.equal(l.region, "bruxelles");
  assert.notEqual(l.commune, "Namur");
});

test("la langue se détecte sur quelques lignes", () => {
  assert.equal(detecterLangue("Le montant de la redevance doit être payé avant la date indiquée."), "fr");
  assert.equal(detecterLangue("Het bedrag van de retributie moet voor de vervaldatum betaald worden."), "nl");
});

/* ------------------------------------------------------------ recherche */

test("la racinisation et les synonymes rapprochent les formes d'un même mot", () => {
  assert.deepEqual(jetons("huissier"), jetons("deurwaarder"));
  assert.deepEqual(jetons("contestations"), jetons("contester"));
  assert.ok(jetons("Où envoyer ma contestation ?").includes("contester"));
});

test("« demandez à SOS » trouve la bonne fiche pour des questions courantes", () => {
  const index = new IndexRecherche(FICHES.map((f) => ({ ...f, texte: `${f.reponse} ${f.texte ?? ""}` })));
  const premiere = (q) => index.rechercher(q, 3)[0]?.document.id;

  assert.equal(premiere("comment obtenir les photos de la scancar"), "photos-du-controle");
  assert.equal(premiere("un deurwaarder m'écrit"), "huissier-que-faire");
  assert.equal(premiere("j'ai reçu une contrainte, que faire"), "contrainte-que-faire");
  assert.match(premiere("est-ce que contester suspend le paiement") ?? "", /contester-suspend-il|faq-0/);
});

test("une question sans rapport ne renvoie rien d'absurde", () => {
  const index = new IndexRecherche(FICHES.map((f) => ({ ...f, texte: f.reponse })));
  assert.equal(index.rechercher("recette de la tarte aux pommes").length, 0);
});

/* --------------------------------------------------------------- agenda */

test("le fichier d'agenda est un iCalendar valide avec ses rappels", () => {
  const ics = genererIcs(
    { uid: "dossier-1", titre: "Contester la redevance, ref 2026/0041234", date: "2026-03-24", description: "Ligne 1\nLigne 2, avec virgule", rappels: [3, 1] },
    new Date("2026-03-20T10:00:00Z"),
  );
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260324/);
  assert.match(ics, /DTEND;VALUE=DATE:20260325/);
  assert.match(ics, /Ligne 1\\nLigne 2\\, avec virgule/);
  assert.equal((ics.match(/BEGIN:VALARM/g) ?? []).length, 2);
  assert.match(ics, /TRIGGER:-PT3780M/); // 3 jours avant, à 9 h
  assert.match(ics, /END:VCALENDAR\r\n$/);
});
