// TEST FIXTURE ONLY (never in the real app): 8 stub decks so the picker shows 12 decks in 4 sections,
// and every card has an img so the picture code can be tested.
(function () {
  var W = ['Ant', 'Bee', 'Cat'], plan = [['Tactical Field Care', 3], ['Field Survival', 3], ['Country Living', 2]], n = 0;
  plan.forEach(function (sp) {
    for (var j = 0; j < sp[1]; j++) {
      n++; var id = 'stub' + n, cards = [];
      for (var k = 0; k < 50; k++) {
        var t = ('0' + k).slice(-2), w = [W[k % 3], W[(k + 1) % 3], W[(k + 2) % 3]];
        cards.push({ id: id + '_' + t, ages: 'both', topic: 'stub-topic', s: 'Stub question ' + t + '?', img: 'img/stub-test.svg',
          imgAlt: k === 0 ? 'A green circle on a light card' : undefined,
          c: [0, 1, 2].map(function (i) { return w[i] + ' choice ' + t + ' ' + 'xyz'.slice(0, 1 + (k + i) % 3); }), m: 'Stub myth ' + t + '.', f: 'Stub fix ' + t + '.', w: 'Stub why.', src: 's' });
      }
      LSA.deck({ id: id, name: sp[0] + ' stub ' + (j + 1), icon: '🧪', section: sp[0], sources: { s: ['Stub source', 'https://example.org/'] }, cards: cards });
    }
  });
})();
