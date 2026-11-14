import json
import unittest
from unittest.mock import patch

from pipeline.benchmark_tylertoo import preservation


class BenchmarkPreservationTests(unittest.TestCase):
    def check(self, source, copies, layer='COALNE'):
        decoded = {'type': 'FeatureCollection', 'properties': {'layer': layer},
                   'features': [{'type': 'Feature', 'properties': p} for p in copies]}
        with patch('pipeline.benchmark_tylertoo.verify', return_value={'missing_features': 0}), \
             patch('pipeline.benchmark_tylertoo.subprocess.check_output',
                   return_value=json.dumps(decoded).encode()):
            return preservation('example.pmtiles', {'COALNE': [{'properties': p} for p in source]}, 16)

    def test_shared_key_retains_distinct_source_records(self):
        props = [{'feature_key': 'shared', 'RCID': n} for n in (6, 7)]
        result = self.check(props, props * 2)
        self.assertEqual(result['changed_scalar_properties'], [])
        self.assertEqual(result['duplicate_source_keys'], {'shared': 2})

    def test_corrupted_buffer_copy_is_detected(self):
        source = {'feature_key': 'coast', 'RCID': 6}
        result = self.check([source], [source, dict(source, RCID=999)])
        self.assertEqual(result['changed_scalar_properties'][0]['field'], 'RCID')

    def test_wrong_mvt_layer_is_detected(self):
        props = {'feature_key': 'coast'}
        result = self.check([props], [props], layer='LNDARE')
        self.assertEqual(result['wrong_layers'][0]['actual'], ['LNDARE'])
