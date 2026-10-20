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
exports.check = function (L, ids) {
  const errs = [], scores = {};
  ids.forEach(id => { const s = exports.score(L.decks[id].cards); scores[id] = s; ['gbm', 'logreg'].forEach(k => { if (s[k] > exports.LIMIT) errs.push(id + ': QA ' + k + ' tell model picks the right answer ' + (s[k] * 100).toFixed(1) + '% of held-out cards (limit 45%)'); }); });
  return { errs, scores };
};
// v20 Hard Reads passage-free check: the same two models trained on each question plus its choices, never the passage.
exports.checkPassage = function (L, ids) {
  const errs = [], scores = {};
  ids.forEach(id => { const qs = []; L.decks[id].cards.forEach(c => c.qs.forEach(q => qs.push({ c: q.c, q: q.q }))); const s = exports.score(qs); scores[id] = s; ['gbm', 'logreg'].forEach(k => { if (s[k] > exports.LIMIT) errs.push(id + ': passage-free ' + k + ' model picks the right answer ' + (s[k] * 100).toFixed(1) + '% of held-out questions without the passage (limit 45%)'); }); });
  return { errs, scores };
};
if (require.main === module) {
  const L = require('../tests/load.js').load(), ids = process.argv.slice(2).length ? process.argv.slice(2) : ['estate', 'legal', 'power'];
  const r = exports.check(L, ids); ids.forEach(id => console.log(id, 'gbm', (r.scores[id].gbm * 100).toFixed(1) + '%', 'logreg', (r.scores[id].logreg * 100).toFixed(1) + '%'));
  r.errs.forEach(e => console.log('FAIL', e)); process.exit(r.errs.length ? 1 : 0);
}
