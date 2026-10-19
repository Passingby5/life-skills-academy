// v8: the single-file test copy (tools/testhtml.js) shows card pictures when the file is opened alone (file://, no img/ folder).
const { chromium } = require('playwright-core'), fs = require('fs'), path = require('path'), os = require('os'), assert = require('assert'), { execSync } = require('child_process');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsa-single-')), out = path.join(dir, 'test.html');
execSync('node ' + path.join(__dirname, '../tools/testhtml.js') + ' ' + out, { stdio: 'ignore' });
assert.deepStrictEqual(fs.readdirSync(dir), ['test.html'], 'only the one file');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(), wait = () => page.waitForTimeout(450);
  await page.goto('file://' + out); await wait();
  await page.click('[data-act=newprof]'); await wait(); await page.fill('#nm', 'One'); await page.click('[data-act="age"][data-a="adult"]'); await wait(); await page.click('[data-act=saveprof]'); await wait();
  await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true));
  await page.click('#picker [data-act=deck][data-id=fieldcare]'); await wait();
  for (const id of ['firstaid', 'kitchen', 'money', 'scams']) { await page.evaluate(() => document.querySelectorAll('#picker details').forEach(d => d.open = true)); await page.click(`#picker [data-act=deck][data-id=${id}]`); await wait(); }
  let seen = 0;
  for (let round = 0; round < 4 && !seen; round++) {
    await page.click('[data-act=play]'); await wait();
    while (await page.$('[data-act=ans], [data-act=conf], [data-act=next]')) {
      if (await page.$('[data-act=next]')) {
        const m = await page.evaluate(() => { const i = document.querySelector('img.cimg'); return i ? { w: i.naturalWidth, src: i.getAttribute('src').slice(0, 26) } : null; });
        if (m) { assert(m.w > 0 && m.src === 'data:image/svg+xml;base64,', JSON.stringify(m)); seen++; }
        await page.click('[data-act=next]');
      } else if (await page.$('[data-act=ans]')) await page.click('[data-act=ans][data-p="0"]');
      else await page.click('[data-act=conf][data-k="1"]');
      await wait();
    }
    await page.click('[data-act=menu]'); await wait();
  }
  assert(seen > 0, 'saw a fix screen with a picture'); console.log('ok single-file test copy shows pictures from data URIs (' + seen + ' seen)');
  await b.close(); fs.rmSync(dir, { recursive: true, force: true });
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
