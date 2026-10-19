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
  return LSA.interleave(due.slice(0, nd)).concat(LSA.interleave(fresh.slice(0, n - nd)));
};
LSA.interleave = function (list) {
  var rest = list.slice(), out = [];
  while (rest.length) {
    var prev = out.length ? out[out.length - 1].topic : null, k = 0;
    // Look ahead: pick the first card whose topic differs, preferring the topic with the most left.
    var counts = {}; rest.forEach(function (c) { counts[c.topic] = (counts[c.topic] || 0) + 1; });
    var best = -1;
    for (var i = 0; i < rest.length; i++) {
      if (rest[i].topic === prev) continue;
      if (best < 0 || counts[rest[i].topic] > counts[rest[best].topic]) best = i;
    }
    k = best < 0 ? 0 : best;
    out.push(rest.splice(k, 1)[0]);
  }
  return out;
};
