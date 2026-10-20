// Unit tests for the engine. Run: node tests/unit.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const { load, ENGINE, ORDER } = require('./load.js');
const L = load();
const J = x => JSON.stringify(x), eq = (a, b, m) => assert.strictEqual(J(a), J(b), m), neq = (a, b) => assert.notStrictEqual(J(a), J(b));
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const prof = age => L.newProfile('T', age);

t('12/13 deck checker passes, ids unique, every card has deck and source', () => {
  eq(L.checkAll(), []);
  L.knowDecks().forEach(id => ['ya', 'adult'].forEach(a => assert(L.cardsFor(a, [id]).length >= 50, id + a)));
});
t('13 deck checker catches bad cards', () => {
  const bad = { id: 'x', format: 'gutcheck', sources: { a: ['A', 'u'] }, cards: [{ id: 'q', deck: 'x', topic: 't', ages: 'both', s: 's', c: ['a', 'a', 'b'], m: 'm', f: 'f', w: 'w', src: 'zz' }] };
  const e = L.checkDeck(bad).join('|');
  assert(/3 different/.test(e) && /unknown source/.test(e) && /only 1 cards/.test(e));
});
t('8 tap guard: two taps in 300 ms count as one', () => {
  const g = L.tapGuard(300);
  assert(g('a', 1000)); assert(!g('a', 1200)); assert(g('a', 1301)); assert(g('b', 1302));
});
t('11 scenario line matches age group', () => {
  const c = L.cardsFor('ya').find(c => typeof c.s === 'object');
  assert.strictEqual(L.scenario(c, 'ya'), c.s.ya); assert.strictEqual(L.scenario(c, 'adult'), c.s.adult);
});
t('15 right answer lands in each spot about 1/3 over 3,000 cards', () => {
  const pos = [0, 0, 0]; let k = 0;
  for (let s = 1; k < 3000; s++) {
    const st = L.GC.start(prof('adult'), null, 0, s);
    st.q.forEach(it => { if (k < 3000) { pos[it.order.indexOf(1)]++; k++; } });
  }
  pos.forEach(p => assert(Math.abs(p / 3000 - 1 / 3) < 0.05, pos.join(',')));
  console.log('   spots', pos.join(' / '));
});
t('17 Wow only when wrong and Sure', () => {
  assert(L.isWow(false, 2)); assert(!L.isWow(false, 1)); assert(!L.isWow(false, 0)); assert(!L.isWow(true, 2));
});
t('18 Leitner rules', () => {
  eq(L.GAPS, [0, 1, 3, 7, 14]);
  let e = L.grade(null, true, 2, 10); assert.strictEqual(e.b, 2); assert.strictEqual(e.due, 11);
  e = L.grade(e, true, 1, 11); assert.strictEqual(e.b, 3); assert.strictEqual(e.due, 14);
  e = L.grade(e, true, 0, 14); assert.strictEqual(e.b, 3); assert.strictEqual(e.due, 17);
  e = L.grade(e, true, 2, 17); e = L.grade(e, true, 2, 24); assert.strictEqual(e.b, 5); assert.strictEqual(e.due, 38);
  e = L.grade(e, true, 2, 38); assert.strictEqual(e.b, 5);
  e = L.grade(e, false, 2, 52); assert.strictEqual(e.b, 1); assert.strictEqual(e.due, 52);
});
function wrongPos(it) { return [0, 1, 2].find(p => it.order[p] !== 1); }
function rightPos(it) { return it.order.indexOf(1); }
t('14/19/20 round of 10; a missed card comes back once later; Wow recap list', () => {
  const p = prof('ya'), st = L.GC.start(p, null, 0, 7);
  assert.strictEqual(st.q.length, 10);
  const first = st.q[0].id;
  L.GC.pick(st, wrongPos(st.q[0])); assert.strictEqual(st.stage, 'conf');
  L.GC.confirm(st, p, 2); assert.strictEqual(st.stage, 'fix'); assert(st.q[0].wow);
  assert.strictEqual(st.q.length, 11); assert.strictEqual(st.q[3].id, first); assert(st.q[3].again);
  L.GC.next(st, p);
  while (st.stage !== 'done') { const it = L.GC.cur(st); L.GC.pick(st, it.id === first ? wrongPos(it) : rightPos(it)); L.GC.confirm(st, p, 1); L.GC.next(st, p); }
  assert.strictEqual(st.q.filter(x => x.id === first).length, 2, 'only once more');
  eq(st.wows, [first]);
  assert.strictEqual(p.stats.rounds, 1);
});
t('21 due cards first, no same topic twice in a row when it can be helped', () => {
  const p = prof('adult'), cards = L.cardsFor('adult');
  cards.slice(0, 30).forEach(c => p.boxes[c.id] = { b: 2, due: 5, n: 1 });
  const st = L.GC.start(p, null, 5, 3);
  st.q.forEach(it => assert(p.boxes[it.id], 'due first'));
  for (let i = 1; i < st.q.length; i++) assert.notStrictEqual(L.cardIndex[st.q[i].id].topic, L.cardIndex[st.q[i - 1].id].topic);
});
t('22 Myth Match uses only seen cards; right pair clears, wrong pair flips back, ends when all clear', () => {
  const p = prof('ya'); assert.strictEqual(L.MM.start(p, null, 1, 4), null);
  const seen = L.cardsFor('ya').slice(0, 6); seen.forEach(c => p.boxes[c.id] = { b: 1, due: 0, n: 1 });
  const st = L.MM.start(p, null, 9, 4); const ids = seen.map(c => c.id);
  st.tiles.forEach(x => assert(ids.includes(x.id)));
  const a = st.tiles.findIndex(x => x.k === 'm'), wrong = st.tiles.findIndex(x => x.k === 'f' && x.id !== st.tiles[a].id);
  L.MM.tap(st, a); assert.strictEqual(L.MM.tap(st, wrong), 'miss'); assert(!st.cleared[a]);
  st.tiles.forEach((x, i) => { if (x.k === 'm' && !st.cleared[i]) { L.MM.tap(st, i); assert.strictEqual(L.MM.tap(st, st.tiles.findIndex(y => y.id === x.id && y.k === 'f')), 'match'); } });
  assert(st.done);
});
t('23 family profiles keep separate boxes and age groups', () => {
  const s = L.newSave(), a = L.addProfile(s, 'Dad', 'adult'), b = L.addProfile(s, 'Kid', 'ya');
  const pa = s.profiles[a], pb = s.profiles[b], st = L.GC.start(pa, null, 0, 1);
  L.GC.pick(st, rightPos(st.q[0])); L.GC.confirm(st, pa, 2);
  assert.strictEqual(Object.keys(pa.boxes).length, 1); assert.strictEqual(Object.keys(pb.boxes).length, 0);
  const back = L.loadSave(L.dumpSave(s)).save; assert.strictEqual(back.profiles[a].age, 'adult'); assert.strictEqual(back.profiles[b].age, 'ya');
});
t('24 mid-round save and resume', () => {
  const s = L.newSave(), id = L.addProfile(s, 'A', 'ya'), p = s.profiles[id];
  p.round = L.GC.start(p, null, 0, 4); L.GC.pick(p.round, 0); L.GC.confirm(p.round, p, 1); L.GC.next(p.round, p);
  const back = L.loadSave(L.dumpSave(s)).save;
  eq(back.profiles[id].round, JSON.parse(JSON.stringify(p.round)));
  eq(back.profiles[id].boxes, p.boxes); assert.strictEqual(back.active, id);
});
t('25 v1 save upgrades with no data loss; broken save gives a fresh start', () => {
  const v1 = { v: 1, name: 'Tom', age: 'adult', boxes: { fa01: { b: 3, due: 9, n: 2 } }, stats: { rounds: 4, right: 30, seen: 40, wows: 2 } };
  const r = L.loadSave(JSON.stringify(v1)); assert(!r.broken); assert.strictEqual(r.save.v, 2);
  const p = r.save.profiles[r.save.active]; assert.strictEqual(p.name, 'Tom'); eq(p.boxes, v1.boxes); assert.strictEqual(p.stats.rounds, 4);
  ['{oops', '{"v":2,"profiles":null}', '{"v":9}', 'null'].forEach(x => { const b = L.loadSave(x); assert(b.broken, x); assert.strictEqual(b.save.v, 2); });
});
t('26 same seed, same cards, answer order and match layout', () => {
  const a = L.GC.start(prof('ya'), null, 0, 42), b = L.GC.start(prof('ya'), null, 0, 42);
  eq(a, b); neq(a.q, L.GC.start(prof('ya'), null, 0, 43).q);
  const p = prof('ya'); L.cardsFor('ya').slice(0, 9).forEach(c => p.boxes[c.id] = { b: 1, due: 0 });
  eq(L.MM.start(p, null, 5, 4), L.MM.start(p, null, 5, 4));
});
t('27 engine files have no DOM use and run in Node alone', () => {
  ENGINE.forEach(f => { const s = fs.readFileSync(path.join(__dirname, '../src', f), 'utf8'); assert(!/\b(document|window|localStorage|navigator)\b/.test(s), f); });
  const E = load(ENGINE); assert.strictEqual(typeof E.grade, 'function');
  ['modes/gutcheck.js', 'modes/mythmatch.js'].forEach(f => assert(!/\b(document|window|localStorage)\b/.test(fs.readFileSync(path.join(__dirname, '../src', f), 'utf8')), f));
});
t('28 step-list stub deck loads through deck.js and stays out of Know It', () => {
  const d = L.decks['steps-stub']; assert.strictEqual(d.format, 'steps'); eq(L.checkDeck(d), []);
  assert(!L.knowDecks().includes('steps-stub')); assert(!L.cardsFor('ya').some(c => c.deck === 'steps-stub'));
});

// ---------- v2 regression tests (QA of v1 81ceab5) ----------
t('v19 age filter on load: a hand-edited save cannot show an adult card to a young adult', () => {
  const mk = (age, id, unlock) => { const s = L.newSave(), k = L.addProfile(s, 'A', age), p = s.profiles[k]; p.round = L.GC.start(p, null, 0, 4); p.round.q[0].id = id; if (unlock) p.unlock = unlock; return { k, txt: L.dumpSave(s) }; };
  let m = mk('ya', 'es33'); let r = L.loadSave(m.txt); assert.strictEqual(r.save.profiles[m.k].round, null, 'adult-only card dropped for ya'); assert(r.repaired);
  m = mk('ya', 'pw01'); assert.strictEqual(L.loadSave(m.txt).save.profiles[m.k].round, null, 'locked power card dropped for ya');
  m = mk('ya', 'pw01', ['power']); assert(L.loadSave(m.txt).save.profiles[m.k].round, 'kept when the parent PIN unlocked it');
  m = mk('adult', 'es33'); assert(L.loadSave(m.txt).save.profiles[m.k].round, 'adult keeps it');
});
t('v19 QA tell models: catch the v17 Estate tell, and every Street Smart deck passes', () => {
  const Q = require('../tools/tellqa.js'), old = require('./fixtures/estate-v17-choices.json').map(c => ({ c }));
  assert(Q.score(old).gbm > Q.LIMIT, 'v17 estate choices should fail the QA gbm gate');
  const r = Q.check(L, L.knowDecks().filter(id => L.decks[id].section === 'Street Smart')); assert.deepStrictEqual(r.errs, []);
});
const goodSave = () => { const s = L.newSave(), id = L.addProfile(s, 'Sam', 'ya'); s.profiles[id].round = L.GC.start(s.profiles[id], null, 0, 5); return s; };
t('M1 deep save check: bad saves never throw, bad parts are reset, good parts kept', () => {
  const cases = {
    'round-badid': s => { s.profiles.p1.round.q[0].id = 'zz99'; },
    'round-empty': s => { s.profiles.p1.round = {}; },
    'decks-string': s => { s.decks = 'firstaid'; },
    'boxes-null': s => { s.profiles.p1.boxes = null; },
    'name-number': s => { s.profiles.p1.name = 42; },
    'next-missing': s => { delete s.next; },
    'stats-bad': s => { s.profiles.p1.stats = 'x'; },
    'box-bad': s => { s.profiles.p1.boxes.fa01 = { b: 9, due: 'x' }; },
    'order-bad': s => { s.profiles.p1.round.q[1].order = [0, 0, 1]; },
    'stage-bad': s => { s.profiles.p1.round.stage = 'zzz'; },
    'i-out': s => { s.profiles.p1.round.i = 99; },
    'profile-null': s => { s.profiles.p1 = null; }
  };
  Object.keys(cases).forEach(k => {
    const s = goodSave(); cases[k](s); const r = L.loadSave(JSON.stringify(s));
    assert(!r.broken && (r.repaired || (k === 'round-badid' && r.pruned)), k); const o = r.save;
    Object.values(o.profiles).forEach(p => {
      assert(typeof p.name === 'string' && typeof p.boxes === 'object' && p.boxes);
      if (p.round) { assert(L.checkRound(p.round), k); L.GC.card(p.round); }
    });
    assert(o.decks === null || Array.isArray(o.decks), k); assert(Number.isInteger(o.next) && o.next >= 1, k);
  });
  ['null', '42', '"x"', '[]', '{"v":99,"profiles":{}}', '{"v":2}', '{bad'].forEach(x => { const r = L.loadSave(x); assert(r.broken, x); assert.strictEqual(r.save.v, 2); });
  const ok = L.loadSave(JSON.stringify(goodSave())); assert(!ok.broken && !ok.repaired, 'good save not flagged');
});
t('M1 v1 save with no name still loads', () => { const r = L.loadSave('{"v":1,"age":"ya","boxes":{}}'); assert(!r.broken); assert.strictEqual(r.save.profiles[r.save.active].name, 'Player'); });
t('M2 checker fails a deck where the right answer is long', () => {
  const mk = (r, o) => ({ id: 'q' + Math.random(), deck: 'x', topic: 't', ages: 'both', s: 's', c: [o, r, o.slice(0, -1) + 'z'], m: 'm', f: 'f', w: 'w', src: 'a' });
  const d = { id: 'x', format: 'gutcheck', sources: { a: ['A', 'u'] }, cards: [] };
  for (let i = 0; i < 60; i++) d.cards.push(mk('right answer here', 'a wrong one here!!'));
  assert(!/longest|next longest/.test(L.checkDeck(d).join('|')), 'equal lengths pass');
  d.cards[0] = mk('a much much longer right answer', 'short one');
  assert(/1\.\d\dx the next longest|[2-9]\.\d\dx/.test(L.checkDeck(d).join('|')), 'ratio rule');
  d.cards.forEach((c, i) => { if (i < 30) c.c = ['short a', 'the right answer', 'short b']; });
  assert(/longest on \d+% of cards/.test(L.checkDeck(d).join('|')), 'share rule');
  L.knowDecks().forEach(id => assert(L.lengthStats(L.decks[id]).rightLongest <= 0.4, id));
});
t('m1 tap guard is per control: a different control right away still counts', () => {
  const g = L.tapGuard(300); assert(g('tile:1', 1000)); assert(g('tile:4', 1150)); assert(!g('tile:4', 1300));
});
t('m2 no topic twice in a row across the whole round, retries included (3,000 seeds)', () => {
  let bad = 0;
  for (let seed = 1; seed <= 3000; seed++) {
    const p = prof(seed % 2 ? 'ya' : 'adult'), r = L.rng(seed), all = L.cardsFor(p.age);
    all.forEach(c => { if (r.next() < 0.1) p.boxes[c.id] = { b: 2, due: 0, n: 1 }; });
    const st = L.GC.start(p, null, 0, seed);
    while (st.stage !== 'done') { const it = L.GC.cur(st); L.GC.pick(st, r.next() < 0.5 ? it.order.indexOf(1) : wrongPos(it)); L.GC.confirm(st, p, r.int(3)); L.GC.next(st, p); }
    const tp = st.q.map(x => L.cardIndex[x.id].topic);
    for (let i = 1; i < tp.length; i++) if (tp[i] === tp[i - 1] && tp.slice(i).some(x => x !== tp[i])) { bad++; break; }
  }
  assert.strictEqual(bad, 0, bad + ' seeds had a repeat');
  const p = prof('adult'); L.cardsFor('adult').forEach(c => { if (Math.abs(L.hashSeed(c.id)) % 9 === 0) p.boxes[c.id] = { b: 2, due: 0 }; });
  const st = L.GC.start(p, null, 0, 119), tp = st.q.map(x => L.cardIndex[x.id].topic);
  for (let i = 1; i < tp.length; i++) assert.notStrictEqual(tp[i], tp[i - 1], 'seed 119');
});
t('m3 a missed card answered right and Sure on its retry stays in box 1', () => {
  const p = prof('ya'), st = L.GC.start(p, null, 0, 11), id = st.q[0].id;
  L.GC.pick(st, wrongPos(st.q[0])); L.GC.confirm(st, p, 1); L.GC.next(st, p);
  while (st.stage !== 'done') { const it = L.GC.cur(st); L.GC.pick(st, rightPos(it)); L.GC.confirm(st, p, 2); L.GC.next(st, p); }
  assert.strictEqual(p.boxes[id].b, 1); assert.strictEqual(p.boxes[id].due, 0);
  assert(Object.keys(p.boxes).filter(k => k !== id).every(k => p.boxes[k].b === 2));
});
t('p1 progress counts unique cards; retries shown apart', () => {
  const p = prof('ya'), st = L.GC.start(p, null, 0, 3);
  L.GC.pick(st, wrongPos(st.q[0])); L.GC.confirm(st, p, 0); L.GC.next(st, p);
  eq(L.GC.progress(st), { n: 2, total: 10, retry: false });
  while (!L.GC.cur(st).again) { L.GC.pick(st, rightPos(L.GC.cur(st))); L.GC.confirm(st, p, 1); L.GC.next(st, p); }
  const pr = L.GC.progress(st); assert.strictEqual(pr.total, 10); assert(pr.retry);
});
t('p3 save with no profile counter gives a real id, not pNaN', () => {
  const s = goodSave(); delete s.next; const o = L.loadSave(JSON.stringify(s)).save, id = L.addProfile(o, 'B', 'adult');
  assert.strictEqual(id, 'p2'); const s2 = goodSave(); s2.next = 'x'; assert.strictEqual(L.addProfile(L.loadSave(JSON.stringify(s2)).save, 'C', 'ya'), 'p2');
});
t('p4 delete a profile; the other stays', () => {
  const s = L.newSave(), a = L.addProfile(s, 'A', 'ya'), b = L.addProfile(s, 'B', 'adult');
  L.deleteProfile(s, b); assert(!s.profiles[b] && s.profiles[a]); assert.strictEqual(s.active, null);
});
t('p4 no IRS Historical Content source; every source file is current', () => {
  L.knowDecks().forEach(id => Object.keys(L.decks[id].sources).forEach(k => {
    const f = path.join(__dirname, '../sources', k + '.txt');
    if (fs.existsSync(f)) assert(!/Historical Content|FS-2017/.test(fs.readFileSync(f, 'utf8')), k);
    assert(!/how-to-know-its-really-the-irs-calling/.test(L.decks[id].sources[k][1]), k);
  }));
});

// ---------- v3 regression tests (QA of v2 eb10a8a) ----------
t('v3-2 a retry never follows its own card: 2+ other cards between, over 3,000 rounds', () => {
  let rounds = 0, back = 0, close = 0, carried = 0;
  for (let seed = 1; seed <= 3000; seed++) {
    const p = prof(seed % 2 ? 'ya' : 'adult'), r = L.rng(seed);
    const st = L.GC.start(p, null, 0, seed); rounds++;
    while (st.stage !== 'done') { const it = L.GC.cur(st); L.GC.pick(st, r.next() < 0.5 ? rightPos(it) : wrongPos(it)); L.GC.confirm(st, p, r.int(3)); L.GC.next(st, p); }
    const ids = st.q.map(x => x.id);
    ids.forEach((id, i) => { if (ids[i + 1] === id) back++; const j = ids.indexOf(id, i + 1); if (j > 0 && j - i < 3) close++; });
    carried += (st.carried || []).length;
  }
  assert.strictEqual(back, 0, 'same card back to back'); assert.strictEqual(close, 0, 'fewer than 2 cards between');
  assert(carried > 0, 'some end-of-round misses were carried'); console.log('   rounds', rounds, 'carried to next round', carried);
});
t('v3-2 a card missed in slot 10 opens the next round', () => {
  const p = prof('ya'), st = L.GC.start(p, null, 0, 21);
  for (let k = 0; k < 9; k++) { L.GC.pick(st, rightPos(L.GC.cur(st))); L.GC.confirm(st, p, 1); L.GC.next(st, p); }
  const last = L.GC.cur(st).id; L.GC.pick(st, wrongPos(L.GC.cur(st))); L.GC.confirm(st, p, 2); L.GC.next(st, p);
  assert.strictEqual(st.stage, 'done'); assert.strictEqual(st.q.length, 10); eq(st.carried, [last]);
  const s = L.newSave(); s.profiles.p1 = p; s.next = 2; const back = L.loadSave(JSON.stringify(s)).save.profiles.p1; eq(back.carry, [last]);
  const st2 = L.GC.start(back, null, 0, 22); assert(st2.q.slice(0, 3).some(x => x.id === last)); eq(back.carry, []);
});
t('v3-3 first words give no clue; simple strategies score 45% or less', () => {
  const all = L.knowDecks().flatMap(id => L.decks[id].cards), W = L.tellStats(all).words;
  Object.keys(W).forEach(w => { if (W[w][0] >= 10) { const r = W[w][1] / W[w][0]; assert(r >= 0.2 && r <= 0.5, w + ' ' + W[w]); } });
  L.knowDecks().forEach(id => Object.entries(L.tellStats(L.decks[id].cards).strat).forEach(([k, v]) => assert(v <= L.tellLimit(id, k), id + ' ' + k + ' ' + v)));
  // checker catches a deck where "No" is always right
  const save = L.decks.firstaid.cards.map(c => c.c.slice());
  L.decks.firstaid.cards.forEach(c => { c.c = ['Yes, ' + c.c[0], 'No, ' + c.c[1], c.c[2]]; });
  const e = L.checkAll().join('|'); L.decks.firstaid.cards.forEach((c, i) => { c.c = save[i]; });
  assert(/first word "No"/.test(e) && /strategy "startsNo"/.test(e), e.slice(0, 200)); eq(L.checkAll(), []);
});
t('v3-4 kf14 fits its question and myth; no half-right decoy', () => {
  const c = L.cardIndex.kf14;
  assert(/Toss the whole thing/.test(c.s) && /toss/i.test(c.m) && /^Yes/.test(c.c[0]) && /toss/.test(c.c[0]), 'myth choice matches myth');
  assert(/1 inch around and below/.test(c.c[1]) && /^No/.test(c.c[1]));
  assert(!/^No|cut|trim|scrape/i.test(c.c[2]), 'decoy is plainly wrong');
  assert(/at least 1 inch around and below/.test(c.f));
});
t('v3-6 mn65 matches the FTC rule', () => {
  const c = L.cardIndex.mn65, src = fs.readFileSync(path.join(__dirname, 'fixtures/ftc-lostcard-excerpt.txt'), 'utf8');
  assert(/within 60 days of your statement/.test(c.s) && /after 3 business days/.test(c.s));
  assert.strictEqual(c.c[1], 'Up to $500'); assert(/up to \$500/.test(c.f) && /more/.test(c.f));
  assert(/more than 2 business days after you learn about the loss or theft, but within 60 calendar days after your statement/.test(src) && /\$500/.test(src));
});

// ---------- v4 regression tests ----------
t('v4-1 middle-length and all simple strategies stay at 45% or less on every deck; checker has the middle rule', () => {
  L.knowDecks().forEach(id => { const t = L.tellStats(L.decks[id].cards).strat; assert('middle' in t); Object.entries(t).forEach(([k, v]) => assert(v <= L.tellLimit(id, k), id + ' ' + k + ' ' + v)); });
  const save = L.decks.scams.cards.map(c => c.c.slice());
  L.decks.scams.cards.forEach(c => { c.c = ['aa ' + 'x'.repeat(5), 'bb ' + 'x'.repeat(10), 'cc ' + 'x'.repeat(15)]; });
  const e = L.checkAll().join('|'); L.decks.scams.cards.forEach((c, i) => { c.c = save[i]; });
  assert(/scams: strategy "middle"/.test(e), e.slice(0, 200)); eq(L.checkAll(), []);
});
t('v4-2/3/4 mn56, kf89, sc34 choices answer their questions', () => {
  const g = id => L.cardIndex[id].c;
  assert(!g('mn56').some(x => /boss/.test(x)) && g('mn56').every(x => x.split(' ').length >= 3));
  assert(!g('kf89').some(x => /grease/.test(x)) && g('kf89').every(x => x.split(' ').length >= 3));
  assert(!g('sc34').includes('It is free'));
});
t('v4-4 no very terse choices except short direct answers to which/how-long/how-much questions', () => {
  const ok = new Set(['fa19', 'kf55', 'kf56', 'kf88', 'kf90', 'kf97', 'mn61', 'mn62', 'mn86', 'sc33', 'ct18']);
  L.knowDecks().forEach(id => L.decks[id].cards.forEach(c => { if (c.c.some(x => x.split(' ').length < 3 && !/\d/.test(x))) assert(ok.has(c.id), c.id + ' ' + c.c.join(' | ')); }));
});
t('v4-5 a carried retry is kept while its deck is off and comes back when it is on', () => {
  const p = prof('adult'), id = L.cardsFor('adult', ['firstaid'])[0].id; p.carry = [id];
  const s1 = L.GC.start(p, ['money', 'kitchen'], 0, 1);
  assert(!s1.q.some(x => x.id === id)); eq(p.carry, [id]);
  const sv = L.newSave(); sv.profiles.p1 = p; sv.next = 2; const back = L.loadSave(JSON.stringify(sv)).save.profiles.p1; eq(back.carry, [id]);
  const s2 = L.GC.start(back, ['money', 'firstaid'], 0, 2);
  assert(s2.q.slice(0, 3).some(x => x.id === id)); eq(back.carry, []);
});

t('v17 QA v15 Red Flags fixes: real names, charged wording, no quote tell, trusted safe cues, polish', () => {
  const d = L.decks.safety, g = id => d.cards.find(c => c.id === id), all = c => [c.s].concat(c.cues.map(q => q.t + ' ' + q.why)).join(' ');
  assert(/Roshard Andrew Carty/.test(g('sf05').s) && !/Kevin/.test(g('sf05').s));
  assert(/Charmmorro Vijay Strothers/.test(g('sf13').s) && !/Jonathan/.test(g('sf13').s));
  assert(/Davyd George Brand Jimenez/.test(g('sf14').s) && !/Pedro/.test(g('sf14').s));
  ['sf14', 'sf15'].forEach(id => assert(/is charged|was charged/.test(g(id).s) && /[Pp]rosecutors say/.test(g(id).s), id));
  assert(/indictment/.test(g('sf30').s) && /said to have taken/.test(g('sf30').s) && /said to have taken/.test(g('sf23').s));
  d.cards.forEach(c => c.cues.forEach(q => assert(!L.cueQuoted(q.t), c.id + ' quoted cue: ' + q.t)));
  ['sf01', 'sf17', 'sf21', 'sf27', 'sf28'].forEach(id => g(id).cues.filter(q => !q.flag).forEach(q => assert(!/^They\b/.test(q.t), id + ' ' + q.t)));
  assert(/falsely said a rapper co-owned/.test(all(g('sf37'))) && !/had no role\./.test(all(g('sf37'))));
  assert(/over \$15,000/.test(all(g('sf43'))) && !/10,000/.test(all(g('sf43'))));
  assert(/Gulf of Mexico/.test(g('sf29').cues.map(q => q.t).join(' ')) && !/oil rig overseas/.test(all(g('sf29'))));
  assert(/Daren Li/.test(g('sf34').s) && g('sf34').src === 'doj-daren-li' && !d.sources['doj-pig-ndny']);
  // Quote rule: separate from punct; a deck whose quoted tiles are all flags fails.
  assert('quote' in L.cueTells(d.cards));
  const bad = Object.assign({}, d, { cards: d.cards.map(c => Object.assign({}, c, { cues: c.cues.map(q => q.flag ? Object.assign({}, q, { t: '"' + q.t + '"' }) : q) })) });
  assert(L.checkFlagDeck(bad).some(e => /quoted cues/.test(e)));
  assert(L.checkFlagDeck(d).every(e => !/quote/.test(e)));
});

// ---------- v5 regression tests ----------
t('v5-1 negation, number, and comma/semicolon strategies exist and stay at 45% or less on every deck', () => {
  L.knowDecks().forEach(id => { const t = L.tellStats(L.decks[id].cards).strat; ['negation', 'number', 'punct'].forEach(k => { assert(k in t); assert(t[k] <= L.tellLimit(id, k), id + ' ' + k + ' ' + t[k]); }); });
  const c = { c: ['Pick this one', 'No, not this one', 'Or this one'] }; eq(L.tellStats([c]).strat.negation, 1);
  eq(L.tellStats([{ c: ['a b c', 'Wait 20 minutes', 'x y z'] }]).strat.number, 1);
  eq(L.tellStats([{ c: ['a b c', 'Call; then wait', 'x y z'] }]).strat.punct, 1);
});
t('v5-1/v8 surface-feature classifier: 45% or less held-out on every deck and on the new decks pooled (all decks pooled 47% or less); only frozen decks have a documented exception', () => {
  const M = require('../tools/tellmodel.js'), G = require('../tools/tellgate.js'), all = [].concat(...L.knowDecks().map(id => L.decks[id].cards));
  const sc = G.scores(L); eq(G.check(L, sc), []);
  assert(sc._pooledNew <= 0.45, 'pooled new ' + sc._pooledNew); assert(sc._pooled <= 0.47, 'pooled all ' + sc._pooled);
  L.knowDecks().forEach(id => assert(sc[id] <= L.tellLimit(id, 'classifier'), id + ' ' + sc[id]));
  L.knowDecks().filter(id => L.FROZEN_DECKS.indexOf(id) < 0).forEach(id => assert(sc[id] <= 0.45, id + ' ' + sc[id]));
  // Sanity: the model does catch an obvious tell (right answer always has a number).
  const fake = all.slice(0, 120).map(c => ({ c: [c.c[0].replace(/\d/g, ''), 'Wait 5 min ' + c.id, c.c[2].replace(/\d/g, '')] }));
  assert(M.heldOut(fake, L, 5) > 0.9);
});
t('v5-2/3/4 mn12, sc54, kf89 rewrites', () => {
  const g = id => L.cardIndex[id].c;
  assert(!g('mn12').includes('A small monthly fee each time'));
  assert(!g('sc54').includes('Keep the receipt') && /normal/i.test(g('sc54')[2]));
  assert(!g('kf89').includes('Teach them for small fires') && !/teach|learn/i.test(g('kf89')[2]));
});

// ---------- v6 tests ----------
t('v6 freeze: the 4 existing decks match tools/frozen-decks.json', () => {
  const fz = require('../tools/frozen-decks.json').sha256, c = require('crypto');
  Object.keys(fz).forEach(id => eq(c.createHash('sha256').update(JSON.stringify(L.decks[id].cards.map(({ deck, ...r }) => r))).digest('hex'), fz[id], id + ' changed; content is frozen'));
});
t('v6-2 no stilted "Not/Skip/Don\'t X; Y" wrong choices; v6-3 kf35 decoy answers yes or no', () => {
  L.knowDecks().forEach(id => L.decks[id].cards.forEach(c => [0, 2].forEach(k => assert(!/^(Not|Skip|Don't|No|Never)\b[^;]*;/.test(c.c[k]), c.id + ' ' + c.c[k]))));
  assert(/^(Yes|No)\b/.test(L.cardIndex.kf35.c[2]));
});
t('v6-5 img field: checker accepts img/name.svg, rejects others; alt text defaults; sections group decks', () => {
  const c = L.cardIndex.fa01, keep = c.img;
  c.img = 'img/tourniquet-placement.svg'; eq(L.checkAll(), []);
  ['img/a.png', '../x.svg', 'http://x/y.svg', 5].forEach(v => { c.img = v; assert(L.checkAll().some(e => /fa01: img must be/.test(e)), String(v)); });
  c.img = keep; delete c.img;
  assert(/burns/.test(L.imgAlt(c))); eq(L.imgAlt({ imgAlt: 'A leg with a band', topic: 'x' }), 'A leg with a band');
  eq(L.sectionsOf(L.knowDecks()).map(g => g.name), ['Everyday', 'Health and Safety', 'Tactical Field Care', 'Field Survival', 'Country Living', 'Big Debates', 'Street Smart']); eq(L.sectionsOf(L.knowDecks())[0].ids, ['firstaid', 'kitchen', 'money', 'scams']);
  eq(L.defaultDecks(), ['firstaid', 'kitchen', 'money', 'scams']); eq(L.knowDecks().length, 16);
});

// ---------- v8 tests ----------
t('v8 tell exceptions: only the 4 frozen decks, each at its frozen score (within 0.5 points), never loosening any other deck', () => {
  const G = require('../tools/tellgate.js'), sc = G.scores(L), fz = Object.keys(require('../tools/frozen-decks.json').sha256).sort();
  eq(L.FROZEN_DECKS.slice().sort(), fz);
  Object.keys(L.TELL_EXCEPTIONS).forEach(id => {
    assert(fz.indexOf(id) >= 0, id + ' is not frozen');
    Object.entries(L.TELL_EXCEPTIONS[id]).forEach(([k, v]) => {
      const now = k === 'classifier' ? sc[id] : L.tellStats(L.decks[id].cards).strat[k];
      assert(now <= v && v - now < 0.005, id + ' ' + k + ' exception ' + v + ' vs score ' + now);
    });
  });
  // A non-frozen deck can not borrow an exception, and an over-limit new deck fails the checker.
  assert.strictEqual(L.tellLimit('fieldcare', 'classifier'), 0.45); assert.strictEqual(L.tellLimit('fieldcare', 'negation'), 0.45);
  const save = L.decks.fieldcare.cards.map(c => c.c.slice());
  L.decks.fieldcare.cards.forEach(c => { c.c = [c.c[0], 'No, ' + c.c[1], c.c[2]]; });
  const e = L.checkAll().join('|'); L.decks.fieldcare.cards.forEach((c, i) => { c.c = save[i]; });
  assert(/fieldcare: strategy "(startsNo|negation)"/.test(e), e.slice(0, 200));
  L.TELL_EXCEPTIONS.fieldcare = { classifier: 0.9 }; const e2 = G.check(L, sc).join('|'); delete L.TELL_EXCEPTIONS.fieldcare;
  assert(/fieldcare: tell exception is only allowed for frozen decks/.test(e2));
  eq(L.checkAll(), []);
});
t('v8 QA guessers exist: word counts, hedge words, scenario overlap, odd first word', () => {
  const s = L.tellStats(L.decks.firstaid.cards).strat;
  ['mostWords', 'fewestWords', 'middleWords', 'avoidHedge', 'mostOverlap', 'leastOverlap', 'oddFirstWord'].forEach(k => assert(k in s, k));
  eq(L.tellStats([{ s: 'x', c: ['a b c d', 'a', 'a b'] }]).strat.fewestWords, 1);
  eq(L.tellStats([{ s: 'x', c: ['Yes it is', 'Maybe not', 'Yes it was'] }]).strat.oddFirstWord, 1);
  eq(L.tellStats([{ s: 'dog bite', c: ['cat', 'dog bite', 'fish'] }]).strat.mostOverlap, 1);
});
t('v8 no myth is used twice across decks', () => {
  const seen = {}, n = x => x.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  L.knowDecks().forEach(id => L.decks[id].cards.forEach(c => { const k = n(c.m); assert(!seen[k], c.id + ' repeats the myth of ' + seen[k] + ': ' + c.m); seen[k] = c.id; }));
});
t('v8 safety cuts and rewrites', () => {
  const ids = Object.keys(L.cardIndex);
  ['tr33', 'tr34', 'tr11', 'sv25', 'sv26', 'fc58', 'fc43', 'hm63'].forEach(id => assert(ids.indexOf(id) < 0, id + ' should be cut'));
  for (let n = 55; n <= 65; n++) assert(ids.indexOf('sv' + n) < 0, 'sv' + n + ' (Virginia trapping) should be cut');
  const all = L.knowDecks().flatMap(id => L.decks[id].cards);
  all.forEach(c => { const txt = [L.scenario(c, 'ya'), L.scenario(c, 'adult'), c.c[1], c.f, c.w].join(' ');
    assert(!/virginia/i.test(txt), c.id + ' mentions Virginia');
    assert(!/(push|pull|knock|move)[^.]*(off|from)[^.]*(wire|line)/i.test(c.c[1] + ' ' + c.f), c.id + ' says to move a person off a live line');
    assert(!/always edible|generally safe/i.test(txt), c.id + ' says wild food is safe'); });
  const fc33 = L.cardIndex.fc33; assert(/do not touch/i.test(fc33.f) && /911/.test(fc33.f) && /back/i.test(fc33.f) && fc33.src === 'esfi-lines');
  const fc63 = L.cardIndex.fc63; assert(!/catch|kill/i.test(fc63.c[1] + fc63.f) && /soap and water/.test(fc63.f) && /animal control/.test(fc63.f) && fc63.src === 'cdc-rabies');
  assert(/exactly as prescribed/.test(L.cardIndex.md13.c[1]) && L.cardIndex.md13.src === 'cdc-antibiotics');
  assert(/grapefruit/i.test(L.cardIndex.md23.s) && L.cardIndex.md23.src === 'fda-grapefruit');
  ['hm40', 'hm41', 'hm42'].forEach(id => { const c = L.cardIndex[id]; assert.strictEqual(c.src, 'nhs-fever'); assert(!/uncover|fresh breeze|keep cooling/i.test(c.c[1] + c.f), id); });
  assert(/sponge/.test(L.cardIndex.hm41.f) && /fluids/.test(L.cardIndex.hm41.f));
  const svg = fs.readFileSync(path.join(__dirname, '../src/img/fever-signs.svg'), 'utf8');
  assert(!/uncover|fresh air/i.test(svg) && /fluids/i.test(svg) && /sponge/i.test(svg), 'fever-signs.svg matches NHS');
  const tr = L.decks.triage.cards.find(c => /30 times a minute/.test(c.f)); assert(tr && tr.src === 'remm-start', 'START breathing-rate card');
  const berry = L.decks.survive.cards.find(c => /wild berries/.test(c.f) && /adult/.test(c.f)); assert(berry, 'berry ID card');
  const traps = L.decks.survive.cards.filter(c => c.topic === 'traps'); assert(traps.length <= 2 && traps.every(c => c.src === 'cdfw-trap' && /CDFW|wildlife agency/.test(c.f + c.w)), 'California trapping cards');
});
t('v8 Health and Safety section holds foodsafe and medsafe; fieldcare and triage stay in Tactical Field Care', () => {
  assert(L.SECTIONS.indexOf('Health and Safety') >= 0);
  eq(L.decks.foodsafe.section, 'Health and Safety'); eq(L.decks.medsafe.section, 'Health and Safety');
  eq(L.decks.fieldcare.section, 'Tactical Field Care'); eq(L.decks.triage.section, 'Tactical Field Care');
  assert(!/^Field Care/.test(L.decks.foodsafe.name) && !/^Field Care/.test(L.decks.medsafe.name));
});
t('v8 rounds are shared evenly across the decks that are on', () => {
  const ids = L.knowDecks();
  for (let s = 1; s <= 40; s++) {
    const p = prof(s % 2 ? 'ya' : 'adult'), st = L.GC.start(p, ids, 0, s), per = {};
    st.q.forEach(x => { const d = L.cardIndex[x.id].deck; per[d] = (per[d] || 0) + 1; });
    assert(Object.values(per).every(v => v === 1), 'seed ' + s + ' ' + JSON.stringify(per)); eq(st.q.length, 10);
  }
  const two = ['money', 'survive'];
  for (let s = 1; s <= 20; s++) { const st = L.GC.start(prof('adult'), two, 0, s), per = {}; st.q.forEach(x => { const d = L.cardIndex[x.id].deck; per[d] = (per[d] || 0) + 1; }); eq([per.money, per.survive], [5, 5]); }
  eq(L.balance([{ deck: 'a' }, { deck: 'a' }, { deck: 'a' }, { deck: 'b' }], 3).map(c => c.deck), ['a', 'b', 'a']);
});
t('v8 question screen: no picture unless imgAsk, and an imgAsk picture holds no right-answer words', () => {
  const ui = fs.readFileSync(path.join(__dirname, '../src/ui/ui.js'), 'utf8');
  assert(/\(c\.imgAsk \? pic\(c\) : ''\)/.test(ui), 'question screen shows a picture only for imgAsk');
  const stop = new Set('a an the and or of to in on it is be at for with by not no do if your you as up off out than more less one this that can may get keep'.split(' '));
  const words = s => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(' ').filter(w => w.length > 2 && !stop.has(w));
  const check = c => {
    const svg = fs.readFileSync(path.join(__dirname, '../src', c.img), 'utf8').replace(/<[^>]+>/g, ' ');
    const pictext = new Set(words(svg + ' ' + L.imgAlt(c))), hit = words(c.c[1]).filter(w => pictext.has(w));
    const wrongHit = words(c.c[0] + ' ' + c.c[2]).filter(w => pictext.has(w));
    return hit.length && hit.length >= wrongHit.length ? hit : [];
  };
  L.knowDecks().forEach(id => L.decks[id].cards.forEach(c => { if (c.imgAsk) eq(check(c), [], c.id + ' question picture gives the answer'); }));
  // The check does catch a picture that gives the answer away (fc02's tourniquet picture names "2 to 3 inches above the cut").
  assert(check(L.cardIndex.fc02).length > 0);
});
t('v8 every new-deck card has a source quote in tools/quotes-new.json', () => {
  const Q = require('../tools/quotes-new.json');
  L.knowDecks().filter(id => L.FROZEN_DECKS.indexOf(id) < 0).forEach(id => L.decks[id].cards.forEach(c => assert(Q[c.id] && Q[c.id].length > 10, c.id)));
});
t('v8 mn65 test uses the vendored excerpt, not the gitignored sources folder', () => {
  const u = fs.readFileSync(__filename, 'utf8'); assert(!u.includes("'../sources/" + "ftc-lostcard.txt'"));
  assert(fs.existsSync(path.join(__dirname, 'fixtures/ftc-lostcard-excerpt.txt')));
});

// v9
const jeq = (x, y) => assert.strictEqual(JSON.stringify(x), JSON.stringify(y));
function v7save() {
  const o = [0, 1, 2];
  return { v: 2, active: 'p1', next: 2, decks: ['triage', 'survive'], profiles: { p1: { name: 'Tom', age: 'adult',
    boxes: { tr01: { b: 2, due: 5, n: 1 }, tr33: { b: 1, due: 5, n: 1 }, sv25: { b: 3, due: 9, n: 2 }, sv01: { b: 1, due: 5, n: 1 } },
    carry: ['tr33', 'sv25', 'tr02'], stats: { rounds: 3, right: 4, seen: 5, wows: 0 },
    round: { rs: 7, today: 5, i: 1, stage: 'conf', right: 1, wows: [], again: { tr33: 1 },
      q: [{ id: 'tr01', order: o, pick: 0, conf: 1 }, { id: 'tr34', order: o, pick: 2, conf: null }, { id: 'tr02', order: o, pick: null, conf: null }, { id: 'sv01', order: o, pick: null, conf: null }] } } } };
}
t('v9 v7 save: cut tr34 is current, tr33 and sv25 carried; only those ids go, the round stays', () => {
  ['tr33', 'tr34', 'sv25'].forEach(id => assert(!L.cardIndex[id], id + ' should be cut'));
  const r = L.loadSave(JSON.stringify(v7save())); assert(!r.broken); assert(r.pruned); assert(!r.repaired);
  const p = r.save.profiles.p1, st = p.round;
  assert(st, 'round kept'); jeq(st.q.map(x => x.id), ['tr01', 'tr02', 'sv01']);
  assert.strictEqual(st.i, 1); assert.strictEqual(st.stage, 'ask'); assert.strictEqual(st.q[1].pick, null);
  assert.strictEqual(st.q[0].pick, 0); assert.strictEqual(st.right, 1); jeq(st.again, {});
  jeq(p.carry, ['tr02']); assert(L.checkRound(st));
});
t('v9 cut card before the current one shifts the index; a round of only cut cards is dropped', () => {
  const s = v7save(), R = s.profiles.p1.round; R.q[0].id = 'tr33'; R.i = 2; R.stage = 'ask';
  const st = L.loadSave(JSON.stringify(s)).save.profiles.p1.round;
  jeq(st.q.map(x => x.id), ['tr02', 'sv01']); assert.strictEqual(st.i, 0);
  const s2 = v7save(); s2.profiles.p1.round.q = s2.profiles.p1.round.q.slice(1, 2); s2.profiles.p1.round.i = 0;
  assert.strictEqual(L.loadSave(JSON.stringify(s2)).save.profiles.p1.round, null);
});
t('v9 unknown ids are pruned from Leitner boxes so cards seen is right', () => {
  const p = L.loadSave(JSON.stringify(v7save())).save.profiles.p1;
  jeq(Object.keys(p.boxes).sort(), ['sv01', 'tr01']);
  assert.strictEqual(L.MM.seenCards(p, ['triage', 'survive']).length, 2);
  const clean = L.loadSave(L.dumpSave(L.loadSave(JSON.stringify(v7save())).save)); assert(!clean.repaired && !clean.pruned);
});
t('v9 fd27 no longer asks the kf24 question', () => {
  const a = L.cardIndex.fd27, k = L.cardIndex.kf24;
  assert(!/how long/i.test(a.s) && /hot/i.test(a.s)); assert.notStrictEqual(a.m, k.m);
});
t('v9 md22 soft wording, sv74 answers the "always safe" question', () => {
  const m = L.cardIndex.md22; assert(!/waste of money|avoid that/i.test(m.f + m.c.join()));
  assert(/^No, /.test(L.cardIndex.sv74.c[1]));
});
// ---------- v10 tests ----------
t('v10 controversy deck: 72 cards in Big Debates, opt-in, with the facts-only note', () => {
  const d = L.decks.controversy; eq(d.cards.length, 72); eq(d.section, 'Big Debates');
  assert(d.cards.every(c => /^ct\d\d$/.test(c.id))); assert(L.defaultDecks().indexOf('controversy') < 0);
  eq(L.sectionsOf(L.knowDecks()).find(g => g.name === 'Big Debates').ids, ['controversy']);
  eq(L.SECTION_NOTES['Big Debates'], 'Facts only. On faith and moral questions we show what each side teaches, not who is right.');
  eq(Object.keys(d.sources).length, 43); assert(d.cards.every(c => d.sources[c.src]));
});
// ---------- v11 tests ----------
t('v11 m1 dropping retired cards is a gentle prune, not a reset; a real repair still says reset', () => {
  const r = L.loadSave(JSON.stringify(v7save())); assert(r.pruned && !r.repaired);
  const ui = fs.readFileSync(path.join(__dirname, '../src/ui/ui.js'), 'utf8');
  assert(/ld\.pruned\) U\.notice = 'This update retired a few cards\. Your progress on every other card is kept\.'/.test(ui));
  const s = v7save(); s.profiles.p1.boxes.fa01 = { b: 9, due: 1 }; const r2 = L.loadSave(JSON.stringify(s)); assert(r2.repaired && r2.pruned);
});
t('v11 M1 vaccine cards say the large studies found no link and cite them', () => {
  const X = require('./fixtures/also-excerpts.json'), Q = require('../tools/quotes-new.json');
  ['ct34', 'ct35'].forEach(id => {
    const c = L.cardIndex[id]; eq(c.also, ['hviid2019', 'taylor2014']);
    assert(/no link/.test(c.f + ' ' + c.w), id); assert(/657,461/.test(c.w) && /1\.2 million/.test(c.w), id);
    c.also.forEach(k => { const q = JSON.parse(Q[id + '@' + k]); assert(X[k].some(e => e.includes(q)), id + '@' + k); });
  });
  assert(/July 2026 change/.test(L.cardIndex.ct35.f) && /not evidence of a link/.test(L.cardIndex.ct35.f));
  assert(/657 461/.test(X.hviid2019.join()) && /1,256,407/.test(X.taylor2014.join()));
});
t('v11 also-sources are checked, shown, and quoted', () => {
  L.knowDecks().forEach(id => L.decks[id].cards.forEach(c => (c.also || []).forEach(k => { assert(L.decks[id].sources[k]); assert(require('../tools/quotes-new.json')[c.id + '@' + k], c.id + '@' + k); })));
  const c = L.cardIndex.ct06; eq(c.also, ['elca']); assert(/bound conscience/.test(c.f));
  c.also = ['nope']; assert(L.checkAll().some(e => /ct06: also must list/.test(e))); c.also = ['elca'];
  assert(/Also: /.test(fs.readFileSync(path.join(__dirname, '../src/ui/ui.js'), 'utf8')));
});
t('v11 sourcing and wording fixes: ct59, ct73, ct26, ct20, fd27 title, speakers', () => {
  assert(!/\$15/.test(L.cardIndex.ct59.w)); assert(!/0\.2%|3\.6%/.test(L.cardIndex.ct73.w));
  assert(!/cast doubt/.test(L.cardIndex.ct26.w)); assert(/within the past 10,000 years/.test(L.cardIndex.ct20.f));
  eq(L.decks.foodsafe.sources['cdc-foodsafety'][0], 'CDC: Preventing Food Poisoning');
  L.decks.controversy.cards.forEach(c => { const s = JSON.stringify(c.s); assert(!/A man at|man in your Bible|pastor friend/.test(s), c.id); });
});
t('v11 P5 single-file copy never registers a service worker', () => {
  assert(/window\.LSA_SINGLE\) return;/.test(fs.readFileSync(path.join(__dirname, '../build.js'), 'utf8')));
  assert(/window\.LSA_SINGLE = true/.test(fs.readFileSync(path.join(__dirname, '../tools/testhtml.js'), 'utf8')));
});
// ---------- v12 tests (Street Smart: Legal Traps) ----------
t('v13 legal deck: 52 cards in Street Smart, opt-in, every card cites a law or case with a saved source', () => {
  const d = L.decks.legal; eq(d.cards.length, 52); eq(d.section, 'Street Smart'); eq(d.rating, 'teen');
  assert(L.defaultDecks().indexOf('legal') < 0); assert(/not legal advice/i.test(d.notice));
  assert(d.cards.every(c => /^lg\d\d$/.test(c.id) && c.cite && d.sources[c.src]));
  ['ya', 'adult'].forEach(a => assert(L.cardsFor(a, ['legal']).length >= 50));
  // v13: every card is built on a real, named case or enforcement action, with the statute kept as a second source.
  const statute = k => /^(veh|civ|pen|lab|usc|irs|ins|bpc|hsc)-/.test(k);
  d.cards.forEach(c => { assert([c.src].concat(c.also || []).some(k => !statute(k)), c.id + ' has no case source');
    assert(/ v\. |FTC|DOJ|U\.S\. Attorney|Secret Service/.test(c.cite + ' ' + (typeof c.s === 'string' ? c.s : c.s.adult)), c.id + ' names no case'); });
  // Every quote (main and also) is in the vendored excerpt of its saved source (tools/street-quotes.js checked it against sources/street/).
  const X = require('./fixtures/street-excerpts.json'), Q = require('../tools/quotes-new.json');
  d.cards.forEach(c => [[c.id, c.src]].concat((c.also || []).map(k => [c.id + '@' + k, k])).forEach(([key, k]) => { const q = JSON.parse(Q[key]); assert(X[k] && X[k].some(e => e.includes(q)), key); }));
});
t('v15 QA v13 fixes: Hailey superseded, 1799.102(b)(2), 1954(d)(2), 1719 limits, 637.2, Toomey total, absolute-word tell', () => {
  const d = L.decks.legal, g = id => d.cards.find(c => c.id === id), all = c => [c.f, c.w].join(' ');
  assert.strictEqual(d.cards.length, 52);
  assert(/superseded/.test(g('lg51').cite) && /fraud/.test(g('lg51').c[1]) && g('lg51').src === 'hsc-1389-21' && g('lg51').also.includes('usc-42-300gg-12'));
  assert(/reversed/.test(g('lg52').c[1]) && /reversed/.test(g('lg52').w));
  assert(/gross negligence/.test(all(g('lg09'))) && /\(b\)\(2\)/.test(g('lg09').w));
  assert(/oral/.test(g('lg20').c[1]) && /120 days/.test(all(g('lg20'))));
  assert(/\$100/.test(g('lg31').f) && /\$1,500/.test(g('lg31').f) && /good faith dispute/.test(g('lg31').f));
  assert(g('lg14').also.includes('pen-637-2') && d.sources['pen-637-2']);
  assert(/\$300,000/.test(g('lg32').c[1]));
  const abs = /\b(always|never|nothing|any|all|ever|only|whatsoever)\b/i;
  const right = d.cards.filter(c => abs.test(c.c[1])).length, wrong = d.cards.filter(c => abs.test(c.c[0]) || abs.test(c.c[2])).length;
  const solo = d.cards.filter(c => c.c.filter(x => abs.test(x)).length === 1 && !abs.test(c.c[1])).length;
  assert(right >= 4, 'absolute right answers ' + right); assert(solo <= 8, 'solvable by dropping the absolute ' + solo);
  assert(!d.cards.some(c => /^Nothing\b/.test(c.c[0]) || /^Nothing\b/.test(c.c[2])), 'Nothing is no longer a decoy opener');
});
t('v16 estate deck: Street Smart, opt-in, every card a named case plus law, saved quotes, ages, absolute-word rule', () => {
  const d = L.decks.estate; eq(d.section, 'Street Smart'); eq(d.rating, 'teen'); eq(d.format || 'gutcheck', 'gutcheck');
  assert(L.defaultDecks().indexOf('estate') < 0); assert(/not legal advice/i.test(d.notice));
  assert(d.cards.every(c => /^es\d\d$/.test(c.id) && c.cite && d.sources[c.src] && c.c.length === 3));
  ['ya', 'adult'].forEach(a => assert(L.cardsFor(a, ['estate']).length >= 50, a));
  const statute = k => /^(prob|fam|usc|irs)-/.test(k);
  d.cards.forEach(c => { assert([c.src].concat(c.also || []).some(k => !statute(k)), c.id + ' has no case source');
    assert(/ v\. |Estate of|Marriage of|Franklin|Prince/.test(c.cite), c.id + ' names no case'); });
  const X = require('./fixtures/street-excerpts.json'), Q = require('../tools/quotes-new.json');
  d.cards.forEach(c => [[c.id, c.src]].concat((c.also || []).map(k => [c.id + '@' + k, k])).forEach(([key, k]) => { const q = JSON.parse(Q[key]); assert(X[k] && X[k].some(e => e.includes(q)), key); }));
  // The absolute-word rule now lives in the deck checker; a deck that leans on "always/never" in wrong choices fails.
  const bad = { id: 'zz', section: 'Street Smart', rating: 'teen', notice: 'n', sources: { a: ['A', 'u'] }, cards: Array.from({ length: 10 }, (_, i) => ({ id: 'z' + i, deck: 'zz', topic: 't', ages: 'both', s: 's', c: ['It always works ' + i, 'Right one ' + i, 'Some other ' + i], m: 'm', f: 'f', w: 'w', src: 'a', cite: 'x' })) };
  assert(L.checkDeck(bad).some(e => /absolute/.test(e)) && L.checkDeck(bad).some(e => /lone absolute/.test(e)));
});
t('v12 Street Smart checker: cite, rating, notice, none-card share and tell, banned words', () => {
  const mk = (n, extra) => Array.from({ length: n }, (_, i) => Object.assign({ id: 'z' + i, deck: 'zz', topic: 't', ages: 'both', s: 's', c: ['aaaa' + i, 'b' + i, 'cccc' + i], m: 'm', f: 'f', w: 'w', src: 'a', cite: 'x' }, extra && extra(i)));
  const base = { id: 'zz', format: 'gutcheck', section: 'Street Smart', rating: 'teen', notice: 'n', sources: { a: ['A', 'u'] } };
  eq(L.checkDeck(Object.assign({}, base, { cards: mk(60) })), []);
  let e = L.checkDeck(Object.assign({}, base, { rating: 'x', notice: '', cards: mk(60, i => i === 0 ? { cite: '' } : {}) })).join('|');
  assert(/needs a cite/.test(e) && /rating/.test(e) && /notice/.test(e));
  e = L.checkDeck(Object.assign({}, base, { cards: mk(60, i => i < 10 ? { kind: 'none', c: ['aaaaaaaaaaaaaaaaaaaaaaaaa' + i, 'None of these; too deep ' + i, 'cccccccccccccccccccccccccc' + i] } : {}) })).join('|');
  assert(/"none" cards are 17%/.test(e) && /wrong choice on only 0/.test(e), e);
  e = L.checkDeck(Object.assign({}, base, { cards: mk(60, i => i === 0 ? { kind: 'none' } : i === 1 ? { f: 'Here is how to make it' } : {}) })).join('|');
  assert(/must have "None of these/.test(e) && /banned word/.test(e), e);
});
t('v14 safety deck: 52 Red Flags sets from real DOJ cases, opt-in, cited, quotes in the saved sources', () => {
  const d = L.decks.safety; eq(d.cards.length, 52); eq(d.format, 'redflags'); eq(d.section, 'Street Smart'); eq(d.rating, 'teen');
  assert(L.defaultDecks().indexOf('safety') < 0 && L.knowDecks().indexOf('safety') < 0 && L.pickerDecks().indexOf('safety') >= 0);
  assert(/911/.test(d.notice) && /real court cases/.test(d.notice));
  eq(L.checkDeck(d), []);
  ['ya', 'adult'].forEach(a => assert(L.setsFor(a, ['safety']).length >= 50));
  eq(L.cardsFor('adult', ['safety']).length, 0);
  d.cards.forEach(c => { assert(/^sf\d\d$/.test(c.id) && c.cite && c.cues.length === 6, c.id);
    assert(/^doj-/.test(c.src) && /^https:\/\/www\.justice\.gov\//.test(d.sources[c.src][1]), c.id + ' main source is a DOJ release');
    assert(/[A-Z][a-z]+ [A-Z]/.test(c.s), c.id + ' names the case'); });
  const X = require('./fixtures/street-excerpts.json'), Q = require('../tools/quotes-new.json');
  d.cards.forEach(c => [[c.id, c.src]].concat((c.also || []).map(k => [c.id + '@' + k, k])).forEach(([key, k]) => { const q = JSON.parse(Q[key]); assert(X[k] && X[k].some(e => e.includes(q)), key); }));
});
t('v14 Red Flags mode: toggle, Done, confidence; partial credit per cue; Leitner only on an exact match', () => {
  const p = prof('ya'), st = L.RF.start(p, ['safety'], 100, 7);
  eq(st.q.length, 5); assert(st.q.every(it => it.order.slice().sort().join() === '0,1,2,3,4,5'));
  eq(L.RF.start(prof('ya'), ['safety'], 100, 7).q, st.q); // seeded
  eq(L.RF.start(prof('ya'), ['firstaid'], 100, 7).stage, 'done'); // no sets on
  const flagsAt = k => { const it = st.q[k], c = L.cardIndex[it.id]; return it.order.map((ci, pos) => c.cues[ci].flag ? pos : -1).filter(x => x >= 0); };
  // Set 1: exact.
  L.RF.confirm(st, p, 2); eq(st.stage, 'ask'); // confirm before Done does nothing
  flagsAt(0).forEach(pos => L.RF.toggle(st, pos)); L.RF.done(st); L.RF.toggle(st, 0); // no toggles after Done
  L.RF.confirm(st, p, 2); eq(st.stage, 'fix'); eq(L.RF.score(st, 0), { n: 6, of: 6, exact: true });
  eq(p.boxes[st.q[0].id], L.grade(undefined, true, 2, 100)); assert(p.boxes[st.q[0].id].b > 1); eq(st.right, 1); eq(st.points, 6); assert(!st.q[0].wow);
  L.RF.next(st, p); eq(st.stage, 'ask');
  // Set 2: tap one wrong fine cue only and say Sure -> partial credit, box 1, Wow.
  const f2 = flagsAt(1), fine = [0, 1, 2, 3, 4, 5].find(x => f2.indexOf(x) < 0);
  L.RF.toggle(st, fine); L.RF.toggle(st, fine); L.RF.toggle(st, fine); L.RF.done(st); L.RF.back(st); eq(st.stage, 'ask'); L.RF.done(st);
  L.RF.confirm(st, p, 2); const sc = L.RF.score(st, 1);
  eq(sc.n, 6 - f2.length - 1); assert(!sc.exact); eq(p.boxes[st.q[1].id].b, 1); assert(st.q[1].wow); eq(st.wows, [st.q[1].id]);
  eq(st.points, 6 + sc.n); eq(st.max, 12);
  const m = L.RF.marks(st, 1); eq(m.length, 6); assert(m.every(x => typeof x.ok === 'boolean' && x.cue.why));
  for (let k = 2; k < 5; k++) { L.RF.next(st, p); L.RF.done(st); L.RF.confirm(st, p, 0); }
  L.RF.next(st, p); eq(st.stage, 'done'); eq(p.stats.rounds, 1); eq(p.stats.seen, 5);
});
t('v14 Red Flags save: a round round-trips; a broken one is reset; one with a cut set is dropped and boxes kept', () => {
  const s = L.newSave(), id = L.addProfile(s, 'Sam', 'ya'), p = s.profiles[id];
  s.decks = ['firstaid', 'safety']; p.rf = L.RF.start(p, ['safety'], 0, 3); L.RF.toggle(p.rf, 2); p.boxes.sf01 = { b: 2, due: 3, n: 1 };
  let r = L.loadSave(L.dumpSave(s)); assert(!r.repaired && !r.broken, J(r)); eq(r.save.profiles[id].rf, p.rf); eq(r.save.decks, ['firstaid', 'safety']);
  const bad = JSON.parse(L.dumpSave(s)); bad.profiles[id].rf.q[0].on = [1, 0]; r = L.loadSave(J(bad)); assert(r.repaired); eq(r.save.profiles[id].rf, null);
  const cut = JSON.parse(L.dumpSave(s)); cut.profiles[id].rf.q[1].id = 'sf99'; r = L.loadSave(J(cut)); assert(r.pruned); eq(r.save.profiles[id].rf, null); eq(r.save.profiles[id].boxes.sf01.b, 2);
});
t('v14 Red Flags checker fails bad sets: cue count, flag count, why, count spread, length and keyword tells', () => {
  const W = ['apple', 'river', 'stone', 'cloud', 'maple', 'tiger', 'piano', 'lemon', 'house', 'grape', 'chair', 'ocean'];
  const cue = (i, k, flag) => ({ t: W[(i + k) % 12] + ' ' + W[(i * 5 + k * 7) % 12] + ' item ' + k, flag, why: 'w' });
  const mk = (n, f) => Array.from({ length: n }, (_, i) => Object.assign({ id: 'r' + i, deck: 'rr', topic: 't', ages: 'both', s: 'Case Name v. X', doThis: 'd', src: 'a', cite: 'c',
    cues: [0, 1, 2, 3, 4, 5].map(k => cue(i, k, k < 2 + (i % 3))) }, f && f(i)));
  const base = { id: 'rr', format: 'redflags', section: 'Street Smart', rating: 'teen', notice: 'n', sources: { a: ['A', 'u'] } };
  eq(L.checkDeck(Object.assign({}, base, { cards: mk(60) })), []);
  let e = L.checkDeck(Object.assign({}, base, { cards: mk(60, i => i === 0 ? { cues: mk(1)[0].cues.slice(0, 5) } : i === 1 ? { cues: mk(1)[0].cues.map((q, k) => Object.assign({}, q, { flag: k === 0 })) } : i === 2 ? { cues: mk(1)[0].cues.map((q, k) => k ? q : Object.assign({}, q, { why: '' })) } : {}) })).join('|');
  assert(/r0: needs exactly 6 cues/.test(e) && /r1: needs 2 to 4 red flags, has 1/.test(e) && /r2: cue 0 needs t, flag and why/.test(e), e);
  e = L.checkDeck(Object.assign({}, base, { cards: mk(60, i => ({ cues: mk(1)[0].cues.map((q, k) => Object.assign({}, q, { flag: k < 3 })) })) })).join('|');
  assert(/100% of sets have 3 flags/.test(e), e);
  e = L.checkDeck(Object.assign({}, base, { cards: mk(60, i => ({ cues: mk(1, () => ({}))[0].cues.map((q, k) => Object.assign({}, cue(i, k, k < 2 + (i % 3)), k < 2 + (i % 3) ? { t: 'urgent secret wire now ' + W[(i + k) % 12] + ' ' + W[k] + ' extra long words here' } : {})) })) })).join('|');
  assert(/flag cues are .*x longer/.test(e) && /cue tell "keywords"/.test(e), e);
  e = L.checkDeck(Object.assign({}, base, { rating: 'x', cards: mk(40) })).join('|'); assert(/rating/.test(e) && /only 40 sets for ya/.test(e), e);
});
t('v18 power deck: adult-rated, our own tactics, step diagrams, none cards 10 to 15%, real-case cites, Greene ban, PIN unlock', () => {
  const d = L.decks.power; eq(d.section, 'Street Smart'); eq(d.rating, 'adult'); eq(d.format, 'gutcheck'); assert(d.power && d.cover && d.notice);
  assert(L.defaultDecks().indexOf('power') < 0); eq(L.checkDeck(d), []);
  ['ya', 'adult'].forEach(a => assert(L.cardsFor(a, ['power']).length >= 50, a));
  const T = Object.keys(L.POWER_TACTICS); assert(T.length >= 10 && T.length <= 14, 'about 12 tactics');
  assert(d.cards.every(c => /^pw\d\d$/.test(c.id) && c.cite && d.sources[c.src] && T.indexOf(c.tactic) >= 0 && c.steps.length >= 3 && c.steps.length <= 4));
  T.forEach(k => assert(d.cards.some(c => c.tactic === k), 'tactic used: ' + k));
  const nn = d.cards.filter(c => c.kind === 'none').length / d.cards.length; assert(nn >= 0.1 && nn <= 0.15, 'none share ' + nn);
  assert(d.cards.filter(c => c.kind === 'none').every(c => /^None of these; /.test(c.c[1])));
  const PB = require('../tools/powerban.js'); eq(PB.check(d, L.POWER_TACTICS), []);
  const bad = JSON.parse(JSON.stringify(d)); bad.cards[0].f += ' Never outshine the master.'; bad.cards[1].steps = ['Conceal your intentions'];
  const pe = PB.check(bad, L.POWER_TACTICS).join('|'); assert(/pw01: banned Greene phrase "outshine the master"/.test(pe) && /pw02: banned Greene phrase "conceal your intentions"/.test(pe), pe);
  const c0 = Object.assign({}, d.cards[0]);
  assert(/3 to 4/.test(L.checkPowerCard(Object.assign({}, c0, { steps: ['a', 'b'] })).join()));
  assert(/1 to 5 words/.test(L.checkPowerCard(Object.assign({}, c0, { steps: ['one two three four five six', 'b', 'c'] })).join()));
  assert(/allowed list/.test(L.checkPowerCard(Object.assign({}, c0, { tactic: 'crushTotally' })).join()));
  // Adult-only by default; a parent PIN unlock opens it for one young adult profile.
  const ya = prof('ya'), ad = prof('adult'); assert(!L.deckAllowed('power', ya) && L.deckAllowed('power', ad) && L.deckAllowed('estate', ya));
  eq(L.allowedDecks(['estate', 'power'], ya), ['estate']); ya.unlock = ['power']; assert(L.deckAllowed('power', ya));
  assert(L.PIN_RX.test('1234') && !L.PIN_RX.test('12a4') && !L.PIN_RX.test('123') && !L.PIN_RX.test('12345')); assert(L.hashPin('1234') !== L.hashPin('1235') && /^h[0-9a-z]+$/.test(L.hashPin('1234')));
  const sv = L.newSave(), id = L.addProfile(sv, 'Kid', 'ya'); sv.profiles[id].unlock = ['power', 'gone']; sv.pin = L.hashPin('2468');
  const ld = L.loadSave(L.dumpSave(sv)); eq(ld.save.profiles[id].unlock, ['power']); eq(ld.save.pin, L.hashPin('2468')); assert(ld.repaired);
  // Over 1,000 seeded rounds with every deck on, a locked young adult profile never gets a power card.
  const kid = prof('ya'), all = L.allowedDecks(L.knowDecks(), kid);
  for (let s = 1; s <= 1000; s++) assert(!L.GC.start(kid, all, 0, s).q.some(it => L.cardIndex[it.id].deck === 'power'));
});

// ---------- v20 Hard Reads (passage mode) ----------
t('v20 passage round: read, then each question with a confidence tap; Leitner per question; done counts a round', () => {
  const s = L.newSave(), p = s.profiles[L.addProfile(s, 'A', 'adult')], st = L.PR.start(p, ['hardreads'], 0, 7);
  const c = L.cardIndex[st.pid]; assert(c && c.deck === 'hardreads'); assert.strictEqual(st.stage, 'read'); assert.strictEqual(st.q.length, c.qs.length);
  L.PR.pick(st, 0); assert.strictEqual(st.stage, 'read', 'no answer before I read it');
  L.PR.read(st); assert.strictEqual(st.stage, 'ask');
  L.PR.togglePeek(st); assert(st.peek); L.PR.togglePeek(st); assert(!st.peek);
  st.q.forEach((it, k) => { const pos = k % 2 ? it.order.indexOf(0) : it.order.indexOf(1); L.PR.pick(st, pos); if (k === 0) { L.PR.back(st); assert.strictEqual(st.stage, 'ask'); L.PR.pick(st, pos); } L.PR.confirm(st, p, 2); assert.strictEqual(st.stage, 'fix'); L.PR.next(st, p); });
  assert.strictEqual(st.stage, 'done'); assert.strictEqual(p.stats.rounds, 1); assert.strictEqual(st.right, Math.ceil(c.qs.length / 2));
  c.qs.forEach((q, k) => { const e = p.boxes[q.id]; assert(e, 'box per question'); assert.strictEqual(e.b, k % 2 ? 1 : 2); assert.strictEqual(e.due, k % 2 ? 0 : 1); });
  assert.strictEqual(st.wows.length, Math.floor(c.qs.length / 2), 'sure but wrong is a Wow');
  // Same day: the missed questions are due now, so the passage comes back with only those questions.
  const st2 = L.PR.start(p, ['hardreads'], 0, 9); assert.strictEqual(st2.pid, c.id, 'due passage first'); eq(st2.q.map(x => x.id), c.qs.filter((_, k) => k % 2).map(q => q.id));
});
t('v20 passage picking: due before new, new before not-yet-due; a passage is due when any question is due', () => {
  const s = L.newSave(), p = s.profiles[L.addProfile(s, 'A', 'adult')], ps = L.passagesFor('adult', ['hardreads']);
  ps.forEach(c => c.qs.forEach(q => { p.boxes[q.id] = { b: 3, due: 10, n: 1 }; }));
  assert.strictEqual(L.PR.choose(ps, p.boxes, 0, L.rng(1)).id && L.PR.start(p, ['hardreads'], 0, 1).q.length, ps.find(c => c.id === L.PR.start(p, ['hardreads'], 0, 1).pid).qs.length, 'nothing due: the soonest passage, all its questions');
  p.boxes[ps[3].qs[2].id] = { b: 2, due: 0, n: 1 };
  for (let sd = 1; sd < 20; sd++) assert.strictEqual(L.PR.start(p, ['hardreads'], 0, sd).pid, ps[3].id);
  delete p.boxes[ps[5].qs[0].id]; ps[5].qs.slice(1).forEach(q => delete p.boxes[q.id]);
  p.boxes[ps[3].qs[2].id] = { b: 2, due: 4, n: 1 };
  for (let sd = 1; sd < 20; sd++) assert.strictEqual(L.PR.start(p, ['hardreads'], 0, sd).pid, ps[5].id, 'new passage before not-yet-due');
});
t('v20 passage save: resumes mid-question (stage, pick, peek); a broken round is reset; a cut passage is dropped', () => {
  const s = L.newSave(), k = L.addProfile(s, 'A', 'adult'), p = s.profiles[k]; p.pr = L.PR.start(p, ['hardreads'], 0, 3);
  L.PR.read(p.pr); L.PR.pick(p.pr, 2); p.pr.peek = true; s.screen = 'pr';
  let r = L.loadSave(L.dumpSave(s)); assert(!r.repaired && !r.broken); eq(r.save.profiles[k].pr, p.pr); assert.strictEqual(r.save.screen, 'pr');
  const bad = JSON.parse(L.dumpSave(s)); bad.profiles[k].pr.q[0].order = [0, 0, 1];
  r = L.loadSave(JSON.stringify(bad)); assert.strictEqual(r.save.profiles[k].pr, null); assert(r.repaired);
  const bad2 = JSON.parse(L.dumpSave(s)); bad2.profiles[k].pr.stage = 'conf'; bad2.profiles[k].pr.q[0].pick = null;
  assert.strictEqual(L.loadSave(JSON.stringify(bad2)).save.profiles[k].pr, null, 'conf needs a pick');
  const cut = JSON.parse(L.dumpSave(s)); cut.profiles[k].pr.pid = 'hr999'; cut.profiles[k].boxes['hr01-q1'] = { b: 2, due: 1, n: 1 };
  r = L.loadSave(JSON.stringify(cut)); assert.strictEqual(r.save.profiles[k].pr, null); assert(r.pruned); assert(r.save.profiles[k].boxes['hr01-q1'], 'boxes kept');
});
t('v20 Hard Reads is adult-rated: no passage reaches a young adult without the PIN unlock (start, load, 1,000 rounds)', () => {
  assert.strictEqual(L.decks.hardreads.rating, 'adult'); assert(L.pickerDecks().indexOf('hardreads') >= 0);
  const s = L.newSave(), k = L.addProfile(s, 'Kid', 'ya'), p = s.profiles[k];
  for (let sd = 1; sd <= 1000; sd++) assert.strictEqual(L.PR.start(p, ['hardreads'], 0, sd).q.length, 0);
  const a = L.newSave(), ka = L.addProfile(a, 'A', 'adult'); a.profiles[ka].pr = L.PR.start(a.profiles[ka], ['hardreads'], 0, 5); a.profiles[ka].age = 'ya';
  assert.strictEqual(L.loadSave(L.dumpSave(a)).save.profiles[ka].pr, null, 'hand-edited save: dropped for ya');
  a.profiles[ka].unlock = ['hardreads']; assert(L.loadSave(L.dumpSave(a)).save.profiles[ka].pr, 'kept after a PIN unlock');
  p.unlock = ['hardreads']; assert(L.PR.start(p, ['hardreads'], 0, 1).q.length > 0, 'unlocked young adult can play');
});
t('v20 passage checker: shape, guard tags, proof lines, question types, and size are enforced', () => {
  const d = L.decks.hardreads; eq(L.checkDeck(d), []);
  const c = JSON.parse(JSON.stringify(d.cards[0])), mk = ch => { const x = JSON.parse(JSON.stringify(c)); ch(x); return L.checkPassageDeck(Object.assign({}, d, { cards: [x].concat(d.cards.slice(1)) })).join('\n'); };
  assert(/quotesExtremism needs rebutted/.test(mk(x => { x.guard = ['quotesExtremism']; })));
  assert(/2 to 3 paragraphs/.test(mk(x => { x.passage = [x.passage.join(' ')]; })));
  assert(/5 to 7 questions/.test(mk(x => { x.qs = x.qs.slice(0, 4); })));
  assert(/proof text is not in paragraph/.test(mk(x => { x.qs[0].proof = 'not in the passage at all'; })));
  assert(/at least 4 types/.test(mk(x => { x.qs.forEach((q, k) => { q.type = ['tone', 'mainIdea', 'purpose'][k % 3]; }); })));
  assert(/line must be/.test(mk(x => { x.qs[1].line = 9; })));
  assert(/banned word/.test(mk(x => { x.qs[2].fix = 'Gory detail.'; })));
  assert(/needs rating adult/.test(mk(x => { delete x.rating; })));
  assert(/building count/.test(L.checkPassageDeck(Object.assign({}, d, { building: d.cards.length + 1 })).join('\n')));
  assert(/need 50 and 250/.test(L.checkPassageDeck(Object.assign({}, d, { building: false })).join('\n')) === (d.cards.length < 50));
});
t('v20 every quoted phrase in a passage is in its saved source excerpt (tools/hr-facts.js fixture)', () => {
  const X = require('./fixtures/hardreads-excerpts.json'), nm = s => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ');
  let n = 0; L.decks.hardreads.cards.forEach(c => (nm(c.passage.join(' ')).match(/"[^"]+"/g) || []).forEach(q => { const s = q.slice(1, -1).replace(/[,.]$/, ''), e = X[c.id + ':' + s]; assert(e && nm(e).includes(s), c.id + ' quote ' + s); n++; }));
  assert(n >= 10);
});
t('v20.1 M1 "None of these" right wording varies, every tail is also used wrong, and no exact-text tell', () => {
  const T = require('../tools/tellqa.js'), cs = L.decks.power.cards, tl = x => x.replace(/^None of these; /, '');
  const right = cs.filter(c => c.kind === 'none').map(c => tl(c.c[1])), wrong = []; cs.forEach(c => c.c.forEach((x, k) => { if (k !== 1 && /^None of these; /.test(x)) wrong.push(tl(x)); }));
  assert(new Set(right).size >= 3, 'right tails ' + right); right.forEach(x => assert(wrong.indexOf(x) >= 0, 'tail also used wrong: ' + x));
  eq(T.textTells(cs), []); assert(T.textTells([{ id: 'a', c: ['x', 'None; z', 'y'] }, { id: 'b', c: ['x2', 'None; z', 'y2'] }, { id: 'c', c: ['x3', 'None; z', 'y3'] }]).length, 'catches a 3 of 3 text');
});
t('v20.1 QA fixes: es44 is about the testator, pw20 is recognition, pw42 has Sept 1997, Estate tell margin 40%', () => {
  assert(/testator/i.test(L.cardIndex.es44.c[1]) && !/^She\b/.test(L.cardIndex.es44.c[1]));
  const p20 = L.cardIndex.pw20; assert(!/stages|quiet|broker/i.test(p20.c.join(' ') + p20.f + p20.steps.join(' ')), 'pw20 no smuggling how-to');
  assert(/September 1997/.test(L.cardIndex.pw42.w) && L.cardIndex.pw42.also.indexOf('sec-jobs') >= 0);
  const T = require('../tools/tellqa.js'), sc = T.score(L.decks.estate.cards); assert(T.LIMITS.estate === 0.40 && sc.gbm <= 0.40 && sc.logreg <= 0.40, JSON.stringify(sc));
});
t('v20.1 B1/M2 PIN is 4 digits; a ya lock prompt can not set one', () => {
  assert(L.PIN_RX.test('2468') && !L.PIN_RX.test('24680'));
  const ui = fs.readFileSync(path.join(__dirname, '../src/ui/ui.js'), 'utf8'), pin = ui.slice(ui.indexOf('R.pin = '), ui.indexOf('R.parent = '));
  assert(/Ask a parent to set this up/.test(pin) && !/pin2/.test(pin), 'lock prompt has no set-PIN'); assert(/speed bump, not real security/.test(ui));
});
console.log(n + ' unit tests passed');
