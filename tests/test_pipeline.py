import io
import tempfile
import unittest
import zipfile
from pathlib import Path
from pipeline.build import normalize, select_cells, extract_zip


class PipelineTests(unittest.TestCase):
    def test_cancelled_or_changed_scale_cell_fails_closed(self):
        config = {'cells': ['US5TEST'], 'scale': 12000}
        for status, scale in [('Cancelled', '12000'), ('Active', '45000')]:
            xml = f'<EncProductCatalog><cell><name>US5TEST</name><status>{status}</status><cscale>{scale}</cscale></cell></EncProductCatalog>'
            with self.assertRaises(ValueError):
                select_cells(xml, config)

    def test_region_enforces_each_cells_recorded_scale(self):
        config = {'cells': ['US5TEST'], 'cell_scales': {'US5TEST': 22000}}
        xml = '<EncProductCatalog><cell><name>US5TEST</name><status>Active</status><cscale>22000</cscale></cell></EncProductCatalog>'
        self.assertEqual(select_cells(xml, config)[0]['name'], 'US5TEST')
        with self.assertRaises(ValueError):
            select_cells(xml.replace('22000', '12000'), config)

    def test_sounding_keeps_negative_depth_and_provenance(self):
        feature = {'properties': {'LNAM': 'example'}, 'geometry': {'type': 'Point', 'coordinates': [-122.4, 47.68, -0.4]}}
        output = normalize(feature, 'US5TEST', 'SOUNDG')
        self.assertEqual(output['properties']['depth_m'], -0.4)
        self.assertEqual(output['properties']['feature_key'], 'US5TEST:SOUNDG:example:-122.4,47.68,-0.4')
        with self.assertRaises(ValueError):
            normalize({'properties': {}, 'geometry': {'type': 'Point', 'coordinates': [0, 0]}}, 'US5TEST', 'SOUNDG')

    def test_archive_cannot_escape_destination(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            archive = root / 'bad.zip'
            with zipfile.ZipFile(archive, 'w') as z:
                z.writestr('../escape', 'bad')
            with self.assertRaises(ValueError):
                extract_zip(archive, root / 'out')
            self.assertFalse((root / 'escape').exists())
