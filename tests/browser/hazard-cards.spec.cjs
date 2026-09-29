const {test, expect} = require('@playwright/test');
const fixtures = require('../fixtures/shilshole-hazards.json');
for (const feature of fixtures) {
  test(`inspect real ${feature.sourceLayer} with chart depth and raw attributes`, async ({page}) => {
    const [lng,lat] = feature.geometry.coordinates;
    await page.goto(`/#${feature.sourceLayer === 'SOUNDG' ? 15 : 18}/${lat}/${lng}`);
    await page.getByRole('button',{name:'Inspect features',exact:true}).click();
    await page.waitForFunction(() => performance.getEntriesByName('chartiles-first-idle').length > 0);
    if (feature.sourceLayer === 'SOUNDG') {
      const soundings = page.locator('input[data-layer="SOUNDG"]');
      await soundings.uncheck();
      await soundings.check();
    }
    const map = page.locator('#map');
    const box = await map.boundingBox();
    const card = page.locator(`[data-kind="${feature.sourceLayer}"]`);
    await expect(async () => {
      await map.click({position:{x:box.width/2,y:box.height/2}});
      await expect(card).toBeVisible({timeout:1000});
    }).toPass();
    const depth = feature.sourceLayer === 'SOUNDG' ? feature.properties.depth_m : feature.properties.VALSOU;
    await expect(card).toContainText(depth == null ? 'Depth not recorded' : `${depth} m charted depth`);
    await expect(card).toContainText('Recorded sounding quality');
    await expect(card).toContainText('not current water depth');
    await page.getByText('Raw ENC attributes',{exact:true}).click();
    await expect(page.locator('#details')).toContainText(feature.properties.LNAM);
    await page.locator('aside').evaluate(node => {node.scrollTop = 0;});
    await page.screenshot({path:`build/hazard-${feature.sourceLayer}.png`});
  });
}
