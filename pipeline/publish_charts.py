"""Validate and upload the current chart bundle to R2; dry-run by default."""

import argparse
import hashlib
import json
from pathlib import Path
import shlex
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bucket', default='chartiles-charts')
    parser.add_argument('--upload', action='store_true', help='Write to remote R2')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    charts = root / 'web/public/charts'
    manifest_path = charts / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    digest = manifest['sha256']
    if len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest):
        raise SystemExit('Invalid archive SHA-256 in manifest')
    archive = charts / f'{digest}.pmtiles'
    if manifest['pmtiles_url'] != f'./charts/{archive.name}':
        raise SystemExit('Expected a local content-addressed archive URL')
    if archive.stat().st_size != manifest['bytes']:
        raise SystemExit('Archive size does not match manifest')
    hasher = hashlib.sha256()
    with archive.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            hasher.update(chunk)
    if hasher.hexdigest() != digest:
        raise SystemExit('Archive checksum does not match manifest')
    files = [(archive, 'application/octet-stream')]
    coverage = [charts / f'{digest}-coverage{suffix}' for suffix in ('.json', '.geojson')]
    if any(path.exists() for path in coverage):
        if not all(path.is_file() for path in coverage):
            raise SystemExit('Coverage audit requires both JSON and GeoJSON files')
        for path in coverage:
            json.loads(path.read_text())
            files.append((path, 'application/geo+json' if path.suffix == '.geojson' else 'application/json'))
    # Publish the pointer only after all of its data has uploaded successfully.
    files.append((manifest_path, 'application/json'))
    for path, content_type in files:
        cache = 'no-cache' if path == manifest_path else 'public, max-age=31536000, immutable'
        command = ['npx', '--yes', 'wrangler@4.142.0', 'r2', 'object', 'put',
                   f'{args.bucket}/charts/{path.name}', '--remote',
                   '--file', str(path.relative_to(root)), '--content-type', content_type,
                   '--cache-control', cache]
        print(shlex.join(command), flush=True)
        if args.upload:
            subprocess.run(command, cwd=root, check=True)
    print('Upload complete.' if args.upload else 'Validated dry run. Use --upload to publish.')


if __name__ == '__main__':
    main()
