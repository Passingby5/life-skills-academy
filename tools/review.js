// Writes REVIEW.md: one checkbox per card for Tom to check against the source before release (item 32).
// Also rebuilds docs/REVIEW-NEW.md (choices, fix and source quote for every card in the new decks) from the live
// card data and tools/quotes-new.json, so it never goes stale after an edit.
const fs = require('fs'), path = require('path'), L = require('../tests/load.js').load();
const Q = require('./quotes-new.json');
let out = '# Card review list (checklist item 32)\n\nCheck each card against its source page, then tick the box. Fix or drop any card that does not match.\nAges: both = everyone, ya = 15 to 30, adult = 30+.\n';
L.knowDecks().forEach(id => {
  const d = L.decks[id];
  out += `\n## ${d.name} (${d.cards.length} cards)\n\nReviewed by: ________  Date: ________\n\n`;
  d.cards.forEach(c => { out += `- [ ] **${c.id}** (${c.ages}) Myth: ${c.m} Fix: ${c.f} Source: [${d.sources[c.src][0]}](${d.sources[c.src][1]})\n`; });
});
let nw = '# Review: new decks\n\nEach card: choices (myth / RIGHT / decoy), the fix, the source, and the source quote. Built by `tools/review.js` from the deck files and `tools/quotes-new.json`.\n';
L.knowDecks().filter(id => L.FROZEN_DECKS.indexOf(id) < 0).forEach(id => {
  const d = L.decks[id];
  nw += `\n## ${d.name} (\`${id}\`)\n`;
  d.cards.forEach(c => {
    const s = typeof c.s === 'string' ? c.s : 'YA: ' + c.s.ya + ' / Adult: ' + c.s.adult;
    nw += `\n**${c.id}** (${c.ages}, ${c.topic})${c.img ? ' img: ' + c.img.replace('img/', '') : ''}. ${s}\n- Choices: ${c.c[0]} / **${c.c[1]}** / ${c.c[2]}\n- Fix: ${c.f}\n- Source: \`${c.src}\` (${d.sources[c.src][1]}) quote: ${Q[c.id] || '(MISSING)'}\n` + (c.also || []).map(k => `- Also: \`${k}\` (${d.sources[k][1]}) quote: ${Q[c.id + '@' + k] || '(MISSING)'}\n`).join('');
  });
});
fs.writeFileSync(path.join(__dirname, '../docs/REVIEW-NEW.md'), nw);
out += '\n\n# Appendix: source quotes for the new decks\n\n' + nw.replace(/^# /gm, '## ');
fs.writeFileSync(path.join(__dirname, '../REVIEW.md'), out); console.log('REVIEW.md and docs/REVIEW-NEW.md written');
