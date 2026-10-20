// Build: checks decks, then concatenates src/ into site/index.html (PWA) with sw.js, version.json and manifest.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execSync } = require('child_process');
const { ORDER, load } = require('./tests/load.js');
// LSA_EXTRA=<dir> adds <dir>/decks/*.js and <dir>/img/*.svg (used by tests); LSA_OUT=<dir> builds there instead of site/.
const EXTRA = process.env.LSA_EXTRA ? path.resolve(process.env.LSA_EXTRA) : '';
const extraDecks = EXTRA ? fs.readdirSync(path.join(EXTRA, 'decks')).filter(f => f.endsWith('.js')).sort().map(f => path.join(EXTRA, 'decks', f)) : [];
const ALL = ORDER.concat(extraDecks);
const LS = load(ALL), errs = LS.checkAll().concat(require('./tools/tellgate.js').check(LS));
if (errs.length) { console.error('Deck check failed:\n' + errs.join('\n')); process.exit(1); }
const r = f => fs.readFileSync(path.isAbsolute(f) ? f : path.join(__dirname, 'src', f), 'utf8');
const scripts = ALL.concat(['ui/ui.js']);
// Card pictures: every img a card names must exist under src/img/ (or the extra dir's img/).
const imgs = [...new Set(Object.values(LS.cardIndex).map(c => c.img).filter(Boolean))].sort();
const imgFile = p => [path.join(__dirname, 'src', p), EXTRA && path.join(EXTRA, p)].find(f => f && fs.existsSync(f));
const missing = imgs.filter(p => !imgFile(p));
if (missing.length) { console.error('Missing card pictures:\n' + missing.join('\n')); process.exit(1); }
let commit = process.env.COMMIT || '';
if (!commit) { try { commit = execSync('git rev-parse HEAD', { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { commit = 'local'; } }
commit = commit.slice(0, 7);
const LABEL = 'v20.3 - Oct 20 - ' + commit;
const id = crypto.createHash('sha1').update(scripts.map(r).join('') + r('ui/style.css') + r('ui/body.html') + LABEL).digest('hex').slice(0, 8);
const js = `<script>var LSA_BUILD = { label: ${JSON.stringify(LABEL)}, id: ${JSON.stringify(id)} };</script>\n` + scripts.map(f => `<script data-src="${f}">\n${r(f)}</script>`).join('\n');
const reg = `
<script>
(function () {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:' || window.LSA_SINGLE) return;
  var had = !!navigator.serviceWorker.controller, reloading = false;
  function reloadNow() { if (reloading) return; reloading = true; try { if (LSA.UI) LSA.UI.save(); } catch (e) { } location.reload(); }
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (!had) { had = true; return; } reloadNow(); });
  function check(reg) {
    if (reg) reg.update().catch(function () { });
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (v) {
      if (!v || v.id === LSA_BUILD.id) return; var k = 'lsa_reload_' + v.id; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1');
      setTimeout(reloadNow, 1500);
    }).catch(function () { });
  }
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      check(reg); document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') check(reg); });
      setInterval(function () { check(reg); }, 20 * 60 * 1000);
    }).catch(function () { });
  });
})();
</script>`;
const page = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#10202e">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Life Skills">
<meta name="description" content="Life Skills Academy: Know It. Quick real life myth checks for families. Works offline.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">
<title>Life Skills Academy</title>
<style>
${r('ui/style.css')}</style></head>
<body>
${r('ui/body.html')}
${js}${reg}
</body></html>
`;
const OUT = process.env.LSA_OUT ? path.resolve(process.env.LSA_OUT) : path.join(__dirname, 'site');
const S = p => path.join(OUT, p);
fs.mkdirSync(S('icons'), { recursive: true });
if (OUT !== path.join(__dirname, 'site')) icons0().forEach(n => fs.copyFileSync(path.join(__dirname, 'site/icons', n + '.png'), S('icons/' + n + '.png')));
fs.rmSync(S('img'), { recursive: true, force: true });
if (imgs.length) { fs.mkdirSync(S('img'), { recursive: true }); imgs.forEach(p => fs.copyFileSync(imgFile(p), S(p))); }
function icons0() { return ['icon-192', 'icon-512', 'maskable-192', 'maskable-512', 'apple-touch-icon']; }
fs.writeFileSync(S('index.html'), page);
fs.writeFileSync(S('.nojekyll'), '');
fs.writeFileSync(S('manifest.webmanifest'), JSON.stringify({
  name: 'Life Skills Academy', short_name: 'Life Skills', description: 'Quick real life myth checks for families. Works offline.',
  start_url: './index.html', scope: './', display: 'standalone', orientation: 'any', background_color: '#10202e', theme_color: '#10202e',
  icons: [['icon-192', '192x192', 'any'], ['icon-512', '512x512', 'any'], ['maskable-192', '192x192', 'maskable'], ['maskable-512', '512x512', 'maskable']].map(([n, s, p]) => ({ src: 'icons/' + n + '.png', sizes: s, type: 'image/png', purpose: p }))
}, null, 1));
const icons = ['icon-192', 'icon-512', 'maskable-192', 'maskable-512', 'apple-touch-icon'];
const assets = ['./', 'index.html', 'manifest.webmanifest'].concat(icons.map(n => 'icons/' + n + '.png'), imgs);
const h = crypto.createHash('sha1'); h.update(page); icons.forEach(n => h.update(fs.readFileSync(S('icons/' + n + '.png')))); imgs.forEach(p => h.update(p).update(fs.readFileSync(S(p))));
const cache = 'lsa-' + h.digest('hex').slice(0, 10);
fs.writeFileSync(S('version.json'), JSON.stringify({ label: LABEL, id, cache }));
fs.writeFileSync(S('sw.js'), `// Service worker (${LABEL}, build ${id}). The page and version.json are NETWORK-FIRST so a new version shows up
// right away; the cached copy is used only when offline. Icons, card pictures and the manifest are cache-first.
const CACHE = '${cache}';
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname.endsWith('version.json');
  if (page) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => {
      if (res.ok && !url.pathname.endsWith('version.json')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
`);
console.log('Built', LABEL, id);
