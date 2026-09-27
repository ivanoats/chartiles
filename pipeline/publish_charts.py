"""Validate and upload the current chart bundle to R2; dry-run by default."""

import argparse
import json
from pathlib import Path
import re
import shlex
import subprocess


try:
    from .chart_manifest import archive_file, validate_version
except ImportError:
    from chart_manifest import archive_file, validate_version


def bucket_name(value):
    # A deliberately narrow name format prevents option prefixes and path injection.
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,61}[a-z0-9]', value):
        raise argparse.ArgumentTypeError(
            'Bucket must be 3–63 lowercase letters, digits or hyphens, with alphanumeric ends')
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bucket', type=bucket_name, default='chartiles-charts')
    parser.add_argument('--upload', action='store_true', help='Write to remote R2')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    files = validated_files(root)
    for path, content_type in files:
        publish_file(root, args.bucket, path, content_type, args.upload)
    print('Upload complete.' if args.upload else 'Validated dry run. Use --upload to publish.')


def validated_files(root):
    charts = root / 'web/public/charts'
    manifest_path = charts / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    validate_version(manifest)
    digest = manifest['sha256']
    archive = archive_file(charts, manifest)
    files = [(archive, 'application/octet-stream')]
    if manifest.get('raster'):
        files.append((archive_file(charts, manifest['raster'], raster=True), 'application/octet-stream'))
    coverage = [charts / f'{digest}-coverage{suffix}' for suffix in ('.json', '.geojson')]
    if any(path.exists() for path in coverage):
        if not all(path.is_file() for path in coverage):
            raise SystemExit('Coverage audit requires both JSON and GeoJSON files')
        for path in coverage:
            json.loads(path.read_text())
            files.append((path, 'application/geo+json' if path.suffix == '.geojson' else 'application/json'))
    # Publish the pointer only after all of its data has uploaded successfully.
    files.append((manifest_path, 'application/json'))
    return files


def publish_file(root, bucket, path, content_type, upload):
    target = f'{bucket}/charts/{path.name}'
    local_file = path.relative_to(root).as_posix()
    filename = r'(?:manifest\.json|[a-f0-9]{64}(?:\.pmtiles|-coverage\.(?:json|geojson)))'
    # Validate the complete arguments here, immediately before the CLI boundary.
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,61}[a-z0-9]/charts/' + filename, target):
        raise ValueError('Invalid upload target')
    if not re.fullmatch(r'web/public/charts/' + filename, local_file):
        raise ValueError('Invalid upload file')
    if content_type not in ('application/json', 'application/geo+json', 'application/octet-stream'):
        raise ValueError('Invalid content type')
    cache = 'no-cache' if path.name == 'manifest.json' else 'public, max-age=31536000, immutable'
    command = ['npx', '--yes', 'wrangler@4.142.0', 'r2', 'object', 'put',
               target, '--remote', '--file', local_file, '--content-type', content_type,
               '--cache-control', cache]
    print(shlex.join(command), flush=True)
    if upload:
        subprocess.run(command, cwd=root, check=True)


if __name__ == '__main__':
    main()
