// Fails if any em-dash (U+2014) or en-dash (U+2013) is in src, site, tests, tools or docs.
const fs = require('fs'), path = require('path');
const bad = [], root = path.join(__dirname, '..');
(function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!['node_modules', '.git', 'sources', 'shots'].includes(e.name)) walk(p); return; }
    if (!/\.(js|html|css|md|json|webmanifest|yml|txt)$/.test(e.name)) return;
    fs.readFileSync(p, 'utf8').split('\n').forEach((l, i) => { if (/[\u2013\u2014]/.test(l)) bad.push(path.relative(root, p) + ':' + (i + 1)); });
  });
})(root);
if (bad.length) { console.error('Dashes found:\n' + bad.join('\n')); process.exit(1); }
console.log('ok 33 no em-dashes');
