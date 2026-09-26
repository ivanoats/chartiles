# Puget Sound benchmark

## Scope

This benchmark uses a rectangle from longitude -123.15 to -122.15 and latitude 47.0 to 48.15: Olympia through Admiralty Inlet, including Hood Canal. It is a reproducible test boundary, not a definitive geographic boundary or a claim of complete ENC coverage.

`pipeline/puget-sound.json` lists 99 active NOAA harbor-scale cells whose catalog panel bounding boxes intersect that rectangle. The catalog was retrieved on 2026-09-26. The selection includes 77 cells at 1:12,000 and 22 at 1:22,000. Each expected scale is recorded individually; a cancellation or changed scale stops the build for review. Overview, general and coastal cells are excluded. Bounding-box intersection can include cells with no actual features inside the rectangle. This selection does not prove absence of overlaps or coverage gaps.

The same object classes as Shilshole are extracted. Geometry remains clipped to the rectangle. Zooms 8–16 support the regional view; feature-identity and depth checks apply at zoom 16 only. Low-zoom portrayal is an inspection view without SCAMIN filtering, so dense feature displays are expected.

## Run

```bash
npm run charts:puget
npm run build
npm run preview
```

`npm run charts` still builds the small Shilshole fixture. The most recently built region becomes the default viewer. Region-specific manifests are retained as `web/public/charts/puget-sound.json` and `shilshole.json` after each is built; immutable PMTiles archives and intermediate inputs remain available. Rebuild the static viewer when switching regions.

## Manual review record

Ivan reported completing the Shilshole NOAA source checks and finding no discrepancies in this conversation. The checked feature identifiers and sample count were not recorded. This is a user-reported spot check of Shilshole, not independent certification or validation of the expanded region.

Puget Sound manual review is outstanding. It should include the transition between the two source scales, cell boundaries, Hood Canal, southern inlets, and Admiralty Inlet. A second source edition is still required to measure update transfer costs.

## Measurements

The validated regional archive is **56,891,449 bytes (54.26 MiB)**, with **47,262 extracted features**, including **28,103 soundings**. All extracted feature identities survived at zoom 16, and sounding depths matched. Extraction, compilation and validation from retained source ZIPs took **122.18 seconds**; this excludes downloading the inputs.

| Local browser measurement | Shilshole | Puget Sound |
| --- | --- | --- |
| First idle, three fresh browser contexts | 506 / 199 / 339 ms | 549 / 434 / 499 ms |
| Median | 339 ms | 499 ms |
| PMTiles archive | 472,065 bytes | 56,891,449 bytes |

The Shilshole baseline used the earlier default tile precision; Puget Sound uses full-detail 16. This is an observed comparison, not a controlled scaling ratio. Six pipeline/validation tests and the external-network-blocked browser integration test pass. To repeat browser measurements, run `npm run benchmark` while the preview server is running. Raw results are saved in `build/<region>-benchmark.json`.

 Browser timing measures navigation to the first MapLibre idle event on the local development machine with external requests blocked. It is not an onboard hardware or network benchmark.

## Quantization finding

The first regional archive failed feature-retention validation: `US5SEAGK:COALNE:0226585FA1A91923`, a coastline segment from (-122.4000003, 47.6327689) to (-122.4, 47.6327688), collapsed on the default tile coordinate grid. The compiler now uses `--full-detail=16` to retain finer coordinate precision at maximum zoom. This improves representation, not the underlying survey accuracy. Lower-zoom fidelity remains a separate review task.

To repeat compilation and extraction using exactly the saved catalog and cell ZIPs:

```bash
python3 pipeline/build.py --config pipeline/puget-sound.json --snapshot build/puget-sound-REPLACE_WITH_BUILD_ID
```

Snapshot rebuild timing excludes network acquisition. The snapshot directory must contain the catalog and all configured cell ZIPs; missing inputs fail the build. It should be retained with its manifest and source hashes for provenance.
