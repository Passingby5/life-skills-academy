// Red Flags round (STREET-SMART-SPEC.md item 2). A set shows a real case and 6 cue tiles; the player taps every red flag,
// taps Done, then says how sure they are. Partial credit: each cue called right (flag tapped or fine left alone) earns
// one point of 6. Leitner (box schedule) counts a set as right only on an exact match. Plain data state, no DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.RF = {
  SIZE: 5,
  start: function (profile, deckIds, today, seed) {
    var r = LSA.rng(seed), sets = LSA.setsFor(profile.age, deckIds);
    var picked = LSA.interleave(LSA.pickRound(sets, profile.boxes, today, r, LSA.RF.SIZE));
    var q = picked.map(function (c) { return { id: c.id, order: LSA.shuffle([0, 1, 2, 3, 4, 5], r), on: [false, false, false, false, false, false], conf: null }; });
    return { mode: 'rf', today: today, q: q, i: 0, stage: q.length ? 'ask' : 'done', wows: [], right: 0, points: 0, max: 0 };
  },
  cur: function (st) { return st.q[st.i]; },
  set: function (st) { return LSA.cardIndex[st.q[st.i].id]; },
  // pos: tile position on screen. Toggles that cue on or off.
  toggle: function (st, pos) { if (st.stage !== 'ask') return; var it = st.q[st.i]; it.on[pos] = !it.on[pos]; },
  done: function (st) { if (st.stage === 'ask') st.stage = 'conf'; },
  back: function (st) { if (st.stage === 'conf') st.stage = 'ask'; },
  // Per cue result in screen order: { cue, picked, ok }.
  marks: function (st, k) {
    var it = st.q[k === undefined ? st.i : k], c = LSA.cardIndex[it.id];
    return it.order.map(function (ci, pos) { var cue = c.cues[ci]; return { cue: cue, picked: it.on[pos], ok: it.on[pos] === cue.flag }; });
  },
  score: function (st, k) { var m = LSA.RF.marks(st, k), n = m.filter(function (x) { return x.ok; }).length; return { n: n, of: m.length, exact: n === m.length }; },
  confirm: function (st, profile, conf) {
    if (st.stage !== 'conf') return;
    var it = st.q[st.i], sc = LSA.RF.score(st); it.conf = conf; it.right = sc.exact; it.pts = sc.n;
    profile.boxes[it.id] = LSA.grade(profile.boxes[it.id], sc.exact, conf, st.today);
    profile.stats.seen++;
    st.points += sc.n; st.max += sc.of;
    if (sc.exact) { st.right++; profile.stats.right++; }
    it.wow = LSA.isWow(sc.exact, conf);
    if (it.wow && st.wows.indexOf(it.id) < 0) { st.wows.push(it.id); profile.stats.wows++; }
    st.stage = 'fix';
  },
  next: function (st, profile) {
    if (st.stage !== 'fix') return;
    st.i++;
    if (st.i >= st.q.length) { st.stage = 'done'; profile.stats.rounds++; } else st.stage = 'ask';
  }
};
