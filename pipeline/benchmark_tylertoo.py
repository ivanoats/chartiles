#!/usr/bin/env python3
"""Compare compilers on normalized GeoJSON from a retained ChartTiles build.

Run with the isolated Python environment containing tylertoo and PyArrow.
Does not publish archives or change the viewer manifest.
"""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform
import subprocess
import sys
import time

try:
    from .verify import verify
except ImportError:
    from verify import verify


def timed_command(args, prefix):
    started = time.monotonic()
    with prefix.with_suffix('.log').open('w') as log:
        subprocess.run(['/usr/bin/time', '-l', '-o', str(prefix.with_suffix('.time')),
                        *map(str, args)], stdout=log, stderr=log, check=True)
    metrics = {'wall_seconds': round(time.monotonic() - started, 3)}
    for line in prefix.with_suffix('.time').read_text().splitlines():
        if 'maximum resident set size' in line:
            metrics['peak_rss_bytes'] = int(line.split()[0])
    return metrics


def worker(snapshot, output, config, extent, merge_tool=None):
    import tylertoo
    reports = {}
    archives = []
    conversion_seconds = 0
    tiling_seconds = 0
    for layer in config['layers']:
        source = snapshot / f'{layer}.geojson'
        if not source.exists():
            continue
        parquet = output / f'{layer}.parquet'
        parquet.unlink(missing_ok=True)
        started = time.monotonic()
        subprocess.run(['ogr2ogr', '-f', 'Parquet', str(parquet), str(source),
                        '-overwrite', '-dim', 'XY', '-a_srs', 'EPSG:4326',
                        '-lco', 'COMPRESSION=ZSTD'], check=True)
        conversion_seconds += time.monotonic() - started
        started = time.monotonic()
        overview = output / f'{layer}-overview.parquet'
        archive = output / f'{layer}.pmtiles'
        ov = tylertoo.overview(str(parquet), str(overview),
                              min_zoom=config['minzoom'], max_zoom=config['maxzoom'],
                              simplify_factor=0, point_thinning=0, line_thinning=0,
                              polygon_thinning=0, line_visibility=0, polygon_visibility=0,
                              density_drop=False, coalesce_lines=False, no_auto_rank=True)
        ex = tylertoo.export_pmtiles(str(overview), str(archive), layer_name=layer,
                                    extent=extent, tile_buffer=8, tile_size_limit=0)
        tiling_seconds += time.monotonic() - started
        reports[layer] = {'overview': ov, 'export': ex}
        archives.append(archive)
    started = time.monotonic()
    if merge_tool:
        command = [str(merge_tool), 'pyramid', '-f', str(output / 'chart.pmtiles')]
        for archive in archives:
            command += ['--band', f"{config['minzoom']}-{config['maxzoom']}:{archive}:{archive.stem}"]
    else:
        command = ['tile-join', '-f', '-pk', '-o', str(output / 'chart.pmtiles'),
                   *map(str, archives)]
    subprocess.run(command, check=True)
    (output / 'worker-results.json').write_text(json.dumps({
        'geoparquet_seconds': conversion_seconds, 'tiling_seconds': tiling_seconds,
        'merge_seconds': time.monotonic() - started, 'layers': reports}, indent=2))


def preservation(archive, grouped, zoom):
    started = time.monotonic()
    try:
        existing_check = verify(archive, grouped, zoom)
    except (ValueError, KeyError) as error:
        existing_check = {'error': str(error)}
    decoded = json.loads(subprocess.check_output(
        ['tippecanoe-decode', f'-Z{zoom}', f'-z{zoom}', str(archive)]))
    seen = {}
    seen_layers = {}
    def visit(node, layer=None):
        if node['type'] == 'FeatureCollection':
            layer = node.get('properties', {}).get('layer', layer)
            for child in node['features']:
                visit(child, layer)
        else:
            props = node['properties']
            key = props.get('feature_key')
            if key:
                seen.setdefault(key, []).append(props)
                seen_layers.setdefault(key, set()).add(layer)
    visit(decoded)
    source_variants = {}
    for features in grouped.values():
        for feature in features:
            props = feature['properties']
            source_variants.setdefault(props['feature_key'], []).append(props)
    missing = []
    changed = []
    wrong_layers = []
    counts = {}
    for layer, features in grouped.items():
        absent = 0
        for feature in features:
            props = feature['properties']
            key = props['feature_key']
            copies = seen.get(key, [])
            if not copies:
                missing.append(key)
                absent += 1
                continue
            if seen_layers[key] != {layer}:
                wrong_layers.append({'feature_key': key, 'expected': layer,
                                     'actual': sorted(seen_layers[key])})
            # Check every tile copy, including buffer duplicates. MVT has no
            # array/object/null property type; those fields are outside this check.
            for field, value in props.items():
                if value is None or isinstance(value, (list, dict)):
                    continue
                def equal(actual, expected):
                    if isinstance(expected, (float, int)) and not isinstance(expected, bool):
                        return isinstance(actual, (float, int)) and abs(actual-expected) <= 1e-5
                    return actual == expected
                allowed = [variant.get(field) for variant in source_variants[key]]
                if (not any(equal(copy.get(field), value) for copy in copies) or
                    not all(any(equal(copy.get(field), expected) for expected in allowed)
                            for copy in copies)):
                    changed.append({'feature_key': key, 'field': field,
                                    'expected': value, 'actual': list({str(c.get(field)) for c in copies})})
        counts[layer] = {'input': len(features), 'retained': len(features)-absent}
    expected = {f['properties']['feature_key'] for fs in grouped.values() for f in fs}
    return {'existing_check': existing_check, 'zoom': zoom, 'counts': counts,
            'missing_features': missing, 'changed_scalar_properties': changed,
            'wrong_layers': wrong_layers,
            'duplicate_source_keys': {key: len(variants) for key, variants in source_variants.items()
                                      if len(variants) > 1},
            'unexpected_feature_keys': sorted(set(seen)-expected),
            'validation_seconds': round(time.monotonic()-started, 3),
            'limitations': 'Identity/scalar attribute check; geometry and portrayal are not validated.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--config', type=Path, default=Path('pipeline/puget-sound.json'))
    parser.add_argument('--extent', type=int, default=65536)
    parser.add_argument('--worker', action='store_true')
    parser.add_argument('--resume', action='store_true', help='Reuse a completed baseline with identical input hashes and config')
    parser.add_argument('--merge-tool', type=Path, help='tylertoo CLI for native pyramid layer merging; otherwise tile-join')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    config = json.loads(args.config.read_text())
    if args.worker:
        worker(args.snapshot, args.output, config, args.extent, args.merge_tool)
        return
    grouped = {layer: json.loads((args.snapshot / f'{layer}.geojson').read_text())['features']
               for layer in config['layers'] if (args.snapshot / f'{layer}.geojson').exists()}
    baseline = args.output / 'tippecanoe.pmtiles'
    command = ['tippecanoe', '-f', '-o', str(baseline), '-Z', str(config['minzoom']),
               '-z', str(config['maxzoom']), '--no-feature-limit', '--no-tile-size-limit',
               '--no-line-simplification', '--no-tiny-polygon-reduction', '--full-detail=16',
               '--drop-rate=1', '--buffer=8',
               f"--name={config.get('label', config['name'])} inspection prototype",
               '--attribution=NOAA ENC — experimental conversion']
    for layer in grouped:
        command += ['-L', f'{layer}:{args.snapshot / (layer + ".geojson")}']
    results = {'snapshot': str(args.snapshot.resolve()), 'config': config,
               'platform': platform.platform(), 'extent': args.extent,
               'versions': {name: importlib.metadata.version(name) for name in ('tylertoo', 'pyarrow')},
               'tippecanoe_version': subprocess.check_output(['tippecanoe', '--version'], text=True, stderr=subprocess.STDOUT).strip(),
               'method': 'One sequential run per compiler on identical normalized features; macOS time -l maximum RSS is largest process, not simultaneous process-tree memory.'}
    results['input_sha256'] = {layer: hashlib.sha256(
        (args.snapshot / f'{layer}.geojson').read_bytes()).hexdigest() for layer in grouped}
    results['source_manifest'] = json.loads((args.snapshot / 'manifest.json').read_text())
    results['merge_tool'] = str(args.merge_tool) if args.merge_tool else 'tile-join'
    if args.resume:
        previous = json.loads((args.output / 'results.json').read_text())
        if previous['input_sha256'] != results['input_sha256'] or previous['config'] != config:
            raise ValueError('Cannot resume: baseline inputs changed')
        results['tippecanoe'] = previous['tippecanoe']
    else:
        results['tippecanoe'] = timed_command(command, args.output / 'tippecanoe')
        results['tippecanoe']['bytes'] = baseline.stat().st_size
        results['tippecanoe']['preservation'] = preservation(baseline, grouped, config['maxzoom'])
    (args.output / 'results.json').write_text(json.dumps(results, indent=2))
    worker_args = [sys.executable, __file__, '--worker', '--snapshot', args.snapshot,
                   '--output', args.output / 'tylertoo', '--config', args.config,
                   '--extent', str(args.extent)]
    if args.merge_tool:
        worker_args += ['--merge-tool', args.merge_tool]
    results['tylertoo'] = timed_command(worker_args, args.output / 'tylertoo')
    archive = args.output / 'tylertoo/chart.pmtiles'
    results['tylertoo']['bytes'] = archive.stat().st_size
    results['tylertoo']['phases'] = json.loads((args.output / 'tylertoo/worker-results.json').read_text())
    results['tylertoo']['preservation'] = preservation(archive, grouped, config['maxzoom'])
    results['archive_sha256'] = {
        'tippecanoe': hashlib.sha256(baseline.read_bytes()).hexdigest(),
        'tylertoo': hashlib.sha256(archive.read_bytes()).hexdigest()}
    (args.output / 'results.json').write_text(json.dumps(results, indent=2))
    print(json.dumps({name: {k: v for k, v in results[name].items() if k not in ('phases', 'preservation')}
                      for name in ('tippecanoe', 'tylertoo')}, indent=2))


if __name__ == '__main__':
    main()
