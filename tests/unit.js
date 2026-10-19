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
  L.knowDecks().forEach(id => Object.entries(L.tellStats(L.decks[id].cards).strat).forEach(([k, v]) => assert(v <= 0.45, id + ' ' + k + ' ' + v)));
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
  const c = L.cardIndex.mn65, src = fs.readFileSync(path.join(__dirname, '../sources/ftc-lostcard.txt'), 'utf8');
  assert(/within 60 days of your statement/.test(c.s) && /after 3 business days/.test(c.s));
  assert.strictEqual(c.c[1], 'Up to $500'); assert(/up to \$500/.test(c.f) && /more/.test(c.f));
  assert(/more than 2 business days after you learn about the loss or theft, but within 60 calendar days after your statement/.test(src) && /\$500/.test(src));
});

// ---------- v4 regression tests ----------
t('v4-1 middle-length and all simple strategies stay at 45% or less on every deck; checker has the middle rule', () => {
  L.knowDecks().forEach(id => { const t = L.tellStats(L.decks[id].cards).strat; assert('middle' in t); Object.entries(t).forEach(([k, v]) => assert(v <= 0.45, id + ' ' + k + ' ' + v)); });
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
  L.knowDecks().forEach(id => L.decks[id].cards.forEach(c => { if (c.c.some(x => x.split(' ').length < 3)) assert(ok.has(c.id), c.id + ' ' + c.c.join(' | ')); }));
});
t('v4-5 a carried retry is kept while its deck is off and comes back when it is on', () => {
  const p = prof('adult'), id = L.cardsFor('adult', ['firstaid'])[0].id; p.carry = [id];
  const s1 = L.GC.start(p, ['money', 'kitchen'], 0, 1);
  assert(!s1.q.some(x => x.id === id)); eq(p.carry, [id]);
  const sv = L.newSave(); sv.profiles.p1 = p; sv.next = 2; const back = L.loadSave(JSON.stringify(sv)).save.profiles.p1; eq(back.carry, [id]);
  const s2 = L.GC.start(back, ['money', 'firstaid'], 0, 2);
  assert(s2.q.slice(0, 3).some(x => x.id === id)); eq(back.carry, []);
});
console.log(n + ' unit tests passed');
