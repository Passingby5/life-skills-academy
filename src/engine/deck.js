// Deck registry, checker and age filter. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.decks = LSA.decks || {};
LSA.deckOrder = LSA.deckOrder || [];
LSA.cardIndex = LSA.cardIndex || {};
LSA.MIN_CARDS = 50;
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
  ['ya', 'adult'].forEach(function (a) {
    var n = d.cards.filter(function (c) { return LSA.visible(c, a); }).length;
    if (n < LSA.MIN_CARDS) errs.push(d.id + ': only ' + n + ' cards for ' + a);
  });
  return errs;
};
LSA.checkAll = function () {
  var errs = [], ids = {};
  LSA.deckOrder.forEach(function (id) {
    errs = errs.concat(LSA.checkDeck(LSA.decks[id]));
    LSA.decks[id].cards.forEach(function (c) { if (ids[c.id] && ids[c.id] !== id) errs.push('id ' + c.id + ' used in ' + ids[c.id] + ' and ' + id); ids[c.id] = id; });
  });
  return errs;
};
