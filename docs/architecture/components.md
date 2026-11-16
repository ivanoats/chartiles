# Components (C4 level 3)

The [container view](containers.md) shows where these components run. This page
maps those responsibilities to the repository.

## Chart processing and delivery

| Component | Responsibility |
| --- | --- |
| [`pipeline/build.py`](../../pipeline/build.py) | Selects configured NOAA cells, extracts and clips their features with GDAL, assigns source keys, compiles vector PMTiles with tippecanoe, and writes the build manifest. |
| [`pipeline/verify.py`](../../pipeline/verify.py) | Reads back the highest zoom and compares extracted feature keys and sounding depths. |
| [`pipeline/import_raster.py`](../../pipeline/import_raster.py) | Converts NOAA raster MBTiles to PMTiles and verifies sample tile payloads. |
| [`pipeline/coverage.py`](../../pipeline/coverage.py) | Audits source coverage polygons and produces the optional vector coverage overlay. |
| [`pipeline/check_updates.py`](../../pipeline/check_updates.py) | Reports catalog changes for a retained build. |
| [`pipeline/publish_charts.py`](../../pipeline/publish_charts.py) | Verifies artifact sizes and hashes, uploads referenced objects, then publishes the manifest. |
| [`hosting/worker.mjs`](../../hosting/worker.mjs) | Serves chart artifacts from R2 with range and conditional request handling. |
| [`pipeline/package_offline.py`](../../pipeline/package_offline.py), [`onboard/serve.py`](../../onboard/serve.py) | Package the map and selected archives and serve the extracted bundle over localhost. |

## Public site and viewer

| Component | Responsibility |
| --- | --- |
| [`src/layouts/SiteLayout.astro`](../../src/layouts/SiteLayout.astro) | Shares Verdant navigation, theme preferences, and footer across the public content pages. |
| [`src/content/`](../../src/content/) | Holds the Markdown integration guide and blog posts. |
| [`scripts/stage-site.mjs`](../../scripts/stage-site.mjs) | Stages the Vite inspection viewer and CUGOS deck in the Astro output. |
| [`web/main.js`](../../web/main.js) | Loads the manifest, creates MapLibre sources and layers, and runs feature selection. |
| [`web/chart-modes.js`](../../web/chart-modes.js) | Validates the raster descriptor and manages mode changes and source status. |
| [`web/portrayal.js`](../../web/portrayal.js), [`web/coverage.js`](../../web/coverage.js) | Set inspection symbols and zoom thresholds and load the optional coverage overlay. |
| [`web/feature-cards.mjs`](../../web/feature-cards.mjs), [`web/s57-attributes.mjs`](../../web/s57-attributes.mjs) | Render readable feature attributes, keeping raw data and source context available. |

See [data flows](data-flows.md) for how these modules interact during a release.
