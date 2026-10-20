// Hard Reads fact check (v20). For every passage: each quoted phrase ("...") must appear in one of its saved sources
// (sources/street/<id>.txt), and every number and capitalized name must appear in them too (common words excepted).
// Writes tests/fixtures/hardreads-excerpts.json (each quote with the source text around it) so tests/unit.js can
// re-check quotes without sources/, which is not in git. Usage: node tools/hr-facts.js
const fs = require('fs'), path = require('path'), L = require('../tests/load.js').load();
const norm = s => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
const d = L.decks.hardreads, X = {}, COMMON = new Set(fs.readFileSync(path.join(__dirname, 'hr-common.txt'), 'utf8').split(/\s+/).filter(Boolean));
let bad = 0;
d.cards.forEach(c => {
  const T = c.sourceIds.map(k => norm(fs.readFileSync(path.join(__dirname, '../sources/street/' + k + '.txt'), 'utf8'))), all = T.join('\n'), low = all.toLowerCase();
  const txt = norm(c.passage.join(' '));
  (txt.match(/"[^"]+"/g) || []).forEach(q => {
    const s = q.slice(1, -1).replace(/[,.]$/, ''); const at = all.indexOf(s);
    if (at < 0) { console.log('QUOTE NOT IN SOURCE', c.id, s); bad++; return; }
    X[c.id + ':' + s] = all.slice(Math.max(0, at - 80), at + s.length + 80);
  });
  (txt.match(/\d[\d,.]*\d|\d/g) || []).forEach(n => { const v = n.replace(/[.,]$/, ''); if (!all.includes(v)) { console.log('NUMBER NOT IN SOURCE', c.id, v); bad++; } });
  [...new Set(txt.match(/\b[A-Z][A-Za-z'\-]+/g) || [])].filter(w => !COMMON.has(w) && !low.includes(w.toLowerCase().replace(/'s$/, ''))).forEach(w => { console.log('NAME NOT IN SOURCE', c.id, w); bad++; });
});
fs.writeFileSync(path.join(__dirname, '../tests/fixtures/hardreads-excerpts.json'), JSON.stringify(X, null, 1));
console.log(bad ? bad + ' problems' : 'ok hard reads facts: quotes, numbers and names found in saved sources (' + Object.keys(X).length + ' quotes)');
process.exit(bad ? 1 : 0);
