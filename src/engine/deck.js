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
LSA.SECTIONS = ['Everyday', 'Health and Safety', 'Tactical Field Care', 'Field Survival', 'Country Living', 'Big Debates', 'Street Smart'];
// Short intro shown at the top of a section in the picker.
LSA.SECTION_NOTES = { 'Big Debates': 'Facts only. On faith and moral questions we show what each side teaches, not who is right.', 'Street Smart': 'Real cases and real laws. Learn to spot the trap and get out safe. Every card cites its source.' };
// Street Smart rules (STREET-SMART-SPEC.md). Every card cites a law, case or account; 'none' cards (no safe choice was left)
// stay a small minority so they are not a tell; banned words keep it recognition and defense only, never gore or how-to.
LSA.STREET = 'Street Smart'; LSA.MAX_NONE_SHARE = 0.15; LSA.MAX_ABS_SOLO = 0.15;
LSA.RX_ABS = /\b(always|never|nothing|any|all|ever|only|whatsoever)\b/i;
LSA.RX_BANNED = /\b(gore|gory|disembowel|decapitat\w*|dismember\w*|how to (make|build|cook|spike|stalk|launder)|step[- ]by[- ]step (attack|bomb))\b/i;
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
// Red Flags decks (multi-select cue sets). They show in the picker next to Gut Check decks but play in their own mode.
LSA.flagDecks = function () { return LSA.deckOrder.filter(function (id) { return LSA.decks[id].format === 'redflags'; }); };
LSA.pickerDecks = function () { return LSA.deckOrder.filter(function (id) { var f = LSA.decks[id].format; return f === 'gutcheck' || f === 'redflags'; }); };
LSA.setsFor = function (age, deckIds) {
  var out = [];
  (deckIds || LSA.flagDecks()).forEach(function (id) { var d = LSA.decks[id]; if (d && d.format === 'redflags') d.cards.forEach(function (c) { if (LSA.visible(c, age)) out.push(c); }); });
  return out;
};
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
  if (d.format === 'redflags') return LSA.checkFlagDeck(d);
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
    if (d.section === LSA.STREET) {
      if (!c.cite || typeof c.cite !== 'string') errs.push(p + 'Street Smart card needs a cite');
      if (c.kind !== undefined && c.kind !== 'none') errs.push(p + 'bad kind');
      if (c.kind === 'none' && !/^None of these\b/.test(c.c && c.c[1] || '')) errs.push(p + 'a none card must have "None of these..." as its right choice');
      if (LSA.RX_BANNED.test([c.s && (c.s.ya || c.s), c.s && c.s.adult, c.f, c.w, c.m].concat(c.c || []).join(' '))) errs.push(p + 'banned word (gore or how-to)');
    }
    if (c.also !== undefined && !(Array.isArray(c.also) && c.also.length && c.also.every(function (k) { return k !== c.src && d.sources && d.sources[k]; }))) errs.push(p + 'also must list other known sources');
  });
  // Length must give no clue: the right answer may not be much longer than the others, or the longest too often.
  d.cards.forEach(function (c) {
    if (!Array.isArray(c.c) || c.c.length !== 3) return;
    var r = c.c[1].length, o = Math.max(c.c[0].length, c.c[2].length);
    if (r > LSA.MAX_RIGHT_RATIO * o) errs.push(d.id + '/' + c.id + ': right answer is ' + (r / o).toFixed(2) + 'x the next longest');
  });
  if (d.section === LSA.STREET) {
    if (!d.notice && d.needNotice !== false) errs.push(d.id + ': Street Smart deck needs a notice line');
    if (['teen', 'adult'].indexOf(d.rating) < 0) errs.push(d.id + ': rating must be teen or adult');
    var nn = d.cards.filter(function (c) { return c.kind === 'none'; }).length;
    if (nn / d.cards.length > LSA.MAX_NONE_SHARE) errs.push(d.id + ': "none" cards are ' + Math.round(100 * nn / d.cards.length) + '% (max 15%)');
    // A "None of these" choice must also show up as a wrong choice, so it is never a sure tell.
    var nw = d.cards.filter(function (c) { return c.kind !== 'none' && (c.c || []).some(function (x, k) { return k !== 1 && /^None of these\b/.test(x); }); }).length;
    if (nn && nw < nn) errs.push(d.id + ': "None of these" is right on ' + nn + ' cards but a wrong choice on only ' + nw);
    // Absolute words (QA v13 m4): myths love "always" and "never", so they must not mark the wrong choices. Wrong choices with
    // one may be at most 3x the right ones (or 3), and cards solvable by dropping the lone absolute-worded choice stay at or under 15%.
    var ab = d.cards.filter(function (c) { return Array.isArray(c.c) && c.c.length === 3; }), hasA = function (x) { return LSA.RX_ABS.test(x); };
    var ar = ab.filter(function (c) { return hasA(c.c[1]); }).length, aw = ab.filter(function (c) { return hasA(c.c[0]) || hasA(c.c[2]); }).length;
    var solo = ab.filter(function (c) { return !hasA(c.c[1]) && c.c.filter(hasA).length === 1; }).length;
    if (ab.length && aw > Math.max(3, 3 * ar)) errs.push(d.id + ': absolute words are in ' + aw + ' wrong choices but only ' + ar + ' right ones');
    if (ab.length && solo / ab.length > LSA.MAX_ABS_SOLO) errs.push(d.id + ': ' + solo + ' cards can be solved by dropping the lone absolute-worded choice (max ' + Math.round(LSA.MAX_ABS_SOLO * 100) + '%)');
  }
  var ls = LSA.lengthStats(d);
  if (ls.rightLongest > LSA.MAX_RIGHT_LONGEST) errs.push(d.id + ': right answer is the longest on ' + Math.round(ls.rightLongest * 100) + '% of cards');
  ['ya', 'adult'].forEach(function (a) {
    var n = d.cards.filter(function (c) { return LSA.visible(c, a); }).length;
    if (n < LSA.MIN_CARDS) errs.push(d.id + ': only ' + n + ' cards for ' + a);
  });
  return errs;
};
// Red Flags checker. Each set: 6 cues, 2 to 4 flags, a why on every cue, doThis, a cite and a known source.
// Tells: no flag count on over half the sets; flag cues not over 1.2x longer than fine cues on average; and the
// first-word, punctuation and keyword guessers (tools/cuetell.js logic, leave-one-set-out) stay at or under 45% lift.
LSA.CUE_MAX_LIFT = 0.45; LSA.CUE_LEN_RATIO = 1.2; LSA.CUE_MAX_COUNT_SHARE = 0.5;
LSA.cueWords = function (t) { return t.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(' ').filter(function (w) { return w.length > 2; }); };
// Lift over the base rate: 0 means no better than always guessing the more common label, 1 means perfect.
LSA.cueQuoted = function (t) { return /["\u201c\u201d\u2018]|(^|[\s(])'|'([\s.,;:!?)]|$)/.test(t); };
LSA.cueTells = function (cards) {
  var all = [], base = 0;
  cards.forEach(function (c, si) { (c.cues || []).forEach(function (q) { all.push({ si: si, t: q.t, flag: !!q.flag }); if (q.flag) base++; }); });
  var n = all.length; if (!n) return {};
  var bp = Math.max(base, n - base) / n;
  function lift(acc) { return bp >= 1 ? 0 : Math.max(0, (acc - bp) / (1 - bp)); }
  function feat(name, f) {
    // Per set held out: learn flag rate per feature value from the other sets, guess the majority.
    var ok = 0;
    all.forEach(function (x) {
      var v = f(x.t), a = 0, b = 0;
      all.forEach(function (y) { if (y.si !== x.si && f(y.t) === v) { if (y.flag) a++; else b++; } });
      var g = a + b ? a > b : base * 2 > n; if (g === x.flag) ok++;
    });
    return lift(ok / n);
  }
  function words() {
    // Naive Bayes on words, leave one set out.
    var ok = 0, sets = {};
    all.forEach(function (x) { sets[x.si] = 1; });
    Object.keys(sets).forEach(function (si) {
      var cf = {}, cn = {}, nf = 0, nn = 0, tf = 0, tn = 0, V = {};
      all.forEach(function (y) { if (String(y.si) === si) return; LSA.cueWords(y.t).forEach(function (w) { V[w] = 1; if (y.flag) { cf[w] = (cf[w] || 0) + 1; tf++; } else { cn[w] = (cn[w] || 0) + 1; tn++; } }); if (y.flag) nf++; else nn++; });
      var v = Object.keys(V).length;
      all.forEach(function (x) {
        if (String(x.si) !== si) return;
        var sf = Math.log(nf / (nf + nn)), sn = Math.log(nn / (nf + nn));
        LSA.cueWords(x.t).forEach(function (w) { if (!V[w]) return; sf += Math.log(((cf[w] || 0) + 1) / (tf + v)); sn += Math.log(((cn[w] || 0) + 1) / (tn + v)); });
        if ((sf > sn) === x.flag) ok++;
      });
    });
    return lift(ok / n);
  }
  return {
    firstWord: feat('firstWord', function (t) { return LSA.firstWord(t).toLowerCase(); }),
    punct: feat('punct', function (t) { return (/[,;:"']/.test(t) ? 'p' : '') + (/\d/.test(t) ? 'd' : ''); }),
    quote: feat('quote', function (t) { return LSA.cueQuoted(t) ? 'q' : ''; }),
    length: feat('length', function (t) { return Math.floor(t.length / 8); }),
    keywords: words()
  };
};
LSA.checkFlagDeck = function (d) {
  var errs = [], seen = {}, counts = {}, fl = [0, 0], fi = [0, 0];
  d.cards.forEach(function (c) {
    var p = d.id + '/' + c.id + ': ';
    ['id', 'deck', 'topic', 'ages', 's', 'cues', 'doThis', 'src', 'cite'].forEach(function (k) { if (!c[k]) errs.push(p + 'missing ' + k); });
    if (seen[c.id]) errs.push(p + 'duplicate id'); seen[c.id] = 1;
    if (['both', 'ya', 'adult'].indexOf(c.ages) < 0) errs.push(p + 'bad ages');
    if (c.s && typeof c.s === 'object' && (!c.s.ya || !c.s.adult)) errs.push(p + 'two-line scenario needs ya and adult');
    if (c.src && !(d.sources && d.sources[c.src])) errs.push(p + 'unknown source ' + c.src);
    if (c.also !== undefined && !(Array.isArray(c.also) && c.also.length && c.also.every(function (k) { return k !== c.src && d.sources && d.sources[k]; }))) errs.push(p + 'also must list other known sources');
    var cues = Array.isArray(c.cues) ? c.cues : [];
    if (cues.length !== 6) errs.push(p + 'needs exactly 6 cues');
    if (new Set(cues.map(function (q) { return q.t; })).size !== cues.length) errs.push(p + 'cues must differ');
    cues.forEach(function (q, k) { if (!q || !q.t || !q.why || typeof q.flag !== 'boolean') errs.push(p + 'cue ' + k + ' needs t, flag and why'); else { var a = q.flag ? fl : fi; a[0] += q.t.length; a[1]++; } });
    var nf = cues.filter(function (q) { return q && q.flag; }).length;
    if (nf < 2 || nf > 4) errs.push(p + 'needs 2 to 4 red flags, has ' + nf);
    counts[nf] = (counts[nf] || 0) + 1;
    var txt = [LSA.scenario(c, 'ya'), LSA.scenario(c, 'adult'), c.doThis].concat(cues.map(function (q) { return q.t + ' ' + q.why; })).join(' ');
    if (LSA.RX_BANNED.test(txt)) errs.push(p + 'banned word (gore or how-to)');
  });
  Object.keys(counts).forEach(function (k) { if (counts[k] / d.cards.length > LSA.CUE_MAX_COUNT_SHARE) errs.push(d.id + ': ' + Math.round(100 * counts[k] / d.cards.length) + '% of sets have ' + k + ' flags (max 50%)'); });
  if (fl[1] && fi[1] && (fl[0] / fl[1]) > LSA.CUE_LEN_RATIO * (fi[0] / fi[1])) errs.push(d.id + ': flag cues are ' + ((fl[0] / fl[1]) / (fi[0] / fi[1])).toFixed(2) + 'x longer than fine cues');
  // Quote rule: quotation marks on tiles must not mark one side. With 2+ quoted cues, at most 75% may share a side.
  var qc = [];
  d.cards.forEach(function (c) { (c.cues || []).forEach(function (q) { if (q && q.t && LSA.cueQuoted(q.t)) qc.push(!!q.flag); }); });
  if (qc.length >= 2) { var qf = qc.filter(Boolean).length / qc.length; if (qf > 0.75 || qf < 0.25) errs.push(d.id + ': quoted cues are ' + Math.round(100 * qf) + '% red flags (quote tell, keep 25% to 75%)'); }
  var t = LSA.cueTells(d.cards);
  Object.keys(t).forEach(function (k) { if (t[k] > LSA.CUE_MAX_LIFT) errs.push(d.id + ': cue tell "' + k + '" lift ' + Math.round(100 * t[k]) + '%'); });
  if (d.section === LSA.STREET) {
    if (!d.notice) errs.push(d.id + ': Street Smart deck needs a notice line');
    if (['teen', 'adult'].indexOf(d.rating) < 0) errs.push(d.id + ': rating must be teen or adult');
  }
  ['ya', 'adult'].forEach(function (a) { var n = d.cards.filter(function (c) { return LSA.visible(c, a); }).length; if (n < LSA.MIN_CARDS) errs.push(d.id + ': only ' + n + ' sets for ' + a); });
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
