"""Shared validation for local, content-addressed chart artifacts."""
import hashlib
import math
from pathlib import Path
import re
import struct


def digest(path):
    hasher = hashlib.sha256()
    with Path(path).open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            hasher.update(block)
    return hasher.hexdigest()


def raster_header(path):
    with Path(path).open('rb') as source:
        header = source.read(127)
    if len(header) != 127 or header[:8] != b'PMTiles\x03':
        raise ValueError('Expected a PMTiles v3 archive')
    if header[99] not in (2, 3, 4):
        raise ValueError('Expected PNG, JPEG or WebP raster tiles')
    return {'tile_type': {2: 'png', 3: 'jpg', 4: 'webp'}[header[99]],
            'minzoom': header[100], 'maxzoom': header[101],
            'bounds': [v / 1e7 for v in struct.unpack_from('<4i', header, 102)]}


def validate_raster_descriptor(item):
    bounds = item.get('bounds', [])
    if (len(bounds) != 4 or not all(isinstance(v, (int, float)) and math.isfinite(v) for v in bounds)
            or not -180 <= bounds[0] < bounds[2] <= 180
            or not -85.051129 <= bounds[1] < bounds[3] <= 85.051129):
        raise ValueError('Invalid raster bounds')
    if not all(type(item.get(k)) is int for k in ('minzoom', 'maxzoom')) or not 0 <= item['minzoom'] <= item['maxzoom'] <= 24:
        raise ValueError('Invalid raster zoom range')
    if item.get('tile_size') not in (256, 512) or item.get('tile_type') not in ('png', 'jpg', 'webp'):
        raise ValueError('Unsupported raster tile format or size')
    if not isinstance(item.get('attribution'), str) or not item['attribution']:
        raise ValueError('Raster attribution is required')


def archive_file(charts, item, raster=False):
    sha = item.get('sha256', '')
    if not re.fullmatch('[a-f0-9]{64}', sha):
        raise ValueError('Invalid archive SHA-256')
    path = charts / f'{sha}.pmtiles'
    if item.get('pmtiles_url') != f'./charts/{path.name}':
        raise ValueError('Expected a local content-addressed archive URL')
    if path.stat().st_size != item.get('bytes') or digest(path) != sha:
        raise ValueError('Archive size or checksum does not match manifest')
    if raster:
        validate_raster_descriptor(item)
        header = raster_header(path)
        for field in ('tile_type', 'minzoom', 'maxzoom'):
            if header[field] != item[field]:
                raise ValueError(f'Raster {field} does not match archive')
        if any(abs(a-b) > 1e-6 for a, b in zip(header['bounds'], item['bounds'])):
            raise ValueError('Raster bounds do not match archive')
    return path


def validate_version(manifest):
    if manifest.get('schema_version', 1) not in (1, 2):
        raise ValueError('Unsupported manifest version')
    if manifest.get('raster') and manifest.get('schema_version') != 2:
        raise ValueError('Raster descriptor requires manifest version 2')
