// Versioned save. Text in, text out; the UI decides where it is stored. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.SAVE_V = 2;
LSA.newProfile = function (name, age) { return { name: name || 'Player', age: age === 'ya' ? 'ya' : 'adult', boxes: {}, round: null, stats: { rounds: 0, right: 0, seen: 0, wows: 0 } }; };
LSA.newSave = function () { return { v: LSA.SAVE_V, active: null, next: 1, profiles: {}, decks: null }; };
LSA.addProfile = function (s, name, age) { var id = 'p' + (s.next++); s.profiles[id] = LSA.newProfile(name, age); s.active = id; return id; };
// v1 was one player: { v:1, name, age, boxes, round }
LSA.upgrade = function (o) {
  if (o.v === 1) {
    var s = LSA.newSave(), id = LSA.addProfile(s, o.name, o.age);
    var p = s.profiles[id]; p.boxes = o.boxes || {}; p.round = o.round || null; if (o.stats) p.stats = o.stats;
    o = s;
  }
  return o;
};
// Returns { save, broken } and never throws.
LSA.loadSave = function (text) {
  if (!text) return { save: LSA.newSave(), broken: false };
  try {
    var o = LSA.upgrade(JSON.parse(text));
    if (!o || o.v !== LSA.SAVE_V || typeof o.profiles !== 'object' || !o.profiles) throw new Error('bad save');
    Object.keys(o.profiles).forEach(function (k) {
      var p = o.profiles[k]; if (!p || typeof p.boxes !== 'object') throw new Error('bad profile');
      if (p.age !== 'ya' && p.age !== 'adult') p.age = 'adult';
      p.stats = p.stats || { rounds: 0, right: 0, seen: 0, wows: 0 };
    });
    if (o.active && !o.profiles[o.active]) o.active = null;
    return { save: o, broken: false };
  } catch (e) { return { save: LSA.newSave(), broken: true }; }
};
LSA.dumpSave = function (s) { return JSON.stringify(s); };
