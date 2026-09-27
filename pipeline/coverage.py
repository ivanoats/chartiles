"""Audit extracted ENC coverage. Uncovered rectangle area includes land, not just water."""
import argparse
import json
from pathlib import Path
from itertools import combinations
from shapely.geometry import shape, mapping, box
from shapely.ops import unary_union, transform
from pyproj import Transformer


def audit(features, bounds):
    cells = {}
    for feature in features:
        p = feature['properties']
        geometry = shape(feature['geometry'])
        if not geometry.is_valid:
            raise ValueError(f"Invalid coverage geometry: {p['source_cell']}")
        if p['CATCOV'] not in (1, 2):
            raise ValueError('Unknown CATCOV')
        cells.setdefault(p['source_cell'], {1: [], 2: []})[p['CATCOV']].append(geometry)
    region = box(*bounds)
    coverage = {name: unary_union(parts[1]).difference(unary_union(parts[2])).intersection(region)
                for name, parts in cells.items()}
    covered = unary_union(list(coverage.values()))
    # UTM zone 10N is suitable for this Puget Sound audit, not arbitrary global regions.
    project = Transformer.from_crs(4326, 32610, always_xy=True).transform
    area = lambda g: transform(project, g.segmentize(0.001)).area
    output = []
    def add(kind, geom, **props):
        if not geom.is_empty:
            output.append({'type': 'Feature', 'properties': {'kind': kind, **props}, 'geometry': mapping(geom)})
    add('uncovered', region.difference(covered))
    overlaps = []
    for (a, ga), (b, gb) in combinations(coverage.items(), 2):
        intersection = ga.intersection(gb)
        sqm = area(intersection)
        if sqm > 0:
            overlaps.append({'cells': [a, b], 'square_metres': sqm})
            add('overlap', intersection, cells=f'{a}, {b}', square_metres=sqm)
    for name, geom in coverage.items():
        add('cell', geom, source_cell=name)
    add('boundary', region)
    return {'cells': len(cells), 'rectangle_km2': area(region)/1e6,
            'covered_km2': area(covered)/1e6, 'uncovered_km2': area(region.difference(covered))/1e6,
            'overlap_pairs': overlaps,
            'limitations': 'Coverage footprints only. Uncovered area includes land. No conclusion about water gaps, survey accuracy or feature agreement at seams.'}, {'type': 'FeatureCollection', 'features': output}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot', type=Path)
    args = parser.parse_args()
    manifest = json.loads((args.snapshot/'manifest.json').read_text())
    features = json.loads((args.snapshot/'M_COVR.geojson').read_text())['features']
    report, geojson = audit(features, manifest['bounds'])
    report['archive_sha256'] = manifest['sha256']
    target = Path(__file__).resolve().parents[1]/'web/public/charts'
    for suffix, data in [('coverage.json', report), ('coverage.geojson', geojson)]:
        (target/f"{manifest['sha256']}-{suffix}").write_text(json.dumps(data, indent=2)+'\n')
    print(json.dumps(report, indent=2))
