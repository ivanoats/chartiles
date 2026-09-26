#!/usr/bin/env python3
"""Build an explicitly selected, single-scale NOAA ENC inspection bundle."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

try:
    from .verify import verify
except ImportError:
    from verify import verify

ROOT = Path(__file__).resolve().parents[1]
CATALOG = 'https://www.charts.noaa.gov/ENCs/ENCProdCat.xml'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def download(url, destination):
    request = urllib.request.Request(url, headers={'User-Agent': 'ChartTiles-prototype/0.1'})
    with urllib.request.urlopen(request, timeout=120) as response:
        destination.write_bytes(response.read())


def select_cells(xml, config):
    catalog = ET.fromstring(xml)
    records = {c.findtext('name'): c for c in catalog.findall('cell')}
    selected = []
    for name in config['cells']:
        c = records.get(name)
        if c is None or c.findtext('status') != 'Active':
            raise ValueError(f'{name} is missing or no longer active; review cell selection')
        if int(c.findtext('cscale')) != config.get('cell_scales', {}).get(name, config.get('scale')):
            raise ValueError(f'{name}: source scale changed; review cell selection')
        selected.append({key: c.findtext(key) for key in
                         ('name', 'lname', 'cscale', 'edtn', 'updn', 'isdt', 'zipfile_location')})
    return selected


def extract_zip(archive, destination):
    with zipfile.ZipFile(archive) as z:
        for member in z.infolist():
            target = (destination / member.filename).resolve()
            if not target.is_relative_to(destination.resolve()):
                raise ValueError('Unsafe archive path')
        z.extractall(destination)


def normalize(feature, cell, layer):
    props = feature.setdefault('properties', {})
    props['source_cell'] = cell
    props['source_layer'] = layer
    props['feature_key'] = f"{cell}:{layer}:{props.get('LNAM') or props.get('RCID')}"
    if layer == 'SOUNDG':
        geometry = feature['geometry']
        if geometry['type'] != 'Point' or len(geometry['coordinates']) < 3:
            raise ValueError('Expected split 3D sounding; refusing to lose depth')
        props['depth_m'] = geometry['coordinates'][2]
        props['feature_key'] += ':' + ','.join(map(str, geometry['coordinates']))
    return feature


def run(config_path, snapshot=None):
    started = time.monotonic()
    for tool in ('ogr2ogr', 'ogrinfo', 'tippecanoe', 'tippecanoe-decode'):
        if not shutil.which(tool):
            raise SystemExit(f'Missing {tool}. On macOS: brew install gdal tippecanoe')
    config = json.loads(config_path.read_text())
    work = ROOT / 'build'
    work.mkdir(exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=config['name'] + '-', dir=work))
    print(f'Build workspace: {stage}', flush=True)
    catalog_path = stage / 'catalog.xml'
    if snapshot:
        shutil.copyfile(snapshot / 'catalog.xml', catalog_path)
    else:
        download(CATALOG, catalog_path)
    cells = select_cells(catalog_path.read_bytes(), config)
    env = dict(os.environ, OGR_S57_OPTIONS='UPDATES=APPLY,SPLIT_MULTIPOINT=ON,ADD_SOUNDG_DEPTH=ON')
    grouped = {layer: [] for layer in config['layers']}
    counts = {}
    for cell in cells:
        name = cell['name']
        print(f'Downloading and extracting {name}', flush=True)
        # Construct the known NOAA endpoint rather than trusting URLs in the catalog.
        archive = stage / f'{name}.zip'
        if snapshot:
            shutil.copyfile(snapshot / f'{name}.zip', archive)
        else:
            download(f'https://www.charts.noaa.gov/ENCs/{name}.zip', archive)
        cell['sha256'] = digest(archive)
        dest = stage / name
        extract_zip(archive, dest)
        sources = list(dest.rglob(f'{name}.000'))
        if len(sources) != 1:
            raise ValueError(f'{name}: expected one base cell')
        source = sources[0]
        listing = subprocess.check_output(['ogrinfo', '-ro', '-so', str(source)], env=env, text=True)
        counts[name] = {}
        for layer in config['layers']:
            if f': {layer} ' not in listing and not any(line.endswith(f': {layer}') for line in listing.splitlines()):
                counts[name][layer] = 0
                continue
            output = stage / f'{name}-{layer}.json'
            subprocess.run(['ogr2ogr', '-f', 'GeoJSON', str(output), str(source), layer,
                            '-clipsrc', *map(str, config['bounds']), '-t_srs', 'EPSG:4326'],
                           env=env, check=True)
            features = json.loads(output.read_text())['features']
            grouped[layer].extend(normalize(f, name, layer) for f in features)
            counts[name][layer] = len(features)
    for required in ('LNDARE', 'COALNE', 'DEPARE', 'SOUNDG'):
        if not grouped[required]:
            raise ValueError(f'Empty required layer: {required}')
    args = ['tippecanoe', '-o', str(stage / 'chart.pmtiles'),
            '-Z', str(config['minzoom']), '-z', str(config['maxzoom']),
            '--no-feature-limit', '--no-tile-size-limit', '--no-line-simplification',
            '--no-tiny-polygon-reduction', '--full-detail=16', '--drop-rate=1', '--buffer=8',
            f"--name={config.get('label', config['name'])} inspection prototype", '--attribution=NOAA ENC — experimental conversion']
    for layer, features in grouped.items():
        if features:
            path = stage / f'{layer}.geojson'
            path.write_text(json.dumps({'type': 'FeatureCollection', 'features': features}))
            args += ['-L', f'{layer}:{path}']
    with (stage / 'tippecanoe.log').open('w') as log:
        subprocess.run(args, check=True, stderr=log)
    archive = stage / 'chart.pmtiles'
    validation = verify(archive, grouped, config['maxzoom'])
    sha = digest(archive)
    manifest = {
        'label': config.get('label', config['name'].replace('-', ' ').title()), 'validation': validation, 'region': config['name'], 'bounds': config['bounds'],
        'built_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'catalog_sha256': digest(catalog_path), 'sources': cells,
        'pmtiles_url': f'./charts/{sha}.pmtiles', 'sha256': sha,
        'bytes': archive.stat().st_size, 'build_seconds': round(time.monotonic() - started, 2),
        'minzoom': config['minzoom'], 'maxzoom': config['maxzoom'],
        'counts_by_cell': counts, 'counts': {k: len(v) for k, v in grouped.items()},
        'tools': {t: subprocess.check_output([t, '--version'], text=True, stderr=subprocess.STDOUT).strip()
                  for t in ('ogr2ogr', 'tippecanoe')},
        'limitations': ['Inspection only; not for navigation', 'No S-52 portrayal or scale-dependent filtering',
                        'Coverage and feature fidelity require manual review; zero counts do not establish absence of hazards']}
    target = ROOT / 'web/public/charts'
    target.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(archive, target / f'{sha}.pmtiles')
    (stage / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    shutil.copyfile(stage / 'manifest.json', target / 'manifest.tmp')
    os.replace(target / 'manifest.tmp', target / 'manifest.json')
    shutil.copyfile(stage / 'manifest.json', target / f"{config['name']}.json")
    print(json.dumps({'bytes': manifest['bytes'], 'seconds': manifest['build_seconds'], 'counts': manifest['counts']}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=ROOT / 'pipeline/shilshole.json')
    parser.add_argument('--snapshot', type=Path, help='Reuse catalog.xml and cell ZIPs from a retained build directory')
    options = parser.parse_args()
    run(options.config, options.snapshot)
