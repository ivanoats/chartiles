"""Compare NOAA catalog revisions and optionally ZIP payloads with a retained build."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET
import zipfile
try:
    from .build import CATALOG, download, digest
except ImportError:
    from build import CATALOG, download, digest

REVISION_FIELDS = ('edtn', 'updn', 'isdt', 'cscale')


def compare_catalog(sources, xml):
    records = {c.findtext('name'): c for c in ET.fromstring(xml).findall('cell')}
    changed, unavailable = [], []
    for old in sources:
        cell = records.get(old['name'])
        if cell is None or cell.findtext('status') != 'Active':
            unavailable.append(old['name'])
            continue
        differences = {key: {'before': old.get(key), 'after': cell.findtext(key)}
                       for key in REVISION_FIELDS if old.get(key) != cell.findtext(key)}
        if differences:
            changed.append({'cell': old['name'], 'fields': differences})
    return changed, unavailable


def payloads(path):
    # Ignore ZIP packaging metadata. Retain member paths and hashes of actual bytes.
    with zipfile.ZipFile(path) as z:
        return {item.filename: hashlib.sha256(z.read(item)).hexdigest()
                for item in z.infolist() if not item.is_dir()}


def check(snapshot, verify_downloads=False):
    manifest = json.loads((snapshot / 'manifest.json').read_text())
    output = Path(tempfile.mkdtemp(prefix='update-check-', dir=snapshot.parent))
    catalog = output / 'catalog.xml'
    download(CATALOG, catalog)
    changes, unavailable = compare_catalog(manifest['sources'], catalog.read_bytes())
    report = {'checked_at': datetime.now(timezone.utc).isoformat(), 'region': manifest['region'],
              'baseline_archive_sha256': manifest['sha256'], 'baseline_build': manifest['built_at'],
              'current_catalog_sha256': digest(catalog), 'cells_checked': len(manifest['sources']),
              'catalog_changes': changes, 'unavailable_cells': unavailable,
              'full_archive_bytes': manifest['bytes'], 'download_verification': None,
              'pmtiles_delta_bytes': None,
              'limitation': 'Source changes are not PMTiles deltas. Archive delta size requires a second build with identical settings.'}
    if verify_downloads:
        if unavailable:
            raise ValueError('Review unavailable or cancelled cells before downloading')
        def compare(source):
            name = source['name']
            previous = snapshot / f'{name}.zip'
            if digest(previous) != source['sha256']:
                raise ValueError(f'Baseline ZIP does not match recorded hash: {name}')
            current = output / f'{name}.zip'
            download(f'https://www.charts.noaa.gov/ENCs/{name}.zip', current)
            before, after = payloads(previous), payloads(current)
            changed_members = sorted(k for k in before.keys() | after.keys() if before.get(k) != after.get(k))
            return {'cell': name, 'bytes': current.stat().st_size,
                    'zip_changed': digest(current) != source['sha256'], 'changed_members': changed_members}
        with ThreadPoolExecutor(max_workers=4) as pool:
            comparisons = list(pool.map(compare, manifest['sources']))
        report['download_verification'] = {
            'downloaded_bytes': sum(c['bytes'] for c in comparisons),
            'changed_zip_count': sum(c['zip_changed'] for c in comparisons),
            'changed_payload_cells': [c for c in comparisons if c['changed_members']],
            'comparisons': comparisons}
    (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Report: {output / "report.json"}')
    print(json.dumps({k: v for k, v in report.items() if k != 'download_verification'}, indent=2))
    if report['download_verification']:
        print(json.dumps({k: v for k, v in report['download_verification'].items() if k != 'comparisons'}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot', type=Path)
    parser.add_argument('--verify-downloads', action='store_true', help='Download every selected cell and compare uncompressed ZIP members')
    args = parser.parse_args()
    check(args.snapshot, args.verify_downloads)
