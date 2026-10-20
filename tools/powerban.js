// v18 Power Plays: no law title from Greene's 48 Laws of Power (phrase list in tools/power-banned.json) may appear in a
// power deck's text or in our tactic names. Used by tools/checkdecks.js and tests/unit.js. Returns a list of problems.
const PB = require('./power-banned.json').phrases;
exports.check = function (d, tactics) {
  const out = [], low = x => JSON.stringify(x).toLowerCase().replace(/\u2019/g, "'");
  const txt = c => low([c.s, c.c, c.m, c.f, c.w, c.steps, c.faith, c.cite, tactics[c.tactic]]);
  [low([d.name, d.notice, d.cover])].concat(d.cards.map(txt)).forEach((t, i) => PB.forEach(ph => { if (t.indexOf(ph) >= 0) out.push(d.id + (i ? '/' + d.cards[i - 1].id : '') + ': banned Greene phrase "' + ph + '"'); }));
  Object.values(tactics).forEach(n => PB.forEach(ph => { if (n.toLowerCase().indexOf(ph) >= 0) out.push('tactic name "' + n + '" uses banned phrase "' + ph + '"'); }));
  return out;
};
