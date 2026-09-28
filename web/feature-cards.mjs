// Deliberately small S-57 vocabulary: unsupported values remain available verbatim.
export function list(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map(String);
  try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.map(String); } catch {}
  return [String(value)];
}
const colours = {'1': 'White', '3': 'Red', '4': 'Green', '6': 'Yellow'};
const abbreviations = {'1': 'W', '3': 'R', '4': 'G', '6': 'Y'};
const props = feature => feature.properties || feature;
const layer = feature => feature.sourceLayer || props(feature).source_layer || props(feature).layer;
const present = value => value !== undefined && value !== null && value !== '';
const number = value => present(value) && Number.isFinite(Number(value)) ? Number(value) : null;

export function describeFeature(feature, candidates = []) {
  const p = props(feature);
  const kind = layer(feature);
  const rows = [];
  let title = p.OBJNAM || kind || 'ENC feature';
  let summary = '';
  let note = '';
  if (kind === 'LIGHTS') {
    // Only explicit references within the same cell can supply a buoy name.
    const linked = [...new Map(candidates.filter(candidate => {
      const b = props(candidate);
      return ['BOYLAT', 'BOYSAW', 'BOYSPP'].includes(layer(candidate)) && p.source_cell
        && b.source_cell === p.source_cell && p.LNAM && list(b.LNAM_REFS).includes(p.LNAM);
    }).map(candidate => [props(candidate).feature_key || props(candidate).LNAM, props(candidate)])).values()];
    const colourCodes = list(p.COLOUR);
    const colour = colourCodes.map(code => colours[code] || `Unknown colour (${code})`).join(' / ');
    const flashing = String(p.LITCHR) === '2';
    title = p.OBJNAM || (linked.length === 1 && linked[0].OBJNAM) || `${colour || 'Unspecified colour'} light`;
    const period = number(p.SIGPER);
    summary = `${flashing ? 'Flashing' : 'Light characteristic'}${colour ? ' · ' + colour.toLowerCase() : ''}${period > 0 ? ` · every ${period} s` : ''}`;
    if (!flashing) rows.push(['Characteristic code', present(p.LITCHR) ? String(p.LITCHR) : 'Not recorded']);
    if (flashing && colourCodes.length && colourCodes.every(code => abbreviations[code]) && period > 0) {
      rows.push(['Chart notation', `Fl${present(p.SIGGRP) && p.SIGGRP !== '(1)' ? p.SIGGRP : ''} ${colourCodes.map(code => abbreviations[code]).join('')} ${period}s`]);
    }
    if (present(p.SIGGRP)) rows.push(['Signal group', String(p.SIGGRP)]);
    // This interpretation applies to flashing; occulting reverses light/eclipse order.
    const sequence = flashing && /^([0-9]+(?:\.[0-9]+)?)\+\(([0-9]+(?:\.[0-9]+)?)\)$/.exec(String(p.SIGSEQ));
    if (sequence) rows.push(['Timing', `${Number(sequence[1])} s lit · ${Number(sequence[2])} s dark`]);
    else if (present(p.SIGSEQ)) rows.push(['Signal sequence', String(p.SIGSEQ)]);
    if (linked.length === 1 && linked[0].OBJNAM) rows.push(['Buoy association', 'Explicit ENC reference']);
    else note = 'Buoy identity is not established by this selection.';
  } else if (kind === 'DEPARE') {
    title = 'Surrounding depth area';
    const low = number(p.DRVAL1), high = number(p.DRVAL2);
    summary = low !== null && high !== null ? `${low}–${high} m charted depth range` : 'Depth range incomplete';
    note = 'Area range, not a sounding at the selected feature or current water depth.';
  } else {
    summary = 'ENC attributes available below.';
  }
  if (present(p.source_cell)) rows.push(['NOAA cell', String(p.source_cell)]);
  if (present(p.SORDAT)) {
    const date = String(p.SORDAT);
    rows.push(['Feature source date', /^\d{8}$/.test(date) ? `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6)}` : date]);
    rows.push(['Date meaning', 'Recorded source date; not the chart update date.']);
  }
  if (present(p.SORIND)) rows.push(['Source reference', String(p.SORIND)]);
  return {kind, title, summary, rows, note};
}

export function renderFeatureCards(container, features, candidates = []) {
  container.replaceChildren();
  const ordered = [...features].sort((a, b) => (layer(a) === 'DEPARE') - (layer(b) === 'DEPARE'));
  for (const feature of ordered) {
    const card = describeFeature(feature, candidates);
    const article = document.createElement('article');
    article.className = 'feature-card';
    article.dataset.kind = card.kind || 'unknown';
    const append = (tag, text) => { const node = document.createElement(tag); node.textContent = text; article.append(node); };
    append('h3', card.title);
    append('p', card.summary);
    const dl = document.createElement('dl');
    for (const [label, value] of card.rows) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value; dl.append(dt, dd);
    }
    article.append(dl);
    if (card.note) append('p', card.note);
    container.append(article);
  }
}
