import tempfile
from pathlib import Path
import unittest
import zipfile
from pipeline.check_updates import compare_catalog, payloads


class UpdateTests(unittest.TestCase):
    def test_revision_change_and_cancellation(self):
        source = {'name': 'US5TEST', 'edtn': '1', 'updn': '2', 'isdt': '2026-09-01', 'cscale': '12000'}
        xml = '<EncProductCatalog><cell><name>US5TEST</name><status>Active</status><edtn>1</edtn><updn>3</updn><isdt>2026-09-01</isdt><cscale>12000</cscale></cell></EncProductCatalog>'
        changes, unavailable = compare_catalog([source], xml)
        self.assertEqual(changes[0]['fields'], {'updn': {'before': '2', 'after': '3'}})
        self.assertFalse(unavailable)
        self.assertEqual(compare_catalog([source], xml.replace('Active', 'Cancelled'))[1], ['US5TEST'])
        self.assertEqual(compare_catalog([source], xml.replace('<updn>3', '<updn>2')), ([], []))

    def test_zip_timestamps_are_not_data_changes(self):
        with tempfile.TemporaryDirectory() as folder:
            paths = [Path(folder)/f'{i}.zip' for i in range(3)]
            for i, path in enumerate(paths):
                with zipfile.ZipFile(path, 'w') as archive:
                    info = zipfile.ZipInfo('CELL.000', (2026, 9, 20+i, 0, 0, 0))
                    archive.writestr(info, b'chart' if i < 2 else b'changed chart')
            self.assertNotEqual(paths[0].read_bytes(), paths[1].read_bytes())
            self.assertEqual(payloads(paths[0]), payloads(paths[1]))
            self.assertNotEqual(payloads(paths[1]), payloads(paths[2]))
