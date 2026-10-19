// Fails if any em-dash (U+2014) or en-dash (U+2013) is in the app's own text: src/ (UI, engine, decks),
// the built page if present, and the card review file. Untracked research folders are never scanned.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), bad = [];
const scan = p => fs.readFileSync(p, 'utf8').split('\n').forEach((l, i) => { if (/[\u2013\u2014]/.test(l)) bad.push(path.relative(root, p) + ':' + (i + 1)); });
(function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(js|html|css|json|svg)$/.test(e.name)) scan(p); });
})(path.join(root, 'src'));
['site/index.html', 'REVIEW.md'].map(f => path.join(root, f)).filter(fs.existsSync).forEach(scan);
if (bad.length) { console.error('Dashes found:\n' + bad.join('\n')); process.exit(1); }
console.log('ok 33 no em-dashes in the app text and decks');
