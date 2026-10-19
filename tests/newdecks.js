// v7: play one full round in each of the 8 new decks (portrait and landscape), with only that deck on.
// Checks every card comes from that deck, pictures load with alt text, and there are zero console errors.
// SHOTS=dir saves 4 portrait screenshots: the grouped picker, a field care question with a picture,
// a knot fix screen, and a homestead card with a picture.
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const SITE = path.join(__dirname, '../site'), shots = process.env.SHOTS;
const T = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' };
const NEW = ['fieldcare', 'triage', 'foodsafe', 'medsafe', 'navgear', 'survive', 'canning', 'homestead'];
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[f.split('.').pop()] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise(r => server.listen(0, r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  if (shots) fs.mkdirSync(shots, { recursive: true });
  for (const vp of [{ width: 390, height: 844, name: 'portrait' }, { width: 844, height: 390, name: 'landscape' }]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), page = await ctx.newPage(), errs = [];
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); page.on('pageerror', e => errs.push(e.message));
    const tap = async s => { await page.click(s); await page.waitForTimeout(400); };
    const shot = async n => { if (shots && vp.name === 'portrait') await page.screenshot({ path: path.join(shots, n), type: 'jpeg', quality: 85 }); };
    const done = new Set();
    await page.goto(base); await tap('[data-act=newprof]'); await page.fill('#nm', 'Tester'); await tap('[data-act="age"][data-a="adult"]'); await tap('[data-act=saveprof]');
    // New decks start off; the 4 Everyday decks start on.
    const on0 = await page.evaluate(() => [...document.querySelectorAll('#picker [data-act=deck].on')].map(e => e.dataset.id));
    assert.deepStrictEqual(on0, ['firstaid', 'kitchen', 'money', 'scams'], 'default decks');
    assert.strictEqual(await page.evaluate(() => document.querySelectorAll('#picker [data-act=deck]').length), 12);
    let prev = on0;
    for (const id of NEW) {
      await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
      await tap(`#picker [data-act=deck][data-id=${id}]`);
      for (const o of prev) { await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true)); await tap(`#picker [data-act=deck][data-id=${o}]`); }
      prev = [id];
      assert.deepStrictEqual(await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks), [id]);
      if (id === 'fieldcare') { await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true)); await page.evaluate(() => document.getElementById('picker').scrollIntoView()); await shot('1-deck-picker.jpg'); await page.evaluate(() => window.scrollTo(0, 0)); }
      await tap('[data-act=play]');
      let n = 0, pics = 0;
      while (await page.$('[data-act=ans], [data-act=conf], [data-act=next]')) {
        const st = await page.evaluate(() => { const s = JSON.parse(localStorage.lsa_save).profiles.p1.round; const it = s.q[s.i]; return { deck: LSA.cardIndex[it.id].deck, id: it.id, img: LSA.cardIndex[it.id].img || '', stage: s.stage }; });
        assert.strictEqual(st.deck, id, 'card from ' + st.deck + ' in ' + id + ' round');
        if (st.img) {
          const m = await page.evaluate(() => { const i = document.querySelector('img.cimg'); return i && i.complete ? { w: i.naturalWidth, alt: i.alt } : null; });
          assert(m && m.w > 0 && m.alt.length > 10, id + ' picture loads with alt: ' + st.id);
          if (st.stage === 'ask') pics++;
          if (st.stage === 'ask' && id === 'fieldcare' && !done.has('fc')) { done.add('fc'); await shot('2-fieldcare-question-picture.jpg'); }
          if (st.stage === 'ask' && id === 'homestead' && !done.has('hm')) { done.add('hm'); await shot('4-homestead-card-picture.jpg'); }
          if (st.stage === 'fix' && /knot|bowline|hitch/.test(st.img) && !done.has('knot')) { done.add('knot'); await shot('3-knot-fix-screen.jpg'); }
        }
        if (await page.$('[data-act=ans]')) { await tap('[data-act=ans][data-p="' + (n % 3) + '"]'); n++; }
        else if (await page.$('[data-act=conf]')) await tap('[data-act=conf][data-k="1"]');
        else await tap('[data-act=next]');
      }
      assert(await page.$('#recap'), id + ' round reached the recap');
      console.log('ok ' + vp.name + ' played a round in ' + id + ' (' + n + ' answers, ' + pics + ' with pictures)');
      await tap('[data-act=menu]');
    }
    // Make sure a knot fix screen was captured: play navgear/survive knot cards if the rounds missed them.
    if (shots && vp.name === 'portrait' && !done.has('knot')) {
      const kid = await page.evaluate(() => Object.values(LSA.cardIndex).find(c => c.img && /knot|bowline|hitch/.test(c.img)).id);
      await page.evaluate(k => { const s = JSON.parse(localStorage.lsa_save); const p = s.profiles.p1; p.round = LSA.GC.start(p, [LSA.cardIndex[k].deck], 0, 1); p.round.q.unshift({ id: k, order: [0, 1, 2], tries: 0 }); }, kid).catch(() => {});
    }
    assert.deepStrictEqual(errs, [], 'console errors: ' + errs.join(' | '));
    console.log('ok ' + vp.name + ' zero console errors across 8 new-deck rounds');
    if (vp.name === 'portrait') console.log('shots taken: ' + [...done].join(', '));
    await ctx.close();
  }
  await b.close(); server.close(); console.log('ok new deck tests passed');
})().catch(e => { console.error('FAIL', e.message); server.close(); process.exit(1); });
