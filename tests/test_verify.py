import json
import unittest
from unittest.mock import patch
from pipeline.verify import verify


class RetentionTests(unittest.TestCase):
    def test_rejects_a_missing_coastline(self):
        grouped = {'COALNE': [{'properties': {'feature_key': 'tiny-coastline'}}]}
        with patch('pipeline.verify.subprocess.check_output', return_value=b'{"type":"FeatureCollection","features":[]}'):
            with self.assertRaisesRegex(ValueError, 'tiny-coastline'):
                verify('example.pmtiles', grouped, 16)

    def test_rejects_changed_sounding_depth(self):
        grouped = {'SOUNDG': [{'properties': {'feature_key': 'sounding', 'depth_m': -0.4}}]}
        decoded = {'type': 'FeatureCollection', 'features': [{'type': 'Feature', 'properties': {'feature_key': 'sounding', 'depth_m': 0.4}}]}
        with patch('pipeline.verify.subprocess.check_output', return_value=json.dumps(decoded).encode()):
            with self.assertRaisesRegex(ValueError, 'depth changed'):
                verify('example.pmtiles', grouped, 16)
