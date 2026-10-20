// v7/v8: play one full round in each of the 8 new decks (portrait and landscape), with only that deck on.
// Checks every card comes from that deck, pictures load with alt text, and there are zero console errors.
// SHOTS=dir saves 4 portrait screenshots: the grouped picker, a field care question with a picture,
// a knot fix screen, and a homestead card with a picture.
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const SITE = path.join(__dirname, '../site'), shots = process.env.SHOTS;
const T = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webmanifest: 'application/manifest+json' };
const NEW = ['fieldcare', 'triage', 'foodsafe', 'medsafe', 'navgear', 'survive', 'canning', 'homestead', 'controversy', 'legal', 'estate'];
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[f.split('.').pop()] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise(r => server.listen(0, r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  if (shots) fs.mkdirSync(path.join(shots, 'v11'), { recursive: true });
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
    assert.strictEqual(await page.evaluate(() => document.querySelectorAll('#picker [data-act=deck]').length), 16);
    let prev = on0;
    for (const id of NEW) {
      await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
      await tap(`#picker [data-act=deck][data-id=${id}]`);
      for (const o of prev) { await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true)); await tap(`#picker [data-act=deck][data-id=${o}]`); }
      prev = [id];
      assert.deepStrictEqual(await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks), [id]);
      if (id === 'fieldcare') { await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true)); await page.evaluate(() => document.getElementById('picker').scrollIntoView()); await shot('1-deck-picker.jpg'); await page.evaluate(() => window.scrollTo(0, 0)); }
      if (id === 'legal') {
        const ss = await page.evaluate(() => { const d = document.querySelector('#picker details[data-sect="Street Smart"]'); const nt = d && d.querySelector('.sectnote'); return d && { ids: [...d.querySelectorAll('[data-act=deck]')].map(e => e.dataset.id), note: nt && nt.textContent }; });
        assert(ss, 'Street Smart section'); assert.deepStrictEqual(ss.ids, ['estate', 'legal', 'safety']); assert(/cites its source/.test(ss.note));
        if (shots && vp.name === 'portrait') { fs.mkdirSync(path.join(shots, 'street/legal'), { recursive: true }); await page.evaluate(() => { document.querySelectorAll('#picker details').forEach(d => d.open = d.dataset.sect === 'Street Smart'); document.querySelector('#picker details[data-sect="Street Smart"]').scrollIntoView(); }); await page.screenshot({ path: path.join(shots, 'street/legal/v12-picker.jpg'), type: 'jpeg', quality: 85 }); await page.evaluate(() => window.scrollTo(0, 0)); }
      }
      if (id === 'controversy') {
        // v10: Big Debates section with its facts-only note; the deck is opt-in.
        const bd = await page.evaluate(() => { const d = document.querySelector('#picker details[data-sect="Big Debates"]'); const nt = d && d.querySelector('.sectnote'); return d && { ids: [...d.querySelectorAll('[data-act=deck]')].map(e => e.dataset.id), note: nt && nt.textContent }; });
        assert(bd, 'Big Debates section'); assert.deepStrictEqual(bd.ids, ['controversy']);
        assert.strictEqual(bd.note, 'Facts only. On faith and moral questions we show what each side teaches, not who is right.');
        if (shots && vp.name === 'portrait') { await page.evaluate(() => { document.querySelectorAll('#picker details').forEach(d => d.open = d.dataset.sect === 'Big Debates' || d.dataset.sect === 'Everyday'); document.querySelector('#picker details[data-sect="Big Debates"]').scrollIntoView(); }); await page.screenshot({ path: path.join(shots, 'v11/1-picker-big-debates.jpg'), type: 'jpeg', quality: 85 }); await page.evaluate(() => window.scrollTo(0, 0)); }
      }
      await tap('[data-act=play]');
      let n = 0, pics = 0;
      while (await page.$('[data-act=ans], [data-act=conf], [data-act=next]')) {
        const st = await page.evaluate(() => { const s = JSON.parse(localStorage.lsa_save).profiles.p1.round; const it = s.q[s.i]; return { deck: LSA.cardIndex[it.id].deck, id: it.id, img: LSA.cardIndex[it.id].img || '', stage: s.stage }; });
        assert.strictEqual(st.deck, id, 'card from ' + st.deck + ' in ' + id + ' round');
        const shown = await page.evaluate(() => document.querySelectorAll('img.cimg').length);
        if (st.stage !== 'fix') assert.strictEqual(shown, 0, id + ' question screen shows no picture: ' + st.id);
        if (st.img && st.stage === 'fix') {
          const m = await page.evaluate(() => { const i = document.querySelector('img.cimg'); return i && i.complete ? { w: i.naturalWidth, alt: i.alt } : null; });
          assert(m && m.w > 0 && m.alt.length > 10, id + ' picture loads with alt: ' + st.id);
          pics++;
          if (id === 'fieldcare' && !done.has('fc')) { done.add('fc'); await shot('2-fieldcare-fix-picture.jpg'); }
          if (id === 'homestead' && !done.has('hm')) { done.add('hm'); await shot('3-homestead-fix-picture.jpg'); }
        }
        if (id === 'controversy' && shots && vp.name === 'portrait' && !done.has('ct' + st.stage) && (st.stage === 'ask' || st.stage === 'fix')) { done.add('ct' + st.stage); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(shots, st.stage === 'ask' ? 'v11/2-ct-question.jpg' : 'v11/3-ct-fix.jpg'), type: 'jpeg', quality: 85 }); }
        if ((id === 'legal' || id === 'estate') && st.stage === 'fix') {
          // v12 Street Smart: every Legal fix shows the law or case and the not-legal-advice line, and fits the width.
          const fx = await page.evaluate(() => ({ cite: (document.querySelector('#fix .cite') || {}).textContent || '', src0: (document.querySelector('#fix a.src') || {}).textContent || '', note: (document.getElementById('notice') || {}).textContent || '', sw: document.documentElement.scrollWidth }));
          assert(/^Law or case: \S/.test(fx.cite) || /^Source: \S/.test(fx.src0), 'legal cite or source ' + st.id); assert(/not legal advice/i.test(fx.note), 'legal notice ' + st.id); assert(fx.sw <= vp.width, 'legal fix fits');
        }
        if (id === 'legal' && shots && !done.has('lg' + vp.name + st.stage) && (st.stage === 'ask' || st.stage === 'fix')) { done.add('lg' + vp.name + st.stage); fs.mkdirSync(path.join(shots, 'street/legal'), { recursive: true }); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(shots, 'street/legal', 'v12-legal-' + st.stage + '-' + vp.name + '.jpg'), type: 'jpeg', quality: 85, fullPage: true }); }
        if (id === 'estate' && shots && !done.has('es' + vp.name + st.stage) && (st.stage === 'ask' || st.stage === 'fix')) { done.add('es' + vp.name + st.stage); fs.mkdirSync(path.join(shots, 'street/estate'), { recursive: true }); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(shots, 'street/estate', 'v16-estate-' + st.stage + '-' + vp.name + '.jpg'), type: 'jpeg', quality: 85, fullPage: true }); }
        if (await page.$('[data-act=ans]')) { await tap('[data-act=ans][data-p="' + (n % 3) + '"]'); n++; }
        else if (await page.$('[data-act=conf]')) await tap('[data-act=conf][data-k="1"]');
        else await tap('[data-act=next]');
      }
      assert(await page.$('#recap'), id + ' round reached the recap');
      console.log('ok ' + vp.name + ' played a round in ' + id + ' (' + n + ' answers, ' + pics + ' fix screens with pictures)');
      await tap('[data-act=menu]');
    }
    assert.deepStrictEqual(errs, [], 'console errors: ' + errs.join(' | '));
    console.log('ok ' + vp.name + ' zero console errors across ' + NEW.length + ' new-deck rounds');
    if (vp.name === 'portrait') console.log('shots taken: ' + [...done].join(', '));
    await ctx.close();
  }
  await b.close(); server.close(); console.log('ok new deck tests passed');
})().catch(e => { console.error('FAIL', e.message); server.close(); process.exit(1); });
