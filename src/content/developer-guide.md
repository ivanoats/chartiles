---
title: Add Puget Sound chart features to MapLibre.
description: Load the CharTiles Puget Sound archive in MapLibre and look up a chart feature’s NOAA source revision.
---

Use the public PMTiles archive to draw wrecks, buoys, lights, and soundings. The archive is for experimental inspection. Not for navigation.

## Load the archive

Install `maplibre-gl` and `pmtiles`. In a browser module, register the PMTiles protocol before loading the vector source. This example starts with an existing MapLibre map and adds a layer once its style loads.

```js
import {addProtocol} from 'maplibre-gl';
import {Protocol} from 'pmtiles';

addProtocol('pmtiles', new Protocol().tile);

async function addWrecks(map) {
  const service = 'https://chartiles-data.ivanstorck.workers.dev/';
  const response = await fetch(new URL('charts/manifest.json', service));
  if (!response.ok) throw new Error('Could not load the chart manifest');
  const manifest = await response.json();
  const archive = new URL(manifest.pmtiles_url, service);

  map.addSource('enc', {type: 'vector', url: `pmtiles://${archive.href}`});
  map.addLayer({
    id: 'wrecks',
    type: 'circle',
    source: 'enc',
    'source-layer': 'WRECKS',
    paint: {'circle-radius': 6, 'circle-color': '#93204c'},
  });

  map.on('click', 'wrecks', ({features: [wreck]}) => {
    const {source_cell, feature_key} = wreck.properties;
    const revision = manifest.sources.find(cell => cell.name === source_cell);
    console.log(feature_key, revision);
  });
}

// Call after creating the map and before its initial style has loaded.
map.once('load', () => {
  addWrecks(map).catch(console.error);
  map.jumpTo({center: [-122.4145, 47.6766], zoom: 16});
});
```

## Look up the NOAA source

Click or query a rendered wreck and read its `source_cell`. Find the matching entry by `name` in the manifest’s `sources` list. It records the edition (`edtn`), update number (`updn`), and issue date (`isdt`). Keep the archive’s `sha256` with any saved feature reference.

- [Open the release manifest](https://chartiles-data.ivanstorck.workers.dev/charts/manifest.json)
- [Inspect the Shilshole wreck](/inspect.html?view=features#18/47.6766/-122.4145)
