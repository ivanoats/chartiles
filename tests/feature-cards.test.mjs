import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describeFeature, list} from '../web/feature-cards.mjs';
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/shilshole-features.json', import.meta.url)));
for (const [index, colour, mark] of [[0, 'R', '2'], [1, 'G', '1']]) {
  test(`Shilshole buoy ${mark}: explicit identity and flash timing`, () => {
    const card = describeFeature(fixtures[index], fixtures);
    assert.equal(card.title, `Shilshole Bay Entrance Lighted Buoy ${mark}`);
    assert.ok(card.rows.some(([k,v]) => k === 'Chart notation' && v === `Fl ${colour} 2.5s`));
    assert.ok(card.rows.some(([k,v]) => k === 'Timing' && v === '0.3 s lit · 2.2 s dark'));
    assert.ok(card.rows.some(([k,v]) => k === 'Feature source date' && v === '2014-05-27'));
  });
}
test('does not associate across cells, by location, or ambiguously', () => {
  const light = fixtures[0], buoy = fixtures[3];
  for (const candidates of [[], [{...buoy, properties:{...buoy.properties, source_cell:'OTHER'}}], [buoy, {...buoy, properties:{...buoy.properties, feature_key:'different', OBJNAM:'Other buoy'}}]]) {
    assert.equal(describeFeature(light, candidates).title, 'Red light');
  }
});
test('unknown and missing codes are preserved without inventing characteristics', () => {
  const card = describeFeature({source_layer:'LIGHTS', COLOUR:'["999"]', LITCHR:999, SIGSEQ:'odd'});
  assert.match(card.title, /Unknown colour \(999\)/);
  assert.ok(card.rows.some(([k,v]) => k === 'Characteristic code' && v === '999'));
  assert.ok(!card.rows.some(([k]) => k === 'Chart notation'));
  assert.equal(describeFeature({source_layer:'LIGHTS'}).title, 'Unspecified colour light');
  assert.deepEqual(list('["3","4"]'), ['3','4']);
  assert.deepEqual(list([3,4]), ['3','4']);
  assert.deepEqual(list('[]'), []);
});
test('depth polygon remains an area range and missing endpoints are not zero', () => {
  const card = describeFeature(fixtures[4]);
  assert.equal(card.summary, '9.1–182.8 m charted depth range');
  assert.match(card.note, /not a sounding/);
  assert.equal(describeFeature({source_layer:'DEPARE', DRVAL1:null, DRVAL2:5}).summary,'Depth range incomplete');
});
test('unique linked buoy name precedes light name, including duplicate tile copies', () => {
  const light = {...fixtures[0], properties: {...fixtures[0].properties, OBJNAM: 'Light-specific name'}};
  const buoy = fixtures[3];
  assert.equal(describeFeature(light, [buoy, buoy]).title, buoy.properties.OBJNAM);
  assert.equal(light.properties.OBJNAM, 'Light-specific name');
  for (const candidates of [
    [],
    [{...buoy, properties: {...buoy.properties, OBJNAM: ''}}],
    [{...buoy, properties: {...buoy.properties, source_cell: 'OTHER'}}],
    [buoy, {...buoy, properties: {...buoy.properties, feature_key: 'different', OBJNAM: 'Other buoy'}}],
  ]) {
    assert.equal(describeFeature(light, candidates).title, 'Light-specific name');
  }
});

test('rock card preserves zero depth and recorded water-level effect', () => {
  const card = describeFeature({source_layer:'UWTROC', VALSOU:0, WATLEV:5, QUASOU:'["3","999"]'});
  assert.equal(card.title, 'Rock');
  assert.equal(card.summary, '0 m charted depth');
  assert.deepEqual(card.rows.slice(0,2), [['Water-level effect','Awash'], ['Recorded sounding quality','Doubtful sounding; Unknown QUASOU code (999)']]);
});
test('wreck card distinguishes recorded classification from a clearance assessment', () => {
  const card = describeFeature({source_layer:'WRECKS', OBJNAM:'Example wreck', CATWRK:1, WATLEV:3, VALSOU:12.4});
  assert.equal(card.title, 'Example wreck');
  assert.equal(card.summary, '12.4 m charted depth');
  assert.ok(card.rows.some(([k,v]) => k === 'Recorded wreck category' && v === 'Non-dangerous wreck'));
  assert.match(card.note, /not current water depth or a vessel-clearance assessment/);
});
test('hazards do not invent missing depths or silently discard unknown categories', () => {
  const card = describeFeature({source_layer:'WRECKS', VALSOU:' ', CATWRK:999});
  assert.equal(card.summary, 'Depth not recorded');
  assert.ok(card.rows.some(([k,v]) => k === 'Recorded wreck category' && v === 'Unknown CATWRK code (999)'));
  assert.ok(card.rows.some(([k,v]) => k === 'Recorded sounding quality' && v === 'Not recorded'));
});
test('soundings use normalized point depth, preserve negative values and reported quality', () => {
  const card = describeFeature({source_layer:'SOUNDG', depth_m:-1.2, QUASOU:[8,9]});
  assert.equal(card.summary, '-1.2 m charted depth');
  assert.equal(card.rows[0][1], 'Value reported (not surveyed); Value reported (not confirmed)');
  assert.equal(describeFeature({source_layer:'SOUNDG', DRVAL1:4}).summary, 'Depth not recorded');
});
