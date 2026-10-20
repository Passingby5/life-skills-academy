// v18 Power Plays: a young adult profile sees Power Plays locked; the parent PIN (set once, typed twice) unlocks it for
// that profile only; an Adult profile plays it with no PIN. Every fix screen shows the tactic and a 3 to 4 box way-out
// diagram that fits 390x844 and 844x390 with no side scroll, targets at least 48 px, zero console errors.
// SHOTS=dir saves JPGs to <dir>/street/power.
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const SITE = path.join(__dirname, '../site'), shots = process.env.SHOTS;
const T = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[f.split('.').pop()] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise(r => server.listen(0, r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
  const dir = shots && path.join(shots, 'street/power'); if (dir) fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const vp of [{ width: 390, height: 844, name: 'portrait' }, { width: 844, height: 390, name: 'landscape' }]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), page = await ctx.newPage(), errs = [];
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); page.on('pageerror', e => errs.push(e.message));
    const tap = async s => { await page.click(s); await page.waitForTimeout(350); };
    const shot = async (n, full) => { if (dir) { await page.screenshot({ path: path.join(dir, 'v18-' + n + '-' + vp.name + '.jpg'), type: 'jpeg', quality: 85, fullPage: !!full }); } };
    const openStreet = () => page.evaluate(() => { document.querySelectorAll('#picker details').forEach(d => d.open = d.dataset.sect === 'Street Smart'); });
    await page.goto(base);
    // Young adult: locked.
    await tap('[data-act=newprof]'); await page.fill('#nm', 'Kid'); await tap('[data-act="age"][data-a="ya"]'); await tap('[data-act=saveprof]');
    await openStreet();
    const lock = await page.evaluate(() => { const e = document.querySelector('#picker [data-act=deck][data-id=power]'); return e && { lock: e.dataset.lock, text: e.textContent }; });
    assert(lock && lock.lock === '1' && /🔒/.test(lock.text) && /parent PIN/.test(lock.text), 'power locked for ya: ' + JSON.stringify(lock));
    await page.evaluate(() => document.querySelector('#picker details[data-sect="Street Smart"]').scrollIntoView()); await shot('1-ya-locked');
    await page.evaluate(() => window.scrollTo(0, 0));
    await tap('#picker [data-act=deck][data-id=power]'); assert(await page.$('#pin1') && await page.$('#pin2'), 'set-PIN screen');
    await shot('2-pin-set');
    await page.fill('#pin1', '2468'); await page.fill('#pin2', '1357'); await tap('[data-act=pinok]');
    assert(/do not match/.test(await page.textContent('#pinmsg')), 'mismatch message');
    await page.fill('#pin1', '2468'); await page.fill('#pin2', '2468'); await tap('[data-act=pinok]');
    let sv = await page.evaluate(() => JSON.parse(localStorage.lsa_save));
    assert.deepStrictEqual(sv.profiles.p1.unlock, ['power']); assert(/^h/.test(sv.pin) && sv.pin !== '2468'); assert(sv.decks.indexOf('power') >= 0);
    assert(/Power Plays covers/.test(await page.textContent('.note')), 'adult-rated deck note');
    // Second young adult profile: still locked; a wrong PIN fails, the right one unlocks.
    await tap('[data-act=home]'); await tap('[data-act=newprof]'); await page.fill('#nm', 'Teen'); await tap('[data-act="age"][data-a="ya"]'); await tap('[data-act=saveprof]');
    await openStreet(); assert.strictEqual(await page.getAttribute('#picker [data-act=deck][data-id=power]', 'data-lock'), '1', 'still locked on a second ya profile');
    await tap('#picker [data-act=deck][data-id=power]'); assert(!(await page.$('#pin2')), 'PIN asked once after it is set');
    await page.fill('#pin1', '0000'); await tap('[data-act=pinok]'); assert(/not right/.test(await page.textContent('#pinmsg')));
    await tap('[data-act=menu]');
    // Adult profile: open, with only Power Plays on.
    await tap('[data-act=home]'); await tap('[data-act=newprof]'); await page.fill('#nm', 'Tom'); await tap('[data-act="age"][data-a="adult"]'); await tap('[data-act=saveprof]');
    await openStreet(); assert.strictEqual(await page.getAttribute('#picker [data-act=deck][data-id=power]', 'data-lock'), null);
    for (const o of await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks)) if (o !== 'power') { await openStreet(); await page.evaluate(id => { const e = document.querySelector(`#picker [data-act=deck][data-id=${id}]`); const d = e.closest('details'); if (d) d.open = true; e.scrollIntoView(); }, o); await tap(`#picker [data-act=deck][data-id=${o}]`); }
    assert.deepStrictEqual(await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks), ['power']);
    await tap('[data-act=play]');
    let n = 0, fixes = 0, none = 0;
    while (await page.$('[data-act=ans], [data-act=conf], [data-act=next]')) {
      const st = await page.evaluate(() => { const s = JSON.parse(localStorage.lsa_save).profiles[JSON.parse(localStorage.lsa_save).active].round; const c = LSA.cardIndex[s.q[s.i].id]; return { deck: c.deck, id: c.id, stage: s.stage, n: c.steps.length, kind: c.kind || '' }; });
      assert.strictEqual(st.deck, 'power');
      if (st.stage === 'ask') { if (!n) await shot('3-question'); const small = await page.evaluate(() => [...document.querySelectorAll('[data-act=ans]')].filter(e => e.getBoundingClientRect().height < 48).length); assert.strictEqual(small, 0, 'answer targets 48 px'); }
      if (st.stage === 'fix') {
        fixes++; if (st.kind) none++;
        const fx = await page.evaluate(() => { const s = document.getElementById('steps'), r = s.getBoundingClientRect(); return { boxes: s.querySelectorAll('.step').length, arrows: s.querySelectorAll('.arr').length, w: r.right, sw: document.documentElement.scrollWidth, tactic: (document.getElementById('tactic') || {}).textContent || '', src: !!document.querySelector('#fix a.src') }; });
        assert.strictEqual(fx.boxes, st.n, 'boxes ' + st.id); assert.strictEqual(fx.arrows, st.n - 1); assert(fx.boxes >= 3 && fx.boxes <= 4);
        assert(fx.sw <= vp.width && fx.w <= vp.width, 'diagram fits ' + st.id + ' ' + JSON.stringify(fx)); assert(/^The play: \S/.test(fx.tactic) && fx.src, 'tactic and source ' + st.id);
        if (fixes === 1) await shot('4-fix', true);
      }
      if (await page.$('[data-act=ans]')) { await tap('[data-act=ans][data-p="' + (n % 3) + '"]'); n++; }
      else if (await page.$('[data-act=conf]')) await tap('[data-act=conf][data-k="1"]');
      else await tap('[data-act=next]');
    }
    assert(await page.$('#recap'), 'reached the recap'); await shot('5-recap');
    // A none card and a faith note, shown directly, for the review shots.
    if (vp.name === 'portrait') {
      const lab = await page.evaluate(() => { const c = LSA.decks.power.cards.find(x => x.kind === 'none'); return c.id; });
      console.log('ok none card id for review: ' + lab);
    }
    assert.deepStrictEqual(errs, [], 'console errors: ' + errs.join(' | '));
    console.log('ok ' + vp.name + ' power: ya locked, PIN set and checked, adult round ' + n + ' answers, ' + fixes + ' fix diagrams fit (' + none + ' none cards)');
    await ctx.close();
  }
  await b.close(); server.close(); console.log('ok power tests passed');
})().catch(e => { console.error(e); process.exit(1); });
