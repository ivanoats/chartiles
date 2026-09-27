const {test, expect} = require('@playwright/test');
test('renders and inspects real tiles with all external requests blocked', async ({page}) => {
  const errors = [];
  const external = [];
  const ranges = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') {
      external.push(route.request().url()); return route.abort();
    }
    return route.continue();
  });
  page.on('response', response => {if (response.url().endsWith('.pmtiles')) ranges.push(response.status());});
  await page.goto('/');
  const manifest = await (await page.request.get('/charts/manifest.json')).json();
  await expect(page.locator('#status')).toContainText(`${manifest.sources.length} NOAA cells`);
  // Poll by interacting until the worker has decoded and painted real features.
  await expect(async () => {
    await page.locator('#map').click({position: {x: 450, y: 340}});
    await expect(page.locator('#details')).toContainText('source_cell', {timeout: 1000});
  }).toPass();
  await expect(page.locator('#details')).toContainText('feature_key');
  await expect(page.locator('.maplibregl-canvas')).toHaveCSS('cursor', /identify-cursor\.svg/);
  await expect(page.locator('.maplibregl-popup')).toContainText('selected');
  const details = await page.locator('#details').textContent();
  await page.getByRole('button', {name: 'Pan', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Pan', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#map').click({position: {x: 100, y: 100}});
  await expect(page.locator('#details')).toHaveText(details);
  await page.keyboard.press('Control+Shift+I');
  await expect(page.getByRole('button', {name: 'Inspect', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#map .map-tools')).toBeVisible();
  await expect(page.locator('.maplibregl-canvas')).toHaveCSS('cursor', /identify-cursor\.svg/);
  await page.getByLabel(`SOUNDG (${manifest.counts.SOUNDG})`, {exact: false}).uncheck();
  await page.screenshot({path: 'build/viewer.png'});
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  expect(ranges).toContain(206);
});

test('detail view renders sounding labels with no external fonts or sprites', async ({page}) => {
  const errors = [];
  const external = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') {
      external.push(route.request().url()); return route.abort();
    }
    return route.continue();
  });
  await page.goto('/#15/47.681/-122.411');
  await page.waitForFunction(() => performance.getEntriesByName('chartiles-first-idle').length > 0);
  await expect(page.locator('#zoom-hint')).toContainText('Zoom 15.0');
  await expect(page.locator('#status')).not.toContainText('error');
  await page.screenshot({path: 'build/detail-viewer.png'});
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('coverage audit can be toggled on the map', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('#coverage-status')).toContainText('99 coverage footprints');
  const button = page.getByRole('button', {name: 'Coverage', exact: true});
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({path: 'build/coverage-viewer.png'});
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});
