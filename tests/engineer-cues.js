// Cue-guesser: a test-wise strategy that avoids self-refuting tails, avoids
// absolute words, and prefers a uniquely longest choice. Chance is 25%.
// Each Engineer Practice deck must stay at or under 30% expected score.
const assert = require('assert');
const L = require('./load.js').load();

const SELF = /,\s*which (is|has|would|misses|leaves|confuses|ignores|tests|governs|relates|rather)|\bas if\b|, not\b|\bwhich is not\b|\bwrong\b|\bunsafe\b|\bnot (a|an|the|what|how|this|cable|clinical|usually|the same)\b|\beven (if|when|though|after|while)\b|\bwith no\b|\bwithout\b/i;
const ABS = /\bonly\b|\balways\b|\bnever\b|\bevery\b|\ball\b|\bany amount\b|\bno (check|test)\b/i;

function scoreChoice(text, isUniqueLongest) {
  let s = 0;
  if (SELF.test(text)) s -= 2;
  if (ABS.test(text)) s -= 1;
  if (isUniqueLongest) s += 1;
  return s;
}

function guessDeck(cards) {
  let expected = 0;
  const rows = [];
  cards.forEach(c => {
    const lens = c.c.map(t => t.length);
    const mx = Math.max.apply(null, lens);
    const unique = lens.filter(n => n === mx).length === 1;
    const sc = c.c.map((t, i) => scoreChoice(t, unique && lens[i] === mx));
    const best = Math.max.apply(null, sc);
    const tied = [];
    sc.forEach((v, i) => { if (v === best) tied.push(i); });
    const share = tied.indexOf(1) >= 0 ? 1 / tied.length : 0;
    expected += share;
    rows.push({ id: c.id, sc, share });
  });
  return { expected: expected / cards.length, rows };
}

// Pure cue (no length) is reported but the gate includes the longest heuristic.
['fecivil', 'cbet'].forEach(id => {
  const r = guessDeck(L.decks[id].cards);
  const pct = r.expected * 100;
  console.log('cue-guesser', id, pct.toFixed(1) + '%', '(n=' + L.decks[id].cards.length + ')');
  assert(pct <= 30, id + ' cue-guesser scored ' + pct.toFixed(1) + '% (target 30% or lower)');
});

// Self-refuting tails should not appear on wrong answers.
['fecivil', 'cbet'].forEach(id => {
  L.decks[id].cards.forEach(c => {
    [0, 2, 3].forEach(i => {
      assert(!SELF.test(c.c[i]), c.id + ' wrong choice is self-refuting: ' + c.c[i]);
    });
  });
});

console.log('ok engineer cue-guesser (longest + absolute words + self-refuting tails)');
