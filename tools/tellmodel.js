// General "can surface clues pick the right answer?" test.
// Trains a small logistic model on surface features only (length, word count,
// first word, negation, digits, punctuation, and each one's rank within the card),
// then scores it on held-out cards with k-fold cross-validation.
'use strict';
function feats(card, LSA) {
  var v = card.c, len = v.map(function (x) { return x.length; }), wc = v.map(function (x) { return x.split(/\s+/).length; });
  function rank(a, k) { var s = a.slice().sort(function (p, q) { return p - q; }); return [a[k] === s[0] ? 1 : 0, a[k] === s[1] ? 1 : 0, a[k] === s[2] ? 1 : 0]; }
  return v.map(function (x, k) {
    var f = {};
    f.len = len[k] / 40; f.wc = wc[k] / 8;
    rank(len, k).forEach(function (r, i) { f['lr' + i] = r; });
    rank(wc, k).forEach(function (r, i) { f['wr' + i] = r; });
    f.neg = LSA.RX_NEG.test(x) ? 1 : 0; f.num = /\d/.test(x) ? 1 : 0; f.pun = /[,;]/.test(x) ? 1 : 0;
    f['fw_' + LSA.firstWord(x)] = 1; f.bias = 1;
    return f;
  });
}
function train(rows, epochs) {
  var w = {}, lr = 0.1, l2 = 0.01;
  for (var e = 0; e < epochs; e++) rows.forEach(function (r) {
    var s = r.f.map(function (f) { var z = 0; for (var k in f) z += (w[k] || 0) * f[k]; return z; });
    var m = Math.max.apply(null, s), ex = s.map(function (z) { return Math.exp(z - m); }), t = ex.reduce(function (a, b) { return a + b; });
    r.f.forEach(function (f, i) { var g = (i === r.y ? 1 : 0) - ex[i] / t; for (var k in f) w[k] = (w[k] || 0) * (1 - lr * l2) + lr * g * f[k]; });
  });
  return w;
}
function pick(w, f) {
  var s = f.map(function (x) { var z = 0; for (var k in x) z += (w[k] || 0) * x[k]; return z; }), b = Math.max.apply(null, s);
  var top = [0, 1, 2].filter(function (i) { return s[i] === b; });
  return top.indexOf(1) >= 0 ? 1 / top.length : 0;
}
// Held-out accuracy (0 to 1) for one list of cards. Deterministic fold split.
exports.feats = feats; exports.train = train;
exports.heldOut = function (cards, LSA, folds) {
  folds = folds || 5;
  var rows = cards.filter(function (c) { return Array.isArray(c.c) && c.c.length === 3; }).map(function (c, i) { return { f: feats(c, LSA), y: 1, fold: i % folds }; });
  var hit = 0;
  for (var k = 0; k < folds; k++) {
    var w = train(rows.filter(function (r) { return r.fold !== k; }), 30);
    rows.filter(function (r) { return r.fold === k; }).forEach(function (r) { hit += pick(w, r.f); });
  }
  return rows.length ? hit / rows.length : 0;
};
