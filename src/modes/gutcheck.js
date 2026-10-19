// Gut Check round. Plain data state, so a round can be saved and resumed. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.GC = {
  start: function (profile, deckIds, today, seed) {
    var r = LSA.rng(seed), cards = LSA.cardsFor(profile.age, deckIds);
    var picked = LSA.pickRound(cards, profile.boxes, today, r, 10);
    var q = picked.map(function (c) { return { id: c.id, order: LSA.shuffle([0, 1, 2], r), pick: null, conf: null }; });
    return { rs: r.s, today: today, q: q, i: 0, stage: 'ask', again: {}, wows: [], right: 0 };
  },
  cur: function (st) { return st.q[st.i]; },
  card: function (st) { return LSA.cardIndex[st.q[st.i].id]; },
  // choice: index into order (position on screen)
  pick: function (st, pos) { if (st.stage !== 'ask') return; st.q[st.i].pick = pos; st.stage = 'conf'; },
  isRight: function (it) { return it.order[it.pick] === LSA.answerIndex; },
  confirm: function (st, profile, conf) {
    if (st.stage !== 'conf') return;
    var it = st.q[st.i], right = LSA.GC.isRight(it); it.conf = conf; it.right = right;
    profile.boxes[it.id] = LSA.grade(profile.boxes[it.id], right, conf, st.today);
    profile.stats.seen++;
    if (right) { st.right++; profile.stats.right++; }
    it.wow = LSA.isWow(right, conf);
    if (it.wow && st.wows.indexOf(it.id) < 0) { st.wows.push(it.id); profile.stats.wows++; }
    if (!right && !st.again[it.id]) {
      // Ask it once more, a few cards later in this round.
      st.again[it.id] = 1;
      var r = LSA.rng(st.rs), at = Math.min(st.q.length, st.i + 3);
      st.q.splice(at, 0, { id: it.id, order: LSA.shuffle([0, 1, 2], r), pick: null, conf: null, again: true });
      st.rs = r.s;
    }
    st.stage = 'fix';
  },
  next: function (st, profile) {
    if (st.stage !== 'fix') return;
    st.i++;
    if (st.i >= st.q.length) { st.stage = 'done'; profile.stats.rounds++; } else st.stage = 'ask';
  }
};
