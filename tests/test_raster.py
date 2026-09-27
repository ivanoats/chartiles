import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch
import zipfile
from pipeline.chart_manifest import archive_file, digest, raster_header, validate_version
from pipeline.publish_charts import validated_files, main
from pipeline import package_offline


def make_bundle(root):
    charts = root / 'web/public/charts'
    charts.mkdir(parents=True)
    vector = charts/'vector'
    vector.write_bytes(b'vector-fixture')
    sha = digest(vector)
    vector.rename(charts/f'{sha}.pmtiles')
    manifest = {'sha256': sha, 'bytes': 14, 'pmtiles_url': f'./charts/{sha}.pmtiles', 'region': 'test'}
    header = bytearray(127)
    header[:8] = b'PMTiles\x03'
    header[99:102] = bytes([2, 0, 16])
    struct.pack_into('<4i', header, 102, -1240000000, 470000000, -1220000000, 490000000)
    raster = charts/'raster'
    raster.write_bytes(header)
    rsha = digest(raster)
    raster.rename(charts/f'{rsha}.pmtiles')
    manifest.update(schema_version=2, raster={'sha256': rsha, 'bytes':127,
        'pmtiles_url': f'./charts/{rsha}.pmtiles', 'tile_type':'png', 'tile_size':256,
        'bounds':[-124,47,-122,49], 'minzoom':0, 'maxzoom':16, 'attribution':'NOAA'})
    (charts/'manifest.json').write_text(json.dumps(manifest))
    return charts, manifest


class RasterTests(unittest.TestCase):
    def test_real_converter_header_with_zero_minzoom(self):
        # Captured bytes from a CLI-converted NOAA archive, not a synthetic layout.
        header = Path(__file__).parent/'fixtures/noaa-raster-v3-header.bin'
        self.assertEqual(raster_header(header), {
            'tile_type': 'png', 'minzoom': 0, 'maxzoom': 16,
            'bounds': [-129.917222, 47.008889, -116.333333, 60.333333],
        })

    def test_rejects_unsafe_url_and_mismatched_header(self):
        with tempfile.TemporaryDirectory() as folder:
            charts, manifest = make_bundle(Path(folder))
            raster = manifest['raster']
            self.assertTrue(archive_file(charts, raster, raster=True).exists())
            for field, value in [('pmtiles_url','../secret'), ('bounds',[-124,47,-122,48]),
                                 ('tile_type','jpg'), ('minzoom',3), ('maxzoom',30),
                                 ('sha256','../bad'), ('tile_size',128)]:
                item = dict(raster, **{field:value})
                with self.subTest(field=field), self.assertRaises(ValueError):
                    archive_file(charts, item, raster=True)

    def test_both_archives_precede_manifest(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            charts, manifest = make_bundle(root)
            files = validated_files(root)
            self.assertEqual([p.name for p, _ in files], [manifest['sha256']+'.pmtiles', manifest['raster']['sha256']+'.pmtiles', 'manifest.json'])
            (charts/(manifest['raster']['sha256']+'.pmtiles')).write_bytes(b'corrupt')
            with self.assertRaises(ValueError): validated_files(root)

    def test_upload_failure_never_publishes_manifest(self):
        files = [(Path('vector.pmtiles'), 'application/octet-stream'),
                 (Path('raster.pmtiles'), 'application/octet-stream'),
                 (Path('manifest.json'), 'application/json')]
        with patch('sys.argv',['publish_charts.py','--upload']), \
             patch('pipeline.publish_charts.validated_files',return_value=files), \
             patch('pipeline.publish_charts.publish_file',side_effect=[None, RuntimeError('upload failed')]) as publish:
            with self.assertRaises(RuntimeError): main()
            self.assertEqual(publish.call_count,2)

    def test_package_selection_and_checksums(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            charts, manifest = make_bundle(root)
            (root/'web/public').rename(root/'dist')
            (root/'onboard').mkdir()
            (root/'onboard/serve.py').write_text('# test')
            for included in (False, True):
                with patch.object(package_offline,'ROOT',root):
                    output = package_offline.package(include_raster=included)
                with zipfile.ZipFile(output) as bundle:
                    packaged = json.loads(bundle.read('site/charts/manifest.json'))
                    self.assertEqual('raster' in packaged, included)
                    self.assertEqual(f"site/charts/{manifest['raster']['sha256']}.pmtiles" in bundle.namelist(), included)
                    import hashlib
                    for line in bundle.read('SHA256SUMS').decode().splitlines():
                        sha, name = line.split('  ')
                        self.assertEqual(hashlib.sha256(bundle.read(name)).hexdigest(), sha)
            self.assertIn('raster',json.loads((root/'dist/charts/manifest.json').read_text()))

    def test_legacy_and_unknown_versions(self):
        validate_version({})
        with self.assertRaises(ValueError): validate_version({'schema_version':3})
        with self.assertRaises(ValueError): validate_version({'raster':{'sha256':'a'*64}})
