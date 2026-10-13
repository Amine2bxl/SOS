const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { lireAttenteAuth, secondesAvantRenvoi } = require('../.test-build/lib/auth-attente.js');
const { traduireErreur } = require('../.test-build/lib/auth-erreurs.js');
const { lireRetourLien } = require('../.test-build/lib/lien-email.js');

// Exécute les vrais modules serveur. Seules les frontières réseau/Next sont
// remplacées : aucune demande de code n'est envoyée à une vraie adresse.
function charger(fichier, dependances, globaux = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', fichier), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const charge = { exports: {} };
  vm.runInNewContext(code, {
    module: charge, exports: charge.exports, crypto: require('node:crypto').webcrypto,
    URL, FormData, process, console, ...globaux,
    require: (nom) => {
      if (Object.hasOwn(dependances, nom)) return dependances[nom];
      throw new Error(`Dépendance non simulée : ${nom}`);
    },
  }, { filename: fichier });
  return charge.exports;
}

function actions({ verifyOtp, signInWithOtp, getUser, setSession, quota = true, admin = null, mail = false, envoi = { ok: true } } = {}) {
  const supabase = { auth: {
    signInWithOtp: signInWithOtp ?? (async () => ({ error: null })),
    verifyOtp: verifyOtp ?? (async () => ({ error: null, data: { session: {}, user: {} } })),
    getUser: getUser ?? (async () => ({ error: null, data: { user: null } })),
    setSession: setSession ?? (async () => ({ error: null, data: { session: {} } })),
  } };
  return charger('src/lib/auth-actions.ts', {
    'next/headers': { headers: async () => new Headers() },
    'next/cache': { revalidatePath: () => {} },
    'next/navigation': { redirect: () => {} },
    '@/lib/chemin-sur': require('../.test-build/lib/chemin-sur.js'),
    '@/lib/supabase/server': { creerClientServeur: async () => supabase },
    '@/lib/supabase/admin': { creerClientAdmin: () => admin },
    '@/lib/supabase/lien': { creerClientLien: () => supabase },
    '@/lib/lien-email': require('../.test-build/lib/lien-email.js'),
    '@/lib/mail/envoyer': { mailConfigure: () => mail, urlDuSite: () => 'https://soscitizens.vercel.app', envoyerEmail: async (message) => typeof envoi === 'function' ? envoi(message) : envoi },
    '@/lib/mail/gabarits': require('../.test-build/lib/mail/gabarits.js'),
    '@/lib/auth-erreurs': { traduireErreur },
    '@/lib/limites': { consommerJeton: async () => quota, messageQuotaAtteint: () => 'Trop de tentatives.' },
    '@/lib/email-canonique': require('../.test-build/lib/email-canonique.js'),
    '@/lib/anti-robot': { verifierHumain: async () => true },
  });
}

function formulaire(valeurs) {
  const data = new FormData();
  Object.entries(valeurs).forEach(([k, v]) => data.set(k, v));
  return data;
}
const demande = () => formulaire({ email: 'citoyen@example.be', suite: '/tableau-de-bord/nouveau?reprise=1' });
const verification = () => formulaire({ email: 'citoyen@example.be', code: '123456' });

test('un envoi Supabase réussi conserve le parcours demandé', async () => {
  let appel;
  const a = actions({ signInWithOtp: async (p) => { appel = p; return { error: null }; } });
  const r = await a.envoyerCode({}, demande());
  assert.equal(r.envoye, true);
  assert.equal(r.email, 'citoyen@example.be');
  assert.equal(new URL(appel.options.emailRedirectTo).searchParams.get('suite'), '/tableau-de-bord/nouveau?reprise=1');
});

test('un quota du mailer ne fait jamais croire que le code est parti', async () => {
  const a = actions({ signInWithOtp: async () => ({ error: { message: 'email rate limit exceeded' } }) });
  const r = await a.envoyerCode({}, demande());
  assert.equal(r.envoye, undefined);
  assert.match(r.erreur, /Aucun nouveau code/);
});

test('une panne réseau renvoie une erreur exploitable sans casser le formulaire', async () => {
  const a = actions({ signInWithOtp: async () => { throw new Error('fetch failed'); } });
  assert.match((await a.envoyerCode({}, demande())).erreur, /momentanément indisponible/);
  const b = actions({ verifyOtp: async () => { throw new Error('fetch failed'); } });
  assert.match((await b.verifierCode({}, verification())).erreur, /saisie est conservée/);
});

test('Resend reçoit un code visible sans lien de connexion et un refus ne valide pas l’envoi', async () => {
  let message;
  const admin = {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
    auth: { admin: { generateLink: async () => ({ error: null, data: {
      properties: { email_otp: '123456', hashed_token: 'secret-test' }, user: { user_metadata: {} },
    } }) } },
  };
  const a = actions({ admin, mail: true, envoi: async (m) => { message = m; return { ok: true }; } });
  assert.equal((await a.envoyerCode({}, demande())).mode, 'code');
  assert.match(message.html, /123456/);
  assert.match(message.texte, /123456/);
  assert.equal(message.html.includes('token_hash='), false);
  assert.equal(message.texte.includes('secret-test'), false);
  const b = actions({ admin, mail: true, envoi: { ok: false } });
  assert.equal((await b.envoyerCode({}, demande())).envoye, undefined);
});

test('un code de connexion ouvre une vraie session', async () => {
  const a = actions();
  assert.equal((await a.verifierCode({}, verification())).verifie, true);
});

test('un code de première inscription est vérifié après le type email', async () => {
  const types = [];
  const a = actions({ verifyOtp: async ({ type }) => {
    types.push(type);
    return type === 'email' ? { error: { message: 'Token has expired or is invalid' } }
      : { error: null, data: { session: {}, user: {} } };
  } });
  assert.equal((await a.verifierCode({}, verification())).verifie, true);
  assert.deepEqual(types, ['email', 'signup']);
});

test('la vérification ne multiplie pas les appels quand Supabase limite les tentatives', async () => {
  let appels = 0;
  const a = actions({ verifyOtp: async () => { appels++; return { error: { message: 'too many requests' } }; } });
  assert.equal((await a.verifierCode({}, verification())).verifie, undefined);
  assert.equal(appels, 1);
});

test('une réponse sans session ne constitue jamais un succès', async () => {
  const a = actions({ verifyOtp: async () => ({ error: null, data: { session: null, user: null } }) });
  assert.equal((await a.verifierCode({}, verification())).verifie, undefined);
});

test('les codes incomplets et le quota local empêchent les appels réseau', async () => {
  let appels = 0;
  const verifyOtp = async () => { appels++; return {}; };
  assert.match((await actions({ verifyOtp }).verifierCode({}, formulaire({ email: 'citoyen@example.be', code: '123' }))).erreur, /6 chiffres/);
  assert.match((await actions({ verifyOtp, quota: false }).verifierCode({}, verification())).erreur, /Trop de tentatives/);
  assert.equal(appels, 0);
});

test('le retour de messagerie vérifie l’adresse et la session sur le serveur', async () => {
  const getUser = async () => ({ error: null, data: { user: { email: 'citoyen@example.be', email_confirmed_at: '2026-10-12' } } });
  const a = actions({ getUser });
  assert.equal((await a.verifierSession('citoyen@example.be')).verifie, true);
  assert.equal((await a.verifierSession('autre@example.be')).verifie, undefined);
  assert.equal((await actions().verifierSession('citoyen@example.be')).verifie, undefined);
});

test('les anciennes confirmations reviennent au même formulaire avec la destination conservée', async () => {
  const route = charger('src/app/auth/confirm/route.ts', {
    'next/server': require('next/server'),
    '@/lib/chemin-sur': require('../.test-build/lib/chemin-sur.js'),
    '@/lib/supabase/server': { creerClientServeur: async () => ({ auth: {
      verifyOtp: async () => ({ error: null }), exchangeCodeForSession: async () => ({ error: null }),
    } }) },
  });
  for (const jeton of ['token_hash=abc&type=email', 'code=abc']) {
    const r = await route.GET(new Request(`https://soscitizens.vercel.app/auth/confirm?${jeton}&suite=%2Fadherer`));
    const retour = new URL(r.headers.get('location'));
    assert.equal(retour.pathname, '/connexion');
    assert.equal(retour.searchParams.get('confirme'), '1');
    assert.equal(retour.searchParams.get('suite'), '/adherer');
    assert.equal(retour.searchParams.has('token_hash'), false);
    assert.equal(retour.searchParams.has('code'), false);
  }
});

test('les deux modèles hébergés affichent un OTP et aucune action ouvrant un autre onglet', () => {
  for (const fichier of ['confirm-signup.html', 'magic-link.html']) {
    const html = fs.readFileSync(path.join(__dirname, '../emails', fichier), 'utf8');
    assert.ok(html.includes('{{ .Token }}'));
    assert.ok(!html.includes('{{ .ConfirmationURL }}'));
    assert.ok(!html.includes('{" "}'));
    assert.match(html, /aucun lien à ouvrir/);
  }
});

test('le délai de renvoi est de 60 secondes et reprend après un rechargement', () => {
  assert.equal(secondesAvantRenvoi(1000, 1000), 60);
  assert.equal(secondesAvantRenvoi(1000, 31_000), 30);
  assert.equal(secondesAvantRenvoi(1000, 62_000), 0);
});

test('une attente valide ne contient aucun secret et garde la bonne destination', () => {
  const a = { email: 'citoyen@example.be', suite: '/adherer', mode: 'code', envoyeLe: 1000 };
  assert.deepEqual(lireAttenteAuth(JSON.stringify(a), '/adherer', 2000), a);
  assert.equal(lireAttenteAuth(JSON.stringify(a), '/tableau-de-bord', 2000), null);
  assert.equal(lireAttenteAuth(JSON.stringify(a), '/adherer', 3601_001), null);
  assert.equal(lireAttenteAuth(JSON.stringify(a), '/adherer', 500), null);
  assert.equal(lireAttenteAuth('{cassé', '/adherer', 2000), null);
});


test('le garde garde la confirmation sur connexion et protège toujours l’espace membre', async () => {
  const next = require('next/server');
  let utilisateur = { id: 'test-user' };
  const garde = charger('src/proxy.ts', {
    'next/server': next,
    '@/lib/chemin-sur': require('../.test-build/lib/chemin-sur.js'),
    '@supabase/ssr': { createServerClient: () => ({ auth: {
      getUser: async () => ({ data: { user: utilisateur } }),
    } }) },
  }, { process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key' } } });
  for (const method of ['GET', 'POST']) {
    const r = await garde.proxy(new next.NextRequest('https://soscitizens.vercel.app/connexion?suite=%2Fadherer', { method }));
    assert.equal(r.headers.has('location'), false);
  }
  utilisateur = null;
  const refuse = await garde.proxy(new next.NextRequest('https://soscitizens.vercel.app/adherer'));
  assert.equal(new URL(refuse.headers.get('location')).pathname, '/connexion');
});

test('un code refusé n\'est pas présenté comme forcément expiré', () => {
  // La même phrase de Supabase couvre la faute de frappe et le code périmé.
  const message = traduireErreur('Token has expired or is invalid');
  assert.match(message, /ne correspond pas ou a expiré/);
  assert.match(traduireErreur('Email rate limit exceeded'), /limite/);
});

/* -------------------------------------------- le lien reçu de Supabase */

const JWT_TEST = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXJl';

test('le lien de Supabase ramène à la connexion avec la destination demandée', async () => {
  let appel;
  const a = actions({ signInWithOtp: async (p) => { appel = p; return { error: null }; } });
  await a.envoyerCode({}, demande());
  const retour = new URL(appel.options.emailRedirectTo);
  assert.equal(retour.pathname, '/connexion');
  assert.equal(retour.searchParams.get('suite'), '/tableau-de-bord/nouveau?reprise=1');
});

test('le fragment d\'un lien de connexion est lu, et seulement lui', () => {
  assert.deepEqual(lireRetourLien(`#access_token=${JWT_TEST}&expires_in=3600&refresh_token=r3fr3sh-t0ken&token_type=bearer&type=magiclink`),
    { type: 'session', accessToken: JWT_TEST, refreshToken: 'r3fr3sh-t0ken' });
  assert.deepEqual(lireRetourLien('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'),
    { type: 'erreur', raison: 'lien-expire' });
  assert.equal(lireRetourLien('#analyser'), null, 'une ancre de page');
  assert.equal(lireRetourLien(''), null);
  assert.deepEqual(lireRetourLien('#access_token=pas-un-jwt&refresh_token=r3fr3sh-t0ken'), { type: 'erreur', raison: 'lien-expire' });
});

test('la session d\'un lien n\'est ouverte qu\'après vérification par Supabase', async () => {
  let recu;
  const a = actions({ setSession: async (s) => { recu = s; return { error: null, data: { session: { access_token: s.access_token } } }; } });
  // Le module tourne dans un autre contexte : on compare les champs, pas les objets.
  assert.equal((await a.ouvrirSessionDepuisLien(JWT_TEST, 'r3fr3sh-t0ken')).ok, true);
  assert.equal(recu.access_token, JWT_TEST);
  assert.equal(recu.refresh_token, 'r3fr3sh-t0ken');

  const refuse = actions({ setSession: async () => ({ error: { message: 'invalid JWT' }, data: { session: null } }) });
  assert.equal((await refuse.ouvrirSessionDepuisLien(JWT_TEST, 'r3fr3sh-t0ken')).ok, false);

  let appels = 0;
  const b = actions({ setSession: async () => { appels++; return { error: null, data: { session: {} } }; } });
  assert.equal((await b.ouvrirSessionDepuisLien('pas-un-jwt', 'r3fr3sh-t0ken')).ok, false);
  assert.equal((await actions({ quota: false }).ouvrirSessionDepuisLien(JWT_TEST, 'r3fr3sh-t0ken')).ok, false);
  assert.equal(appels, 0);
});
