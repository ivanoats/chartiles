// Raster and vector portrayal are independent; no feature picking through imagery.
export function rasterDescriptor(manifest) {
  if (![1, 2].includes(manifest.schema_version ?? 1)) throw new Error('Unsupported chart manifest version');
  const r = manifest.raster;
  if (!r) return null;
  const b = r.bounds;
  if (manifest.schema_version !== 2 || !/^[a-f0-9]{64}$/.test(r.sha256)
      || r.pmtiles_url !== `./charts/${r.sha256}.pmtiles`
      || !Array.isArray(b) || b.length !== 4 || !b.every(Number.isFinite)
      || !(b[0] >= -180 && b[0] < b[2] && b[2] <= 180 && b[1] >= -85.051129 && b[1] < b[3] && b[3] <= 85.051129)
      || !Number.isInteger(r.minzoom) || !Number.isInteger(r.maxzoom)
      || !(r.minzoom >= 0 && r.minzoom <= r.maxzoom && r.maxzoom <= 24)
      || ![256, 512].includes(r.tile_size) || !['png', 'jpg', 'webp'].includes(r.tile_type)
      || typeof r.attribution !== 'string' || !r.attribution) throw new Error('Invalid raster chart descriptor');
  return r;
}

export function installChartModes(map, manifest, raster, rasterState, setInteraction, clearSelection) {
  const panel = document.createElement('div');
  panel.className = 'maplibregl-ctrl maplibregl-ctrl-group chart-modes';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Chart display');
  panel.innerHTML = '<button type="button" id="chart-view">Chart view</button><button type="button" id="feature-view">Inspect features</button>';
  map.addControl({onAdd: () => panel, onRemove: () => panel.remove()}, 'top-left');
  const chartButton = panel.querySelector('#chart-view');
  const featureButton = panel.querySelector('#feature-view');
  chartButton.disabled = !raster;
  chartButton.title = raster ? 'Pre-rendered NOAA imagery' : 'No raster chart installed';
  let current = raster ? 'chart' : 'features';
  const report = document.querySelector('#raster-status');
  const updateStatus = () => {
    if (current !== 'chart') return;
    const c = map.getCenter();
    const b = raster.bounds;
    const messages = ['Chart images cannot be inspected. Switch to Inspect features for ENC attributes.'];
    if (c.lng < b[0] || c.lng > b[2] || c.lat < b[1] || c.lat > b[3]) messages.push('Map center is outside the raster archive bounds.');
    if (map.getZoom() > raster.maxzoom) messages.push(`Overzoom: native imagery ends at zoom ${raster.maxzoom}; no additional detail.`);
    if (map.getZoom() < raster.minzoom) messages.push(`Zoom in to ${raster.minzoom} to see chart imagery.`);
    messages.push('Blank areas may have no chart imagery; archive bounds do not prove coverage.');
    if (rasterState.error) messages.unshift(`Chart imagery unavailable: ${rasterState.error}. Use Inspect features to continue.`);
    report.textContent = messages.join(' ');
    document.querySelector('#status').textContent = `NOAA NCDS · ${(raster.bytes / 1048576).toFixed(2)} MiB · Publication date: ${raster.publication_date || 'unknown'} · Source file last modified: ${raster.source_last_modified || 'unknown'} · Imported: ${raster.imported_at?.slice(0, 10) || 'unknown'}`;
  };
  const apply = () => {
    const isChart = current === 'chart';
    document.querySelector('#map').classList.toggle('chart-active', isChart);
    document.querySelector('#vector-panel').hidden = isChart;
    report.hidden = !isChart;
    document.querySelector('#view-heading').textContent = isChart ? 'NOAA chart imagery' : 'Inspect the source';
    chartButton.setAttribute('aria-pressed', String(isChart));
    featureButton.setAttribute('aria-pressed', String(!isChart));
    document.querySelector('#inspect-mode').disabled = isChart;
    document.querySelector('#inspect-mode').title = isChart ? 'Switch to Inspect features to identify ENC objects' : 'Inspect features (Ctrl+Shift+I)';
    // Style remains loaded: preserve camera, sources, and existing event handlers.
    for (const layer of map.getStyle().layers) {
      if (layer.source === 'enc') {
        const checked = document.querySelector(`#layers input[data-layer="${layer['source-layer']}"]`)?.checked ?? true;
        map.setLayoutProperty(layer.id, 'visibility', !isChart && checked ? 'visible' : 'none');
      }
      if (isChart && layer.source === 'coverage-audit') map.setLayoutProperty(layer.id, 'visibility', 'none');
    }
    const coverage = document.querySelector('.coverage-control button');
    if (isChart && coverage?.getAttribute('aria-pressed') === 'true') coverage.click();
    if (map.getLayer('raster-chart')) map.setLayoutProperty('raster-chart', 'visibility', isChart ? 'visible' : 'none');
    clearSelection();
    setInteraction(isChart ? 'pan' : 'inspect');
    if (isChart) {
      document.querySelector('#mode-hint').textContent = 'Drag to pan. Scroll to zoom. Symbols and labels are part of the chart image.';
      updateStatus();
    } else {
      document.querySelector('#status').textContent = `Built ${manifest.built_at.slice(0, 10)} · ${(manifest.bytes / 1048576).toFixed(2)} MiB · ${manifest.sources.length} NOAA cells · zooms ${manifest.minzoom}–${manifest.maxzoom}`;
    }
  };
  chartButton.onclick = () => { current = 'chart'; apply(); };
  featureButton.onclick = () => { current = 'features'; apply(); };
  map.on('moveend', updateStatus);
  map.on('error', event => {
    if (event.sourceId === 'raster-chart') {
      rasterState.error = event.error.message;
      updateStatus();
    }
  });
  apply();
}
