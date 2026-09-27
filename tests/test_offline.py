import json
import tempfile
import threading
import unittest
from functools import partial
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path
from pipeline.package_offline import coverage_files
from onboard.serve import Handler


class OfflineTests(unittest.TestCase):
    def test_coverage_requires_complete_matching_pair(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); sha = 'a'*64
            self.assertEqual(coverage_files(root, sha), [])
            report = root/f'{sha}-coverage.json'
            report.write_text(json.dumps({'archive_sha256': sha}))
            with self.assertRaises(ValueError): coverage_files(root, sha)
            geo = root/f'{sha}-coverage.geojson'
            geo.write_text('{"type":"FeatureCollection","features":[]}')
            self.assertEqual(coverage_files(root, sha), [report, geo])
            report.write_text('{"archive_sha256":"wrong"}')
            with self.assertRaises(ValueError): coverage_files(root, sha)

    def test_http_range_and_head_semantics(self):
        with tempfile.TemporaryDirectory() as folder:
            Path(folder, 'sample.bin').write_bytes(b'0123456789')
            server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=folder))
            thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
            try:
                cases = [('GET', {'Range':'bytes=2-4'}, 206, b'234'),
                         ('GET', {'Range':'bytes=-2'}, 206, b'89'),
                         ('GET', {'Range':'bytes=99-'}, 416, b''),
                         ('GET', {'Range':'bytes=0-1,4-5'}, 200, b'0123456789'),
                         ('GET', {'Range':'bytes=0-1', 'If-Range':'"stale"'}, 200, b'0123456789'),
                         ('HEAD', {'Range':'bytes=0-1'}, 200, b'')]
                for method, headers, status, body in cases:
                    with self.subTest(method=method, headers=headers):
                        conn = HTTPConnection(*server.server_address, timeout=3)
                        conn.request(method, '/sample.bin', headers=headers)
                        response = conn.getresponse()
                        self.assertEqual(response.status, status)
                        self.assertEqual(response.read(), body)
                        if status == 416: self.assertEqual(response.getheader('Content-Range'), 'bytes */10')
                        conn.close()
            finally:
                server.shutdown(); server.server_close(); thread.join()
