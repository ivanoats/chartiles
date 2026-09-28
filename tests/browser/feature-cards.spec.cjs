const {test, expect} = require('@playwright/test');
const fixtures = require('../fixtures/shilshole-features.json');
for (const [index, mark, colour] of [[0,'2','R'],[1,'1','G']]) {
  test(`real Shilshole buoy ${mark} has readable light and separate depth cards`, async ({page}) => {
    const [lng,lat] = fixtures[index].geometry.coordinates;
    await page.goto(`/#17/${lat}/${lng}`);
    await page.getByRole('button',{name:'Inspect features',exact:true}).click();
    const map = page.locator('#map');
    const box = await map.boundingBox();
    await expect(async () => {
      await map.click({position:{x:box.width/2,y:box.height/2}});
      await expect(page.locator('[data-kind="LIGHTS"]')).toContainText(`Entrance Lighted Buoy ${mark}`, {timeout:1000});
    }).toPass();
    await expect(page.locator('[data-kind="LIGHTS"]')).toContainText(`Fl ${colour} 2.5s`);
    await expect(page.locator('[data-kind="LIGHTS"]')).toContainText('0.3 s lit · 2.2 s dark');
    await expect(page.locator('[data-kind="DEPARE"]')).toContainText('not a sounding');
    await expect(page.locator('#raw-attributes')).not.toHaveAttribute('open','');
    await page.getByText('Raw ENC attributes',{exact:true}).click();
    await expect(page.locator('#details')).toBeVisible();
    await expect(page.locator('#details')).toContainText(fixtures[index].properties.LNAM);
    await page.locator('aside').evaluate(node => { node.scrollTop = 0; });
    await page.screenshot({path:`build/light-card-${mark}.png`});
    await page.getByRole('button',{name:'Chart view',exact:true}).click();
    await page.getByRole('button',{name:'Inspect features',exact:true}).click();
    await expect(page.locator('.feature-card')).toHaveCount(0);
    await expect(page.locator('#raw-attributes')).not.toHaveAttribute('open','');
  });
}
