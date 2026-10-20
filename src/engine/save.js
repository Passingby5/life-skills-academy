// Versioned save. Text in, text out; the UI decides where it is stored. No DOM.
// Every field is checked deeply. Bad parts are fixed or reset; a save that cannot be used at all starts fresh.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.SAVE_V = 2;
LSA.SCREENS = ['home', 'menu', 'play', 'about', 'match', 'newprof', 'rf', 'pr', 'parent', 'swpin'];
LSA.newStats = function () { return { rounds: 0, right: 0, seen: 0, wows: 0 }; };
LSA.newProfile = function (name, age) { return { name: String(name || 'Player').slice(0, 20), age: age === 'ya' ? 'ya' : 'adult', boxes: {}, round: null, rf: null, pr: null, carry: [], stats: LSA.newStats() }; };
LSA.newSave = function () { return { v: LSA.SAVE_V, active: null, next: 1, profiles: {}, decks: null, parent: null }; };
LSA.addProfile = function (s, name, age) {
  var id; do { id = 'p' + (s.next++); } while (s.profiles[id]);
  s.profiles[id] = LSA.newProfile(name, age); s.active = id;
  if (!s.parent || !s.profiles[s.parent]) s.parent = id; // v20.4 M1: the first profile made on the device is the parent
  return id;
};
// v20.4 M1: the parent is the earliest-created Adult profile, or else the earliest profile (ids are p1, p2, ... in order).
LSA.pickParent = function (s) {
  var n = function (k) { var m = /^p(\d+)$/.exec(k); return m ? +m[1] : 1e9; };
  var ids = Object.keys(s.profiles).sort(function (a, b) { return n(a) - n(b); });
  var ad = ids.filter(function (k) { return s.profiles[k].age === 'adult'; });
  return ad[0] || ids[0] || null;
};
LSA.isParent = function (s, id) { return !!id && s.parent === id; };
LSA.deleteProfile = function (s, id) { delete s.profiles[id]; if (s.active === id) s.active = null; if (s.parent === id) s.parent = LSA.pickParent(s); };
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
// v14: a Red Flags round is kept apart from the Gut Check round (profile.rf). Same rules, 6 cue tiles per set.
LSA.checkRfRound = function (r) {
  if (!isObj(r) || r.mode !== 'rf' || !Array.isArray(r.q) || !r.q.length || !isInt(r.i, 0, r.q.length)) return false;
  if (['ask', 'conf', 'fix', 'done'].indexOf(r.stage) < 0 || (r.stage !== 'done' && r.i >= r.q.length)) return false;
  if (typeof r.today !== 'number' || !isFinite(r.today) || !isInt(r.right, 0, 1e6) || !isInt(r.points, 0, 1e6) || !isInt(r.max, 0, 1e6)) return false;
  if (!Array.isArray(r.wows) || !r.wows.every(known)) return false;
  return r.q.every(function (it) {
    if (!isObj(it) || !known(it.id) || !Array.isArray(it.order) || it.order.slice().sort().join() !== '0,1,2,3,4,5') return false;
    if (!Array.isArray(it.on) || it.on.length !== 6 || !it.on.every(function (x) { return typeof x === 'boolean'; })) return false;
    if (it.conf !== null && it.conf !== undefined && !isInt(it.conf, 0, 2)) return false;
    return true;
  });
};
// v20: a Hard Reads round (profile.pr) is one passage and its questions, each with 3 shuffled choices.
LSA.checkPrRound = function (r) {
  if (!isObj(r) || r.mode !== 'pr' || !Array.isArray(r.q) || !r.q.length || !isInt(r.i, 0, r.q.length)) return false;
  if (['read', 'ask', 'conf', 'fix', 'done'].indexOf(r.stage) < 0 || (r.stage !== 'done' && r.i >= r.q.length)) return false;
  var c = typeof r.pid === 'string' && LSA.cardIndex[r.pid];
  if (!c || !Array.isArray(c.qs) || typeof r.peek !== 'boolean') return false;
  if (typeof r.today !== 'number' || !isFinite(r.today) || !isInt(r.right, 0, 1e6) || !Array.isArray(r.wows) || !r.wows.every(known)) return false;
  return r.q.every(function (it) {
    if (!isObj(it) || !known(it.id) || LSA.cardIndex[it.id].p !== r.pid || !Array.isArray(it.order) || it.order.slice().sort().join() !== '0,1,2') return false;
    if (it.pick !== null && it.pick !== undefined && !isInt(it.pick, 0, 2)) return false;
    if (it.conf !== null && it.conf !== undefined && !isInt(it.conf, 0, 2)) return false;
    return true;
  }) && (r.stage !== 'conf' || isInt(r.q[r.i].pick, 0, 2));
};
// v9: cards cut in a later version leave their ids behind. Drop only those ids from a saved round and keep the rest.
// If the current card was cut, the next card becomes current, fresh (stage 'ask'). Returns true if anything changed.
LSA.pruneRound = function (r) {
  if (!isObj(r) || !Array.isArray(r.q)) return false;
  var ch = false, i0 = isInt(r.i, 0, r.q.length) ? r.i : 0, i = i0, q = [];
  r.q.forEach(function (it, j) {
    if (isObj(it) && typeof it.id === 'string' && !known(it.id)) { ch = true; if (j < i0) i--; else if (j === i0 && r.stage !== 'done') { r.stage = 'ask'; } return; }
    q.push(it);
  });
  if (!ch && !(Array.isArray(r.wows) && !r.wows.every(known))) return false;
  r.q = q; r.i = Math.min(i, q.length);
  if (r.stage !== 'done' && r.i >= q.length) r.stage = 'done';
  if (r.stage === 'ask' && q[r.i]) { q[r.i].pick = null; q[r.i].conf = null; }
  if (Array.isArray(r.wows)) r.wows = r.wows.filter(known);
  if (isObj(r.again)) Object.keys(r.again).forEach(function (k) { if (!known(k)) delete r.again[k]; });
  return true;
};
// Returns { save, broken, repaired, pruned } and never throws. pruned: only retired card ids were dropped (nothing was reset).
LSA.loadSave = function (text) {
  if (!text) return { save: LSA.newSave(), broken: false, repaired: false };
  try {
    var o = LSA.upgrade(JSON.parse(text)), fixed = false, pruned = false;
    if (!isObj(o) || o.v !== LSA.SAVE_V || !isObj(o.profiles)) throw new Error('bad save');
    var s = LSA.newSave(), maxN = 0;
    Object.keys(o.profiles).forEach(function (k) {
      var p = o.profiles[k];
      if (!isObj(p)) { fixed = true; return; }
      var q = LSA.newProfile(typeof p.name === 'string' || typeof p.name === 'number' ? p.name : 'Player', p.age);
      if (q.name !== p.name || q.age !== p.age) fixed = true;
      if (isObj(p.boxes)) Object.keys(p.boxes).forEach(function (id) {
        var e = p.boxes[id];
        if (!known(id)) { pruned = true; return; } // v9: forget boxes for cards that no longer exist
        if (isObj(e) && isInt(e.b, 1, 5) && typeof e.due === 'number' && isFinite(e.due)) q.boxes[id] = { b: e.b, due: e.due, n: isInt(e.n, 0, 1e9) ? e.n : 1 };
        else fixed = true;
      }); else fixed = true;
      if (p.round !== null && p.round !== undefined) { if (LSA.pruneRound(p.round)) pruned = true; if (p.round.q && !p.round.q.length) p.round = null; }
      if (p.round !== null && p.round !== undefined) { if (LSA.checkRound(p.round)) q.round = p.round; else fixed = true; }
      if (p.rf !== null && p.rf !== undefined) {
        // A Red Flags round with a cut set is simply dropped (it is at most 5 sets); the boxes are kept.
        if (isObj(p.rf) && Array.isArray(p.rf.q) && p.rf.q.some(function (it) { return isObj(it) && typeof it.id === 'string' && !known(it.id); })) pruned = true;
        else if (LSA.checkRfRound(p.rf)) q.rf = p.rf; else fixed = true;
      }
      if (p.pr !== null && p.pr !== undefined) {
        // A Hard Reads round whose passage or a question was cut is dropped (it is one passage); the boxes are kept.
        if (isObj(p.pr) && ((typeof p.pr.pid === 'string' && !known(p.pr.pid)) || (Array.isArray(p.pr.q) && p.pr.q.some(function (it) { return isObj(it) && typeof it.id === 'string' && !known(it.id); })))) pruned = true;
        else if (LSA.checkPrRound(p.pr)) q.pr = p.pr; else fixed = true;
      }
      if (Array.isArray(p.carry)) { q.carry = p.carry.filter(known).slice(0, 10); if (q.carry.length !== p.carry.length) pruned = true; } else if (p.carry !== undefined) fixed = true;
      if (isObj(p.stats)) Object.keys(q.stats).forEach(function (st) { if (isInt(p.stats[st], 0, 1e9)) q.stats[st] = p.stats[st]; });
      else fixed = true;
      // v18: decks a parent PIN unlocked on this profile (adult-rated decks for a young adult).
      if (Array.isArray(p.unlock)) { var ul = p.unlock.filter(function (d) { return typeof d === 'string' && LSA.decks && LSA.decks[d]; }); if (ul.length) q.unlock = ul; if (ul.length !== p.unlock.length) fixed = true; } else if (p.unlock !== undefined) fixed = true;
      // v19: age filter on load. A hand-edited save cannot put a card this profile may not see (wrong age, or an
      // adult-rated deck that is not unlocked) in front of it; such a round is dropped, the boxes are kept.
      ['round', 'rf', 'pr'].forEach(function (rk) {
        var r = q[rk]; if (!r || !Array.isArray(r.q)) return;
        var bad = r.q.some(function (it) { var c = LSA.cardIndex && LSA.cardIndex[it && it.id]; return c && (!LSA.visible(c, q.age) || !LSA.deckAllowed(c.deck, q)); });
        if (bad) { q[rk] = null; fixed = true; }
      });
      s.profiles[k] = q;
      var m = /^p(\d+)$/.exec(k); if (m) maxN = Math.max(maxN, +m[1]);
    });
    s.next = isInt(o.next, 1, 1e9) && o.next > maxN ? o.next : maxN + 1;
    if (s.next !== o.next) fixed = true;
    s.active = typeof o.active === 'string' && s.profiles[o.active] ? o.active : null;
    if (o.decks !== null && o.decks !== undefined) {
      var ds = Array.isArray(o.decks) ? o.decks.filter(function (d) { return typeof d === 'string' && LSA.decks && LSA.decks[d] && ['gutcheck', 'redflags', 'passage'].indexOf(LSA.decks[d].format) >= 0; }) : [];
      if (ds.length && Array.isArray(o.decks) && ds.length === o.decks.length) s.decks = ds; else { fixed = true; s.decks = ds.length ? ds : null; }
    }
    if (typeof o.pin === 'string' && /^h[0-9a-z]{1,8}$/.test(o.pin)) s.pin = o.pin; else if (o.pin !== undefined && o.pin !== null) fixed = true;
    // v20.4 M1: keep a valid stored parent; older saves get the earliest Adult profile, or else the first profile.
    if (typeof o.parent === 'string' && s.profiles[o.parent]) s.parent = o.parent; else { s.parent = LSA.pickParent(s); if (o.parent !== undefined && o.parent !== null) fixed = true; }
    if (LSA.SCREENS.indexOf(o.screen) >= 0) s.screen = o.screen;
    return { save: s, broken: false, repaired: fixed, pruned: pruned };
  } catch (e) { return { save: LSA.newSave(), broken: true, repaired: false }; }
};
LSA.dumpSave = function (s) { return JSON.stringify(s); };
