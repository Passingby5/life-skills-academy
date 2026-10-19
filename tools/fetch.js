// Saves the visible text of each source page to sources/<id>.txt using real Chrome.
const { chromium } = require('playwright-core'); const fs = require('fs');
const list = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map(l => l.trim().split(/\s+/));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' });
  await Promise.all([0,1,2,3].map(async w => { const p = await ctx.newPage();
    for (let i = w; i < list.length; i += 4) { const [id, url] = list[i];
      try { const r = await p.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
        const t = await p.evaluate(() => (document.querySelector('main') || document.body).innerText);
        fs.writeFileSync('sources/' + id + '.txt', url + '\n' + t); console.log(r.status(), id, t.length);
      } catch (e) { console.log('ERR', id, e.message.split('\n')[0]); } } }));
  await b.close();
})();
