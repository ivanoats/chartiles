import argparse
from contextlib import redirect_stderr
import io
import unittest
from unittest.mock import patch
from pipeline.publish_charts import bucket_name, main


class PublishingArgumentsTests(unittest.TestCase):
    def test_accepts_plain_bucket_names(self):
        for name in ('chartiles-charts', 'abc', 'a'*63, '123'):
            self.assertEqual(bucket_name(name), name)

    def test_rejects_options_paths_whitespace_and_shell_tokens(self):
        for name in ('--help', '-x', 'bucket/key', '../bucket', 'a b', 'a\nb',
                     '$(id)', 'a;id', 'ABC', 'ab', 'a'*64, 'abc-', 'abc\n'):
            with self.subTest(name=name), self.assertRaises(argparse.ArgumentTypeError):
                bucket_name(name)

    def test_invalid_upload_target_never_launches_subprocess(self):
        with patch('sys.argv', ['publish_charts.py', '--upload', '--bucket=--help']), \
             patch('pipeline.publish_charts.subprocess.run') as run, \
             redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as failure:
            main()
        self.assertEqual(failure.exception.code, 2)
        run.assert_not_called()
