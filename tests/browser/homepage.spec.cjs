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
