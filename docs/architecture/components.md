# Components (C4 Level 3)

This view zooms into the two containers with non-trivial internal structure: the **Build Pipeline** and the **Web Client**. The other containers (Tile Store, CDN, Onboard Server) are off-the-shelf and have no useful component decomposition.

## Build Pipeline components

```mermaid
C4Component
    title Component Diagram — Build Pipeline

    System_Ext(noaa, "NOAA ENC", "S-57 .000 cells")
    ContainerDb(r2, "Tile Store", "Cloudflare R2")

    Container_Boundary(pipeline, "Build Pipeline") {
        Component(downloader, "ENC Downloader", "bash + curl", "Pulls the PNW cell list and downloads .000 files into a working directory")
        Component(extractor, "S-57 Extractor", "ogr2ogr (GDAL)", "Translates S-57 layers we care about into GeoJSON")
        Component(normalizer, "GeoJSON Normalizer", "Python", "Maps S-57 attributes to a stable internal schema; filters out-of-scope features")
        Component(builder, "MVT Builder", "tippecanoe", "Builds an MBTiles file with marine-tuned zoom and layer settings")
        Component(packager, "PMTiles Packager", "pmtiles CLI", "Converts MBTiles to a single PMTiles archive")
        Component(manifest, "Manifest Writer", "Python", "Computes SHA-256, file size, source NOAA cycle date; writes manifest.json")
        Component(uploader, "Uploader", "rclone", "Uploads versioned PMTiles + manifest to R2; updates latest pointer")
    }

    Rel(downloader, noaa, "Bulk download", "HTTPS")
    Rel(extractor, downloader, "Reads .000 files", "filesystem")
    Rel(normalizer, extractor, "Reads per-layer GeoJSON", "filesystem")
    Rel(builder, normalizer, "Reads normalized GeoJSON", "filesystem")
    Rel(packager, builder, "Reads MBTiles", "filesystem")
    Rel(manifest, packager, "Reads PMTiles bytes", "filesystem")
    Rel(uploader, packager, "Uploads PMTiles", "filesystem → S3")
    Rel(uploader, manifest, "Uploads manifest", "filesystem → S3")
    Rel(uploader, r2, "PUT objects", "S3 API")

    UpdateLayoutConfig($c4ShapeInRow="3")
```

### Build Pipeline component catalog

| Component | Responsibility | Owns these decisions |
| --- | --- | --- |
| **ENC Downloader** | Fetch the PNW cell list from NOAA's bulk endpoint. Resumable, retry-on-failure, integrity-check via NOAA's published MD5s. | What cells are in scope (driven by a bounding-box config file in `pipeline/regions/pnw.yaml`). |
| **S-57 Extractor** | Run `ogr2ogr` per cell per layer with GDAL's S-57 driver. Emit one GeoJSON file per (cell, layer) pair. | The S-57 layer subset we care about (`DEPARE`, `SOUNDG`, `BOYLAT`, etc.). |
| **GeoJSON Normalizer** | Map S-57 attribute codes to a stable internal schema; drop features below a relevance threshold; merge per-cell GeoJSONs into per-layer GeoJSONs. | Attribute mapping (`OBJNAM` → `name`, `VALDCO` → `depth_m`, etc.) and feature filtering rules. |
| **MVT Builder** | Run `tippecanoe` with marine-tuned arguments (`--no-tile-stats`, per-layer minzoom/maxzoom, layer-specific feature limits). | Tile size budget, zoom-level cutoffs, generalization strategy. |
| **PMTiles Packager** | Run `pmtiles convert` to produce a single archive. | Whether to split by region (PNW vs. all-US) — currently single-file. |
| **Manifest Writer** | Compute file metadata; write `manifest.json` with version, timestamp, source NOAA cycle date, file size, SHA-256, schema version. | The manifest schema, which is the public contract for clients. |
| **Uploader** | Push the versioned PMTiles and updated manifest to R2; update the `latest` pointer atomically. | Naming convention for versioned objects; concurrency safety of the pointer swap. |

Each component is invokable independently. The whole pipeline is orchestrated by a single `pipeline/build.sh` that runs them in sequence; CI calls the same script.

## Web Client components

```mermaid
C4Component
    title Component Diagram — Web Client

    Person(sailor, "Sailor", "Browser user")
    ContainerDb(r2, "Tile Store (via CDN)", "Cloudflare R2 + CDN")

    Container_Boundary(web, "Web Client") {
        Component(shell, "App Shell", "HTML / CSS", "Page layout, palette selector, safety-depth input, attribution and disclaimer chrome")
        Component(maplibre, "MapLibre GL JS", "Library", "WebGL vector map renderer")
        Component(pmtilesjs, "pmtiles.js", "Library", "Translates MapLibre tile requests into HTTP Range requests against R2")
        Component(style, "S-52 Style", "JSON", "MapLibre style spec implementing approximated S-52 day/dusk/night palettes")
        Component(sprites, "Sprite Sheet", "PNG + JSON", "Pre-rendered marine symbols (lateral marks, lights, wrecks)")
        Component(safety, "Safety Depth Controller", "JS module", "Reads user draft + safety margin, re-styles depth-area layers dynamically")
        Component(manifestclient, "Manifest Client", "JS module", "Fetches manifest.json on load, displays last-updated date, warns if stale")
    }

    Rel(sailor, shell, "Interacts with viewer", "DOM events")
    Rel(shell, maplibre, "Initializes map", "JS API")
    Rel(shell, manifestclient, "Reads manifest", "JS")
    Rel(shell, safety, "Wires up depth input", "JS")
    Rel(maplibre, style, "Loads style", "fetch")
    Rel(maplibre, sprites, "Loads symbols", "fetch")
    Rel(maplibre, pmtilesjs, "Requests tiles", "protocol handler")
    Rel(pmtilesjs, r2, "Fetches tile ranges", "HTTP Range")
    Rel(manifestclient, r2, "Fetches manifest.json", "HTTPS")
    Rel(safety, maplibre, "Updates paint properties", "JS API")

    UpdateLayoutConfig($c4ShapeInRow="3")
```

### Web Client component catalog

| Component | Responsibility | Notes |
| --- | --- | --- |
| **App Shell** | Page skeleton, palette selector, safety-depth input, disclaimer banner. | Plain HTML + CSS; no framework. ~200 lines. |
| **MapLibre GL JS** | Vector map rendering, viewport management, paint computation. | Off-the-shelf. Version pinned in `web/package.json`. |
| **pmtiles.js** | Registers a `pmtiles://` protocol handler so MapLibre tile requests become byte-range fetches against a remote PMTiles file. | This is the trick that makes the "no tile server" architecture work in the browser. |
| **S-52 Style** | MapLibre style JSON describing layer order, paint, filter expressions, and per-zoom visibility for each marine feature. | The biggest single asset we author. Living document; expect dozens of iterations. |
| **Sprite Sheet** | Pre-rendered raster symbols for lateral marks, cardinal marks, lights, wrecks, anchorages. | Built from open-source S-52 symbol sets where licensing permits; otherwise hand-drawn. |
| **Safety Depth Controller** | Reads the user's draft + safety margin, updates MapLibre paint expressions at runtime to highlight contours and shade "shallower than safe" areas. | Pure client-side computation. No server round-trip. |
| **Manifest Client** | Fetches `manifest.json` at app load; surfaces the "charts last updated" date and shows a warning if older than the threshold from [risks-and-safety.md](../risks-and-safety.md). | The user-visible representation of freshness. |

## Why this decomposition

Each component on both sides has a single, narrow responsibility. That matters more in the pipeline than in the client because the pipeline is the place where bugs cause silent data corruption that ships to users — having clear, individually-testable steps means a bad weekly build can be diagnosed and rolled back component-by-component.

The client decomposition is lighter on purpose: a static viewer doesn't need component boundaries policed the same way. The split into modules is for readability and for future swap-ability (e.g. swapping `pmtiles.js` for a different transport when PMTiles v4 changes).
