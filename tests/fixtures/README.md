# Chart fixtures

## Browser chart bundle

`browser-charts/` contains two PMTiles extracts of NOAA chart data around
Shilshole Bay, a manifest, and a coverage audit. The vector tiles come from the
[Puget Sound build](../../docs/puget-sound-benchmark.md). The raster tiles come
from the [NOAA NCDS import](../../docs/raster-chart-view.md). Both archives are
content-addressed and together take about 1.4 MiB. The bundle is for tests only.

A clean checkout can run the same tests as CI with these commands:

```sh
npm ci --ignore-scripts
./node_modules/.bin/playwright install chromium
npm run build
cp -R tests/fixtures/browser-charts dist/charts
npm run test:browser -- --workers=1
```

If `web/public/charts` already contains a local bundle, use a clean checkout for
the fixture run. `npm run build` copies that local bundle into `dist/charts`.

The extracts retain the original tile payloads through native zoom 16. The
vector bounds are `-122.473,47.649,-122.398,47.689` with `--minzoom=11`.
The raster bounds are `-122.420,47.673,-122.402,47.687` with `--minzoom=9`.
Both archives credit NOAA and carry a navigation disclaimer in their metadata.
The vector metadata omits Tippecanoe's `generator_options` field, which contained
local paths. The coverage audit uses `pipeline/coverage.py`'s `audit` function on
the original `M_COVR` features that intersect the vector bounds. The manifest
counts source features that intersect those bounds.

| Extract | Source archive SHA-256 |
| --- | --- |
| Vector | `d3525e79cc428986f04a781b78c55910354c36e1b752cacb4cc3c06395de5a9d` |
| Raster | `ee2129ccda808ba206e8976a0a5b3d6b243ec027f06a9e26259cbd13f7d8938f` |

## PMTiles header regression fixture

`noaa-raster-v3-header.bin` is the first 127 bytes of the actual raster archive
converted from NOAA `ncds_20c.mbtiles` on 2026-09-27. It is a header fixture,
not a complete PMTiles archive. No fields were synthesized or modified.

- Source: https://distribution.charts.noaa.gov/ncds/mbtiles/ncds_20c.mbtiles
- Converted archive SHA-256: `ee2129ccda808ba206e8976a0a5b3d6b243ec027f06a9e26259cbd13f7d8938f`
- Converter executable SHA-256: `ddd6019d1dc6ee01a38414b89d062f9b4307008c1897f2086c4a353012c18f90`
- Expected encoding: PNG; minzoom 0; maxzoom 16.

The PMTiles v3 specification places tile compression at offset 98, tile type
at 99, zooms at 100/101 and bounds at 102. See the
[header layout](https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md#31-overview).
The installed `pmtiles` JavaScript decoder independently confirms these fields.
This fixture catches an accidental offset shift without relying on the hand-built
publisher fixture to encode the same layout as our parser.
