// Seeded RNG (mulberry32). State is one number, so it can be saved and resumed. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.rng = function (seed) {
  var r = { s: (seed >>> 0) || 1 };
  r.next = function () {
    var t = (r.s = (r.s + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = function (n) { return Math.floor(r.next() * n); };
  return r;
};
LSA.shuffle = function (arr, r) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = r.int(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
};
LSA.hashSeed = function (str) {
  var h = 2166136261 >>> 0;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h || 1;
};
// Tap guard: two taps on the same control within 300 ms count as one.
LSA.tapGuard = function (ms) {
  var last = {}; ms = ms || 300;
  return function (key, now) {
    if (last[key] !== undefined && now - last[key] < ms) return false;
    last[key] = now; return true;
  };
};
