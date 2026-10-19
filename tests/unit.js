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
    assert(!r.broken && r.repaired, k); const o = r.save;
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
  const ok = new Set(['fa19', 'kf55', 'kf56', 'kf88', 'kf90', 'kf97', 'mn61', 'mn62', 'mn86', 'sc33']);
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
  eq(L.sectionsOf(L.knowDecks()).map(g => g.name), ['Everyday', 'Health and Safety', 'Tactical Field Care', 'Field Survival', 'Country Living']); eq(L.sectionsOf(L.knowDecks())[0].ids, ['firstaid', 'kitchen', 'money', 'scams']);
  eq(L.defaultDecks(), ['firstaid', 'kitchen', 'money', 'scams']); eq(L.knowDecks().length, 12);
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
console.log(n + ' unit tests passed');
