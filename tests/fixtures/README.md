# PMTiles header regression fixture

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
