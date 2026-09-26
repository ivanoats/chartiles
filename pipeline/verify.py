"""Check feature identities and sounding depths survive tiling at maximum zoom."""
import json
import subprocess


def verify(archive, grouped, zoom):
    decoded = json.loads(subprocess.check_output(['tippecanoe-decode', f'-Z{zoom}', f'-z{zoom}', str(archive)]))
    seen = {}
    def visit(node):
        if node['type'] == 'FeatureCollection':
            for child in node['features']:
                visit(child)
        else:
            props = node['properties']
            key = props['feature_key']
            seen[key] = props
    visit(decoded)
    checked = 0
    for layer, features in grouped.items():
        for feature in features:
            props = feature['properties']
            key = props['feature_key']
            if key not in seen:
                raise ValueError(f'Feature disappeared during tiling: {key}')
            if layer == 'SOUNDG' and abs(seen[key]['depth_m'] - props['depth_m']) > 0.00001:
                raise ValueError(f'Sounding depth changed: {key}')
            checked += 1
    return {'zoom': zoom, 'features_checked': checked, 'missing_features': 0,
            'note': 'Identity retention only; does not validate geometry, coverage, or portrayal'}
