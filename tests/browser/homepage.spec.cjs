const {test, expect} = require('@playwright/test');

test('homepage links to the developer guide', async ({page}) => {
  await page.goto('/');
  await page.getByRole('link', {name: 'See how to integrate'}).click();
  await expect(page.getByRole('heading', {name: 'Add Puget Sound chart features to MapLibre.'})).toBeVisible();
});

test('homepage opens Shilshole and lets visitors inspect the wreck', async ({page}) => {
  await page.goto('/');
  await page.getByRole('link', {name: 'Explore near Shilshole'}).click();
  await expect(page).toHaveURL(/\/inspect(?:\.html)?\/?\?view=features#18\/47\.6766\/-122\.4145$/);
  await expect(page.getByRole('button', {name: 'Inspect features', exact: true}))
    .toHaveAttribute('aria-pressed', 'true');
  await page.waitForFunction(() => performance.getEntriesByName('chartiles-first-idle').length > 0);

  const map = page.locator('#map');
  const {width, height} = await map.boundingBox();
  await expect(async () => {
    await map.click({position: {x: width / 2, y: height / 2}});
    await expect(page.locator('[data-kind="WRECKS"]')).toContainText('Depth not recorded', {timeout: 1000});
  }).toPass({timeout: 8000});
});

test('theme choice persists across pages and System follows the browser', async ({page}) => {
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto('/');
  const theme = page.locator('summary[aria-label="Color theme"]');
  const body = page.locator('body');
  const light = 'rgb(250, 248, 243)';
  const dark = 'rgb(21, 20, 15)';

  await expect(body).toHaveCSS('background-color', light);
  await theme.click();
  await expect(page.getByRole('radio', {name: 'System'})).toBeChecked();
  await page.getByRole('radio', {name: 'Dark'}).check();
  await expect(body).toHaveCSS('background-color', dark);

  await page.getByRole('navigation').getByRole('link', {name: 'Developers'}).click();
  await expect(body).toHaveCSS('background-color', dark);
  await page.emulateMedia({colorScheme: 'dark'});
  await theme.click();
  await expect(page.getByRole('radio', {name: 'Dark'})).toBeChecked();
  await page.getByRole('radio', {name: 'Light'}).check();
  await expect(body).toHaveCSS('background-color', light);
  await page.getByRole('radio', {name: 'System'}).check();
  await expect(body).toHaveCSS('background-color', dark);
  await page.emulateMedia({colorScheme: 'light'});
  await expect(body).toHaveCSS('background-color', light);
});

test('blog lists the Markdown draft and opens it for review', async ({page}) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', {name: 'Blog'}).click();
  await expect(page.getByRole('heading', {name: 'CharTiles blog'})).toBeVisible();
  await page.getByRole('link', {name: 'The coastline that disappeared'}).click();
  await expect(page.getByRole('heading', {name: 'The coastline that disappeared'})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Two ends, one grid point'})).toBeVisible();
  const diagram = page.getByRole('img', {name: /coastline endpoints collapse/});
  await diagram.scrollIntoViewIfNeeded();
  await expect.poll(() => diagram.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
