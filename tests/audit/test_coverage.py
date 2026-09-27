import unittest
from shapely.geometry import box, mapping
from pipeline.coverage import audit


def feature(cell, bounds, category=1):
    return {'properties': {'source_cell': cell, 'CATCOV': category}, 'geometry': mapping(box(*bounds))}


class CoverageTests(unittest.TestCase):
    def test_shared_edge_is_not_overlap(self):
        report, _ = audit([feature('a', [-123,47,-122.5,48]), feature('b', [-122.5,47,-122,48])], [-123,47,-122,48])
        self.assertEqual(report['overlap_pairs'], [])
        self.assertEqual(report['uncovered_km2'], 0)

    def test_overlap_and_explicit_exclusion(self):
        report, _ = audit([feature('a', [-123,47,-122,48]), feature('a', [-123,47,-122.8,48], 2), feature('b', [-122.5,47,-122,48])], [-123,47,-122,48])
        self.assertEqual(len(report['overlap_pairs']), 1)
        self.assertGreater(report['uncovered_km2'], 0)
