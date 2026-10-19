// Deck registry, checker and age filter. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.decks = LSA.decks || {};
LSA.deckOrder = LSA.deckOrder || [];
LSA.cardIndex = LSA.cardIndex || {};
LSA.MIN_CARDS = 50;
LSA.MAX_RIGHT_RATIO = 1.3;
LSA.MAX_RIGHT_LONGEST = 0.4;
LSA.WORD_MIN_USES = 10; LSA.WORD_RIGHT_LO = 0.2; LSA.WORD_RIGHT_HI = 0.5; LSA.MAX_STRATEGY = 0.45;
LSA.firstWord = function (x) { return x.split(/[ ,;:]/)[0]; };
// Answer tells. words: first word -> [uses, right]. strat: expected score of simple guessing rules (ties split evenly).
LSA.tellStats = function (cards) {
  var W = {}, st = { longest: 0, shortest: 0, middle: 0, startsNo: 0, noAvoidYesOnly: 0 }, n = 0;
  function share(f) { var idx = [0, 1, 2].filter(f); return idx.length ? (idx.indexOf(1) >= 0 ? 1 / idx.length : 0) : 1 / 3; }
  cards.forEach(function (c) {
    if (!Array.isArray(c.c) || c.c.length !== 3) return; n++;
    var v = c.c, l = v.map(function (x) { return x.length; }), mx = Math.max.apply(null, l), mn = Math.min.apply(null, l);
    v.forEach(function (x, k) { var w = LSA.firstWord(x); W[w] = W[w] || [0, 0]; W[w][0]++; if (k === 1) W[w][1]++; });
    var isNo = function (k) { return /^No\b/.test(v[k]); }, notYO = function (k) { return !/^(Yes|Only)\b/.test(v[k]); };
    st.longest += share(function (k) { return l[k] === mx; }); st.shortest += share(function (k) { return l[k] === mn; });
    var srt = l.slice().sort(function (a, b) { return a - b; });
    st.middle += share(function (k) { return l[k] === srt[1]; });
    st.startsNo += share(isNo);
    st.noAvoidYesOnly += [0, 1, 2].some(isNo) ? share(isNo) : share(notYO);
  });
  Object.keys(st).forEach(function (k) { st[k] = n ? st[k] / n : 0; });
  return { words: W, strat: st };
};
// Share of cards where the right answer is the longest choice (ties count as longest).
LSA.lengthStats = function (d) {
  var n = 0, l = 0;
  d.cards.forEach(function (c) { if (Array.isArray(c.c) && c.c.length === 3) { n++; if (c.c[1].length >= Math.max(c.c[0].length, c.c[2].length)) l++; } });
  return { cards: n, rightLongest: n ? l / n : 0 };
};
LSA.deck = function (d) {
  d.format = d.format || 'gutcheck';
  d.cards.forEach(function (c) { c.deck = d.id; LSA.cardIndex[c.id] = c; });
  if (!LSA.decks[d.id]) LSA.deckOrder.push(d.id);
  LSA.decks[d.id] = d;
  return d;
};
LSA.knowDecks = function () { return LSA.deckOrder.filter(function (id) { return LSA.decks[id].format === 'gutcheck'; }); };
LSA.visible = function (c, age) { return c.ages === 'both' || c.ages === age; };
LSA.cardsFor = function (age, deckIds) {
  var out = [];
  (deckIds || LSA.knowDecks()).forEach(function (id) {
    var d = LSA.decks[id]; if (!d || d.format !== 'gutcheck') return;
    d.cards.forEach(function (c) { if (LSA.visible(c, age)) out.push(c); });
  });
  return out;
};
LSA.scenario = function (c, age) { return typeof c.s === 'string' ? c.s : (c.s[age] || c.s.adult || c.s.ya); };
LSA.answerIndex = 1; // c[1] is always the right choice in the data; the engine shuffles the order shown.
// Returns a list of problems. Empty list means the deck is good.
LSA.checkDeck = function (d) {
  var errs = [], seen = {};
  if (d.format === 'steps') {
    d.cards.forEach(function (c) { if (!c.id || !c.title || !Array.isArray(c.steps) || !c.steps.length) errs.push(d.id + ': bad step card ' + c.id); });
    return errs;
  }
  d.cards.forEach(function (c) {
    var p = d.id + '/' + c.id + ': ';
    ['id', 'deck', 'topic', 'ages', 's', 'c', 'm', 'f', 'w', 'src'].forEach(function (k) { if (!c[k]) errs.push(p + 'missing ' + k); });
    if (seen[c.id]) errs.push(p + 'duplicate id'); seen[c.id] = 1;
    if (['both', 'ya', 'adult'].indexOf(c.ages) < 0) errs.push(p + 'bad ages');
    if (!Array.isArray(c.c) || c.c.length !== 3 || new Set(c.c).size !== 3) errs.push(p + 'needs 3 different choices');
    if (c.s && typeof c.s === 'object' && (!c.s.ya || !c.s.adult)) errs.push(p + 'two-line scenario needs ya and adult');
    if (c.src && !(d.sources && d.sources[c.src])) errs.push(p + 'unknown source ' + c.src);
  });
  // Length must give no clue: the right answer may not be much longer than the others, or the longest too often.
  d.cards.forEach(function (c) {
    if (!Array.isArray(c.c) || c.c.length !== 3) return;
    var r = c.c[1].length, o = Math.max(c.c[0].length, c.c[2].length);
    if (r > LSA.MAX_RIGHT_RATIO * o) errs.push(d.id + '/' + c.id + ': right answer is ' + (r / o).toFixed(2) + 'x the next longest');
  });
  var ls = LSA.lengthStats(d);
  if (ls.rightLongest > LSA.MAX_RIGHT_LONGEST) errs.push(d.id + ': right answer is the longest on ' + Math.round(ls.rightLongest * 100) + '% of cards');
  ['ya', 'adult'].forEach(function (a) {
    var n = d.cards.filter(function (c) { return LSA.visible(c, a); }).length;
    if (n < LSA.MIN_CARDS) errs.push(d.id + ': only ' + n + ' cards for ' + a);
  });
  return errs;
};
LSA.checkAll = function () {
  var errs = [], ids = {}, all = [];
  LSA.knowDecks().forEach(function (id) {
    all = all.concat(LSA.decks[id].cards);
    var t = LSA.tellStats(LSA.decks[id].cards).strat;
    Object.keys(t).forEach(function (k) { if (t[k] > LSA.MAX_STRATEGY) errs.push(id + ': strategy "' + k + '" scores ' + Math.round(t[k] * 100) + '%'); });
  });
  var W = LSA.tellStats(all).words;
  Object.keys(W).forEach(function (w) {
    var u = W[w][0], r = W[w][1] / u;
    if (u >= LSA.WORD_MIN_USES && (r < LSA.WORD_RIGHT_LO || r > LSA.WORD_RIGHT_HI)) errs.push('first word "' + w + '" is right on ' + W[w][1] + ' of ' + u + ' choices');
  });
  LSA.deckOrder.forEach(function (id) {
    errs = errs.concat(LSA.checkDeck(LSA.decks[id]));
    LSA.decks[id].cards.forEach(function (c) { if (ids[c.id] && ids[c.id] !== id) errs.push('id ' + c.id + ' used in ' + ids[c.id] + ' and ' + id); ids[c.id] = id; });
  });
  return errs;
};
