// v6/v7/v8: card pictures (img, fix screen only) and the sectioned picker with 20 decks (12 real + 8 stubs). Builds a test copy with a stub fixture
// (tests/fixtures/img-stub: 8 stub decks, every card has img) into a temp dir, never into site/.
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), assert = require('assert'), { execSync } = require('child_process');
const root = path.join(__dirname, '..'), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsa-img-'));
execSync('node build.js', { cwd: root, env: Object.assign({}, process.env, { LSA_EXTRA: 'tests/fixtures/img-stub', LSA_OUT: dir, COMMIT: 'imgtest' }), stdio: 'ignore' });
const sw = fs.readFileSync(path.join(dir, 'sw.js'), 'utf8');
assert(/"img\/stub-test\.svg"/.test(sw), 'picture is in the service worker cache list'); console.log('ok img in service worker ASSETS');
// The real build has no pictures yet, and its checker rejects a bad img path.
const L = require('./load.js').load(); L.cardIndex.fa01.img = 'pics/x.png'; assert(L.checkAll().some(e => /fa01: img must be/.test(e))); console.log('ok checker rejects a bad img path');
const T = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = q.url.split('?')[0]; if (p.endsWith('/')) p += 'index.html'; const f = path.join(dir, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[f.split('.').pop()] }); r.end(fs.readFileSync(f)); });
const wait = p => p.waitForTimeout(400);
async function imgOk(page, vp, where) {
  const m = await page.evaluate(() => { const i = document.querySelector('img.cimg'); if (!i) return null; const r = i.getBoundingClientRect(); return { alt: i.alt, nw: i.naturalWidth, l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height, w: r.width, sw: document.documentElement.scrollWidth }; });
  assert(m, where + ': picture shown');
  assert(m.nw > 0, where + ': picture loaded'); assert(m.alt && m.alt.length > 5, where + ': alt text');
  assert(m.l >= 0 && m.r <= vp.width + 0.5 && m.sw <= vp.width, where + ': fits the width');
  // Captions must read at about 12px or more: the smallest SVG text is 13 units in a 320-unit-wide picture.
  const scale = Math.min(m.w / 320, m.h / 240); assert(13 * scale >= 12, where + ': captions too small, ' + (13 * scale).toFixed(1) + 'px ' + JSON.stringify(m));
  assert(m.t < vp.height, where + ': picture starts on screen ' + JSON.stringify(m));
  return m;
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    const tag = vp.width < vp.height ? 'portrait' : 'landscape', errs = [];
    const ctx = await b.newContext({ viewport: vp }), page = await ctx.newPage();
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); page.on('pageerror', e => errs.push(e.message));
    await page.goto(base); await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.click('[data-act=newprof]'); await wait(page); await page.fill('#nm', 'Pic'); await page.click('[data-act="age"][data-a="ya"]'); await wait(page); await page.click('[data-act=saveprof]'); await wait(page);
    // Picker: 12 decks in 4 sections, in order, all reachable and none wider than the screen.
    const pk = await page.evaluate(() => ({ sects: [...document.querySelectorAll('#picker details')].map(d => d.dataset.sect), n: document.querySelectorAll('#picker [data-act=deck]').length, sw: document.documentElement.scrollWidth }));
    assert.deepStrictEqual(pk.sects, ['Everyday', 'Health and Safety', 'Tactical Field Care', 'Field Survival', 'Country Living']); assert.strictEqual(pk.n, 20); assert(pk.sw <= vp.width, 'picker fits width');
    // Each section header has a fold arrow that turns when open.
    const arrows = await page.evaluate(() => [...document.querySelectorAll('#picker summary')].map(s => [getComputedStyle(s, '::before').content, getComputedStyle(s, '::before').transform, s.parentNode.open]));
    arrows.forEach(([c, tr, open]) => { assert(/\u25B8|▸/.test(c), 'fold arrow ' + c); assert(open ? tr !== 'none' : tr === 'none', 'arrow turns when open ' + tr); });
    console.log('ok ' + tag + ' section headers have a fold arrow');
    // Turning off the last deck in a section keeps that section open.
    const hs = '#picker details[data-sect="Health and Safety"]';
    await page.evaluate(s => { document.querySelector(s).open = true; }, hs); await wait(page);
    await page.click(hs + ' [data-act=deck][data-id=foodsafe]'); await wait(page);
    assert(await page.evaluate(s => document.querySelector(s).open, hs), 'open after turning a deck on');
    await page.click(hs + ' [data-act=deck][data-id=foodsafe]'); await wait(page);
    assert(await page.evaluate(s => document.querySelector(s).open, hs), 'still open after turning its last deck off');
    await page.evaluate(s => { const d = document.querySelector(s); d.open = false; }, hs); await wait(page);
    await page.click('#picker details[data-sect="Everyday"] [data-act=deck][data-id=money]'); await wait(page);
    assert(!(await page.evaluate(s => document.querySelector(s).open, hs)), 'a section closed by the player stays closed');
    await page.click('#picker details[data-sect="Everyday"] [data-act=deck][data-id=money]'); await wait(page);
    console.log('ok ' + tag + ' a section stays open when its last deck is turned off');
    // Turn the 4 Everyday decks off so the round is all stub cards with pictures.
    const stubs = await page.evaluate(() => LSA.knowDecks().filter(id => /^stub/.test(id)));
    for (const id of stubs) { await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true)); await page.click(`#picker [data-act=deck][data-id=${id}]`); await wait(page); }
    for (const id of ['firstaid', 'kitchen', 'money', 'scams']) { await page.click(`#picker [data-act=deck][data-id=${id}]`); await wait(page); }
    const st = await page.evaluate(() => ({ on: JSON.parse(localStorage.lsa_save).decks, txt: [...document.querySelectorAll('#picker summary')].map(s => s.textContent), h: Math.min(...[...document.querySelectorAll('#picker [data-act=deck]')].map(e => e.getBoundingClientRect().height).filter(Boolean)) }));
    assert.strictEqual(st.on.length, 8); assert(/0 of 4 on/.test(st.txt[0]), st.txt.join('|')); assert(st.h >= 48, 'deck buttons are big enough to tap');
    await page.click('[data-act=play]'); await wait(page);
    assert.strictEqual(await page.evaluate(() => document.querySelectorAll('img.cimg').length), 0, tag + ': no picture on the question screen');
    // The first answer button is on screen with the picture (no scrolling needed to start).
    const ans = await page.evaluate(() => document.querySelector('[data-act=ans]').getBoundingClientRect().top);
    assert(ans < vp.height, tag + ': first answer is on screen');
    await page.click('[data-act=ans][data-p="0"]'); await wait(page); await page.click('[data-act=conf][data-k="1"]'); await wait(page);
    await imgOk(page, vp, tag + ' fix');
    console.log('ok ' + tag + ' picture only on the fix screen, alt text, captions 12px or more, fits ' + vp.width + 'x' + vp.height);
    // Offline: reload with the network off; the page and the picture come from the service worker cache.
    await ctx.setOffline(true); await page.reload(); await wait(page);
    if (await page.$('[data-act=play]')) { await page.click('[data-act=play]'); await wait(page); }
    await imgOk(page, vp, tag + ' offline');
    console.log('ok ' + tag + ' picture works offline');
    // Home screen picker shows too, grouped the same way.
    await ctx.setOffline(false); await page.click('[data-act=menu]'); await wait(page); await page.click('[data-act=home]'); await wait(page);
    assert.strictEqual(await page.evaluate(() => document.querySelectorAll('#picker details').length), 5);
    console.log('ok ' + tag + ' home screen deck picker grouped in 5 sections');
    assert.deepStrictEqual(errs, []); await ctx.close();
  }
  console.log('ok img and picker tests passed'); await b.close(); server.close(); fs.rmSync(dir, { recursive: true, force: true });
})().catch(e => { console.error('FAIL', e.message); server.close(); process.exit(1); });
