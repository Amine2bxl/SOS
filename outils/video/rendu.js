// Rendu image par image : chaque image est une fonction pure du temps.
// Quatre navigateurs se partagent les images ; la liste des bruitages sort de
// la même page, sur la même ligne de temps.
const { chromium } = require('playwright');
const fs = require('fs');
const FPS = 30, OUVRIERS = Number(process.env.OUVRIERS || 4);
(async () => {
  fs.mkdirSync('images', { recursive: true });
  const b = await chromium.launch();
  const ouvrir = async () => {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    p.on('pageerror', (e) => { console.error('ERREUR', e.message); process.exit(1); });
    await p.goto('file://' + __dirname + '/scene.html');
    await p.waitForFunction(() => window.policesPretes);
    return p;
  };
  const p0 = await ouvrir();
  const total = await p0.evaluate(() => window.pret);
  fs.writeFileSync('sons.json', JSON.stringify(await p0.evaluate(() => window.SONS)));
  const n = Math.ceil(total * FPS);
  const pages = [p0, ...(await Promise.all(Array.from({ length: OUVRIERS - 1 }, ouvrir)))];
  let fait = 0;
  await Promise.all(pages.map(async (p, k) => {
    for (let f = k; f < n; f += OUVRIERS) {
      await p.evaluate((t) => window.rendre(t), f / FPS);
      await p.screenshot({ path: `images/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
      if (++fait % 150 === 0) console.log(fait, '/', n);
    }
  }));
  console.log('images', n, 'durée', total.toFixed(2));
  await b.close();
})();
