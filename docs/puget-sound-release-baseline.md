# Puget Sound release baseline

Observed 2026-11-15. The public manifest identified the vector release by SHA-256
`d3525e79cc428986f04a781b78c55910354c36e1b752cacb4cc3c06395de5a9d`,
built 2026-09-26 at 21:13 UTC from 99 NOAA cells. The manifest reports
47,262 feature identities checked at zoom 16 with zero missing.
[Public manifest](https://chartiles-data.ivanstorck.workers.dev/charts/manifest.json)

| Measure | Baseline | Source |
| --- | ---: | --- |
| Vector build and validation | 122.18 s | Retained-input build recorded in the manifest. Excludes input downloads. |
| Vector archive | 56,891,449 bytes (54.26 MiB) | Public manifest and Worker byte-range response. |
| Vector offline ZIP | 57,019,317 bytes (54.38 MiB) | Retained local package with the same vector archive. |
| Vector plus raster offline ZIP | 536,108,530 bytes (511.27 MiB) | Retained local package with raster hash prefix `ee2129ccda80`. |

ZIP sizes include the viewer packaged at the time. The offline ZIPs are local
artifacts. See [the build benchmark](puget-sound-benchmark.md) for timing and
validation limits.

## Reproduce the release checks

1. Run `npm run charts:puget` with the pipeline tools installed, or build from
   a retained NOAA snapshot for a comparable timing. Save the manifest and
   input hashes. The pipeline verifies maximum-zoom feature identity and
   sounding depth. Review coverage and portrayal separately.
2. Run `npm run package:offline`. For the combined package use
   `npm run package:offline:raster` with a matching raster archive. Verify the
   adjacent checksum and open the extracted bundle locally.
3. Run `python3 pipeline/publish_charts.py` to verify archive sizes and hashes
   and preview the upload. An authorized release operator can add `--upload`.
   The uploader publishes the manifest after its referenced archives.
4. Fetch the published manifest and verify its hash and byte count refer to
   the intended build. Request bytes 0–126 directly from the Worker archive URL.
   Expect HTTP 206, a `Content-Range` total matching the manifest, an
   `Access-Control-Allow-Origin` header, and the `PMTiles` header bytes.
   Open the quickstart and the production viewer to check the map and click
   a known feature.

The data endpoint returned the expected PMTiles header bytes and asset size.
A range request through the viewer domain returned a partial redirect body
during this check. Use the data endpoint for third-party integrations and
check the viewer path independently when verifying a release.
[Hosting and publication](../hosting/README.md)
