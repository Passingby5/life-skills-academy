// Deck registry, checker and age filter. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.decks = LSA.decks || {};
LSA.deckOrder = LSA.deckOrder || [];
LSA.cardIndex = LSA.cardIndex || {};
LSA.MIN_CARDS = 50;
LSA.MAX_RIGHT_RATIO = 1.3;
LSA.MAX_RIGHT_LONGEST = 0.4;
LSA.WORD_MIN_USES = 10; LSA.WORD_RIGHT_LO = 0.2; LSA.WORD_RIGHT_HI = 0.5; LSA.MAX_STRATEGY = 0.45;
// Tell limits. Every deck must keep each guessing rule and the surface classifier (tools/tellgate.js) at or under 45%.
// The only exceptions are the 4 decks frozen in v6 (content hash-locked in tools/frozen-decks.json). Each exception is
// that deck's score at the freeze, so it can not get worse, and a frozen deck still fails on any other rule.
// No other deck may be listed here; the unit test enforces that.
LSA.FROZEN_DECKS = ['firstaid', 'kitchen', 'money', 'scams'];
LSA.TELL_EXCEPTIONS = {
  firstaid: { classifier: 0.482 },
  kitchen: { classifier: 0.462 },
  money: { leastOverlap: 0.453 },
  scams: { classifier: 0.494, negation: 0.453 }
};
// All decks pooled, frozen ones included. The non-frozen decks pooled must stay at 45%.
LSA.TELL_POOLED_ALL = 0.47;
LSA.tellLimit = function (id, k) { var e = LSA.FROZEN_DECKS.indexOf(id) >= 0 && LSA.TELL_EXCEPTIONS[id]; return e && e[k] !== undefined ? Math.max(LSA.MAX_STRATEGY, e[k]) : LSA.MAX_STRATEGY; };
LSA.firstWord = function (x) { return x.split(/[ ,;:]/)[0]; };
// Answer tells. words: first word -> [uses, right]. strat: expected score of simple guessing rules (ties split evenly).
// Deck sections, in picker order. A deck without a section is Everyday.
LSA.SECTIONS = ['Everyday', 'Health and Safety', 'Tactical Field Care', 'Field Survival', 'Country Living', 'Big Debates'];
// Short intro shown at the top of a section in the picker.
LSA.SECTION_NOTES = { 'Big Debates': 'Facts only. On faith and moral questions we show what each side teaches, not who is right.' };
LSA.sectionsOf = function (ids) {
  var names = LSA.SECTIONS.slice();
  ids.forEach(function (id) { var s = LSA.decks[id].section; if (names.indexOf(s) < 0) names.push(s); });
  return names.map(function (n) { return { name: n, ids: ids.filter(function (id) { return LSA.decks[id].section === n; }) }; }).filter(function (g) { return g.ids.length; });
};
// Optional card picture: img is a path to an SVG under img/. imgAlt is optional alt text.
LSA.IMG_RX = /^img\/[a-z0-9][a-z0-9-]*\.svg$/;
LSA.imgAlt = function (c) { return c.imgAlt || ('Picture for this card about ' + String(c.topic || 'this topic').replace(/-/g, ' ')); };
LSA.RX_NEG = /\b(not|never|no|don't|do not|isn't|can't|won't|none)\b/i;
LSA.RX_HEDGE = /\b(usually|always|only|never|all|every|just|maybe|might|can)\b/i;
LSA.tellStats = function (cards) {
  var W = {}, st = { longest: 0, shortest: 0, middle: 0, startsNo: 0, noAvoidYesOnly: 0, negation: 0, number: 0, punct: 0, mostWords: 0, fewestWords: 0, middleWords: 0, avoidHedge: 0, mostOverlap: 0, leastOverlap: 0, oddFirstWord: 0 }, n = 0;
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
    st.negation += share(function (k) { return LSA.RX_NEG.test(v[k]); });
    st.number += share(function (k) { return /\d/.test(v[k]); });
    st.punct += share(function (k) { return /[,;]/.test(v[k]); });
    st.noAvoidYesOnly += [0, 1, 2].some(isNo) ? share(isNo) : share(notYO);
    // Word-count, hedge-word, scenario-overlap and odd-first-word guessers (from the QA script).
    var wc = v.map(function (x) { return x.split(/\s+/).length; }), ws = wc.slice().sort(function (a, b) { return a - b; });
    st.mostWords += share(function (k) { return wc[k] === ws[2]; }); st.fewestWords += share(function (k) { return wc[k] === ws[0]; });
    st.middleWords += share(function (k) { return wc[k] === ws[1]; });
    st.avoidHedge += share(function (k) { return !LSA.RX_HEDGE.test(v[k]); });
    var sw = {}; (typeof c.s === 'string' ? c.s : (c.s && (c.s.adult || c.s.ya)) || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(' ').forEach(function (x) { if (x) sw[x] = 1; });
    var ov = v.map(function (x) { var seen = {}, n = 0; x.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(' ').forEach(function (y) { if (y && sw[y] && !seen[y]) { seen[y] = 1; n++; } }); return n; });
    var omx = Math.max.apply(null, ov), omn = Math.min.apply(null, ov);
    st.mostOverlap += share(function (k) { return ov[k] === omx; }); st.leastOverlap += share(function (k) { return ov[k] === omn; });
    var fw = v.map(function (x) { return LSA.firstWord(x).toLowerCase(); });
    st.oddFirstWord += share(function (k) { return fw.filter(function (y) { return y === fw[k]; }).length === 1 && fw[0] + fw[1] + fw[2] && new Set(fw).size === 2; });
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
  d.section = d.section || 'Everyday';
  d.cards.forEach(function (c) { c.deck = d.id; LSA.cardIndex[c.id] = c; });
  if (!LSA.decks[d.id]) LSA.deckOrder.push(d.id);
  LSA.decks[d.id] = d;
  return d;
};
// Decks that are on for a new save: the Everyday section. Every player can turn the others on in the picker.
LSA.defaultDecks = function () { return LSA.knowDecks().filter(function (id) { return LSA.decks[id].section === 'Everyday'; }); };
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
    if (c.img !== undefined && !(typeof c.img === 'string' && LSA.IMG_RX.test(c.img))) errs.push(p + 'img must be a path like img/name.svg');
    if (c.imgAlt !== undefined && !(typeof c.imgAlt === 'string' && c.imgAlt.trim())) errs.push(p + 'imgAlt must be text');
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
    Object.keys(t).forEach(function (k) { if (t[k] > LSA.tellLimit(id, k)) errs.push(id + ': strategy "' + k + '" scores ' + Math.round(t[k] * 100) + '%'); });
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
