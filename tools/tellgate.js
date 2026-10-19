// Classifier gate: a small logistic model trained only on surface features (tools/tellmodel.js) must not pick the
// right answer on held-out cards more than 45% of the time (chance is 33%). 5-fold per deck, 10-fold for the non-frozen decks pooled (45%) and for all decks pooled (LSA.TELL_POOLED_ALL, since the frozen decks are in that pool).
// Frozen v6 decks may use their documented exception in LSA.TELL_EXCEPTIONS (deck.js). Returns a list of problems.
const M = require('./tellmodel.js');
exports.scores = function (L) {
  const out = {}; L.knowDecks().forEach(id => { out[id] = M.heldOut(L.decks[id].cards, L, 5); });
  out._pooled = M.heldOut([].concat(...L.knowDecks().map(id => L.decks[id].cards)), L, 10);
  out._pooledNew = M.heldOut([].concat(...L.knowDecks().filter(id => L.FROZEN_DECKS.indexOf(id) < 0).map(id => L.decks[id].cards)), L, 10);
  return out;
};
exports.check = function (L, scores) {
  const s = scores || exports.scores(L), errs = [];
  L.knowDecks().forEach(id => { const lim = L.tellLimit(id, 'classifier'); if (s[id] > lim) errs.push(id + ': surface classifier picks the right answer ' + (s[id] * 100).toFixed(1) + '% of held-out cards (limit ' + (lim * 100).toFixed(1) + '%)'); });
  if (s._pooledNew > L.MAX_STRATEGY) errs.push('non-frozen decks pooled: surface classifier ' + (s._pooledNew * 100).toFixed(1) + '% (limit 45%)');
  if (s._pooled > L.TELL_POOLED_ALL) errs.push('all decks pooled: surface classifier ' + (s._pooled * 100).toFixed(1) + '% (limit ' + (L.TELL_POOLED_ALL * 100) + '%, raised only because the frozen decks are in the pool)');
  Object.keys(L.TELL_EXCEPTIONS).forEach(id => { if (L.FROZEN_DECKS.indexOf(id) < 0) errs.push(id + ': tell exception is only allowed for frozen decks'); });
  return errs;
};
