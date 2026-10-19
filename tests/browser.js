// Playwright phone click-through. Run: node tests/browser.js [url]   (default: serves ./site locally)
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const SITE = path.join(__dirname, '../site');
const TYPES = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' };
function serve() {
  return new Promise(res => { const s = http.createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[f.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(r);
  }).listen(0, () => res(s)); });
}
const results = {}; const pass = (k, m) => { results[k] = 'PASS'; console.log('ok', k, m || ''); };
(async () => {
  let base = process.argv[2], server;
  if (!base) { server = await serve(); base = 'http://127.0.0.1:' + server.address().port + '/'; }
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const shotDir = process.env.SHOTS;
  for (const vp of [{ width: 390, height: 844, name: 'portrait' }, { width: 844, height: 390, name: 'landscape' }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(), errors = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    const tap = async sel => { await page.click(sel); await page.waitForTimeout(400); };
    const checkLayout = async where => {
      const r = await page.evaluate(() => {
        const over = document.documentElement.scrollWidth > window.innerWidth + 1;
        const small = [...document.querySelectorAll('button, a, input')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => { const b = e.getBoundingClientRect(); return { t: e.textContent.slice(0, 30), w: b.width, h: b.height }; }).filter(b => b.w < 48 || b.h < 48);
        return { over, small };
      });
      assert(!r.over, vp.name + ' overflow at ' + where); assert.strictEqual(r.small.length, 0, vp.name + ' small targets at ' + where + ' ' + JSON.stringify(r.small));
    };
    const shot = async n => { if (shotDir && vp.name === 'portrait') await page.screenshot({ path: path.join(shotDir, n), type: 'jpeg', quality: 85 }); };
    await page.goto(base, { waitUntil: 'load' });
    const v = await (await page.request.get(base + 'version.json?t=' + Date.now())).json();
    assert.strictEqual(await page.textContent('#ver'), v.label); pass('1 label matches version.json', v.label);
    await checkLayout('home');
    await tap('[data-act=newprof]'); await page.fill('#nm', 'Sam'); await tap('[data-act=age][data-a=ya]'); await checkLayout('new player'); await tap('[data-act=saveprof]');
    assert.strictEqual((await page.evaluate(() => JSON.parse(localStorage.lsa_save))).profiles.p1.age, 'ya');
    await shot('1-home-profile.jpg');
    await checkLayout('menu');
    await tap('[data-act=play]');
    let n = 0, sawWow = false;
    while (await page.$('[data-act=ans]')) {
      const st = await page.evaluate(() => { const S = LSA.UI.S(), p = S.profiles[S.active], st = p.round, it = st.q[st.i], c = LSA.cardIndex[it.id]; return { it, c, age: p.age, i: st.i }; });
      assert(st.c.ages === 'both' || st.c.ages === 'ya', 'cross-age card in browser');
      assert.strictEqual(await page.textContent('#scene'), typeof st.c.s === 'string' ? st.c.s : st.c.s.ya);
      await checkLayout('question');
      if (vp.name === 'landscape') { const bottom = await page.evaluate(() => Math.max(...[...document.querySelectorAll('[data-act=ans]'), document.getElementById('scene')].map(e => e.getBoundingClientRect().bottom))); assert(bottom <= vp.height, 'landscape answers need scroll'); }
      if (n === 0) await shot('2-gut-check-question.jpg');
      const wrong = st.it.order.findIndex(x => x !== 1), right = st.it.order.indexOf(1);
      const goWrong = n === 0 || n === 2;
      await tap(`[data-act=ans][data-p="${goWrong ? wrong : right}"]`);
      await checkLayout('confidence');
      await tap(`[data-act=conf][data-k="${n === 0 ? 2 : n === 2 ? 0 : 1}"]`);
      await checkLayout('fix');
      const wow = !!(await page.$('#wow')); assert.strictEqual(wow, n === 0, 'wow only when wrong and Sure (card ' + n + ')'); if (wow) sawWow = true;
      const order = await page.evaluate(() => { const t = document.getElementById('fix').innerText; return ['Many people think', 'That is wrong', 'Do this', 'Why', 'Source:'].map(s => t.indexOf(s)); });
      order.forEach((x, k) => assert(x >= 0 && (k === 0 || x > order[k - 1]), 'fix order'));
      assert(await page.getAttribute('#fix a.src', 'href'));
      if (n === 0) await shot('3-fix-wow.jpg');
      if (n === 1) {
        // 8: double tap on Next counts once
        const before = await page.evaluate(() => { const S = LSA.UI.S(); return S.profiles[S.active].round.i; });
        await page.evaluate(() => { const b = document.querySelector('[data-act=next]'); b.click(); });
        await page.evaluate(() => { const b = document.querySelector('[data-act=next]'); if (b) b.click(); });
        const after = await page.evaluate(() => { const S = LSA.UI.S(), st = S.profiles[S.active].round; return { i: st.i, stage: st.stage }; });
        assert.strictEqual(after.i, before + 1); assert.strictEqual(after.stage, 'ask'); pass('8 double tap on Next counts once'); await page.waitForTimeout(400); n++; continue;
      }
      if (n === 3) {
        // 24: reload mid-round, come back to the same card
        const before = await page.evaluate(() => { const S = LSA.UI.S(); return JSON.stringify(S.profiles[S.active].round); });
        await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(300);
        assert.strictEqual(await page.evaluate(() => { const S = LSA.UI.S(); return JSON.stringify(S.profiles[S.active].round); }), before);
        assert(await page.$('#fix'), 'resumed on fix screen');
      }
      await tap('[data-act=next]'); n++;
    }
    assert(n >= 11, 'round had 10 cards plus re-ask, got ' + n);
    assert(sawWow); pass('14/16/17/19 round, fix order, Wow rule', vp.name + ' cards ' + n);
    await page.waitForSelector('#recap'); await checkLayout('recap');
    const wowId = await page.evaluate(() => { const S = LSA.UI.S(); return S.profiles[S.active].round.wows; });
    assert.strictEqual(wowId.length, 1); assert((await page.textContent('#recap')).includes(await page.evaluate(id => LSA.cardIndex[id].m, wowId[0])));
    pass('20 Wow recap'); await shot('4-recap.jpg');
    // Myth Match
    await tap('[data-act=match]'); await checkLayout('match');
    const tiles = await page.evaluate(() => LSA.UI.U.mm.tiles);
    const seen = await page.evaluate(() => { const S = LSA.UI.S(); return Object.keys(S.profiles[S.active].boxes); });
    tiles.forEach(t => assert(seen.includes(t.id), 'unseen card in match'));
    const a = tiles.findIndex(t => t.k === 'm'), bad = tiles.findIndex(t => t.k === 'f' && t.id !== tiles[a].id);
    await tap(`[data-act=tile][data-i="${a}"]`); await tap(`[data-act=tile][data-i="${bad}"]`); await page.waitForTimeout(700);
    assert(!(await page.$eval(`[data-act=tile][data-i="${a}"]`, e => e.classList.contains('gone'))));
    for (let i = 0; i < tiles.length; i++) if (tiles[i].k === 'm') { await tap(`[data-act=tile][data-i="${i}"]`); await tap(`[data-act=tile][data-i="${tiles.findIndex(t => t.id === tiles[i].id && t.k === 'f')}"]`); }
    await page.waitForSelector('#mmdone'); await checkLayout('match done'); pass('22 Myth Match in browser');
    await shot('5-myth-match.jpg');
    // age change saved
    await tap('[data-act=menu]'); await tap('[data-act=editage]'); await tap('[data-act=age][data-a=adult]'); await tap('[data-act=saveprof]');
    assert.strictEqual((await page.evaluate(() => JSON.parse(localStorage.lsa_save))).profiles.p1.age, 'adult');
    await page.reload({ waitUntil: 'load' }); assert((await page.textContent('#app')).includes('Adults (30+)')); pass('9 age pick changed and saved');
    // About
    await tap('[data-act=about]'); await checkLayout('about');
    const want = await page.evaluate(() => LSA.knowDecks().reduce((s, id) => s + Object.keys(LSA.decks[id].sources).length, 0) + LSA.RESEARCH.length);
    assert.strictEqual(await page.$$eval('a.src', l => l.length), want); pass('31 About lists ' + want + ' links');
    await tap('[data-act=menu]');
    // family: second player
    await tap('[data-act=home]'); await tap('[data-act=newprof]'); await page.fill('#nm', 'Dad'); await tap('[data-act=age][data-a=adult]'); await tap('[data-act=saveprof]');
    const fam = await page.evaluate(() => { const S = LSA.UI.S(); return [Object.keys(S.profiles.p1.boxes).length, Object.keys(S.profiles.p2.boxes).length]; });
    assert(fam[0] > 0 && fam[1] === 0); pass('23 family profiles separate in browser');
    // broken save
    await page.evaluate(() => localStorage.setItem('lsa_save', '{broken')); await page.reload({ waitUntil: 'load' });
    assert((await page.textContent('.note')).includes('could not be read')); pass('25 broken save recovers in browser');
    assert.deepStrictEqual(errors, [], vp.name + ' console: ' + errors.join(' | '));
    pass('4/5/6 layout ' + vp.name); pass('30 zero console errors or warnings ' + vp.name);
    // 3: offline
    if (vp.name === 'portrait' && base.startsWith('http')) {
      await page.evaluate(() => navigator.serviceWorker.ready); await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await ctx.setOffline(true); await page.reload({ waitUntil: 'load' });
      await tap('[data-act=newprof]'); await tap('[data-act=age][data-a=adult]'); await tap('[data-act=saveprof]'); await tap('[data-act=play]');
      let k = 0; while (await page.$('[data-act=ans]')) { await tap('[data-act=ans][data-p="0"]'); await tap('[data-act=conf][data-k="1"]'); await tap('[data-act=next]'); k++; }
      assert(k >= 10 && await page.$('#recap')); await ctx.setOffline(false); pass('3 offline full round', k + ' cards');
    }
    await ctx.close();
  }
  await browser.close(); if (server) server.close();
  console.log('Browser tests passed:', Object.keys(results).length, 'checks');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
