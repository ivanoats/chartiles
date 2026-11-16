import {addProtocol, Map, setWorkerUrl} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import {Protocol} from 'pmtiles';

const service = 'https://chartiles-data.ivanstorck.workers.dev/';
const status = document.querySelector('#status');
const feature = document.querySelector('#feature');
const release = document.querySelector('#release');
const wreck = [-122.4145, 47.6766];
const json = value => JSON.stringify(value, null, 2);

async function start() {
  const response = await fetch(new URL('charts/manifest.json', service));
  if (!response.ok) throw new Error(`Manifest request failed (HTTP ${response.status})`);
  const manifest = await response.json();
  // Archive paths in the manifest are relative to the service root.
  const archive = new URL(manifest.pmtiles_url, service);
  release.textContent = json({
    region: manifest.region,
    bounds: manifest.bounds,
    built_at: manifest.built_at,
    bytes: manifest.bytes,
    sha256: manifest.sha256,
    source_cells: manifest.sources.map(({name, edtn, updn, isdt}) => ({name, edtn, updn, isdt})),
  });

  const protocol = new Protocol();
  setWorkerUrl(workerUrl);
  addProtocol('pmtiles', protocol.tile);
  const map = new Map({
    container: 'map',
    center: wreck,
    zoom: 16,
    style: {
      version: 8,
      sources: {
        enc: {type: 'vector', url: `pmtiles://${archive.href}`, attribution: 'NOAA Office of Coast Survey'},
      },
      layers: [
        {id: 'water', type: 'background', paint: {'background-color': '#e0eff5'}},
        {id: 'land', type: 'fill', source: 'enc', 'source-layer': 'LNDARE',
          paint: {'fill-color': '#eee8da'}},
        {id: 'wrecks', type: 'circle', source: 'enc', 'source-layer': 'WRECKS',
          paint: {'circle-radius': 7, 'circle-color': '#93204c', 'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'}},
      ],
    },
  });
  map.once('load', () => {
    status.textContent = 'Select the wreck marker near the center of the map.';
  });
  map.on('error', ({error}) => {
    status.textContent = `Chart load error: ${error.message}`;
  });
  map.on('click', 'wrecks', ({features: [selected]}) => {
    const {feature_key, source_cell, VALSOU} = selected.properties;
    const revision = manifest.sources.find(cell => cell.name === source_cell);
    feature.textContent = json({
      feature_key,
      source_cell,
      recorded_depth_m: VALSOU ?? null,
      source_revision: revision ? {edition: revision.edtn, update: revision.updn, issued: revision.isdt} : null,
    });
  });
}

start().catch(error => {
  status.textContent = error.message;
});
