export async function installCoverage(map, manifest) {
  const panel = document.createElement('div');
  panel.className = 'maplibregl-ctrl maplibregl-ctrl-group coverage-control';
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.textContent = 'Coverage'; toggle.title = 'Show coverage footprints and uncovered areas';
  toggle.setAttribute('aria-pressed', 'false'); toggle.disabled = true;
  panel.append(toggle);
  map.addControl({onAdd: () => panel, onRemove: () => panel.remove()}, 'bottom-left');
  const note = document.querySelector('#coverage-status');
  try {
    const response = await fetch(`./charts/${manifest.sha256}-coverage.json`);
    if (!response.ok) { note.textContent = 'No coverage audit for this build.'; return; }
    const report = await response.json();
    map.addSource('coverage-audit', {type: 'geojson', data: `./charts/${manifest.sha256}-coverage.geojson`});
    for (const [kind, color] of [['uncovered', '#525a61'], ['overlap', '#d81b60']]) {
      map.addLayer({id: `audit-${kind}`, type: 'fill', source: 'coverage-audit',
        filter: ['==', ['get', 'kind'], kind], layout: {visibility: 'none'}, paint: {'fill-color': color, 'fill-opacity': 0.35}});
    }
    map.addLayer({id: 'audit-cells', type: 'line', source: 'coverage-audit', filter: ['==', ['get', 'kind'], 'cell'],
      layout: {visibility: 'none'}, paint: {'line-color': '#176fc1', 'line-width': 1.5}});
    let enabled = false;
    toggle.disabled = false;
    toggle.onclick = () => {
      enabled = !enabled;
      toggle.setAttribute('aria-pressed', String(enabled));
      for (const id of ['audit-uncovered', 'audit-overlap', 'audit-cells']) map.setLayoutProperty(id, 'visibility', enabled ? 'visible' : 'none');
    };
    note.textContent = `${report.cells} coverage footprints · ${report.overlap_pairs.length} overlapping pairs. Coverage overlay: blue boundaries, grey uncovered, magenta overlaps. Uncovered includes land; water gaps are not yet classified.`;
  } catch (error) { note.textContent = `Coverage audit unavailable: ${error.message}`; }
}
