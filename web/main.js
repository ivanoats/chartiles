import {renderFeatureCards} from './feature-cards.mjs';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {Protocol} from 'pmtiles';
import {rasterDescriptor, installChartModes} from './chart-modes.js';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import {installCoverage} from './coverage.js';
import {detailZoom, installImages} from './portrayal.js';

maplibregl.setWorkerUrl(workerUrl);
const status = document.querySelector('#status');
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

async function start() {
  const response = await fetch('./charts/manifest.json');
  if (!response.ok) throw new Error('No chart bundle. Run npm run charts, then npm run build.');
  const manifest = await response.json();
  let raster = null;
  try { raster = rasterDescriptor(manifest); }
  catch (error) { document.querySelector('#raster-warning').textContent = `${error.message}. Vector inspection remains available.`; }
  document.querySelector('h1 small').textContent = manifest.label || manifest.region;
  document.title = `ChartTiles · ${manifest.label || manifest.region} inspection`;
  const url = new URL(manifest.pmtiles_url, location.href).href;
  const layers = [{id: 'background', type: 'background', paint: {'background-color': '#e0e4e5'}}];
  const fills = {DEPARE: '#c0e1ed', LNDARE: '#e9dfc2'};
  const lines = {M_COVR: '#989f9e', DEPCNT: '#648d9d', COALNE: '#635e4d'};
  const points = {SOUNDG: '#47616a', BOYLAT: '#bd4a23', BOYSAW: '#bd4a23', BOYSPP: '#b18a13', BCNLAT: '#ab511f', LIGHTS: '#8e6299', WRECKS: '#b32250', UWTROC: '#b32250', OBSTRN: '#b32250'};
  const add = (id, type, paint, geometry) => {
    if (!manifest.counts[id]) return;
    layers.push({id, type, minzoom: detailZoom[id] || 0, source: 'enc', 'source-layer': id, paint,
      ...(geometry ? {filter: ['==', ['geometry-type'], geometry]} : {})});
  };
  for (const [id, color] of Object.entries(fills)) add(id, 'fill', {'fill-color': color, 'fill-opacity': 0.85}, 'Polygon');
  for (const [id, color] of Object.entries(lines)) add(id, 'line', {'line-color': color, 'line-width': id === 'COALNE' ? 2 : 1});
  for (const [id, color] of Object.entries(points)) {
    if (!manifest.counts[id]) continue;
    layers.push({id, type: 'symbol', minzoom: detailZoom[id], source: 'enc', 'source-layer': id,
      filter: ['==', ['geometry-type'], 'Point'],
      layout: {'icon-image': id === 'SOUNDG'
        ? ['concat', 'depth:', ['to-string', ['get', 'depth_m']]] : `aid:${id}`,
        'icon-allow-overlap': false, 'icon-padding': id === 'SOUNDG' ? 3 : 2}},
      {id: `${id}-extent`, type: 'line', minzoom: detailZoom[id], source: 'enc', 'source-layer': id,
      filter: ['!=', ['geometry-type'], 'Point'], paint: {'line-color': color, 'line-width': 2}});
  }
  const sources = {enc: {type: 'vector', url: `pmtiles://${url}`, attribution: 'NOAA ENC · experimental conversion'}};
  if (raster) {
    sources['raster-chart'] = {type: 'raster', tiles: [`pmtiles://${new URL(raster.pmtiles_url, location.href).href}/{z}/{x}/{y}.png`], tileSize: raster.tile_size, bounds: raster.bounds, minzoom: raster.minzoom, maxzoom: raster.maxzoom, attribution: raster.attribution};
    layers.push({id: 'raster-chart', type: 'raster', source: 'raster-chart', minzoom: raster.minzoom, paint: {'raster-fade-duration': 0}});
    for (const layer of layers) if (layer.source === 'enc') layer.layout = {...layer.layout, visibility: 'none'};
  }
  const bounds = [[manifest.bounds[0], manifest.bounds[1]], [manifest.bounds[2], manifest.bounds[3]]];
  const rasterState = {error: ''};
  const map = new maplibregl.Map({container: 'map', bounds, fitBoundsOptions: {padding: 25},
    minZoom: manifest.minzoom, maxZoom: 19, hash: true,
    style: {version: 8, sources, layers}});
  installImages(map);
  map.once('style.load', () => {
    installCoverage(map, manifest);
    installChartModes(map, manifest, raster, rasterState, setMode, () => {
      selection?.remove();
      document.querySelector('#feature-cards').replaceChildren();
      document.querySelector('#raw-attributes').open = false;
      document.querySelector('#details').textContent = 'Select a feature.';
      document.querySelector('#selection-status').textContent = 'No feature selected.';
    });
  });
  map.once('idle', () => performance.mark('chartiles-first-idle'));
  map.addControl(new maplibregl.NavigationControl());
  map.addControl(new maplibregl.ScaleControl({unit: 'metric'}));
  map.on('error', event => {
    if (event.sourceId === 'raster-chart') rasterState.error = event.error.message;
    else status.textContent = `Map error: ${event.error.message}`;
  });
  const toolbar = document.createElement('div');
  toolbar.className = 'maplibregl-ctrl maplibregl-ctrl-group map-tools';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Map interaction mode');
  toolbar.innerHTML = `
    <button id="pan-mode" type="button" aria-label="Pan" title="Pan — drag to move" aria-pressed="false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6c0 4-2 7-6 7h-1c-2 0-3-1-4-2l-5-6c-1-2 1-3 2-2l2 2Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
    </button>
    <button id="inspect-mode" type="button" aria-label="Inspect" title="Inspect features (Ctrl+Shift+I)" aria-keyshortcuts="Control+Shift+I" aria-pressed="true">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#176fc1"/><path d="M12 11v7" stroke="white" stroke-width="3"/><circle cx="12" cy="7" r="1.6" fill="white"/></svg>
    </button>
    <button id="reset" type="button" aria-label="Reset view" title="Reset view">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    </button>`;
  map.addControl({onAdd: () => toolbar, onRemove: () => toolbar.remove()}, 'top-left');
  let mode = 'inspect';
  let selection;
  const setMode = next => {
    if (next === 'inspect' && document.querySelector('#inspect-mode').disabled) return;
    mode = next;
    document.querySelector('#inspect-mode').setAttribute('aria-pressed', String(mode === 'inspect'));
    document.querySelector('#pan-mode').setAttribute('aria-pressed', String(mode === 'pan'));
    document.querySelector('#mode-hint').textContent = mode === 'inspect'
      ? 'Click a feature to inspect it. Scroll to zoom.' : 'Drag to move the map. Switch to Inspect to select features.';
    map.getCanvas().style.cursor = mode === 'inspect' ? 'url(./identify-cursor.svg) 4 4, crosshair' : '';
    if (mode === 'inspect') {
      map.dragPan.disable();
      map.dragRotate.disable();
      map.doubleClickZoom.disable();
    } else {
      map.dragPan.enable();
      map.dragRotate.enable();
      map.doubleClickZoom.enable();
    }
  };
  document.querySelector('#inspect-mode').onclick = () => setMode('inspect');
  document.querySelector('#pan-mode').onclick = () => setMode('pan');
  document.addEventListener('keydown', event => {
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyI') {
      event.preventDefault();
      setMode('inspect');
    }
  });
  setMode('inspect');
  map.on('click', event => {
    if (mode !== 'inspect' || !map.isStyleLoaded()) return;
    const features = map.queryRenderedFeatures([[event.point.x - 5, event.point.y - 5], [event.point.x + 5, event.point.y + 5]]);
    const unique = [...new Map(features.filter(f => f.source === 'enc').map(f => [f.properties.feature_key, f])).values()];
    selection?.remove();
    const message = unique.length ? `${unique.length} feature${unique.length === 1 ? '' : 's'} selected. Details in the inspector.` : 'No feature here. Try another location.';
    selection = new maplibregl.Popup({closeButton: false, closeOnClick: false})
      .setLngLat(event.lngLat).setText(message).addTo(map);
    document.querySelector('#selection-status').textContent = message;
    const buoys = ['BOYLAT', 'BOYSAW', 'BOYSPP'].flatMap(sourceLayer => map.querySourceFeatures('enc', {sourceLayer}));
    renderFeatureCards(document.querySelector('#feature-cards'), unique, buoys);
    document.querySelector('#details').textContent = unique.length
      ? JSON.stringify(unique.map(f => ({layer: f.sourceLayer, ...f.properties})), null, 2) : 'No feature here. Blank areas do not establish safe water.';
  });
  for (const [name, count] of Object.entries(manifest.counts)) {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.dataset.layer = name; input.checked = count > 0; input.disabled = count === 0;
    input.addEventListener('change', () => {
      for (const id of [name, `${name}-extent`]) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', input.checked ? 'visible' : 'none');
    });
    label.append(input, ` ${name} (${count})${detailZoom[name] ? ' · z' + detailZoom[name] + '+' : ''}`); document.querySelector('#layers').append(label);
  }
  const zoomHint = document.querySelector('#zoom-hint');
  const updateZoomHint = () => { zoomHint.textContent = `Zoom ${map.getZoom().toFixed(1)} · aids z11+ · hazards z12+ · depths z14+. Overlapping symbols may be hidden; zoom in to inspect.`; };
  map.on('zoomend', updateZoomHint);
  updateZoomHint();
  document.querySelector('#reset').onclick = () => map.fitBounds(bounds, {padding: 25});
  status.textContent = `Built ${manifest.built_at.slice(0, 10)} · ${(manifest.bytes / 1048576).toFixed(2)} MiB · ${manifest.sources.length} NOAA cells · zooms ${manifest.minzoom}–${manifest.maxzoom}`;
}
start().catch(error => { status.textContent = error.message; });
