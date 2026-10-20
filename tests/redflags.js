// v14: Red Flags mode in the browser, portrait and landscape. Turn on the Red Flags deck, play a full round:
// toggle cues, Done, confidence, fix screen marks all 6 cues with a why, shows Do this, the case and source, fits the width,
// every tile is at least 48 px, the recap shows partial credit, resume works after reload, and there are no console errors.
// SHOTS=dir saves JPGs to dir/street/safety/.
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const SITE = path.join(__dirname, '../site'), shots = process.env.SHOTS;
const T = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[f.split('.').pop()] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise(r => server.listen(0, r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const dir = shots && path.join(shots, 'street/safety'); if (dir) fs.mkdirSync(dir, { recursive: true });
  for (const vp of [{ width: 390, height: 844, name: 'portrait' }, { width: 844, height: 390, name: 'landscape' }]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), page = await ctx.newPage(), errs = [];
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); page.on('pageerror', e => errs.push(e.message));
    const tap = async s => { await page.click(s); await page.waitForTimeout(400); };
    const shot = async n => { if (dir) { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(dir, 'v14-' + n + '-' + vp.name + '.jpg'), type: 'jpeg', quality: 85, fullPage: true }); } };
    await page.goto(base); await tap('[data-act=newprof]'); await page.fill('#nm', 'Tester'); await tap('[data-act="age"][data-a="ya"]'); await tap('[data-act=saveprof]');
    assert(!(await page.$('#rfbtn')), 'no Red Flags button while the deck is off');
    await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
    await tap('#picker [data-act=deck][data-id=safety]');
    // The last Gut Check deck can not be turned off while only Red Flags is on.
    for (const o of ['firstaid', 'kitchen', 'money', 'scams']) { await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true)); await tap(`#picker [data-act=deck][data-id=${o}]`); }
    const on = await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks);
    assert(on.includes('safety') && on.filter(x => x !== 'safety').length === 1, 'one Gut Check deck stays on: ' + on);
    if (vp.name === 'portrait' && dir) { await page.evaluate(() => { document.querySelectorAll('#picker details').forEach(d => d.open = d.dataset.sect === 'Street Smart'); document.querySelector('#picker details[data-sect="Street Smart"]').scrollIntoView(); }); await page.screenshot({ path: path.join(dir, 'v14-picker.jpg'), type: 'jpeg', quality: 85 }); }
    await tap('#rfbtn');
    let sets = 0, reloaded = false;
    while (await page.$('[data-act=cue], [data-act=rfnext]')) {
      const st = await page.evaluate(() => { const r = JSON.parse(localStorage.lsa_save).profiles.p1.rf; return { id: r.q[r.i].id, stage: r.stage, deck: LSA.cardIndex[r.q[r.i].id].deck }; });
      assert.strictEqual(st.deck, 'safety');
      if (st.stage === 'ask') {
        const tiles = await page.evaluate(() => [...document.querySelectorAll('[data-act=cue]')].map(e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }));
        assert.strictEqual(tiles.length, 6, '6 cue tiles'); assert(tiles.every(([w, h]) => w >= 48 && h >= 48), 'tiles at least 48 px');
        assert(await page.evaluate(() => document.documentElement.scrollWidth) <= vp.width, 'ask screen fits');
        // Pick the real flags on even sets (exact), and only the first tile on odd sets (partial credit).
        const picks = await page.evaluate(k => { const r = JSON.parse(localStorage.lsa_save).profiles.p1.rf, it = r.q[r.i], c = LSA.cardIndex[it.id]; return it.order.map((ci, pos) => [pos, c.cues[ci].flag]).filter(([pos, f]) => k % 2 ? pos === 0 : f).map(x => x[0]); }, sets);
        for (const p of picks) await tap(`[data-act=cue][data-p="${p}"]`);
        assert.strictEqual(await page.$$eval('[data-act=cue].on', a => a.length), picks.length, 'toggled tiles show on');
        if (sets === 0) await shot('ask');
        await tap('#rfdone');
        if (!reloaded) { reloaded = true; await page.reload(); await page.waitForTimeout(500); assert(await page.$('[data-act=rfconf]'), 'resumes at the confidence step after reload'); }
        await tap('[data-act=rfconf][data-k="1"]');
      } else {
        const fx = await page.evaluate(() => ({ cues: document.querySelectorAll('#cuelist li').length, flags: document.querySelectorAll('#cuelist li.flag').length, whys: [...document.querySelectorAll('#cuelist li .muted')].filter(e => e.textContent.length > 3).length, cite: (document.querySelector('#fix .cite') || {}).textContent || '', src: !!document.querySelector('#fix a.src'), note: (document.getElementById('notice') || {}).textContent || '', score: (document.getElementById('rfscore') || {}).textContent || '', sw: document.documentElement.scrollWidth }));
        assert.strictEqual(fx.cues, 6); assert.strictEqual(fx.whys, 6); assert(fx.flags >= 2 && fx.flags <= 4);
        assert(/^Case: \S/.test(fx.cite) && fx.src && /911/.test(fx.note), 'case, source and notice'); assert(fx.sw <= vp.width, 'fix fits');
        assert(sets % 2 ? /of 6 right|All 6/.test(fx.score) : /All 6 right/.test(fx.score), 'score line: ' + fx.score);
        if (sets === 0) await shot('fix-exact'); if (sets === 1) await shot('fix-partial');
        sets++; await tap('[data-act=rfnext]');
      }
    }
    const sum = await page.evaluate(() => (document.getElementById('rfsum') || {}).textContent || '');
    assert(/cues right/.test(sum), 'recap: ' + sum); assert.strictEqual(sets, 5, '5 cases a round');
    const p = await page.evaluate(() => JSON.parse(localStorage.lsa_save).profiles.p1);
    assert.strictEqual(p.rf.right >= 3, true, 'exact sets counted'); assert(p.rf.points > p.rf.right * 6, 'partial credit counted');
    await shot('recap');
    assert.deepStrictEqual(errs, [], 'console errors: ' + errs.join(' | '));
    console.log('ok ' + vp.name + ' Red Flags round: 5 cases, ' + p.rf.points + ' of ' + p.rf.max + ' cue points, ' + p.rf.right + ' exact, zero console errors');
    await ctx.close();
  }
  await b.close(); server.close(); console.log('ok red flags browser tests passed');
})().catch(e => { console.error('FAIL', e.message); server.close(); process.exit(1); });
