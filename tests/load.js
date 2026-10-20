// Loads the engine, modes and decks into Node (no DOM). Same order the build uses.
const fs = require('fs'), path = require('path'), vm = require('vm');
const DECKS = fs.readdirSync(path.join(__dirname, '../src/content/decks')).filter(f => f.endsWith('.js')).sort().map(f => 'content/decks/' + f);
const ENGINE = ['engine/rng.js', 'engine/deck.js', 'engine/srs.js', 'engine/save.js'];
const ORDER = ENGINE.concat(['modes/gutcheck.js', 'modes/mythmatch.js', 'modes/redflags.js', 'content/research.js'], DECKS);
function load(files) {
  const ctx = vm.createContext({ console });
  (files || ORDER).forEach(f => vm.runInContext(fs.readFileSync((path.isAbsolute(f) ? f : path.join(__dirname, '../src', f)), 'utf8'), ctx, { filename: f }));
  return vm.runInContext('LSA', ctx);
}
module.exports = { ORDER, ENGINE, DECKS, load };
