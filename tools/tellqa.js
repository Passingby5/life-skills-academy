// QA-style answer-tell gate (v19). Port of the v17 QA analyzer: 13 surface features per choice, a gradient-boosted
// tree model (60 depth-2 trees, learning rate 0.1, log loss) and an L2 logistic model, each scored 10-fold x5 held-out
// after shuffling the choices with fixed seeds. Every seed's mean must stay at or under 45% (chance is 33%).
// Used by tools/checkdecks.js for the Street Smart Gut Check decks.
const NEG = /\b(not|never|no|don't|do not|isn't|can't|won't|none)\b/i, HED = /\b(usually|always|only|never|all|every|just|maybe|might|can)\b/i, HEDG = new RegExp(HED.source, 'gi');
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const wc = s => s.trim().split(/\s+/).length;
const qw = t => new Set(String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(' ').filter(w => w.length > 3));
function feats(ch, i, q) {
  const L = ch.map(x => x.length), W = ch.map(wc), x = ch[i];
  const rk = L.slice().sort((a, b) => a - b).indexOf(L[i]), wr = W.slice().sort((a, b) => a - b).indexOf(W[i]);
  const fw = x.split(/\s+/)[0].toLowerCase().replace(/[,;]/g, ''), negs = ch.filter(y => NEG.test(y)).length;
  return [rk === 0, rk === 1, rk === 2, wr === 0, wr === 2, NEG.test(x), /\d/.test(x), /[,;]/.test(x), HED.test(x),
    ['no', 'not', "don't", 'do'].indexOf(fw) >= 0, ['yes', 'always', 'only', 'usually', 'never'].indexOf(fw) >= 0,
    (x.match(HEDG) || []).length, negs === 1 && NEG.test(x)].map(Number).concat(q === undefined ? [] : qfeats(ch, i, q));
}
// v20 passage-free extras: how much a choice repeats the question's own words (most, least, any).
function qfeats(ch, i, q) {
  const Q = qw(q), ov = ch.map(x => [...qw(x)].filter(w => Q.has(w)).length), mx = Math.max(...ov), mn = Math.min(...ov);
  return [ov[i] === mx && mx > mn, ov[i] === mn && mx > mn, ov[i] > 0].map(Number);
}
exports.feats = feats;
// One depth-2 regression tree fit to residuals g with Newton leaf values (hess h).
function tree(X, g, h, idx) {
  const nf = X[0].length;
  function best(ids) {
    let bs = null, G = 0; ids.forEach(i => { G += g[i]; }); const n = ids.length;
    for (let f = 0; f < nf; f++) {
      const vals = Array.from(new Set(ids.map(i => X[i][f]))).sort((a, b) => a - b);
      for (let k = 0; k < vals.length - 1; k++) {
        const t = (vals[k] + vals[k + 1]) / 2; let gl = 0, nl = 0; ids.forEach(i => { if (X[i][f] <= t) { gl += g[i]; nl++; } });
        const nr = n - nl; if (!nl || !nr) continue; const gain = gl * gl / nl + (G - gl) * (G - gl) / nr - G * G / n;
        if (!bs || gain > bs.gain + 1e-12) bs = { f, t, gain };
      }
    }
    return bs;
  }
  function leaf(ids) { let a = 0, b = 0; ids.forEach(i => { a += g[i]; b += h[i]; }); return b < 1e-12 ? 0 : a / b; }
  function node(ids, d) {
    const s = d < 2 && ids.length > 1 ? best(ids) : null; if (!s) return { v: leaf(ids) };
    const l = ids.filter(i => X[i][s.f] <= s.t), r = ids.filter(i => X[i][s.f] > s.t);
    return { f: s.f, t: s.t, l: node(l, d + 1), r: node(r, d + 1) };
  }
  return node(idx, 0);
}
const pred = (n, x) => n.v !== undefined ? n.v : pred(x[n.f] <= n.t ? n.l : n.r, x);
function gbm(X, y) {
  const n = y.length, p0 = y.reduce((a, b) => a + b, 0) / n, f0 = Math.log(p0 / (1 - p0)), F = new Array(n).fill(f0), trees = [], idx = X.map((_, i) => i);
  for (let m = 0; m < 60; m++) {
    const p = F.map(v => 1 / (1 + Math.exp(-v))), g = y.map((v, i) => v - p[i]), h = p.map(v => v * (1 - v));
    const t = tree(X, g, h, idx); trees.push(t); for (let i = 0; i < n; i++) F[i] += 0.1 * pred(t, X[i]);
  }
  return x => trees.reduce((a, t) => a + 0.1 * pred(t, x), f0);
}
function logreg(X, y) {
  const d = X[0].length, w = new Array(d + 1).fill(0);
  for (let it = 0; it < 400; it++) {
    const gr = new Array(d + 1).fill(0);
    X.forEach((x, i) => { let z = w[d]; for (let k = 0; k < d; k++) z += w[k] * x[k]; const e = 1 / (1 + Math.exp(-z)) - y[i]; for (let k = 0; k < d; k++) gr[k] += e * x[k]; gr[d] += e; });
    for (let k = 0; k < d; k++) gr[k] += w[k]; for (let k = 0; k <= d; k++) w[k] -= 0.5 * gr[k] / X.length;
  }
  return x => { let z = w[d]; for (let k = 0; k < d; k++) z += w[k] * x[k]; return z; };
}
function heldOut(cs, make) {
  const accs = [];
  for (let seed = 0; seed < 5; seed++) {
    const idx = shuffle(cs.map((_, i) => i), rng(seed + 101)); let hit = 0;
    for (let f = 0; f < 10; f++) {
      const te = idx.filter((_, j) => j % 10 === f).map(i => cs[i]), tr = idx.filter((_, j) => j % 10 !== f).map(i => cs[i]);
      const X = [], y = []; tr.forEach(c => c.c.forEach((_, i) => { X.push(feats(c.c, i, c.q)); y.push(+(i === c.a)); }));
      const m = make(X, y);
      te.forEach(c => { const s = c.c.map((_, i) => m(feats(c.c, i, c.q))); if (s.indexOf(Math.max(...s)) === c.a) hit++; });
    }
    accs.push(hit / cs.length);
  }
  return accs.reduce((a, b) => a + b, 0) / accs.length;
}
exports.SEEDS = [7, 11, 23, 42];
// cards: deck cards with c[1] right. Returns {gbm, logreg} = worst seed mean.
exports.score = function (cards, seeds) {
  const out = { gbm: 0, logreg: 0 };
  (seeds || exports.SEEDS).forEach(sd => {
    const r = rng(sd * 7919), cs = cards.map(c => { const o = shuffle([0, 1, 2], r); return { c: o.map(k => c.c[k]), a: o.indexOf(1), q: c.q }; });
    out.gbm = Math.max(out.gbm, heldOut(cs, gbm)); out.logreg = Math.max(out.logreg, heldOut(cs, logreg));
  });
  return out;
};
exports.LIMIT = 0.45;
// v20.1: Estate sat near the line in QA's own folds, so it gets a wider margin.
exports.LIMITS = { estate: 0.40 };
exports.check = function (L, ids) {
  const errs = [], scores = {};
  ids.forEach(id => { const s = exports.score(L.decks[id].cards); scores[id] = s; const lim = exports.LIMITS[id] || exports.LIMIT; ['gbm', 'logreg'].forEach(k => { if (s[k] > lim) errs.push(id + ': QA ' + k + ' tell model picks the right answer ' + (s[k] * 100).toFixed(1) + '% of held-out cards (limit ' + Math.round(lim * 100) + '%)'); }); });
  return { errs, scores };
};
// v20 Hard Reads passage-free check: the same two models trained on each question plus its choices, never the passage.
// v20.4 M3: limit 40% (QA's line), plus every simple one-feature rule QA tried (longest, shortest, middle, most or fewest
// words, middle words, most or least question overlap), each at or under 40% on every seed.
exports.PASSAGE_LIMIT = 0.40;
const RULES = {
  longest: c => c.map(x => x.length), shortest: c => c.map(x => -x.length),
  middle: c => { const s = c.map(x => x.length).slice().sort((a, b) => a - b); return c.map(x => x.length === s[1] ? 1 : 0); },
  mostWords: c => c.map(wc), fewestWords: c => c.map(x => -wc(x)),
  middleWords: c => { const s = c.map(wc).slice().sort((a, b) => a - b); return c.map(x => wc(x) === s[1] ? 1 : 0); },
  mostOverlap: (c, q) => { const Q = qw(q); return c.map(x => [...qw(x)].filter(w => Q.has(w)).length); },
  leastOverlap: (c, q) => { const Q = qw(q); return c.map(x => -[...qw(x)].filter(w => Q.has(w)).length); }
};
exports.ruleScores = function (qs, seeds) {
  const out = {};
  Object.keys(RULES).forEach(k => { out[k] = 0; (seeds || exports.SEEDS).forEach(sd => {
    const r = rng(sd * 7919); let hit = 0;
    qs.forEach(q => { const o = shuffle([0, 1, 2], r), c = o.map(i => q.c[i]), v = RULES[k](c, q.q), mx = Math.max(...v), top = v.map((x, i) => x === mx ? i : -1).filter(i => i >= 0); if (top.indexOf(o.indexOf(1)) >= 0) hit += 1 / top.length; });
    out[k] = Math.max(out[k], hit / qs.length); }); });
  return out;
};
// v20.4 M3 by-hand-style screen: a choice that a reader could drop without reading. Extreme or absolute words, and
// tone or stance words that no careful writer on a grave subject would take (approving harm, joking, cheering).
exports.EXTREME = /\b(always|never|every|everyone|everything|all|none|nobody|nothing|only|entirely|completely|totally|forever|must|impossible|guaranteed|any)\b/i;
exports.OFFTONE = /\b(celebrat\w*|deserved?|earned their|glorif\w*|gleeful)\b/i;
// On tone questions, moods no careful writer would take on a grave subject can be dropped without reading.
exports.OFFTONE_TONE = /\b(amus\w*|playful|thrill\w*|joking|joyful|cheerful|silly|bored|indifferent|mocking|flippant|whimsical|lighthearted|sentimental|preachy|useless|irrelevant|sympathetic to|sarcastic|upbeat|excited|triumphant|worshipful|cheerleading|lurid|sensational)\b/i;
exports.heuristic = function (cards) {
  const out = [];
  cards.forEach(c => c.qs.forEach(q => q.c.forEach((x, k) => {
    if (exports.EXTREME.test(x)) out.push(q.id + ' choice ' + k + ' has an extreme word: ' + x);
    if (exports.OFFTONE.test(x) || (q.type === 'tone' && exports.OFFTONE_TONE.test(x))) out.push(q.id + ' choice ' + k + ' is an off-tone or repugnant option: ' + x);
  })));
  return out;
};
exports.checkPassage = function (L, ids) {
  const errs = [], scores = {};
  ids.forEach(id => { const qs = []; L.decks[id].cards.forEach(c => c.qs.forEach(q => qs.push({ c: q.c, q: q.q }))); const s = exports.score(qs);
    const rs = exports.ruleScores(qs); s.rules = rs; Object.keys(rs).forEach(k => { if (rs[k] > exports.PASSAGE_LIMIT) errs.push(id + ': passage-free rule "' + k + '" picks the right answer ' + (rs[k] * 100).toFixed(1) + '% (limit 40%)'); });
    exports.heuristic(L.decks[id].cards).forEach(e => errs.push(id + ': ' + e)); scores[id] = s; ['gbm', 'logreg'].forEach(k => { if (s[k] > exports.PASSAGE_LIMIT) errs.push(id + ': passage-free ' + k + ' model picks the right answer ' + (s[k] * 100).toFixed(1) + '% of held-out questions without the passage (limit 40%)'); }); });
  return { errs, scores };
};
if (require.main === module) {
  const L = require('../tests/load.js').load(), ids = process.argv.slice(2).length ? process.argv.slice(2) : ['estate', 'legal', 'power'];
  const r = exports.check(L, ids); ids.forEach(id => console.log(id, 'gbm', (r.scores[id].gbm * 100).toFixed(1) + '%', 'logreg', (r.scores[id].logreg * 100).toFixed(1) + '%'));
  r.errs.forEach(e => console.log('FAIL', e)); process.exit(r.errs.length ? 1 : 0);
}
// v20.1 M1: exact-text tells. A choice text (or its tail after ";") that shows up on 3+ cards and is right on most of
// them, or never right across 4+ cards, can be learned by sight. Also checks a whole "None of these" family.
exports.textTells = function (cards) {
  const g = {}, add = (k, right, id) => { (g[k] = g[k] || { n: 0, r: 0, ids: [] }); g[k].n++; if (right) g[k].r++; g[k].ids.push(id); };
  const norm = x => String(x).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  cards.forEach(c => (c.c || []).forEach((x, k) => {
    add('text: ' + norm(x), k === 1, c.id);
    const t = String(x).split(';'); if (t.length > 1) add('tail: ' + norm(t.slice(1).join(';')), k === 1, c.id);
  }));
  return Object.keys(g).filter(k => g[k].n >= 3 && (g[k].r / g[k].n >= 0.75 || (g[k].r === 0 && g[k].n >= 4))).map(k => k + ' is right on ' + g[k].r + ' of ' + g[k].n + ' (' + g[k].ids.join(', ') + ')');
};
