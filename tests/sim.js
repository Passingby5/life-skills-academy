// Headless sim: 1,000 seeded players x 60 days. Run: node tests/sim.js
const assert = require('assert');
const L = require('./load.js').load();
let backToBack = 0, rounds = 0, cards = 0, cross = 0, topicBad = 0, dueBad = 0;
function playRound(p, today, seed, skill, r) {
  const before = JSON.parse(JSON.stringify(p.boxes));
  const st = L.GC.start(p, null, today, seed); if (!st.q.length) return false;
  // due first: if any due card was left out, no new card may be in the round
  const due = L.cardsFor(p.age).filter(c => before[c.id] && before[c.id].due <= today).map(c => c.id);
  const inRound = st.q.map(x => x.id), hasNew = inRound.some(id => !before[id]);
  if (hasNew && due.some(id => !inRound.includes(id))) dueBad++;
  // no same topic twice in a row inside the due block unless only that topic was left
  const dueBlock = inRound; // whole round, due and new together
  for (let i = 1; i < dueBlock.length; i++) {
    const tp = L.cardIndex[dueBlock[i - 1]].topic;
    if (L.cardIndex[dueBlock[i]].topic === tp && dueBlock.slice(i).some(id => L.cardIndex[id].topic !== tp)) topicBad++;
  }
  while (st.stage !== 'done') {
    const it = L.GC.cur(st), c = L.cardIndex[it.id];
    if (!L.visible(c, p.age)) cross++;
    const right = r.next() < skill;
    L.GC.pick(st, right ? it.order.indexOf(1) : [0, 1, 2].find(x => it.order[x] !== 1));
    L.GC.confirm(st, p, skill === 1 ? 2 : r.int(3)); L.GC.next(st, p); cards++;
  }
  const ids = st.q.map(x => x.id); ids.forEach((id, i) => { const j = ids.indexOf(id, i + 1); if (j > 0 && j - i < 3) backToBack++; });
  rounds++; return true;
}
const t0 = Date.now();
for (let i = 0; i < 1000; i++) {
  const r = L.rng(1000 + i), p = L.newProfile('P' + i, i % 2 ? 'ya' : 'adult'), skill = 0.3 + r.next() * 0.65;
  for (let day = 0; day < 60; day++) { const n = r.int(3); for (let k = 0; k < n; k++) playRound(p, day, r.int(1e9), skill, r); }
  const s = L.loadSave(L.dumpSave({ v: 2, active: 'a', next: 2, profiles: { a: p } })); assert(!s.broken);
}
console.log(`players 1000, days 60, rounds ${rounds}, cards ${cards}, ${Date.now() - t0} ms`);
assert.strictEqual(cross, 0, 'cross-age cards'); assert.strictEqual(topicBad, 0, 'topic repeats'); assert.strictEqual(dueBad, 0, 'due not first');
assert.strictEqual(backToBack, 0, 'retry too close to its card');
console.log('ok 10 no cross-age cards; ok 21 due first and interleaved; ok v3-2 zero same-card-back-to-back over ' + rounds + ' rounds');
['ya', 'adult'].forEach(age => {
  const p = L.newProfile('Perfect', age), r = L.rng(age === 'ya' ? 1 : 2);
  for (let day = 0; day < 60; day++) { let g = 0; while (playRound(p, day, r.int(1e9), 1, r) && g++ < 200) { const due = L.cardsFor(age).filter(c => L.deckAllowed(c.deck, p)).some(c => !p.boxes[c.id] || p.boxes[c.id].due <= day); if (!due) break; } }
  const all = L.cardsFor(age).filter(c => L.deckAllowed(c.deck, p)), // v19: a locked adult-rated deck never plays for a young adult
    at5 = all.filter(c => p.boxes[c.id] && p.boxes[c.id].b === 5).length;
  console.log(`perfect ${age}: ${at5}/${all.length} cards in box 5`);
  assert.strictEqual(at5, all.length);
});
console.log('ok 29 sim ran with no errors; perfect Sure player gets every card to box 5');
// v14: Red Flags sim. 1,000 seeded players x 60 days, Red Flags plus all Gut Check decks on; no errors, no cross-age sets,
// due sets first, save round-trips, and a perfect Sure player gets every set to box 5.
{
  const ids = L.pickerDecks(); let rr = 0, rs = 0, rdue = 0, rcross = 0;
  for (let i = 0; i < 1000; i++) {
    const r = L.rng(5000 + i), p = L.newProfile('R' + i, i % 2 ? 'ya' : 'adult'), skill = r.next();
    for (let day = 0; day < 60; day += 1 + r.int(3)) {
      const before = JSON.parse(JSON.stringify(p.boxes)), st = L.RF.start(p, ids, day, r.int(1e9));
      const inR = st.q.map(x => x.id), due = L.setsFor(p.age, ids).filter(c => before[c.id] && before[c.id].due <= day).map(c => c.id);
      if (inR.some(id => !before[id]) && due.some(id => !inR.includes(id))) rdue++;
      p.rf = st;
      while (st.stage !== 'done') {
        const it = L.RF.cur(st), c = L.cardIndex[it.id]; if (!L.visible(c, p.age)) rcross++;
        it.order.forEach((ci, pos) => { if ((r.next() < skill) === c.cues[ci].flag) L.RF.toggle(st, pos); });
        L.RF.done(st); L.RF.confirm(st, p, r.int(3)); L.RF.next(st, p); rs++;
      }
      rr++;
    }
    const s = L.loadSave(L.dumpSave({ v: 2, active: 'a', next: 2, profiles: { a: p } })); assert(!s.broken && !s.repaired, 'rf save');
  }
  assert.strictEqual(rcross, 0, 'cross-age sets'); assert.strictEqual(rdue, 0, 'due sets first');
  ['ya', 'adult'].forEach(age => {
    const p = L.newProfile('Perfect', age), r = L.rng(9);
    for (let day = 0; day < 60; day++) for (let g = 0; g < 30; g++) {
      const st = L.RF.start(p, ['safety'], day, r.int(1e9)); if (!st.q.length) break;
      if (!st.q.some(x => !p.boxes[x.id] || p.boxes[x.id].due <= day)) break;
      while (st.stage !== 'done') { const it = L.RF.cur(st), c = L.cardIndex[it.id]; it.order.forEach((ci, pos) => { if (c.cues[ci].flag) L.RF.toggle(st, pos); }); L.RF.done(st); L.RF.confirm(st, p, 2); L.RF.next(st, p); }
    }
    const all = L.setsFor(age, ['safety']), at5 = all.filter(c => p.boxes[c.id] && p.boxes[c.id].b === 5).length;
    assert.strictEqual(at5, all.length, 'perfect rf ' + age + ' ' + at5 + '/' + all.length);
  });
  console.log('ok v14 Red Flags sim: ' + rr + ' rounds, ' + rs + ' sets, no cross-age sets, due first, saves load; perfect player gets all ' + L.setsFor('ya', ['safety']).length + ' sets to box 5');
}
