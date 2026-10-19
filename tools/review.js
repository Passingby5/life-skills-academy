// Writes REVIEW.md: one checkbox per card for Tom to check against the source before release (item 32).
const fs = require('fs'), L = require('../tests/load.js').load();
let out = '# Card review list (checklist item 32)\n\nCheck each card against its source page, then tick the box. Fix or drop any card that does not match.\nAges: both = everyone, ya = 15 to 30, adult = 30+.\n';
L.knowDecks().forEach(id => {
  const d = L.decks[id];
  out += `\n## ${d.name} (${d.cards.length} cards)\n\nReviewed by: ________  Date: ________\n\n`;
  d.cards.forEach(c => { out += `- [ ] **${c.id}** (${c.ages}) Myth: ${c.m} Fix: ${c.f} Source: [${d.sources[c.src][0]}](${d.sources[c.src][1]})\n`; });
});
const extra = require('path').join(__dirname, '../docs/REVIEW-NEW.md');
if (fs.existsSync(extra)) out += '\n\n# Appendix: source quotes for the new decks\n\n' + fs.readFileSync(extra, 'utf8').replace(/^# /gm, '## ');
fs.writeFileSync(require('path').join(__dirname, '../REVIEW.md'), out); console.log('REVIEW.md written');
