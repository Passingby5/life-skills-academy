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
  for (let day = 0; day < 60; day++) { let g = 0; while (playRound(p, day, r.int(1e9), 1, r) && g++ < 200) { const due = L.cardsFor(age).some(c => !p.boxes[c.id] || p.boxes[c.id].due <= day); if (!due) break; } }
  const all = L.cardsFor(age), at5 = all.filter(c => p.boxes[c.id] && p.boxes[c.id].b === 5).length;
  console.log(`perfect ${age}: ${at5}/${all.length} cards in box 5`);
  assert.strictEqual(at5, all.length);
});
console.log('ok 29 sim ran with no errors; perfect Sure player gets every card to box 5');
