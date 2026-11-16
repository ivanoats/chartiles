const {test, expect} = require('@playwright/test');

test('hosted CUGOS deck opens with its chart image and advances', async ({page}) => {
  const response = await page.goto('/cugos/');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', {name: 'Why CharTiles?'})).toBeVisible();
  const coverImage = page.getByRole('img', {name: /entrance buoys/});
  await expect(coverImage).toBeVisible();
  await expect.poll(() => coverImage.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button', {name: 'Next'}).click();
  await expect(page.getByRole('heading', {name: 'What’s the OpenStreetMap equivalent for nautical charts?'}))
    .toBeVisible();
});
