// Versioned save. Text in, text out; the UI decides where it is stored. No DOM.
// Every field is checked deeply. Bad parts are fixed or reset; a save that cannot be used at all starts fresh.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.SAVE_V = 2;
LSA.SCREENS = ['home', 'menu', 'play', 'about', 'match', 'newprof'];
LSA.newStats = function () { return { rounds: 0, right: 0, seen: 0, wows: 0 }; };
LSA.newProfile = function (name, age) { return { name: String(name || 'Player').slice(0, 20), age: age === 'ya' ? 'ya' : 'adult', boxes: {}, round: null, stats: LSA.newStats() }; };
LSA.newSave = function () { return { v: LSA.SAVE_V, active: null, next: 1, profiles: {}, decks: null }; };
LSA.addProfile = function (s, name, age) {
  var id; do { id = 'p' + (s.next++); } while (s.profiles[id]);
  s.profiles[id] = LSA.newProfile(name, age); s.active = id; return id;
};
LSA.deleteProfile = function (s, id) { delete s.profiles[id]; if (s.active === id) s.active = null; };
// v1 was one player: { v:1, name, age, boxes, round }
LSA.upgrade = function (o) {
  if (o && o.v === 1) {
    var s = LSA.newSave(), id = LSA.addProfile(s, o.name, o.age);
    var p = s.profiles[id]; p.boxes = o.boxes || {}; p.round = o.round || null; if (o.stats) p.stats = o.stats;
    o = s;
  }
  return o;
};
function isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
function isInt(x, lo, hi) { return typeof x === 'number' && isFinite(x) && Math.floor(x) === x && x >= lo && x <= hi; }
function known(id) { return typeof id === 'string' && !!(LSA.cardIndex && LSA.cardIndex[id]); }
LSA.checkRound = function (r) {
  if (!isObj(r) || !Array.isArray(r.q) || !r.q.length || !isInt(r.i, 0, r.q.length)) return false;
  if (['ask', 'conf', 'fix', 'done'].indexOf(r.stage) < 0 || (r.stage !== 'done' && r.i >= r.q.length)) return false;
  if (!isInt(r.rs, 0, 4294967295) || typeof r.today !== 'number' || !isFinite(r.today) || !isInt(r.right, 0, 1e6)) return false;
  if (!Array.isArray(r.wows) || !r.wows.every(known) || !isObj(r.again)) return false;
  return r.q.every(function (it) {
    if (!isObj(it) || !known(it.id) || !Array.isArray(it.order) || it.order.slice().sort().join() !== '0,1,2') return false;
    if (it.pick !== null && it.pick !== undefined && !isInt(it.pick, 0, 2)) return false;
    if (it.conf !== null && it.conf !== undefined && !isInt(it.conf, 0, 2)) return false;
    return true;
  });
};
// Returns { save, broken, repaired } and never throws.
LSA.loadSave = function (text) {
  if (!text) return { save: LSA.newSave(), broken: false, repaired: false };
  try {
    var o = LSA.upgrade(JSON.parse(text)), fixed = false;
    if (!isObj(o) || o.v !== LSA.SAVE_V || !isObj(o.profiles)) throw new Error('bad save');
    var s = LSA.newSave(), maxN = 0;
    Object.keys(o.profiles).forEach(function (k) {
      var p = o.profiles[k];
      if (!isObj(p)) { fixed = true; return; }
      var q = LSA.newProfile(typeof p.name === 'string' || typeof p.name === 'number' ? p.name : 'Player', p.age);
      if (q.name !== p.name || q.age !== p.age) fixed = true;
      if (isObj(p.boxes)) Object.keys(p.boxes).forEach(function (id) {
        var e = p.boxes[id];
        if (isObj(e) && isInt(e.b, 1, 5) && typeof e.due === 'number' && isFinite(e.due)) q.boxes[id] = { b: e.b, due: e.due, n: isInt(e.n, 0, 1e9) ? e.n : 1 };
        else fixed = true;
      }); else fixed = true;
      if (p.round !== null && p.round !== undefined) { if (LSA.checkRound(p.round)) q.round = p.round; else fixed = true; }
      if (isObj(p.stats)) Object.keys(q.stats).forEach(function (st) { if (isInt(p.stats[st], 0, 1e9)) q.stats[st] = p.stats[st]; });
      else fixed = true;
      s.profiles[k] = q;
      var m = /^p(\d+)$/.exec(k); if (m) maxN = Math.max(maxN, +m[1]);
    });
    s.next = isInt(o.next, 1, 1e9) && o.next > maxN ? o.next : maxN + 1;
    if (s.next !== o.next) fixed = true;
    s.active = typeof o.active === 'string' && s.profiles[o.active] ? o.active : null;
    if (o.decks !== null && o.decks !== undefined) {
      var ds = Array.isArray(o.decks) ? o.decks.filter(function (d) { return typeof d === 'string' && LSA.decks && LSA.decks[d] && LSA.decks[d].format === 'gutcheck'; }) : [];
      if (ds.length && Array.isArray(o.decks) && ds.length === o.decks.length) s.decks = ds; else { fixed = true; s.decks = ds.length ? ds : null; }
    }
    if (LSA.SCREENS.indexOf(o.screen) >= 0) s.screen = o.screen;
    return { save: s, broken: false, repaired: fixed };
  } catch (e) { return { save: LSA.newSave(), broken: true, repaired: false }; }
};
LSA.dumpSave = function (s) { return JSON.stringify(s); };
