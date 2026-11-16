# Puget Sound developer quickstart

Load the published NOAA ENC vector archive in a minimal MapLibre app and inspect
a wreck near Shilshole. ChartTiles is for inspection only and must never be used
for navigation.

## Run the example

From a clean checkout, with Node.js 24 and an internet connection:

```sh
npm ci
npm exec -- vite examples/puget-sound --host 127.0.0.1 --port 8090 --strictPort
```

Open <http://127.0.0.1:8090/> and click the magenta marker in the center of the
map. The sample wreck's key is `US5SEAGK:WRECKS:0226EA5A5C0C1923` and its depth
is unrecorded (`null`). Open **Release and source cells** and find `US5SEAGK`
to see the edition, update number, and issue date for the selected wreck's
source. [Example source](../examples/puget-sound/main.js)

## Use the archive in your app

1. Fetch the [public manifest](https://chartiles-data.ivanstorck.workers.dev/charts/manifest.json).
   Read `region`, `bounds` (west, south, east, north), and `sources` for the
   build extent and included cell revisions. The bounding box alone does not
   describe surveyed coverage. `built_at` is the archive build date.
2. Resolve `pmtiles_url` against the data service root. Register the PMTiles
   protocol with MapLibre and use the resulting archive URL as a vector
   source. The data service supports cross-origin byte-range requests.
3. Add a layer with `source-layer: 'WRECKS'` and use the clicked feature's
   `source_cell` to find its revision in the manifest. Preserve missing depths
   as missing. Record the manifest's `sha256` alongside a `feature_key` if you
   need to reproduce a selection against the same archive.

The quickstart draws land and wreck points. See the full viewer for inspection
cards, provenance, and other layers. [ChartTiles viewer](https://chartiles.com/)

When testing the guide with a developer, give them the checkout and this page.
Record time to first feature, where they needed help, and what their app would
need beyond this example.
