// Prove checkPracticeKey matches stemmed content words and number+unit
// pairs, not substrings. A key shuffle with explanations left in place
// must be caught on 95% or more of the cards in each practice deck,
// including the numeric FE subset. Known v22 bad keys must fail. A
// swapped deck file must make checkdecks exit non-zero.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const L = require('./load.js').load();

const V22_BAD = {
  fe143: 'The plastic or nominal moment strength, including LTB',
  fe058: 'Force times velocity',
  cb016: 'A private, non-routable address on the public Internet'
};

function isNumericCard(c) {
  const parts = (c.c || []).map(t => L.practiceKeyParts(t));
  return parts.every(p => p.nums.length) && new Set(parts.map(p => p.nums[0].n)).size === 4;
}

function catchRate(cards, seed) {
  // Deterministic shuffle of keys among the cards; explanations stay put.
  let s = seed || 1;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
  const keys = cards.map(c => c.c[1]);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = keys[i]; keys[i] = keys[j]; keys[j] = tmp;
  }
  // If a shuffle left a card with its own key, rotate those leftovers.
  for (let i = 0; i < cards.length; i++) {
    if (keys[i] === cards[i].c[1]) {
      const j = (i + 1) % cards.length;
      const tmp = keys[i]; keys[i] = keys[j]; keys[j] = tmp;
    }
  }
  let caught = 0, moved = 0;
  cards.forEach((c, i) => {
    if (keys[i] === c.c[1]) return;
    moved++;
    const mutant = { id: c.id, c: [c.c[0], keys[i], c.c[2], c.c[3]], f: c.f };
    if (L.checkPracticeKey(mutant, '').length) caught++;
  });
  return { caught, moved, rate: moved ? caught / moved : 1 };
}

function meanRate(cards, seeds) {
  const rs = [];
  for (let seed = 1; seed <= seeds; seed++) rs.push(catchRate(cards, seed * 9973 + 17).rate);
  return rs.reduce((a, b) => a + b, 0) / rs.length;
}

const failed = [];
const decks = ['fecivil', 'cbet'];
decks.forEach(id => {
  const cards = L.decks[id].cards;
  const rate = meanRate(cards, 5);
  console.log(id + ' swap-test catch ' + (rate * 100).toFixed(1) + '%  n=' + cards.length);
  if (rate < 0.95 - 1e-12) failed.push(id + ' swap-test catch ' + (rate * 100).toFixed(1) + '% is under 95%');
  if (id === 'fecivil') {
    const num = cards.filter(isNumericCard);
    const nrate = meanRate(num, 5);
    console.log(id + ' numeric swap-test catch ' + (nrate * 100).toFixed(1) + '%  n=' + num.length);
    if (nrate < 0.95 - 1e-12) failed.push(id + ' numeric swap-test catch ' + (nrate * 100).toFixed(1) + '% is under 95%');
  }
});

Object.keys(V22_BAD).forEach(id => {
  const deck = id.slice(0, 2) === 'fe' ? 'fecivil' : 'cbet';
  const c = L.decks[deck].cards.find(x => x.id === id);
  if (!c) { failed.push('missing card ' + id); return; }
  const mutant = { id: c.id, c: [c.c[0], V22_BAD[id], c.c[2], c.c[3]], f: c.f };
  const errs = L.checkPracticeKey(mutant, '');
  const okGood = L.checkPracticeKey(c, '').length === 0;
  console.log('replay v22 bad key ' + id + ' ' + JSON.stringify(V22_BAD[id]) + ': ' + (errs.length ? 'CAUGHT' : 'MISSED'));
  if (!errs.length) failed.push('v22 bad key ' + id + ' was not caught');
  if (!okGood) failed.push('current key for ' + id + ' fails the key gate');
});

// Write a rotated-key override file and require checkdecks to fail.
const tmp = path.join(os.tmpdir(), 'lsa-swapped-fecivil.js');
const src = L.decks.fecivil;
const rot = JSON.parse(JSON.stringify(src));
const n = rot.cards.length;
for (let i = 0; i < n; i++) rot.cards[i].c[1] = src.cards[(i + 1) % n].c[1];
fs.writeFileSync(tmp, 'LSA.decks.fecivil = ' + JSON.stringify(rot) + ';\n');
const run = spawnSync('node', ['tools/checkdecks.js'], {
  cwd: path.join(__dirname, '..'),
  env: Object.assign({}, process.env, { LSA_DECK_OVERRIDE: tmp }),
  encoding: 'utf8'
});
console.log('checkdecks on swapped fecivil file exit ' + run.status);
if (run.status === 0) failed.push('checkdecks exited 0 on a swapped deck file');

if (failed.length) {
  console.error('FAIL');
  failed.forEach(f => console.error('  ' + f));
  process.exit(1);
}
console.log('ok practice key swap test (95% catch, v22 bad keys, checkdecks rejects a swapped file)');
