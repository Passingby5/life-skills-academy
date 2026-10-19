// Deck checker (also run by build.js). Prints counts per deck per age group. Exits 1 on any problem.
const L = require('../tests/load.js').load(), errs = L.checkAll();
L.deckOrder.forEach(id => { const d = L.decks[id]; if (d.format !== 'gutcheck') { console.log(id, '(' + d.format + ')', d.cards.length, 'cards'); return; }
  console.log(id, 'total', d.cards.length, '| ya sees', L.cardsFor('ya', [id]).length, '| adult sees', L.cardsFor('adult', [id]).length, '| sources', Object.keys(d.sources).length); });
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('ok 12/13 deck checker');
L.knowDecks().forEach(id => { const t = L.tellStats(L.decks[id].cards).strat; console.log(id, 'strategy scores:', Object.entries(t).map(([k, v]) => k + ' ' + (v * 100).toFixed(1) + '%').join(', '), '| right is longest', (L.lengthStats(L.decks[id]).rightLongest * 100).toFixed(1) + '%'); });
