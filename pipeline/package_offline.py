"""Package the current static build with only its active chart and matching audit."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def package():
    site = ROOT/'dist'
    manifest = json.loads((site/'charts/manifest.json').read_text())
    sha = manifest['sha256']
    archive = site/'charts'/f'{sha}.pmtiles'
    if hashlib.sha256(archive.read_bytes()).hexdigest() != sha:
        raise ValueError('Chart hash mismatch; refusing to package')
    files = [p for p in site.rglob('*') if p.is_file() and 'charts' not in p.relative_to(site).parts]
    files += [site/'charts/manifest.json', archive]
    files += [p for p in (site/'charts').glob(f'{sha}-coverage.*') if p.is_file()]
    hashes = {f'site/{p.relative_to(site).as_posix()}': hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
    server = ROOT/'onboard/serve.py'
    hashes['serve.py'] = hashlib.sha256(server.read_bytes()).hexdigest()
    output = ROOT/'build'/f"chartiles-{manifest['region']}-{sha[:12]}-offline.zip"
    output.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for p in files: z.write(p, f'site/{p.relative_to(site).as_posix()}')
        z.write(server, 'serve.py')
        z.writestr('SHA256SUMS', ''.join(f'{value}  {name}\n' for name, value in sorted(hashes.items())))
        z.writestr('README.txt', 'ChartTiles offline inspection bundle\n\nRequires Python 3.10+. No Node.js or internet needed after extraction.\nRun: python3 serve.py\nOpen: http://127.0.0.1:8080/\nStop with Ctrl+C. Change port with --port 8081.\n\nDo not open index.html directly. Server binds to localhost only.\nExperimental inspection software, not for navigation. Symbols are simplified.\nCharts reflect the source dates in site/charts/manifest.json.\nSHA256SUMS verifies individual files; it is not a digital signature.\n')
    output.with_suffix('.zip.sha256').write_text(hashlib.sha256(output.read_bytes()).hexdigest()+'  '+output.name+'\n')
    print(output)
    return output


if __name__ == '__main__':
    package()
