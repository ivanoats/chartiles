"""Inline the local chart images for a single-file, offline talk deck."""
from base64 import b64encode
from pathlib import Path
import re

root = Path(__file__).resolve().parent
source = (root / 'index.html').read_text(encoding='utf-8')


def embed_image(match):
    asset = (root / match[1]).read_bytes()
    return f'src="data:image/webp;base64,{b64encode(asset).decode("ascii")}"'


output = re.sub(r'src="(assets/[a-z-]+\.webp)"', embed_image, source)
(root / 'chartiles-ignite.html').write_text(output, encoding='utf-8')
