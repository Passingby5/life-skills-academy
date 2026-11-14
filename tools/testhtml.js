// Writes a single-file test copy of the built app (site/index.html) with every card picture inlined as a data URI
// (LSA.IMG_DATA), so pictures work when the file is opened on its own. It sets LSA_SINGLE so it never registers a service worker, over file: or http:. Run after build.js.
// Usage: node tools/testhtml.js [out.html]   (default ../life-skills-academy-test.html)
const fs = require('fs'), path = require('path');
const site = path.join(__dirname, '../site'), out = process.argv[2] || path.join(__dirname, '../../life-skills-academy-test.html');
let html = fs.readFileSync(path.join(site, 'index.html'), 'utf8'); const data = {};
fs.readdirSync(path.join(site, 'img')).filter(f => f.endsWith('.svg')).sort().forEach(f => { data['img/' + f] = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(site, 'img', f)).toString('base64'); });
// v17 (QA P3): inline the page icons too, so the single file never requests icons/*.png (no 404 in the console).
['icon-192', 'apple-touch-icon'].forEach(n => { const f = path.join(site, 'icons', n + '.png'); if (fs.existsSync(f)) html = html.split('href="icons/' + n + '.png"').join('href="data:image/png;base64,' + fs.readFileSync(f).toString('base64') + '"'); });
// Inline bundled KaTeX (JS, CSS, woff2 fonts as data URIs) so formulas work in the single-file copy.
const kdir = path.join(site, 'vendor/katex');
if (fs.existsSync(path.join(kdir, 'katex.min.js'))) {
  let kcss = fs.readFileSync(path.join(kdir, 'katex.min.css'), 'utf8');
  kcss = kcss.replace(/url\(fonts\/([^)]+?)\.woff2\) format\("woff2"\)/g, (_, name) => {
    const f = path.join(kdir, 'fonts', name + '.woff2');
    return 'url(data:font/woff2;base64,' + fs.readFileSync(f).toString('base64') + ') format("woff2")';
  });
  const kjs = fs.readFileSync(path.join(kdir, 'katex.min.js'), 'utf8');
  // Use split/join so $ in the KaTeX source is not treated as a replace pattern.
  html = html.split('<link rel="stylesheet" href="vendor/katex/katex.min.css">').join('<style id="katex-css">' + kcss + '</style>');
  html = html.split('<script src="vendor/katex/katex.min.js"></script>').join('<script id="katex-js">' + kjs + '</script>');
  if (/vendor\/katex\//.test(html)) throw new Error('single-file copy still points at vendor/katex');
}
const at = html.indexOf('<script data-src='); if (at < 0) throw new Error('no app script found');
html = html.slice(0, at) + '<script>window.LSA_SINGLE = true; var LSA = typeof LSA !== "undefined" ? LSA : {}; LSA.IMG_DATA = ' + JSON.stringify(data) + ';</script>\n' + html.slice(at);
fs.writeFileSync(out, html); console.log('wrote ' + out + ' with ' + Object.keys(data).length + ' inlined pictures');
