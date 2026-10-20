// Street Smart: checks each card's quote is in its saved source (sources/street/<id>.txt), then merges the quotes into
// tools/quotes-new.json and writes the matching excerpts to tests/fixtures/street-excerpts.json so tests run without sources/.
// Usage: node tools/street-quotes.js <deck id> <quotes.json>
const fs = require('fs'), path = require('path'), L = require('../tests/load.js').load();
const [id, qf] = process.argv.slice(2), d = L.decks[id], Q = JSON.parse(fs.readFileSync(qf, 'utf8'));
const norm = s => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ');
const QF = path.join(__dirname, 'quotes-new.json'), XF = path.join(__dirname, '../tests/fixtures/street-excerpts.json');
const all = JSON.parse(fs.readFileSync(QF, 'utf8')), X = fs.existsSync(XF) ? JSON.parse(fs.readFileSync(XF, 'utf8')) : {};
let bad = 0;
d.cards.forEach(c => [[c.id, c.src]].concat((c.also || []).map(k => [c.id + '@' + k, k])).forEach(([key, src]) => {
  const q = Q[key]; if (!q) { console.log('MISSING quote', key); bad++; return; }
  const t = norm(fs.readFileSync(path.join(__dirname, '../sources/street/' + src + '.txt'), 'utf8')), at = t.indexOf(norm(q));
  if (at < 0) { console.log('NOT FOUND', key, src, q); bad++; return; }
  all[key] = JSON.stringify(norm(q)); X[src] = X[src] || []; const ex = t.slice(Math.max(0, at - 120), at + q.length + 120);
  if (!X[src].some(e => e.includes(norm(q)))) X[src].push(ex);
}));
if (bad) process.exit(1);
fs.writeFileSync(QF, '{\n' + Object.keys(all).map(k => JSON.stringify(k) + ': ' + JSON.stringify(all[k]).replace(/[\u007f-\uffff]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'))).join(',\n') + '\n}\n');
fs.writeFileSync(XF, JSON.stringify(X, null, 1)); console.log('ok', id, 'quotes checked and saved');
