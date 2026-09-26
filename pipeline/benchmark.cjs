// Run against npm run preview after npm run build.
const {chromium} = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch();
  try {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext({viewport: {width: 1280, height: 850}});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:4173/');
      await page.waitForFunction(() => performance.getEntriesByName('chartiles-first-idle').length > 0, null, {timeout: 60000});
      const milliseconds = await page.evaluate(() => performance.getEntriesByName('chartiles-first-idle')[0].startTime);
      if (errors.length) throw new Error(errors.join('\n'));
      runs.push(Math.round(milliseconds));
      if (i === 0) await page.screenshot({path: 'build/region-viewer.png'});
      await context.close();
    }
    const manifest = JSON.parse(fs.readFileSync('dist/charts/manifest.json'));
    const result = {region: manifest.region, archive_bytes: manifest.bytes, build_seconds: manifest.build_seconds,
      features: manifest.validation.features_checked, first_idle_ms: runs,
      median_first_idle_ms: [...runs].sort((a,b) => a-b)[1], environment: 'Local headless Chromium, 1280x850, fresh context per run, external requests blocked'};
    fs.writeFileSync(`build/${manifest.region}-benchmark.json`, JSON.stringify(result, null, 2)+'\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
