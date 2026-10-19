// Gut Check round. Plain data state, so a round can be saved and resumed. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.GC = {
  start: function (profile, deckIds, today, seed) {
    var r = LSA.rng(seed), cards = LSA.cardsFor(profile.age, deckIds);
    // Cards missed at the very end of the last round come first.
    var carry = (profile.carry || []).map(function (id) { return LSA.cardIndex[id]; }).filter(function (c) { return c && cards.indexOf(c) >= 0; }).slice(0, 10);
    // Keep carried cards whose deck is off right now; they come back when the deck is on again.
    profile.carry = (profile.carry || []).filter(function (id) { return !carry.some(function (c) { return c.id === id; }); });
    var picked = carry.concat(LSA.pickRound(cards.filter(function (c) { return carry.indexOf(c) < 0; }), profile.boxes, today, r, 10 - carry.length));
    picked = LSA.interleave(picked);
    var q = picked.map(function (c) { return { id: c.id, order: LSA.shuffle([0, 1, 2], r), pick: null, conf: null }; });
    return { rs: r.s, today: today, q: q, i: 0, stage: 'ask', again: {}, wows: [], right: 0 };
  },
  cur: function (st) { return st.q[st.i]; },
  card: function (st) { return LSA.cardIndex[st.q[st.i].id]; },
  // Card number for the screen: retries do not count as new cards.
  progress: function (st) {
    var total = 0, k = 0;
    st.q.forEach(function (x, j) { if (!x.again) { total++; if (j <= st.i) k++; } });
    return { n: Math.max(1, k), total: total, retry: !!(st.q[st.i] && st.q[st.i].again) };
  },
  // choice: index into order (position on screen)
  pick: function (st, pos) { if (st.stage !== 'ask') return; st.q[st.i].pick = pos; st.stage = 'conf'; },
  isRight: function (it) { return it.order[it.pick] === LSA.answerIndex; },
  confirm: function (st, profile, conf) {
    if (st.stage !== 'conf') return;
    var it = st.q[st.i], right = LSA.GC.isRight(it); it.conf = conf; it.right = right;
    var old = profile.boxes[it.id];
    // A retry of a card missed this round stays in box 1 for now, even if right and sure.
    profile.boxes[it.id] = it.again ? { b: 1, due: st.today, n: ((old && old.n) || 0) + 1 } : LSA.grade(old, right, conf, st.today);
    profile.stats.seen++;
    if (right) { st.right++; profile.stats.right++; }
    it.wow = LSA.isWow(right, conf);
    if (it.wow && st.wows.indexOf(it.id) < 0) { st.wows.push(it.id); profile.stats.wows++; }
    if (!right && !st.again[it.id]) {
      // Ask it once more later, with at least 2 other cards in between and no topic twice in a row.
      // If the round is too close to its end, it opens the next round instead.
      st.again[it.id] = 1;
      var at = LSA.retrySpot(st.q, st.i, function (id) { return LSA.cardIndex[id].topic; }, it.id);
      if (at < 0) { profile.carry = (profile.carry || []).filter(function (x) { return x !== it.id; }).concat(it.id); st.carried = (st.carried || []).concat(it.id); }
      else {
        var r = LSA.rng(st.rs);
        st.q.splice(at, 0, { id: it.id, order: LSA.shuffle([0, 1, 2], r), pick: null, conf: null, again: true });
        st.rs = r.s;
      }
    }
    st.stage = 'fix';
  },
  next: function (st, profile) {
    if (st.stage !== 'fix') return;
    st.i++;
    if (st.i >= st.q.length) { st.stage = 'done'; profile.stats.rounds++; } else st.stage = 'ask';
  }
};
