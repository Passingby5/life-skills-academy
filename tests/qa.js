// v2 browser regression tests for the QA report on v1 81ceab5. Run: node tests/qa.js
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const SITE = path.join(__dirname, '../site');
const T = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', webmanifest: 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = q.url.split('?')[0]; if (p.endsWith('/')) p += 'index.html'; const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[f.split('.').pop()] }); r.end(fs.readFileSync(f)); });
const ok = m => console.log('ok', m);
(async () => {
  await new Promise(r => server.listen(0, r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  const tap = async sel => { await page.click(sel); await page.waitForTimeout(400); };
  await page.goto(base);
  // Make a real save with a round in progress to corrupt.
  await tap('[data-act=newprof]'); await page.fill('#nm', 'Sam'); await tap('[data-act=age][data-a=ya]'); await tap('[data-act=saveprof]');
  await tap('[data-act=play]'); await tap('[data-act=ans][data-p="0"]');
  const good = JSON.parse(await page.evaluate(() => localStorage.lsa_save));
  // M1: every QA corrupt case shows a working page, never blank.
  const C = JSON.stringify, mod = f => { const s = JSON.parse(C(good)); f(s); return C(s); };
  const cases = {
    'round-badid': mod(s => { s.profiles.p1.round.q[0].id = 'zz99'; }), 'round-empty': mod(s => { s.profiles.p1.round = {}; }),
    'decks-string': mod(s => { s.decks = 'firstaid'; }), 'boxes-null': mod(s => { s.profiles.p1.boxes = null; }),
    'name-number': mod(s => { s.profiles.p1.name = 7; }), 'next-missing': mod(s => { delete s.next; }),
    'null': 'null', 'number': '5', 'garbage': '{zz', 'v99': '{"v":99}', 'v1': '{"v":1,"name":"Old","age":"ya","boxes":{}}', 'v1-noname': '{"v":1,"age":"adult"}'
  };
  for (const k of Object.keys(cases)) {
    await page.evaluate(v => { localStorage.clear(); localStorage.setItem('lsa_save', v); }, cases[k]);
    await page.reload(); await page.waitForTimeout(150);
    const txt = await page.textContent('#app'); assert(txt.trim().length > 20, k + ' blank page');
    const btn = await page.$('[data-act=play], [data-act=newprof], [data-act=prof], #scene, [data-act=next], [data-act=conf]'); assert(btn, k + ' no way to play');
    if (await page.$('[data-act=play]')) { await tap('[data-act=play]'); assert(await page.$('#scene, #recap'), k + ' cannot play'); }
  }
  assert.deepStrictEqual(errors, []); ok('M1 all 12 QA corrupt saves open a working page with no errors');
  // Back to a clean save with one player who has seen cards.
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await tap('[data-act=newprof]'); await page.fill('#nm', 'Ana'); await tap('[data-act=age][data-a=adult]'); await tap('[data-act=saveprof]');
  await tap('[data-act=play]');
  // p1: progress counts unique cards, retries shown apart
  assert.strictEqual(await page.textContent('#prog'), 'Card 1 of 10');
  const wrong = await page.evaluate(() => { const S = LSA.UI.S(), it = S.profiles[S.active].round.q[0]; return it.order.findIndex(x => x !== 1); });
  await tap(`[data-act=ans][data-p="${wrong}"]`); await tap('[data-act=conf][data-k="0"]'); await tap('[data-act=next]');
  assert.strictEqual(await page.textContent('#prog'), 'Card 2 of 10');
  for (let i = 0; i < 2; i++) { await tap('[data-act=ans][data-p="0"]'); await tap('[data-act=conf][data-k="1"]'); await tap('[data-act=next]'); }
  assert(/^One more try \(card \d+ of 10\)$/.test(await page.textContent('#prog')), 'retry label'); ok('p1 "Card N of 10" and retries shown apart');
  // m4: deck toggle keeps the round
  const before = await page.evaluate(() => { const S = LSA.UI.S(); return C = JSON.stringify(S.profiles[S.active].round); });
  await tap('[data-act=menu]'); assert(await page.$('#decknote'));
  await tap('[data-act=deck][data-id=money]');
  assert.strictEqual(await page.evaluate(() => { const S = LSA.UI.S(); return JSON.stringify(S.profiles[S.active].round); }), before);
  assert((await page.textContent('[data-act=play]')).includes('Resume')); ok('m4 deck toggle keeps the round in progress');
  // 8 per control: two taps on the same deck toggle in 300 ms count once
  const d0 = await page.evaluate(() => LSA.UI.S().decks.length);
  await page.evaluate(() => { document.querySelector('[data-act=deck][data-id=money]').click(); document.querySelector('[data-act=deck][data-id=money]').click(); });
  assert.strictEqual(await page.evaluate(() => LSA.UI.S().decks.length), d0 + 1); await page.waitForTimeout(400); ok('8 same control double tap counts once');
  // m5: Back from About returns to the menu and stays in the app
  await tap('[data-act=about]'); assert(await page.$('#research'));
  await page.goBack(); await page.waitForTimeout(200);
  assert(page.url().startsWith(base) && await page.$('[data-act=play]') && !(await page.$('#research'))); ok('m5 Back from About goes to the menu');
  await tap('[data-act=play]'); await page.goBack(); await page.waitForTimeout(200); assert(await page.$('[data-act=editage]'), 'back from round'); ok('m5 Back from a round goes to the menu');
  // m1: in Myth Match, myth then fix within 150 ms both count
  await tap('[data-act=match]');
  const pair = await page.evaluate(() => { const t = LSA.UI.U.mm.tiles, a = t.findIndex(x => x.k === 'm'); return [a, t.findIndex(x => x.id === t[a].id && x.k === 'f')]; });
  await page.evaluate(([a, f]) => { document.querySelector(`[data-act=tile][data-i="${a}"]`).click(); setTimeout(() => document.querySelector(`[data-act=tile][data-i="${f}"]`).click(), 100); }, pair);
  await page.waitForTimeout(250);
  assert(await page.$eval(`[data-act=tile][data-i="${pair[0]}"]`, e => e.classList.contains('gone')), 'fast pair matched'); ok('m1 fast myth then fix (100 ms) still matches');
  // p2: reload during Myth Match lands on the menu
  await page.reload(); await page.waitForTimeout(150); assert(await page.$('[data-act=editage]'), 'menu after reload'); ok('p2 reload in Myth Match returns to the menu');
  // p4: delete a profile with a confirm
  await tap('[data-act=home]'); await tap('[data-act=newprof]'); await page.fill('#nm', 'Temp'); await tap('[data-act=age][data-a=ya]'); await tap('[data-act=saveprof]');
  await tap('[data-act=delask]'); assert((await page.textContent('h1')).includes('Delete Temp'));
  await tap('[data-act=menu]'); assert(await page.$('[data-act=delask]'), 'cancel keeps player');
  await tap('[data-act=delask]'); await tap('[data-act=delyes]');
  const names = await page.evaluate(() => Object.values(LSA.UI.S().profiles).map(p => p.name));
  assert.deepStrictEqual(names, ['Ana']); ok('p4 delete player asks first; cancel keeps; yes deletes only that player');
  // v3-5: recap plural
  for (const [extra, want] of [[1, '(1 was a second try)'], [2, '(2 were second tries)']]) {
    await page.evaluate(n => { const S = LSA.UI.S(); S.active = Object.keys(S.profiles)[0]; const p = S.profiles[S.active]; const st = LSA.GC.start(p, null, 0, 9);
      for (let k = 0; k < n; k++) st.q.push(Object.assign({}, st.q[k], { again: true }));
      st.i = st.q.length; st.stage = 'done'; p.round = st; LSA.UI.U.screen = 'play'; LSA.UI.render(); }, extra);
    assert((await page.textContent('#app')).includes(want), want);
  }
  ok('v3-5 recap says "1 was a second try" and "2 were second tries"');
  assert.deepStrictEqual(errors, [], errors.join(' | ')); ok('no console errors or warnings');
  await b.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); server.close(); process.exit(1); });
