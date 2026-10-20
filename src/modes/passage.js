// Hard Reads round (STREET-SMART-SPEC.md item 1, v20). A round is one passage: the player reads it ('read'), taps
// "I read it", then answers its questions one at a time (3 choices, then a confidence tap, then a fix that quotes
// the paragraph that proves the answer). The passage stays one tap away (peek). The Leitner unit is the question:
// a passage is due when any of its questions is due, and a round asks the passage's due and new questions
// (all of them when none is due yet). Plain data state, no DOM; the round lives in profile.pr.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.PR = {
  // Which passage to play: soonest-due first, then one never seen, then the one due soonest. Ties go to the seeded RNG.
  choose: function (passages, boxes, today, r) {
    var due = [], fresh = [], later = [];
    LSA.shuffle(passages, r).forEach(function (c) {
      var b = c.qs.map(function (q) { return boxes[q.id]; }), seen = b.filter(Boolean);
      var first = seen.length ? Math.min.apply(null, seen.map(function (e) { return e.due; })) : Infinity;
      if (seen.length && (first <= today || seen.length < b.length)) due.push({ c: c, d: seen.length < b.length ? Math.min(first, today) : first });
      else if (!seen.length) fresh.push({ c: c, d: 0 }); else later.push({ c: c, d: first });
    });
    var by = function (a, b) { return a.d - b.d; };
    due.sort(by); later.sort(by);
    return (due[0] || fresh[0] || later[0] || {}).c || null;
  },
  start: function (profile, deckIds, today, seed) {
    var r = LSA.rng(seed), ps = LSA.passagesFor(profile.age, deckIds).filter(function (c) { return LSA.deckAllowed(c.deck, profile); });
    var c = LSA.PR.choose(ps, profile.boxes, today, r);
    if (!c) return { mode: 'pr', pid: null, today: today, q: [], i: 0, stage: 'done', peek: false, wows: [], right: 0 };
    var qs = c.qs.filter(function (q) { var e = profile.boxes[q.id]; return !e || e.due <= today; });
    if (!qs.length) qs = c.qs;
    var q = qs.map(function (x) { return { id: x.id, order: LSA.shuffle([0, 1, 2], r), pick: null, conf: null }; });
    return { mode: 'pr', pid: c.id, today: today, q: q, i: 0, stage: 'read', peek: false, wows: [], right: 0 };
  },
  passage: function (st) { return LSA.cardIndex[st.pid]; },
  cur: function (st) { return st.q[st.i]; },
  question: function (st) { return LSA.cardIndex[st.q[st.i].id]; },
  read: function (st) { if (st.stage === 'read') { st.stage = 'ask'; st.peek = false; } },
  togglePeek: function (st) { if (st.stage !== 'read' && st.stage !== 'done') st.peek = !st.peek; },
  pick: function (st, pos) { if (st.stage !== 'ask') return; st.q[st.i].pick = pos; st.stage = 'conf'; },
  back: function (st) { if (st.stage === 'conf') { st.q[st.i].pick = null; st.stage = 'ask'; } },
  confirm: function (st, profile, conf) {
    if (st.stage !== 'conf') return;
    var it = st.q[st.i], right = it.order[it.pick] === LSA.answerIndex;
    it.conf = conf; it.right = right;
    profile.boxes[it.id] = LSA.grade(profile.boxes[it.id], right, conf, st.today);
    profile.stats.seen++;
    if (right) { st.right++; profile.stats.right++; }
    it.wow = LSA.isWow(right, conf);
    if (it.wow && st.wows.indexOf(it.id) < 0) { st.wows.push(it.id); profile.stats.wows++; }
    st.stage = 'fix'; st.peek = false;
  },
  next: function (st, profile) {
    if (st.stage !== 'fix') return;
    st.i++;
    if (st.i >= st.q.length) { st.stage = 'done'; profile.stats.rounds++; } else st.stage = 'ask';
  }
};
