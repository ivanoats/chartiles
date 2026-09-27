"""Package the current static build with only its active chart and matching audit."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import zipfile

try:
    from .chart_manifest import archive_file, digest, validate_version
except ImportError:
    from chart_manifest import archive_file, digest, validate_version

ROOT = Path(__file__).resolve().parents[1]


def coverage_files(charts, sha):
    pair = [charts/f'{sha}-coverage{suffix}' for suffix in ('.json', '.geojson')]
    if not any(p.exists() for p in pair):
        return []
    if not all(p.is_file() for p in pair):
        raise ValueError('Coverage audit requires both JSON and GeoJSON files')
    report, geometry = [json.loads(p.read_text()) for p in pair]
    if report.get('archive_sha256') != sha or geometry.get('type') != 'FeatureCollection':
        raise ValueError('Coverage audit does not match the archive or expected format')
    return pair


def package(include_raster=False):
    site = ROOT/'dist'
    manifest = json.loads((site/'charts/manifest.json').read_text())
    validate_version(manifest)
    manifest = copy.deepcopy(manifest)
    sha = manifest['sha256']
    archive = archive_file(site/'charts', manifest)
    files = [p for p in site.rglob('*') if p.is_file() and 'charts' not in p.relative_to(site).parts]
    files.append(archive)
    files += coverage_files(site/'charts', sha)
    if include_raster:
        if not manifest.get('raster'):
            raise ValueError('No raster descriptor; import a raster archive first')
        files.append(archive_file(site/'charts', manifest['raster'], raster=True))
    else:
        manifest.pop('raster', None)
        manifest.pop('schema_version', None)
    manifest_bytes = (json.dumps(manifest, indent=2) + '\n').encode()
    hashes = {f'site/{p.relative_to(site).as_posix()}': digest(p) for p in files}
    hashes['site/charts/manifest.json'] = hashlib.sha256(manifest_bytes).hexdigest()
    print(f"Packaging {sum(p.stat().st_size for p in files) / 1048576:.2f} MiB of files; raster={include_raster}", flush=True)
    server = ROOT/'onboard/serve.py'
    hashes['serve.py'] = digest(server)
    variant = f"-raster-{manifest['raster']['sha256'][:12]}" if include_raster else ''
    output = ROOT/'build'/f"chartiles-{manifest['region']}-{sha[:12]}{variant}-offline.zip"
    output.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for p in files: z.write(p, f'site/{p.relative_to(site).as_posix()}')
        z.writestr('site/charts/manifest.json', manifest_bytes)
        z.write(server, 'serve.py')
        z.writestr('SHA256SUMS', ''.join(f'{value}  {name}\n' for name, value in sorted(hashes.items())))
        z.writestr('README.txt', 'ChartTiles offline inspection bundle\n\nRequires Python 3.10+. No Node.js or internet needed after extraction.\nRun: python3 serve.py\nOpen: http://127.0.0.1:8080/\nStop with Ctrl+C. Change port with --port 8081.\n\nDo not open index.html directly. Server binds to localhost only.\nExperimental software, not for navigation. Vector symbols are simplified; raster images have separate source dates.\nCharts reflect the source dates in site/charts/manifest.json.\nSHA256SUMS verifies individual files; it is not a digital signature.\n')
    output.with_suffix('.zip.sha256').write_text(digest(output)+'  '+output.name+'\n')
    print(output)
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--include-raster', action='store_true', help='Include raster imagery as well as vector inspection')
    package(parser.parse_args().include_raster)
