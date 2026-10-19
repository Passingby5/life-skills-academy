// Item 2: an open app picks up a new build with no cache clear, and keeps its save. Item 7: no hover-only features.
const { chromium } = require('playwright-core'), http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), assert = require('assert'), { execSync } = require('child_process');
const css = fs.readFileSync(path.join(__dirname, '../src/ui/style.css'), 'utf8'), ui = fs.readFileSync(path.join(__dirname, '../src/ui/ui.js'), 'utf8');
assert(!/:hover/.test(css) && !/mouseover|mouseenter|title=/.test(ui)); console.log('ok 7 no hover-only features');
const root = path.join(__dirname, '..'), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsa-'));
const copy = () => execSync(`cp -r ${root}/site/. ${dir}/`);
const T = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', webmanifest: 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = q.url.split('?')[0]; if (p.endsWith('/')) p += 'index.html'; const f = path.join(dir, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[f.split('.').pop()] }); r.end(fs.readFileSync(f)); });
(async () => {
  execSync('COMMIT=aaaaaaa node build.js', { cwd: root }); copy();
  await new Promise(r => server.listen(0, r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage();
  await page.goto(base); await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  assert((await page.textContent('#ver')).endsWith('aaaaaaa'));
  await page.click('[data-act=newprof]'); await page.waitForTimeout(400); await page.click('[data-act="age"][data-a="ya"]'); await page.waitForTimeout(400); await page.click('[data-act=saveprof]'); await page.waitForTimeout(400);
  await page.click('[data-act=play]'); await page.waitForTimeout(400); await page.click('[data-act=ans][data-p="1"]'); await page.waitForTimeout(400);
  const before = await page.evaluate(() => localStorage.lsa_save);
  execSync('COMMIT=bbbbbbb node build.js', { cwd: root }); copy();
  // Coming back to the foreground triggers the check.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForFunction(() => document.getElementById('ver') ? false : true, null, { timeout: 1 }).catch(() => {});
  await page.waitForFunction(() => { const v = document.getElementById('ver'); return LSA_BUILD.label.endsWith('bbbbbbb'); }, null, { timeout: 15000 });
  const after = await page.evaluate(() => localStorage.lsa_save);
  assert.strictEqual(JSON.parse(after).profiles.p1.round.q[0].pick, JSON.parse(before).profiles.p1.round.q[0].pick);
  assert(await page.$('[data-act=conf]'), 'resumed mid-card after update');
  console.log('ok 2 auto-update to new build, save kept, resumed mid-round');
  await b.close(); server.close(); execSync('node build.js', { cwd: root });
})().catch(e => { console.error('FAIL', e.message); server.close(); process.exit(1); });
