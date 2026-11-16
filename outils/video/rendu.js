const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + __dirname + '/scene.html');
  const total = await p.evaluate(() => window.pret);
  const durees = await p.evaluate(() => window.DUREES);
  fs.writeFileSync('durees.json', JSON.stringify(durees));
  const FPS = 24, n = Math.ceil(total * FPS);
  const cadre = await p.$('#cadre');
  for (let f = 0; f < n; f++) {
    await p.evaluate((t) => window.rendre(t), f / FPS);
    await cadre.screenshot({ path: `images/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  console.log('images', n, 'durée', total.toFixed(2));
  await b.close();
})();
