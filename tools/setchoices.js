// Dev helper: node tools/setchoices.js <deckfile> <choices.json> rewrites the c: [...] line of each listed card id.
const fs = require('fs'); const [f, j] = process.argv.slice(2); let s = fs.readFileSync(f, 'utf8'); const m = JSON.parse(fs.readFileSync(j, 'utf8'));
Object.entries(m).forEach(([id, c]) => { const at = s.indexOf("id: '" + id + "'"); if (at < 0) throw new Error('no ' + id); const k = s.indexOf('c: [', at), e = s.indexOf('],', k);
  s = s.slice(0, k) + 'c: ' + JSON.stringify(c).replace(/","/g, '", "').replace(/'/g, "\\'").replace(/"/g, "'") + s.slice(e + 1); });
fs.writeFileSync(f, s);
