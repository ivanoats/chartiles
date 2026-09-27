"""Convert a retained NOAA raster MBTiles file and attach it to the current manifest."""
import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import shutil
import sqlite3
import struct
import subprocess
import tempfile

try:
    from .chart_manifest import digest, raster_header, validate_raster_descriptor
except ImportError:
    from chart_manifest import digest, raster_header, validate_raster_descriptor

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = 'https://distribution.charts.noaa.gov/ncds/mbtiles/ncds_20c.mbtiles'
SAMPLES = {'Shilshole': (-122.411, 47.681), 'Hood Canal': (-122.91, 47.65),
           'Southern inlets': (-122.91, 47.15), 'Admiralty Inlet': (-122.70, 48.02)}


def sample_tiles(db, archive, minzoom, maxzoom):
    results = []
    for name, (lon, lat) in SAMPLES.items():
        for zoom in sorted({minzoom, maxzoom, min(maxzoom, max(minzoom, 12))}):
            n = 2 ** zoom
            x = int((lon + 180) / 360 * n)
            y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
            row = db.execute('SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?',
                             (zoom, x, n - 1 - y)).fetchone()
            if not row:
                results.append({'location': name, 'zoom': zoom, 'present': False})
                continue
            converted = subprocess.check_output(['pmtiles', 'tile', str(archive), str(zoom), str(x), str(y)])
            if converted != row[0]:
                raise ValueError(f'Converted tile differs at {name} zoom {zoom}')
            results.append({'location': name, 'zoom': zoom, 'present': True, 'payload_matches': True})
    if not any(r['present'] for r in results):
        raise ValueError('No sample tiles found in the pilot area')
    return results


def run(source, source_url, last_modified=None):
    source = source.resolve()
    charts = ROOT / 'web/public/charts'
    manifest_path = charts / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    tool = shutil.which('pmtiles')
    if not tool:
        raise ValueError('Install the PMTiles CLI before importing')
    with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as db, tempfile.TemporaryDirectory(dir=ROOT/'build') as folder:
        metadata = dict(db.execute('SELECT name, value FROM metadata'))
        if metadata.get('format') != 'png':
            raise ValueError('Importer currently supports PNG MBTiles only')
        blob = db.execute('SELECT tile_data FROM tiles LIMIT 1').fetchone()[0]
        if blob[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError('Expected PNG tile payload')
        width, height = struct.unpack_from('>II', blob, 16)
        if width != height or width not in (256, 512):
            raise ValueError('Unsupported tile dimensions')
        output = Path(folder) / 'raster.pmtiles'
        subprocess.run(['pmtiles', 'convert', str(source), str(output)], check=True)
        subprocess.run(['pmtiles', 'verify', str(output)], check=True)
        header = raster_header(output)
        samples = sample_tiles(db, output, header['minzoom'], header['maxzoom'])
        sha = digest(output)
        descriptor = {**header, 'tile_size': width, 'sha256': sha,
                      'pmtiles_url': f'./charts/{sha}.pmtiles', 'bytes': output.stat().st_size,
                      'attribution': 'NOAA Office of Coast Survey · NCDS',
                      'publication_date': None, 'source_last_modified': last_modified,
                      'imported_at': datetime.now(timezone.utc).isoformat(),
                      'provenance': {'source_url': source_url, 'source_sha256': digest(source),
                                     'source_bytes': source.stat().st_size, 'source_metadata': metadata,
                                     'converter_version': subprocess.check_output(['pmtiles', 'version'], text=True).strip(),
                                     'converter_sha256': digest(tool), 'samples': samples,
                                     'note': 'Tile presence and byte equality do not establish chart coverage or currency.'}}
        validate_raster_descriptor(descriptor)
        shutil.copyfile(output, charts / f'{sha}.pmtiles')
        manifest.update(schema_version=2, raster=descriptor)
        temporary = manifest_path.with_suffix('.tmp')
        temporary.write_text(json.dumps(manifest, indent=2) + '\n')
        temporary.replace(manifest_path)
        print(json.dumps(descriptor, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--source-url', default=SOURCE_URL)
    parser.add_argument('--last-modified', help='Upstream HTTP Last-Modified; not a chart publication date')
    args = parser.parse_args()
    run(args.source, args.source_url, args.last_modified)
