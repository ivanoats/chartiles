#!/usr/bin/env python3
"""Serve this offline bundle on localhost, including HTTP byte ranges. Python 3.10+."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import re


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.remaining = None
        path = Path(self.translate_path(self.path))
        if self.command != 'GET' or self.headers.get('If-Range') or path.is_dir() or not path.is_file() or not self.headers.get('Range'):
            return super().send_head()
        size = path.stat().st_size
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', self.headers['Range'])
        if not match or not any(match.groups()):
            return super().send_head()
        first, last = match.groups()
        start = int(first) if first else max(0, size - int(last))
        end = min(int(last), size-1) if first and last else size-1
        if start > end or start >= size:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.send_header('Content-Length', '0')
            self.end_headers(); return None
        stream = path.open('rb'); stream.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(str(path)))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end-start+1))
        self.end_headers()
        self.remaining = end-start+1
        return stream

    def copyfile(self, source, outputfile):
        remaining = getattr(self, 'remaining', None)
        if remaining is None:
            return super().copyfile(source, outputfile)
        while remaining:
            chunk = source.read(min(65536, remaining))
            if not chunk: break
            outputfile.write(chunk); remaining -= len(chunk)
        del self.remaining


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent / 'site'
    if not (root/'index.html').exists():
        raise SystemExit('Run serve.py from an extracted ChartTiles offline bundle.')
    print(f'ChartTiles: http://127.0.0.1:{args.port}/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(root))).serve_forever()
