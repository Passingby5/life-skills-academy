// Myth Match: pair each myth tile with its fix tile. Only cards the player has seen. No DOM.
var LSA = typeof LSA !== 'undefined' ? LSA : {};
LSA.MM = {
  seenCards: function (profile, deckIds) {
    return LSA.cardsFor(profile.age, deckIds).filter(function (c) { return profile.boxes[c.id]; });
  },
  start: function (profile, deckIds, seed, pairs) {
    var r = LSA.rng(seed), seen = LSA.shuffle(LSA.MM.seenCards(profile, deckIds), r).slice(0, pairs || 4);
    if (seen.length < 2) return null;
    var tiles = [];
    seen.forEach(function (c) { tiles.push({ id: c.id, k: 'm' }); tiles.push({ id: c.id, k: 'f' }); });
    return { tiles: LSA.shuffle(tiles, r), cleared: {}, sel: null, tries: 0, done: false };
  },
  // Returns 'select', 'match', 'miss', or null.
  tap: function (st, i) {
    if (st.done || st.cleared[i]) return null;
    if (st.sel === null) { st.sel = i; return 'select'; }
    if (st.sel === i) { st.sel = null; return null; }
    var a = st.tiles[st.sel], b = st.tiles[i], j = st.sel; st.sel = null; st.tries++;
    if (a.id === b.id && a.k !== b.k) {
      st.cleared[j] = st.cleared[i] = true;
      st.done = Object.keys(st.cleared).length === st.tiles.length;
      return 'match';
    }
    return 'miss';
  }
};
