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
// v18 Power Plays: banned Greene law titles (tools/powerban.js).
const PBAN = require('./powerban.js');
L.deckOrder.filter(id => L.decks[id].power).forEach(id => PBAN.check(L.decks[id], L.POWER_TACTICS).forEach(e => errs.push(e)));
// v19: QA-style tell models (gradient-boosted trees and logistic) on every Street Smart Gut Check deck.
const TQA = require('./tellqa.js'), sss = L.knowDecks().filter(id => L.decks[id].section === 'Street Smart');
const tq = TQA.check(L, sss); tq.errs.forEach(e => errs.push(e));
console.log('QA tell models (4 seeds, 10-fold x5): ' + sss.map(id => id + ' gbm ' + (tq.scores[id].gbm * 100).toFixed(1) + '% logreg ' + (tq.scores[id].logreg * 100).toFixed(1) + '%').join(' | '));
// v20.1 M1 (frozen v6 decks are hash-locked, so skipped): exact-text tells (a choice text or its tail after ";" that is nearly always right, or never right).
L.knowDecks().filter(id => L.decks[id].format === 'gutcheck' && L.FROZEN_DECKS.indexOf(id) < 0).forEach(id => TQA.textTells(L.decks[id].cards).forEach(e => errs.push(id + ': exact-text tell: ' + e)));
// v20: passage-free tell check on Hard Reads (question plus choices only).
const pds = L.passageDecks(), pq = TQA.checkPassage(L, pds); pq.errs.forEach(e => errs.push(e));
if (pds.length) console.log('Passage-free models (4 seeds, 10-fold x5, limit 40%; one-feature rules and the extreme-word screen also checked): ' + pds.map(id => id + ' gbm ' + (pq.scores[id].gbm * 100).toFixed(1) + '% logreg ' + (pq.scores[id].logreg * 100).toFixed(1) + '%').join(' | '));
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('ok deck checker (strategies, classifier, counts, sources)');
