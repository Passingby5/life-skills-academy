// v3 regression: a double tap never lands on the button that appears under the finger on the next screen.
// Real mouse double taps (two clicks 60 ms apart at the same spot) in portrait and landscape. Run: node tests/dbltap.js
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const SITE = path.join(__dirname, '../site');
const T = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = q.url.split('?')[0]; if (p.endsWith('/')) p += 'index.html'; const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[f.split('.').pop()] }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise(r => server.listen(0, r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 390, height: 844, name: 'portrait' }, { width: 844, height: 390, name: 'landscape' }]) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height } }), page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    const tap = async sel => { await page.click(sel); await page.waitForTimeout(400); };
    const dbl = async sel => { const e = await page.$(sel); await e.scrollIntoViewIfNeeded(); const bb = await e.boundingBox(); const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2; await page.mouse.click(x, y); await page.waitForTimeout(60); await page.mouse.click(x, y); await page.waitForTimeout(450); };
    const st = () => page.evaluate(() => { const S = LSA.UI.S(), p = S.active && S.profiles[S.active], r = p && p.round; return { screen: LSA.UI.U.screen, i: r ? r.i : null, stage: r ? r.stage : null, pick: r && r.q[r.i] ? r.q[r.i].pick : null, conf: r && r.q[r.i] ? r.q[r.i].conf : null }; });
    await page.goto(base);
    await tap('[data-act=newprof]'); await page.fill('#nm', 'Dee'); await tap('[data-act=age][data-a=ya]'); await tap('[data-act=saveprof]');
    await dbl('[data-act=play]'); let s = await st(); assert.strictEqual(s.stage, 'ask'); assert.strictEqual(s.pick, null, vp.name + ': double tap Play also picked an answer');
    await dbl('[data-act=ans][data-p="1"]'); s = await st(); assert.strictEqual(s.stage, 'conf', vp.name + ': double tap answer also picked a confidence'); assert.strictEqual(s.conf, null);
    console.log('ok', vp.name, 'double tap an answer: confidence not picked');
    await dbl('[data-act=conf][data-k="2"]'); s = await st(); assert.strictEqual(s.stage, 'fix', vp.name + ': double tap Sure skipped the fix screen'); assert(await page.$('#fix'));
    console.log('ok', vp.name, 'double tap Sure: fix screen stays');
    const i0 = s.i; await dbl('[data-act=next]'); s = await st(); assert.strictEqual(s.i, i0 + 1); assert.strictEqual(s.stage, 'ask', vp.name + ': double tap Next answered the next card'); assert.strictEqual(s.pick, null);
    console.log('ok', vp.name, 'double tap Next: next card not answered');
    // Myth Match quick pair still works (no screen change between taps)
    await tap('[data-act=menu]');
    await page.evaluate(() => { const S = LSA.UI.S(), p = S.profiles[S.active]; LSA.cardsFor(p.age, LSA.defaultDecks()).slice(0, 6).forEach(c => { p.boxes[c.id] = p.boxes[c.id] || { b: 1, due: 0, n: 1 }; }); LSA.UI.save(); LSA.UI.render(); });
    await page.waitForTimeout(400); await tap('[data-act=match]');
    const pair = await page.evaluate(() => { const t = LSA.UI.U.mm.tiles, a = t.findIndex(x => x.k === 'm'); return [a, t.findIndex(x => x.id === t[a].id && x.k === 'f')]; });
    await page.click(`[data-act=tile][data-i="${pair[0]}"]`); await page.waitForTimeout(100); await page.click(`[data-act=tile][data-i="${pair[1]}"]`); await page.waitForTimeout(100);
    assert(await page.$eval(`[data-act=tile][data-i="${pair[0]}"]`, e => e.classList.contains('gone')), 'quick pair'); console.log('ok', vp.name, 'Myth Match myth then fix 100 ms apart still pairs');
    // Delete: double tap "Yes, delete" deletes once and does not open New player
    await tap('[data-act=menu]'); await tap('[data-act=delask]'); await dbl('[data-act=delyes]');
    s = await st(); assert.strictEqual(s.screen, 'home', vp.name + ': double tap Yes, delete opened ' + s.screen); assert(!(await page.$('#nm')));
    assert.strictEqual(await page.evaluate(() => Object.keys(LSA.UI.S().profiles).length), 0);
    console.log('ok', vp.name, 'double tap Yes, delete: stays on home');
    assert.deepStrictEqual(errors, []); await ctx.close();
  }
  await b.close(); server.close(); console.log('ok 1 double tap tests passed in portrait and landscape');
})().catch(e => { console.error('FAIL', e.message); server.close(); process.exit(1); });
