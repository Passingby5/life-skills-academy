// Leitner boxes. 5 boxes, gaps 0/1/3/7/14 days. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.GAPS = [0, 1, 3, 7, 14];
LSA.CONF = ['Guess', 'Pretty sure', 'Sure'];
// conf: 0 Guess, 1 Pretty sure, 2 Sure. Returns the new entry.
LSA.grade = function (entry, right, conf, today) {
  var b = entry ? entry.b : 1;
  if (!right) b = 1;
  else if (conf >= 1) b = Math.min(5, b + 1);
  return { b: b, due: today + LSA.GAPS[b - 1], n: ((entry && entry.n) || 0) + 1 };
};
LSA.isWow = function (right, conf) { return !right && conf === 2; };
// Pick up to n cards: due first, then new. Then order so no two in a row share a topic when it can be helped.
LSA.pickRound = function (cards, boxes, today, r, n) {
  n = n || 10;
  var due = [], fresh = [];
  LSA.shuffle(cards, r).forEach(function (c) {
    var e = boxes[c.id];
    if (!e) fresh.push(c); else if (e.due <= today) due.push(c);
  });
  due.sort(function (a, b) { return boxes[a.id].due - boxes[b.id].due; });
  var nd = Math.min(n, due.length);
  return LSA.interleave(due.slice(0, nd).concat(fresh.slice(0, n - nd)));
};
LSA.interleave = function (list, prevTopic) {
  // Keep the given order where we can (due cards first), but never put the same topic twice in a row
  // unless only that topic is left. If one topic would run out of room, place it now.
  var rest = list.slice(), out = [];
  while (rest.length) {
    var prev = out.length ? out[out.length - 1].topic : (prevTopic || null), counts = {}, top = null;
    rest.forEach(function (c) { counts[c.topic] = (counts[c.topic] || 0) + 1; if (top === null || counts[c.topic] > counts[top]) top = c.topic; });
    var k = -1;
    if (top !== prev && counts[top] * 2 >= rest.length + 1) k = rest.findIndex(function (c) { return c.topic === top; });
    if (k < 0) k = rest.findIndex(function (c) { return c.topic !== prev; });
    if (k < 0) k = 0;
    out.push(rest.splice(k, 1)[0]);
  }
  return out;
};
// Where to put a retry card: a few cards later, at a spot where its neighbors have other topics if we can.
LSA.retrySpot = function (q, i, topicOf, id) {
  var t = topicOf(id);
  for (var at = Math.min(q.length, i + 3); at <= q.length; at++) {
    var before = q[at - 1] ? topicOf(q[at - 1].id) : null, after = q[at] ? topicOf(q[at].id) : null;
    if (at > i + 1 && before !== t && after !== t) return at;
  }
  for (at = i + 2; at <= q.length; at++) { before = topicOf(q[at - 1].id); after = q[at] ? topicOf(q[at].id) : null; if (before !== t && after !== t) return at; }
  return q.length;
};
