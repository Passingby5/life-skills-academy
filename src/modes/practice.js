// Engineer Practice round. 4 shuffled choices, Leitner + confidence, 10 questions. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.PRACTICE_N = 4; // choices per question; c[1] is the right answer in the data
LSA.practiceDecks = function () { return LSA.deckOrder.filter(function (id) { return LSA.decks[id].format === 'practice'; }); };
LSA.practiceCardsFor = function (age, deckIds) {
  var out = [];
  (deckIds || LSA.practiceDecks()).forEach(function (id) {
    var d = LSA.decks[id]; if (!d || d.format !== 'practice') return;
    d.cards.forEach(function (c) { if (LSA.visible(c, age)) out.push(c); });
  });
  return out;
};
LSA.EP = {
  start: function (profile, deckIds, today, seed) {
    var r = LSA.rng(seed), cards = LSA.practiceCardsFor(profile.age, deckIds).filter(function (c) { return LSA.deckAllowed(c.deck, profile); });
    var carry = (profile.epCarry || []).map(function (id) { return LSA.cardIndex[id]; }).filter(function (c) { return c && cards.indexOf(c) >= 0; }).slice(0, 10);
    profile.epCarry = (profile.epCarry || []).filter(function (id) { return !carry.some(function (c) { return c.id === id; }); });
    var picked = carry.concat(LSA.pickRound(cards.filter(function (c) { return carry.indexOf(c) < 0; }), profile.boxes, today, r, 10 - carry.length));
    picked = LSA.interleave(picked);
    var q = picked.map(function (c) { return { id: c.id, order: LSA.shuffle([0, 1, 2, 3], r), pick: null, conf: null }; });
    return { mode: 'ep', rs: r.s, today: today, q: q, i: 0, stage: q.length ? 'ask' : 'done', again: {}, wows: [], right: 0 };
  },
  cur: function (st) { return st.q[st.i]; },
  card: function (st) { return LSA.cardIndex[st.q[st.i].id]; },
  progress: function (st) {
    var total = 0, k = 0;
    st.q.forEach(function (x, j) { if (!x.again) { total++; if (j <= st.i) k++; } });
    return { n: Math.max(1, k), total: total, retry: !!(st.q[st.i] && st.q[st.i].again) };
  },
  pick: function (st, pos) { if (st.stage !== 'ask') return; st.q[st.i].pick = pos; st.stage = 'conf'; },
  isRight: function (it) { return it.order[it.pick] === LSA.answerIndex; },
  confirm: function (st, profile, conf) {
    if (st.stage !== 'conf') return;
    var it = st.q[st.i], right = LSA.EP.isRight(it); it.conf = conf; it.right = right;
    var old = profile.boxes[it.id];
    profile.boxes[it.id] = it.again ? { b: 1, due: st.today, n: ((old && old.n) || 0) + 1 } : LSA.grade(old, right, conf, st.today);
    profile.stats.seen++;
    if (right) { st.right++; profile.stats.right++; }
    it.wow = LSA.isWow(right, conf);
    if (it.wow && st.wows.indexOf(it.id) < 0) { st.wows.push(it.id); profile.stats.wows++; }
    if (!right && !st.again[it.id]) {
      st.again[it.id] = 1;
      var at = LSA.retrySpot(st.q, st.i, function (id) { return LSA.cardIndex[id].topic; }, it.id);
      if (at < 0) { profile.epCarry = (profile.epCarry || []).filter(function (x) { return x !== it.id; }).concat(it.id); st.carried = (st.carried || []).concat(it.id); }
      else {
        var r = LSA.rng(st.rs);
        st.q.splice(at, 0, { id: it.id, order: LSA.shuffle([0, 1, 2, 3], r), pick: null, conf: null, again: true });
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
