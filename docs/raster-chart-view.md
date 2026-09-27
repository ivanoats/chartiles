# Raster chart view

The viewer now offers **Chart view** (pre-rendered NOAA imagery) and
**Inspect features** (our extracted ENC vectors). Controls live in the map.
Switching retains the camera and clears the previous selection. Chart view
supports pan/zoom; feature identification and vector coverage are available only
in Inspect features. No vector features are selected through raster imagery.

This is traditional NOAA chart portrayal, not a client-side S-52 implementation.
NOAA distinguishes NCDS's traditional portrayal from its ECDIS display service
in its [GIS services documentation](https://www.nauticalcharts.noaa.gov/data/gis-data-and-services.html).

## Import and run

First build the vector region with `npm run charts:puget` if no local manifest
exists. Retain the MBTiles download and response headers for provenance:

```sh
mkdir -p build/raster
curl -fL --retry 3 -D build/raster/source-headers.txt \
  -o build/raster/ncds_20c.mbtiles \
  https://distribution.charts.noaa.gov/ncds/mbtiles/ncds_20c.mbtiles
npm run charts:raster -- build/raster/ncds_20c.mbtiles \
  --last-modified '2024-05-28T21:43:50Z'
npm run build
npm run preview
```

Use the last-modified value from your own response headers for a new download;
do not copy the example date blindly. This is a file timestamp, not a verified
chart edition/publication date. Omit the argument if unknown. The import time
is recorded separately. Downloads and generated charts are gitignored.

The importer requires the PMTiles CLI on PATH. It converts PNG MBTiles without
re-rendering, verifies archive structure, compares sample tile payloads using
TMS-to-XYZ coordinate conversion, and validates header metadata. It stores a
content-addressed archive before atomically updating the local manifest.

The installed converter reports a development version without a commit ID.
The manifest therefore records its executable SHA-256 as well as version text.
Use the same executable for byte-identical reproduction; a release-version pin
remains desirable before automating imports on another machine.

## Measured source record — 2026-09-27

| Property | Observation |
| --- | --- |
| NOAA file | `ncds_20c.mbtiles` |
| Input size | 662,798,336 bytes |
| Input SHA-256 | `966180b284601036bba61d6999c060669a7abe785dd372725ec57a8ab7d0fe39` |
| PMTiles size | 520,180,739 bytes (496.08 MiB) |
| PMTiles SHA-256 | `ee2129ccda808ba206e8976a0a5b3d6b243ec027f06a9e26259cbd13f7d8938f` |
| Tile format | PNG, 256 × 256 pixels |
| Native zoom range | 0–16 |
| Header bounds | -129.917222, 47.008889, -116.333333, 60.333333 |
| HTTP last-modified | 2024-05-28T21:43:50Z |
| Publication date | Unknown; no verified date in source metadata |

This archive extends well beyond Puget Sound; no regional extraction was done.
Its southern metadata bound is slightly north of the vector pilot rectangle's
47.0 boundary. Do not assume matching extents or source dates.

Tiles at Shilshole, Hood Canal, southern inlets and Admiralty Inlet at zooms
0, 12 and 16 were present and byte-identical after conversion. Tile presence can
include transparent pixels and does not prove complete coverage. Browser rendering
at Shilshole was visually checked. Independent regional chart-content review and
a second-computer offline trial remain outstanding.

Source metadata has empty attribution/use-constraints fields. The UI explicitly
credits NOAA Office of Coast Survey. NOAA provides these downloads for offline
applications; the [National Ocean Service disclaimer](https://oceanservice.noaa.gov/disclaimer.html)
permits copying public information unless otherwise noted. Preserve source
metadata and attribution; the conversion is our experimental packaging and is
not NOAA endorsement or certification.

## Manifest compatibility

Version 2 is an additive extension: existing top-level fields remain the vector
descriptor, and `raster` holds an independent descriptor. This avoids two copies
of the vector metadata. Version 1 manifests without a raster remain supported.

The raster descriptor records URL, bytes, SHA-256, encoding, tile size, bounds,
zoom limits, attribution, publication date (nullable), source file timestamp,
import time and source/converter provenance. The publisher validates its checksum
and header before uploading anything. Vector coverage files reference only the
vector SHA. Rebuilding the same vector region preserves its raster attachment;
building a different region produces a vector-only manifest until re-imported.

## Offline packages

```sh
npm run package:offline          # vector-only; smaller existing package
npm run package:offline:raster   # both chart imagery and vector inspection
```

The packager prints the included uncompressed file size before writing, validates
both archives, and writes a package-specific manifest and SHA256SUMS. A vector-only
package omits the raster descriptor and bytes without changing the source manifest.
The combined package includes about 552 MiB of files before ZIP compression.
The verified ZIP is 536,108,530 bytes (511.27 MiB).
No remote fonts, sprites or basemap are required. See [offline instructions](offline-bundle.md).

## Publish and rollback

Run `python3 pipeline/publish_charts.py` for a validated dry run. With deployment
authorization, `--upload` writes both immutable archives and the vector audit
before updating the manifest. The existing Worker accepts both archive types;
its routing and range semantics need no change. Deploy the matching viewer build.

Before publishing, retain the currently deployed manifest. For rollback, restore
that manifest only after verifying all referenced objects still exist. Keep prior
archives; automated deletion is not part of this change. No live chart upload or
production deployment was performed during local implementation.

## Verification

`npm test` covers artifact/header validation, upload failure ordering, package
selection/checksums and existing pipeline/server behavior. `npm run test:browser`
checks both modes, camera retention, external-network blocking, missing/corrupt
raster recovery, overzoom/outside-bounds messages and legacy manifests. Raster
browser cases require the imported local archive; they explicitly skip without it.

Source dates and rendering limitations remain visible. The imagery uses the
units printed by its source portrayal; the vector inspector's metre labels must
not be applied to raster soundings.

Local validation: 19 Python tests, one Worker test and seven browser tests pass.
The combined ZIP was extracted, every SHA256SUMS entry verified, and both modes
loaded from its bundled Python server with external requests blocked. Raster
rendering and vector feature selection worked with HTTP 206 responses and no
page errors. This was on the development machine, not a second-computer trial.
