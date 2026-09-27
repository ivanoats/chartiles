const {test, expect} = require('@playwright/test');

test('raster displays offline and switches modes without moving the camera', async ({page}) => {
  const external = [], errors = [], ranges = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') {
      external.push(route.request().url()); return route.abort();
    }
    return route.continue();
  });
  const manifest = await (await page.request.get('/charts/manifest.json')).json();
  test.skip(!manifest.raster, 'Import NOAA raster fixture first');
  page.on('response', r => { if (r.url().includes(manifest.raster.sha256)) ranges.push(r.status()); });
  await page.goto('/#14/47.681/-122.411');
  const chart = page.getByRole('button', {name:'Chart view',exact:true});
  const features = page.getByRole('button', {name:'Inspect features',exact:true});
  await expect(chart).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Inspect',exact:true})).toBeDisabled();
  await page.waitForFunction(() => performance.getEntriesByName('chartiles-first-idle').length > 0);
  await expect(page.locator('#status')).toContainText('Publication date: unknown');
  await page.screenshot({path:'build/raster-shilshole.png'});
  const camera = new URL(page.url()).hash;
  for (let i=0;i<3;i++) {
    await features.click();
    await expect(page.locator('#vector-panel')).toBeVisible();
    await expect(page.getByRole('button',{name:'Inspect',exact:true})).toBeEnabled();
    await chart.click();
    await page.keyboard.press('Control+Shift+I');
    await expect(page.getByRole('button',{name:'Pan',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#vector-panel')).toBeHidden();
    await expect(page.locator('.coverage-control')).toBeHidden();
    expect(new URL(page.url()).hash).toBe(camera);
  }
  expect(ranges).toContain(206);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('failed raster offers inspection and vector-only manifests remain usable', async ({page}) => {
  const manifest = await (await page.request.get('/charts/manifest.json')).json();
  test.skip(!manifest.raster, 'Import NOAA raster fixture first');
  await page.route(`**/${manifest.raster.sha256}.pmtiles`, route => route.fulfill({status:404,body:'missing'}));
  await page.goto('/#14/47.681/-122.411');
  await expect(page.locator('#raster-status')).toContainText('unavailable');
  await page.getByRole('button',{name:'Inspect features',exact:true}).click();
  await expect(page.locator('#status')).toContainText('NOAA cells');
  delete manifest.raster;
  delete manifest.schema_version;
  await page.route('**/charts/manifest.json', route => route.fulfill({json:manifest}));
  await page.reload();
  await expect(page.getByRole('button',{name:'Chart view',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Inspect features',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('overzoom and out-of-bounds imagery are labeled', async ({page}) => {
  const manifest = await (await page.request.get('/charts/manifest.json')).json();
  test.skip(!manifest.raster, 'Import NOAA raster fixture first');
  await page.goto('/#18/47.681/-122.411');
  await expect(page.locator('#raster-status')).toContainText('Overzoom');
  await page.goto('/#12/46/-122');
  await expect(page.locator('#raster-status')).toContainText('outside the raster archive bounds');
});

test('corrupt raster produces a recoverable error', async ({page}) => {
  const manifest = await (await page.request.get('/charts/manifest.json')).json();
  test.skip(!manifest.raster, 'Import NOAA raster fixture first');
  await page.route(`**/${manifest.raster.sha256}.pmtiles`, route => route.fulfill({status:200,body:'not a PMTiles archive'}));
  await page.goto('/#14/47.681/-122.411');
  await expect(page.locator('#raster-status')).toContainText('unavailable');
  await page.getByRole('button',{name:'Inspect features',exact:true}).click();
  await expect(page.locator('#vector-panel')).toBeVisible();
});
