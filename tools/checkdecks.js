// Deck checker (also run by build.js). Prints counts per deck per age group and every tell score. Exits 1 on any problem,
// including any guessing rule or the surface classifier over 45% (frozen v6 decks: see LSA.TELL_EXCEPTIONS in deck.js).
const L = require('../tests/load.js').load(), G = require('./tellgate.js');
L.deckOrder.forEach(id => { const d = L.decks[id]; if (d.format !== 'gutcheck') { console.log(id, '(' + d.format + ')', d.cards.length, 'cards'); return; }
  console.log(id, 'total', d.cards.length, '| ya sees', L.cardsFor('ya', [id]).length, '| adult sees', L.cardsFor('adult', [id]).length, '| sources', Object.keys(d.sources).length); });
const sc = G.scores(L);
L.knowDecks().forEach(id => { const t = L.tellStats(L.decks[id].cards).strat, top = Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 4);
  console.log(id + (L.FROZEN_DECKS.indexOf(id) >= 0 ? ' (frozen)' : ''), '| classifier', (sc[id] * 100).toFixed(1) + '%', '| top rules:', top.map(([k, v]) => k + ' ' + (v * 100).toFixed(1) + '%').join(', '), '| right is longest', (L.lengthStats(L.decks[id]).rightLongest * 100).toFixed(1) + '%'); });
console.log('classifier pooled (10-fold): non-frozen decks', (sc._pooledNew * 100).toFixed(1) + '% (limit 45%) | all decks', (sc._pooled * 100).toFixed(1) + '% (limit ' + L.TELL_POOLED_ALL * 100 + '%)');
console.log('frozen-deck exceptions:', JSON.stringify(L.TELL_EXCEPTIONS));
const errs = L.checkAll().concat(G.check(L, sc));
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('ok deck checker (strategies, classifier, counts, sources)');
