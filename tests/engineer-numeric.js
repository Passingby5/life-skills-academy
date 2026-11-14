// Recompute every recorded engineer calculation and check it matches the card's right answer.
const fs = require('fs'), path = require('path'), assert = require('assert');
const calcs = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/engineer-calcs.json'), 'utf8'));
const L = require('./load.js').load();

function factorial(n) { let x = 1; for (let i = 2; i <= n; i++) x *= i; return x; }
function ev(expr, inputs) {
  const math = Object.assign(Object.create(Math), { factorial, pi: Math.PI, sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, atan: Math.atan, asin: Math.asin, acos: Math.acos, log: Math.log, log10: Math.log10, exp: Math.exp, radians: x => x * Math.PI / 180, degrees: x => x * 180 / Math.PI });
  return Function('math', 'sqrt', 'pi', 'sin', 'cos', 'tan', 'atan', 'asin', 'acos', 'log', 'log10', 'exp', 'radians', 'degrees', 'factorial', ...Object.keys(inputs || {}),
    '"use strict"; return (' + expr + ');')(
    math, Math.sqrt, Math.PI, Math.sin, Math.cos, Math.tan, Math.atan, Math.asin, Math.acos, Math.log, Math.log10, Math.exp,
    math.radians, math.degrees, factorial, ...Object.values(inputs || {})
  );
}

function numbers(s) {
  const out = [];
  let t = String(s).replace(/,/g, '').replace(/\$/g, '');
  // Turn TeX scientific notation into a plain JS number before scanning.
  t = t.replace(/(-?\d+(?:\.\d+)?)\s*\\times\s*10\^\{?(-?\d+)\}?/g, function (_, a, b) {
    return String(parseFloat(a) * Math.pow(10, parseFloat(b)));
  });
  const re = /-?\d+(?:\.\d+)?(?:e[+\-]?\d+)?/ig;
  let m;
  while ((m = re.exec(t))) out.push(parseFloat(m[0]));
  return out;
}

function near(n, exp, tol) {
  // Same sign and same displayed magnitude as the fixture (no sign flip, no silent x1000/x100 scale).
  const t = Math.max(tol, Math.abs(exp) * 0.02, 1e-9);
  return Math.abs(n - exp) <= t;
}

const skipNumericParse = new Set(['fe132', 'fe097']); // wording answers (determinate; 4 m in 100 m = 0.04)

assert(calcs.length >= 80, 'expected a full calc fixture, got ' + calcs.length);
calcs.forEach(c => {
  const val = ev(c.expr, c.inputs);
  assert(Math.abs(val - c.expected) <= c.tol, c.id + ' expr ' + c.expr + ' gave ' + val + ', expected ' + c.expected);
  const card = L.cardIndex[c.id];
  assert(card, c.id + ' missing from decks');
  const right = card.c[1];
  assert(right.indexOf(c.contain) >= 0, c.id + ' right answer ' + JSON.stringify(right) + ' missing ' + JSON.stringify(c.contain));
  if (skipNumericParse.has(c.id)) return;
  const nums = numbers(right);
  assert(nums.some(n => near(n, c.expected, c.tol)), c.id + ' right ' + JSON.stringify(right) + ' has no number near ' + c.expected + ' (got ' + nums + ')');
});

// Sources must be real public refs, never Wikipedia, and every card points at one.
['fecivil', 'cbet'].forEach(id => {
  const d = L.decks[id];
  assert(d && d.format === 'practice');
  Object.keys(d.sources).forEach(k => {
    const url = d.sources[k][1];
    assert(!/wikipedia\.org/i.test(url), id + ' source ' + k + ' is Wikipedia');
    assert(/^https:\/\//.test(url), id + ' source ' + k + ' needs an https URL');
  });
  d.cards.forEach(c => assert(d.sources[c.src], c.id + ' unknown source'));
});


assert.strictEqual(near(-4, 4, 0.01), false, 'near() must reject a sign flip');
assert.strictEqual(near(190, 0.190, 0.003), false, 'near() must reject an x1000 unit error');
assert.strictEqual(near(4e-3, 4, 0.01), false, 'near() must reject an x1000 scale the other way');
assert.strictEqual(near(0.190, 0.1898, 0.003), true, 'near() still accepts the same displayed magnitude');

let soleOutline = 0;
['fecivil', 'cbet'].forEach(id => {
  const d = L.decks[id];
  d.cards.forEach(c => {
    const outline = /^(ncees-spec|ncees-fe|aami-cbet|aami)$/.test(c.src);
    if (outline && !(c.also && c.also.length)) {
      soleOutline++;
      assert.fail(c.id + ' cites only ' + c.src);
    }
  });
});
assert.strictEqual(soleOutline, 0, 'cards citing only an NCEES or AAMI outline should be near zero');

console.log('ok engineer-numeric', calcs.length, 'calculations recomputed and matched to right answers');
