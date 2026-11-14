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
  const t = String(s).replace(/,/g, '');
  const re = /-?\d+(?:\.\d+)?(?:e[+\-]?\d+)?/ig;
  let m;
  while ((m = re.exec(t))) out.push(parseFloat(m[0]));
  return out;
}

function near(n, exp, tol) {
  const t = Math.max(tol, Math.abs(exp) * 0.02, 1e-9);
  if (Math.abs(n - exp) <= t || Math.abs(n - Math.abs(exp)) <= t) return true;
  // unit scales used in the decks: m vs mm, Pa vs MPa, raw vs percent
  const scales = [1000, 0.001, 1e6, 1e-6, 100, 0.01];
  return scales.some(s => Math.abs(n - exp * s) <= Math.max(tol, Math.abs(exp * s) * 0.02, 0.05));
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

console.log('ok engineer-numeric', calcs.length, 'calculations recomputed and matched to right answers');
