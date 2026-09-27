# Raster chart view implementation plan

Date: 2026-09-27. Status: implemented locally; production publication and pilot review remain.
See [implementation and measurements](raster-chart-view.md).

## Outcome and scope

Offer two explicit modes: **Chart view**, showing pre-rendered NOAA chart
imagery, and **Inspect features**, showing our existing ENC vector tiles.
Both retain the same center and zoom when switched. The first release targets
our Puget Sound pilot and keeps the experimental, not-for-navigation notice.

This follows reciprocal-clubs' raster PMTiles approach. PMTiles is a container:
its raster images already contain symbols and labels, whereas ChartTiles'
vector archive requires client-side portrayal. This work does not implement
or establish conformity with S-52.

The local reference is `reciprocal-clubs/src/ui/hooks/use-map-style.ts` and
that repository's README. Its documented source is NOAA NCDS MBTiles, converted
to PMTiles. Verify available downloads and actual archive contents before reuse;
the reference app is not evidence of current chart coverage or freshness.

## First milestone: source qualification

Timebox: half to one engineering day, excluding large downloads.

1. Locate the NOAA NCDS download covering the pilot rectangle. Record the
   official download URL, retrieval date, available publication date, attribution
   and applicable redistribution terms. Do not infer currency from retrieval date.
2. Inspect MBTiles metadata and representative tiles: raster encoding, projection,
   tile dimensions, bounds, native zoom range and transparency. Check Shilshole,
   Hood Canal, southern inlets and Admiralty Inlet at useful scales. A bounding
   rectangle alone does not establish coverage.
3. Convert with a pinned PMTiles tool version, without re-rendering. Record input
   and output hashes, size and conversion command. Verify sample tile payloads
   survive conversion and XYZ/TMS handling is correct.
4. Measure storage and transfer size. Decide whether one archive suffices. If
   multiple archives or regional extraction are necessary, revise the estimate
   before implementing mosaicking or clipping.

Exit: a reproducible source record, local validated raster PMTiles, known gaps,
and an explicit decision on offline package size. No live upload is required.

## Implementation sequence

### PR 1: artifact contract and local raster ingestion

- Add a raster import/validation command; keep the ENC build intact.
- Publish archives under content-addressed names. Define a versioned manifest
  with distinct raster and vector descriptors: URL, SHA-256, bytes, media/tile
  type, bounds, min/max zoom, attribution, source dates and provenance reference.
- Preserve support for the existing vector-only manifest. A missing raster is
  a supported state, not a failure of the vector viewer.
- Validate raster headers/metadata and checksums; reject mismatched tile type,
  invalid bounds or incomplete descriptors before publication.
- Refactor publisher validation around the descriptor types. Upload referenced
  immutable artifacts first and the manifest last. Never expose a manifest that
  points at an upload that failed. Coverage audit remains tied to the vector SHA.
- Review Worker allowed paths and response types. Keep the same read-only range
  delivery; introduce no tile-rendering service.

### PR 2: map modes and failure handling

- Put the Chart view / Inspect features selector inside the map area.
- Default to Chart view only when a raster descriptor is configured; existing
  vector-only installs continue opening in Inspect features.
- Use a raster MapLibre source with validated native zoom limits and bounds.
  Preserve source colors initially; do not copy STYC's contrast/saturation tweaks.
- Retain camera position on mode switches. Show an explicit outside-coverage or
  overzoom indication instead of suggesting added detail exists.
- Chart view supports pan/zoom. Disable Identify there with concise explanatory
  text; do not query hidden vector features underneath raster images.
- Inspect features retains our inspector and vector coverage controls. Hide
  vector coverage overlays in Chart view: they do not describe raster coverage.
- Preserve hash navigation and avoid duplicate event listeners on repeated switches.
- On raster failure, show the error and an explicit switch to Inspect features.
  Do not silently substitute OSM or OpenSeaMap. Display source attribution/date
  for the active mode, including an unknown publication date where appropriate.

### PR 3: offline packaging and pilot release

- Make package selection explicit: vector-only or raster plus vector. Include
  both archives only when requested and show the measured package size first.
- Package the manifest, required immutable files and vector audit as a consistent
  snapshot. Resolve URLs locally and include all UI assets needed offline.
- Extend checksum verification and extraction/run instructions for both modes.
- Document publication order, rollback to the prior manifest, and source refresh.
- After local checks, obtain authorization for live publishing if not already
  provided. Verify the deployed viewer and range endpoints after publishing.
- Record human spot checks and try the extracted bundle on a second computer
  with external network access blocked before inviting pilot users.

## Acceptance and verification

| Area | Required evidence |
| --- | --- |
| Conversion | Header/type checks and matching sample tile payloads |
| Manifest | Vector-only compatibility; invalid or missing artifacts rejected |
| Publication | Failure before manifest update leaves prior release usable |
| UI | Camera/hash preserved; repeated switching works; tool state is correct |
| Failure | Missing raster, 404, corrupt archive and outside-coverage states are clear |
| Chart detail | Native zoom limits respected; representative pilot locations checked |
| Delivery | GET/HEAD, HTTP 206 byte ranges and browser CORS work |
| Offline | Both modes load from extracted package with external requests blocked |
| Provenance | Source dates, attribution, hashes and measured sizes recorded |

Automate manifest, publication and mode-switch regressions. Use browser tests
for local raster rendering and offline requests. Record manual geographic checks
with locations, zooms, source archive hash and observed gaps. Seeing familiar
symbols is not a substitute for validating their underlying source.

## Estimate and decision gates

Initial estimate: **2–5 engineering days for a basic local integration**, assuming
one suitable archive. Allow **another 2–4 days** for robust packaging, failure
handling, deployment verification and documentation. Download time and external
manual review are additional. These are planning ranges, not delivery promises.

Stop after source qualification if coverage, permitted redistribution or size is
unsuitable. Re-estimate for multiple archives, extracting a regional subset, or
source-service changes. Do not start an S-52 renderer to work around an unsuitable
raster source without a separate decision.

## Deferred

Raster/vector visual overlay, identifying raster symbols via nearby vector
features, raster night palettes, vessel safety-depth portrayal, full S-52,
automatic source refresh, incremental raster updates and new geographical regions.

Success is a pilot user switching between readable chart imagery and inspectable
features, understanding which is active, and using both offline with known sources.
