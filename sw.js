// Service worker (v20.7 - Oct 20 - 1583ead, build 040af427). The page and version.json are NETWORK-FIRST so a new version shows up
// right away; the cached copy is used only when offline. Icons, card pictures and the manifest are cache-first.
const CACHE = 'lsa-e4b997db81';
const ASSETS = ["./","index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/maskable-192.png","icons/maskable-512.png","icons/apple-touch-icon.png","img/canner-types.svg","img/chicken-hands.svg","img/compass-declination.svg","img/contour-lines.svg","img/eye-shield.svg","img/fever-signs.svg","img/goat-check.svg","img/jar-check.svg","img/pressure-dressing.svg","img/skin-pinch.svg","img/tourniquet-placement.svg","img/triage-tags.svg","img/water-treat.svg","img/wound-clean.svg","img/wound-packing.svg"];
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
