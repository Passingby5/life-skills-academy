// Engineer Practice: picker fix, 4-choice mode, counts, seeded shuffle, About notice, Playwright.
const fs = require('fs'), path = require('path'), assert = require('assert'), http = require('http');
const { chromium } = require('playwright-core');
const L = require('./load.js').load();

const FE_TOPICS = { math: 16, ethics: 8, econ: 10, statics: 16, dynamics: 8, mom: 14, materials: 10, fluids: 12, surveying: 12, water: 20, structural: 20, geotech: 20, trans: 18, construction: 16 };
const CB_TOPICS = { anatomy: 7, electricity: 6, healthit: 17, function: 30, troubleshooting: 30, safety: 10 };

function topics(id) {
  const t = {};
  L.decks[id].cards.forEach(c => { t[c.topic] = (t[c.topic] || 0) + 1; });
  return t;
}

assert.strictEqual(L.SAVE_V, 2, 'SAVE_V must stay 2 so v2 saves still load');
assert.strictEqual(L.practiceDecks().sort().join(), 'cbet,fecivil');
assert.strictEqual(L.decks.fecivil.section, 'Engineer Fundamentals');
assert.strictEqual(L.decks.cbet.section, 'Engineer Fundamentals');
assert.strictEqual(L.decks.fecivil.format, 'practice');
assert.strictEqual(L.decks.cbet.format, 'practice');
assert.strictEqual(L.knowDecks().length, 16);
assert.deepStrictEqual(topics('fecivil'), FE_TOPICS);
assert.deepStrictEqual(topics('cbet'), CB_TOPICS);
assert.strictEqual(L.decks.fecivil.cards.length, 200);
assert.strictEqual(L.decks.cbet.cards.length, 100);
['ya', 'adult'].forEach(a => {
  assert.strictEqual(L.practiceCardsFor(a, ['fecivil']).length, 200, 'FE ' + a);
  assert.strictEqual(L.practiceCardsFor(a, ['cbet']).length, 100, 'CBET ' + a);
});
assert.strictEqual(L.checkDeck(L.decks.fecivil).join('\n'), '', 'fecivil checker');
assert.strictEqual(L.checkDeck(L.decks.cbet).join('\n'), '', 'cbet checker');

(function phraseRule() {
  const baseCard = (id, c) => ({ id, deck: 'fecivil', topic: 'math', ages: 'both', s: 'A short stem for the phrase test.', c, f: 'A worked explanation that is long enough to pass the minimum length check.', src: 'ncees-fe' });
  const d = Object.assign({}, L.decks.fecivil, { cards: L.decks.fecivil.cards.slice() });
  d.cards = d.cards.slice(0, 50).map((c, i) => Object.assign({}, c));
  // A choice that repeats a 4-word phrase inside itself.
  d.cards[0] = baseCard('ph01', ['The same four word phrase the same four word phrase again', 'Right choice one here', 'Wrong two is short enough', 'Wrong three is also fine']);
  const inner = L.checkPracticeDeck(d).join('\n');
  assert(/choice repeats the phrase/.test(inner), 'inner repeat should fail, got ' + inner);
  // The same 4-word phrase in more than 3 choices across the deck.
  const phrase = 'under all field conditions today';
  d.cards = d.cards.map((c, i) => i < 4 ? baseCard('ph' + i, [i === 0 ? phrase : 'Wrong A ' + i, i === 1 ? phrase : 'Right B ' + i, i === 2 ? phrase : 'Wrong C ' + i, i === 3 ? phrase : 'Wrong D ' + i]) : c);
  const across = L.checkPracticeDeck(d).join('\n');
  assert(/appears in 4 choices/.test(across), 'cross-choice repeat should fail, got ' + across);
})();
assert(L.decks.fecivil.notice && /not (real|official)|not a license/i.test(L.decks.fecivil.notice));
assert(L.decks.cbet.notice && /not (real|official)|not a license/i.test(L.decks.cbet.notice));
L.decks.fecivil.cards.concat(L.decks.cbet.cards).forEach(c => {
  assert.strictEqual(c.ages, 'both', c.id);
  assert.strictEqual(c.c.length, 4, c.id);
  assert.strictEqual(new Set(c.c).size, 4, c.id);
  assert(c.f && c.f.trim().length >= 40, c.id + ' short explanation');
});

// [] is kept; null still means Everyday defaults. load/dump does not turn [] into null.
{
  const empty = L.newSave(); empty.decks = [];
  const ld = L.loadSave(L.dumpSave(empty));
  assert.strictEqual(JSON.stringify(ld.save.decks), '[]');
  assert.strictEqual(ld.repaired, false);
  const fresh = L.loadSave(L.dumpSave(L.newSave()));
  assert.strictEqual(fresh.save.decks, null);
}

// Seeded answer-position distribution: right choice (data index 1) should land in each slot often.
{
  const counts = [0, 0, 0, 0];
  let n = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const p = L.newProfile('Sam', 'ya');
    const st = L.EP.start(p, ['fecivil', 'cbet'], 100, seed);
    assert.strictEqual(st.q.length, 10);
    assert.strictEqual(st.mode, 'ep');
    st.q.forEach(it => {
      assert.strictEqual(Array.from(it.order).slice().sort().join(), '0,1,2,3');
      counts[it.order.indexOf(1)]++;
      n++;
    });
  }
  const expect = n / 4;
  counts.forEach((k, i) => assert(k > expect * 0.7 && k < expect * 1.3, 'slot ' + i + ' got ' + k + ' of ' + n));
  // Different seeds shuffle the question list, not just the choices.
  const a = L.EP.start(L.newProfile('A', 'adult'), ['fecivil'], 1, 11).q.map(x => x.id).join();
  const b = L.EP.start(L.newProfile('B', 'adult'), ['fecivil'], 1, 99).q.map(x => x.id).join();
  assert.notStrictEqual(a, b, 'questions should shuffle each session');
  console.log('ok seeded 4-choice distribution', counts.join('/'), 'n=' + n);
}

// imgAsk figures must not give away the right answer in SVG text or alt.
{
  const stop = new Set('a an the and or of to in on it is be at for with by not no do if your you as up off out than more less one this that can may get keep'.split(' '));
  const words = s => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(' ').filter(w => w.length > 2 && !stop.has(w));
  L.practiceDecks().forEach(id => L.decks[id].cards.forEach(c => {
    if (!c.imgAsk) return;
    const svg = fs.readFileSync(path.join(__dirname, '../src', c.img), 'utf8').replace(/<[^>]+>/g, ' ');
    const pictext = new Set(words(svg + ' ' + L.imgAlt(c)));
    const hit = words(c.c[1]).filter(w => pictext.has(w));
    const wrongHit = words(c.c[0] + ' ' + c.c[2] + ' ' + c.c[3]).filter(w => pictext.has(w));
    assert(!(hit.length && hit.length >= wrongHit.length), c.id + ' question picture gives the answer: ' + hit);
  }));
  console.log('ok imgAsk figures do not give away the answer');
}

// KaTeX is bundled offline (MIT), referenced by the service worker template in build.js.
{
  const lic = fs.readFileSync(path.join(__dirname, '../src/vendor/katex/LICENSE'), 'utf8');
  assert(/MIT License/i.test(lic));
  assert(fs.existsSync(path.join(__dirname, '../src/vendor/katex/katex.min.js')));
  assert(fs.existsSync(path.join(__dirname, '../src/vendor/katex/katex.min.css')));
  const build = fs.readFileSync(path.join(__dirname, '../build.js'), 'utf8');
  assert(/vendor\/katex\/katex\.min\.js/.test(build));
  console.log('ok bundled KaTeX (MIT) is part of the build');
}

console.log('ok practice unit checks (picker save, counts, ages, 4-choice shuffle)');

const SITE = path.join(__dirname, '../site');
const TYPES = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webmanifest: 'application/manifest+json', ttf: 'font/ttf', woff: 'font/woff', woff2: 'font/woff2', css: 'text/css' };
function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': TYPES[f.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      fs.createReadStream(f).pipe(r);
    }).listen(0, () => res(s));
  });
}

(async () => {
  assert(fs.existsSync(path.join(SITE, 'index.html')), 'site/index.html missing; run node build.js first');
  const shotDir = path.join(__dirname, '../shots');
  fs.mkdirSync(shotDir, { recursive: true });
  const server = await serve();
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const vps = [
    { width: 390, height: 844, name: 'portrait' },
    { width: 844, height: 390, name: 'landscape' },
    { width: 320, height: 568, name: 'small' }
  ];
  for (const vp of vps) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.name === 'portrait' ? 3 : 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(), errors = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    const tap = async sel => { await page.click(sel); await page.waitForTimeout(350); };
    const checkLayout = async where => {
      const r = await page.evaluate(() => ({ over: document.documentElement.scrollWidth > window.innerWidth + 1 }));
      assert(!r.over, vp.name + ' overflow at ' + where);
    };
    await page.goto(base, { waitUntil: 'load' });
    await tap('[data-act=newprof]');
    await page.fill('#nm', 'Alex');
    await tap('[data-act=age][data-a=adult]');
    await tap('[data-act=saveprof]');
    await checkLayout('menu');

    // Picker: last deck (and any deck) can be turned off; 0 or 1 allowed; Select all / Clear all.
    await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
    await tap('[data-act=decksclear]');
    let st = await page.evaluate(() => ({ decks: JSON.parse(localStorage.lsa_save).decks, playOff: !!document.querySelector('[data-act=play][disabled]'), note: (document.getElementById('playnote') || {}).textContent, epOff: !!document.querySelector('#epbtn[disabled]'), epnote: (document.getElementById('epnote') || {}).textContent }));
    assert.deepStrictEqual(st.decks, []);
    assert(st.playOff && /Gut Check/i.test(st.note || ''), 'Play should be disabled with a note when no decks are on');
    assert(st.epOff && /Engineer/i.test(st.epnote || ''), 'Engineer Practice should be disabled with a note');

    // Reload: [] stays empty (no silent default re-add).
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(300);
    st = await page.evaluate(() => ({ decks: JSON.parse(localStorage.lsa_save).decks, n: (JSON.parse(localStorage.lsa_save).decks || []).length }));
    assert.deepStrictEqual(st.decks, []);

    await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
    await tap('#picker [data-act=deck][data-id=fecivil]');
    st = await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks);
    assert.deepStrictEqual(st, ['fecivil']);

    await tap('[data-act=decksall]');
    st = await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks);
    assert(Array.isArray(st) && st.length >= 18, 'Select all should turn on picker decks, got ' + (st && st.length));
    await tap('[data-act=decksclear]');
    await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
    await tap('#picker details[data-sect="Engineer Fundamentals"] [data-act=deck][data-id=fecivil]');
    await checkLayout('picker one deck');

    if (vp.name === 'portrait') {
      await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
      const have = await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks || []);
      if (have.indexOf('cbet') < 0) await tap('#picker [data-act=deck][data-id=cbet]');
      await page.evaluate(() => {
        const sect = document.querySelector('#picker details[data-sect="Engineer Fundamentals"]');
        if (sect) { sect.open = true; sect.scrollIntoView({ block: 'start' }); }
      });
      await page.waitForTimeout(250);
      const vis = await page.evaluate(() => {
        const inView = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth; };
        return {
          fe: inView(document.querySelector('#picker [data-act=deck][data-id=fecivil]')),
          cb: inView(document.querySelector('#picker [data-act=deck][data-id=cbet]'))
        };
      });
      assert(vis.fe && vis.cb, 'picker shot should show FE Civil and CBET tiles, got ' + JSON.stringify(vis));
      await page.screenshot({ path: path.join(shotDir, '1-picker.jpg'), type: 'jpeg', quality: 85 });
      const now = await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks || []);
      if (now.indexOf('cbet') >= 0) await tap('#picker [data-act=deck][data-id=cbet]');
    }

    // About notice
    await tap('[data-act=about]');
    const about = await page.textContent('#engnotice');
    assert(/original practice/i.test(about) && /not a license/i.test(about) && /not (an )?official/i.test(about));
    await checkLayout('about');
    await tap('[data-act=menu]');

    // Play Engineer Practice with FE Civil only. Jump to a figure+formula card for the screenshot.
    await tap('#epbtn');
    await page.waitForSelector('#scene');
    await checkLayout('ep ask');

    const jump = async (id) => {
      await page.evaluate(cid => {
        const S = LSA.UI.S(), p = S.profiles[S.active];
        p.ep.q[0].id = cid;
        p.ep.q[0].pick = null;
        p.ep.q[0].conf = null;
        p.ep.i = 0;
        p.ep.stage = 'ask';
        S.screen = 'ep';
        LSA.UI.save();
      }, id);
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(300);
      // resume if we landed on the menu
      if (await page.$('#epbtn')) await tap('#epbtn');
      await page.waitForSelector('#scene');
    };

    await jump('fe129');
    await checkLayout('fe129');
    const feState = await page.evaluate(() => ({
      img: !!document.querySelector('img.cimg'),
      math: !!document.querySelector('.katex, .math, .tex'),
      scene: document.getElementById('scene').innerText
    }));
    assert(feState.img, 'FE figure should show on an imgAsk question');
    assert(feState.math, 'FE formula should render or fall back to tex');
    if (vp.name === 'portrait') {
      await page.screenshot({ path: path.join(shotDir, '2-fe-figure.jpg'), type: 'jpeg', quality: 85 });
    }

    // Worked explanation screen
    const rightPos = await page.evaluate(() => {
      const S = LSA.UI.S(), p = S.profiles[S.active], it = p.ep.q[p.ep.i];
      return it.order.indexOf(1);
    });
    await tap('[data-act=epans][data-p="' + rightPos + '"]');
    await tap('[data-act=epconf][data-k="1"]');
    await page.waitForSelector('#why');
    await checkLayout('explanation');
    const why = await page.evaluate(() => ({
      text: document.getElementById('why').innerText,
      math: !!document.querySelector('#why .katex, #why .math, #why .tex'),
      src: !!document.querySelector('#fix a.src')
    }));
    assert(why.text.length > 20 && why.src && why.math);
    if (vp.name === 'portrait') {
      await page.screenshot({ path: path.join(shotDir, '3-explanation.jpg'), type: 'jpeg', quality: 85 });
    }

    // CBET question
    await tap('[data-act=menu]');
    await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
    const on = await page.evaluate(() => JSON.parse(localStorage.lsa_save).decks);
    if (on.indexOf('fecivil') >= 0) await tap('#picker [data-act=deck][data-id=fecivil]');
    if (on.indexOf('cbet') < 0) {
      await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
      await tap('#picker [data-act=deck][data-id=cbet]');
    }
    // start a fresh CBET round
    await page.evaluate(() => {
      const S = LSA.UI.S(), p = S.profiles[S.active];
      p.ep = null;
      LSA.UI.save();
    });
    await tap('#epbtn');
    await jump('cb008');
    await checkLayout('cbet');
    const cbScene = await page.textContent('#scene');
    assert(/ohm|current|voltage|resistor|amp/i.test(cbScene), 'CBET question text: ' + cbScene);
    if (vp.name === 'portrait') {
      await page.screenshot({ path: path.join(shotDir, '4-cbet.jpg'), type: 'jpeg', quality: 85 });
    }

    assert.deepStrictEqual(errors, [], vp.name + ' console: ' + errors.join(' | '));
    await ctx.close();
    console.log('ok practice browser', vp.name);
  }
  await browser.close();
  server.close();
  console.log('ok practice Playwright (390x844, 844x390, 320x568) and screenshots in shots/');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
