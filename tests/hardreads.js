// v20 Hard Reads (passage mode) in the browser, portrait 390x844 and landscape 844x390. A young adult sees the deck locked
// (parent PIN); an Adult turns it on and plays a passage: the passage first with "I read it", then each question with 3
// choices and a confidence tap, "Show passage" from any question, a fix with the why, the proving paragraph (highlighted
// when shown) and the sources. Resumes mid-question after a reload, plays offline, every target is at least 48 px, no side
// scroll, zero console errors. SHOTS=dir saves JPGs to <dir>/street/hardreads.
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const SITE = path.join(__dirname, '../site'), shots = process.env.SHOTS;
const T = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[f.split('.').pop()] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise(r => server.listen(0, r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
  const dir = shots && path.join(shots, 'street/hardreads'); if (dir) fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const vp of [{ width: 390, height: 844, name: 'portrait' }, { width: 844, height: 390, name: 'landscape' }]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), page = await ctx.newPage(), errs = [];
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); page.on('pageerror', e => errs.push(e.message));
    const tap = async s => { await page.click(s); await page.waitForTimeout(400); };
    const shot = async n => { if (dir) await page.screenshot({ path: path.join(dir, 'v20-' + n + '-' + vp.name + '.jpg'), type: 'jpeg', quality: 85, fullPage: true }); };
    const openStreet = () => page.evaluate(() => { document.querySelectorAll('#picker details').forEach(d => d.open = d.dataset.sect === 'Street Smart'); });
    const fits = async w => { const sw = await page.evaluate(() => document.documentElement.scrollWidth); assert(sw <= vp.width, w + ' fits width: ' + sw); };
    const big = async (sel, w) => { const s = await page.$$eval(sel, a => a.map(e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; })); assert(s.length && s.every(([x, y]) => x >= 48 && y >= 48), w + ' targets 48 px: ' + JSON.stringify(s)); };
    const st = () => page.evaluate(() => { const s = JSON.parse(localStorage.lsa_save), p = s.profiles[s.active]; return p.pr; });
    await page.goto(base);
    await tap('[data-act=newprof]'); await page.fill('#nm', 'Kid'); await tap('[data-act="age"][data-a="ya"]'); await tap('[data-act=saveprof]');
    await openStreet();
    assert.strictEqual(await page.getAttribute('#picker [data-act=deck][data-id=hardreads]', 'data-lock'), '1', 'Hard Reads locked for a young adult');
    assert(!(await page.$('#prbtn')), 'no Hard Reads button while locked');
    await tap('[data-act=home]'); await tap('[data-act=newprof]'); await page.fill('#nm', 'Tom'); await tap('[data-act="age"][data-a="adult"]'); await tap('[data-act=saveprof]');
    assert(!(await page.$('#prbtn')), 'no Hard Reads button while the deck is off');
    await openStreet(); await page.evaluate(() => document.querySelector('#picker [data-act=deck][data-id=hardreads]').scrollIntoView()); await tap('#picker [data-act=deck][data-id=hardreads]');
    assert(/Hard Reads covers/.test(await page.textContent('.note')), 'adult-rated deck note');
    await tap('#prbtn');
    // Screen 1: the passage.
    const ps = await page.evaluate(() => ({ paras: document.querySelectorAll('#passage .para').length, title: (document.getElementById('ptitle') || {}).textContent }));
    assert(ps.paras >= 2 && ps.paras <= 3 && ps.title, 'passage shows: ' + JSON.stringify(ps)); assert(!(await page.$('[data-act=prans]')), 'no questions before I read it');
    await big('#prread', 'read'); await fits('passage'); await shot('1-passage');
    await tap('#prread');
    let n = 0, reloaded = false, peeked = false;
    while (await page.$('[data-act=prans], [data-act=prconf], [data-act=prnext]')) {
      const s = await st();
      if (s.stage === 'ask') {
        assert.strictEqual(await page.$$eval('[data-act=prans]', a => a.length), 3, '3 choices'); await big('[data-act=prans]', 'choices'); await big('#prpeek', 'show passage');
        assert(/^Question \d+ of \d+ · \w/.test(await page.textContent('#prog')), 'progress and type');
        if (!peeked) { peeked = true; await tap('#prpeek'); assert(await page.$('#passage'), 'Show passage works'); await shot('3-peek'); await tap('#prpeek'); assert(!(await page.$('#passage')), 'Hide passage works'); }
        if (n === 0) await shot('2-question');
        const pos = await page.evaluate(() => { const s = JSON.parse(localStorage.lsa_save), r = s.profiles[s.active].pr, it = r.q[r.i]; return r.i % 2 ? it.order.indexOf(0) : it.order.indexOf(1); });
        await tap(`[data-act=prans][data-p="${pos}"]`);
      } else if (s.stage === 'conf') {
        if (!reloaded) { reloaded = true; await page.reload(); await page.waitForTimeout(600); assert(await page.$('[data-act=prconf]'), 'resumes at the confidence step after reload'); await tap('#prpeek'); assert(await page.$('#passage'), 'peek from the confidence step'); await tap('#prpeek'); }
        await big('[data-act=prconf]', 'confidence'); await tap('[data-act=prconf][data-k="2"]');
      } else {
        const fx = await page.evaluate(() => ({ proof: (document.getElementById('proof') || {}).textContent || '', why: (document.getElementById('why') || {}).textContent || '', src: document.querySelectorAll('#fix a.src').length, note: (document.getElementById('notice') || {}).textContent || '', ok: !!document.querySelector('#fix .ok'), wow: !!document.getElementById('wow') }));
        assert(/^Paragraph \d says: “.+”$/.test(fx.proof) && fx.why.length > 10 && fx.src >= 1 && /911/.test(fx.note), 'fix: ' + JSON.stringify(fx));
        assert.strictEqual(fx.ok, s.i % 2 === 0, 'right and wrong scored'); assert.strictEqual(fx.wow, s.i % 2 === 1, 'sure but wrong is a Wow');
        await fits('fix'); await big('#prnext', 'next');
        if (n === 0) { await tap('#prpeek'); assert(await page.$('#passage .para.mark'), 'proving paragraph highlighted'); await shot('4-fix'); await tap('#prpeek'); }
        if (n === 1) await shot('5-fix-wrong');
        n++; await tap('#prnext');
      }
    }
    const sum = await page.textContent('#prsum'), s = await st();
    assert(/questions right/.test(sum) && s.stage === 'done' && n === s.q.length && n >= 5 && n <= 7, 'recap: ' + sum + ' ' + n);
    assert.strictEqual(s.right, Math.ceil(n / 2)); await fits('recap'); await shot('6-recap');
    const boxes = await page.evaluate(() => { const s = JSON.parse(localStorage.lsa_save); return Object.keys(s.profiles[s.active].boxes).filter(k => /^hr\d+-q\d+$/.test(k)).length; });
    assert.strictEqual(boxes, n, 'one Leitner box per question');
    // Offline: the service worker serves the app; a new passage still plays.
    await page.waitForTimeout(800); await ctx.setOffline(true); await page.reload(); await page.waitForTimeout(800);
    await tap('[data-act=prplay]'); assert(await page.$('#passage .para'), 'passage plays offline'); await tap('#prread'); assert.strictEqual(await page.$$eval('[data-act=prans]', a => a.length), 3, 'question offline');
    await ctx.setOffline(false);
    assert.deepStrictEqual(errs, [], 'console errors: ' + errs.join(' | '));
    console.log('ok ' + vp.name + ' Hard Reads: ya locked; passage, then ' + n + ' questions; show passage; resume; fix with proof line; offline; zero console errors');
    await ctx.close();
  }
  await b.close(); server.close(); console.log('ok hard reads tests passed');
})().catch(e => { console.error(e); process.exit(1); });
