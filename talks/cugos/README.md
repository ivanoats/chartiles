# Why CharTiles?

A five-minute CUGOS lightning talk by Ivan Storck. Twenty slides at 15 seconds
each, following the format of the
[Salish Sea Ferry Map Ignite talk](https://github.com/ivanoats/Salish-Sea-Ferry-Map/tree/main/talks/2026-10-cugos).

The talk starts with Ivan’s perspective as a Puget Sound sailor who wants to
click a chart mark and see what NOAA recorded. It asks why adding nautical chart features to
a web map takes more work than adding an OpenStreetMap basemap. MapLibre can
display NOAA imagery with a configured raster source. Loading the feature
records for inspection takes another step. CharTiles packages them as PMTiles. A missing coastline segment makes the
risk of conversion visible. The closing ask is for a real chart overlap that
CUGOS can help turn into a repeatable test.

## Present or rehearse

Run `npm run talks:serve` from the repository root and open
<http://localhost:8110/cugos/>. This serves the editable deck and its images.
Reload the page after editing the slides. Add `?ignite` to start the timer
on load.

For an offline copy:


- Open [chartiles-ignite.html](chartiles-ignite.html) directly in a browser.
  The file includes all artwork and works offline. It opens paused.
- Press **A** to start or pause the timer. Use **←** and **→** to advance
  manually, or **Home** and **End** to jump to the first or last slide.
- Press **S** for the current slide's rehearsal notes beneath the deck.
  Keep them closed on the projector. The slide copy and notes are in
  [index.html](index.html) if you prefer a script on a separate device.
- Append `#ignite` to the local file URL or `?ignite` to a served URL
  to start the timer immediately.

Edit `index.html`, then run `python3 talks/cugos/build.py` from the repo root
to regenerate the offline file. The source page and `assets/` can also be
served together as static files. The talk is independent of the main site build.

## Sources and credits

- [NOAA GIS Data & Services](https://www.nauticalcharts.noaa.gov/data/gis-data-and-services.html)
  documents the chart display services, including WMS and Esri REST. The
  [MapLibre source specification](https://maplibre.org/maplibre-style-spec/sources/)
  shows how to configure WMS imagery as a raster source and which vector tile
  formats MapLibre reads.

- [Protomaps’ PMTiles concepts](https://docs.protomaps.com/pmtiles/#mbtiles)
  compares HTTP byte-range reads with the common server-side MBTiles setup.
  The [MBTiles specification](https://github.com/mapbox/mbtiles-spec) describes
  the SQLite container.
- The chart figures are CharTiles screenshots derived from NOAA Electronic
  Navigational Charts. The raster figure uses NOAA Office of Coast Survey
  NCDS imagery. The screenshots show inspection views and are for illustration.
- [Puget Sound benchmark](../../docs/puget-sound-benchmark.md) documents the 99
  selected cells, archive size, collapsed segment, and maximum-zoom checks.
- [Coverage audit](../../docs/coverage-audit.md) explains the footprint overlay
  and the difference between coverage geometry and continuous source features.
- [Feature inspection](../../docs/feature-inspection.md) and
  [Shilshole hazard fixtures](../../tests/fixtures/shilshole-hazards.json)
  document the wreck and rock examples.
- [Publishing workflow](../../hosting/README.md),
  [raster chart view](../../docs/raster-chart-view.md), and
  [implementation plan](../../docs/implementation-plan.md) record the
  release steps, portrayal limits, and planned multi-scale work.
