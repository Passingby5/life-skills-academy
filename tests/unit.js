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
console.log(n + ' unit tests passed');
