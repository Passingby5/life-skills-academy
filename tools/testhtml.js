// Writes a single-file test copy of the built app (site/index.html) with every card picture inlined as a data URI
// (LSA.IMG_DATA), so pictures work when the file is opened on its own. It sets LSA_SINGLE so it never registers a service worker, over file: or http:. Run after build.js.
// Usage: node tools/testhtml.js [out.html]   (default ../life-skills-academy-test.html)
const fs = require('fs'), path = require('path');
const site = path.join(__dirname, '../site'), out = process.argv[2] || path.join(__dirname, '../../life-skills-academy-test.html');
let html = fs.readFileSync(path.join(site, 'index.html'), 'utf8'); const data = {};
fs.readdirSync(path.join(site, 'img')).filter(f => f.endsWith('.svg')).sort().forEach(f => { data['img/' + f] = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(site, 'img', f)).toString('base64'); });
const at = html.indexOf('<script data-src='); if (at < 0) throw new Error('no app script found');
html = html.slice(0, at) + '<script>window.LSA_SINGLE = true; var LSA = typeof LSA !== "undefined" ? LSA : {}; LSA.IMG_DATA = ' + JSON.stringify(data) + ';</script>\n' + html.slice(at);
fs.writeFileSync(out, html); console.log('wrote ' + out + ' with ' + Object.keys(data).length + ' inlined pictures');
