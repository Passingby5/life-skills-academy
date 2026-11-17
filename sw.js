// Service worker (v28 - Nov 16 - 82bb185, build 4bbe6e44). The page and version.json are NETWORK-FIRST so a new version shows up
// right away; the cached copy is used only when offline. Icons, card pictures, KaTeX files and the manifest are cache-first.
const CACHE = 'lsa-bfb9036e65';
const ASSETS = ["./","index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/maskable-192.png","icons/maskable-512.png","icons/apple-touch-icon.png","img/canner-types.svg","img/cbet-ecg.svg","img/cbet-parallel.svg","img/cbet-plug.svg","img/cbet-series.svg","img/chicken-hands.svg","img/compass-declination.svg","img/contour-lines.svg","img/eye-shield.svg","img/fe-beam-mid.svg","img/fe-beam-offset.svg","img/fe-beam-udl.svg","img/fe-cantilever.svg","img/fe-channel.svg","img/fe-column.svg","img/fe-curve.svg","img/fe-footing.svg","img/fe-level.svg","img/fe-mohr.svg","img/fe-pipe.svg","img/fe-retaining.svg","img/fe-soil-phase.svg","img/fe-truss.svg","img/fever-signs.svg","img/goat-check.svg","img/jar-check.svg","img/pressure-dressing.svg","img/skin-pinch.svg","img/tourniquet-placement.svg","img/triage-tags.svg","img/water-treat.svg","img/wound-clean.svg","img/wound-packing.svg","vendor/katex/katex.min.js","vendor/katex/katex.min.css","vendor/katex/fonts/KaTeX_AMS-Regular.woff2","vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2","vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2","vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2","vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2","vendor/katex/fonts/KaTeX_Main-Bold.woff2","vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2","vendor/katex/fonts/KaTeX_Main-Italic.woff2","vendor/katex/fonts/KaTeX_Main-Regular.woff2","vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2","vendor/katex/fonts/KaTeX_Math-Italic.woff2","vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2","vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2","vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2","vendor/katex/fonts/KaTeX_Script-Regular.woff2","vendor/katex/fonts/KaTeX_Size1-Regular.woff2","vendor/katex/fonts/KaTeX_Size2-Regular.woff2","vendor/katex/fonts/KaTeX_Size3-Regular.woff2","vendor/katex/fonts/KaTeX_Size4-Regular.woff2","vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname.endsWith('version.json');
  if (page) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => {
      if (res.ok && !url.pathname.endsWith('version.json')) { const a = res.clone(), b = res.clone(); caches.open(CACHE).then(c => { c.put('index.html', a); c.put('./', b); }); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
