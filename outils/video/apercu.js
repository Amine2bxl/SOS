// Quelques images fixes, pour juger la mise en page avant le rendu complet.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const erreurs = [];
  p.on('pageerror', (e) => erreurs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  await p.goto('file://' + __dirname + '/scene.html');
  await p.waitForFunction(() => window.policesPretes);
  const instants = process.argv.slice(2).map(Number);
  for (const t of instants) {
    await p.evaluate((t) => window.rendre(t), t);
    await p.screenshot({ path: `apercu/${String(t).replace('.', '_')}.jpg`, type: 'jpeg', quality: 80 });
  }
  console.log(erreurs.length ? erreurs : 'ok', await p.evaluate(() => window.SONS.length));
  await b.close();
})();
