# Architecture

ChartTiles' architecture is documented using the [C4 model](https://c4model.com/) at four zoom levels. Read them in order.

| Level | Document | What it answers |
| --- | --- | --- |
| L1 — System Context | [system-context.md](system-context.md) | Who uses ChartTiles and which external systems it depends on |
| L2 — Containers | [containers.md](containers.md) | What runtime processes / storage stores make up ChartTiles, and how they talk |
| L3 — Components | [components.md](components.md) | What modules sit inside each container and what they're each responsible for |
| Dynamic — Data flows | [data-flows.md](data-flows.md) | Sequence diagrams for the build, viewing, and sync paths |

A fourth C4 level (Code) is deliberately not maintained. It would constrain implementation choices without paying back in clarity at this stage. If the codebase grows past ~30 components we revisit.

## Architectural shape, in one paragraph

ChartTiles is a static-file system with a build pipeline and a thin client. A weekly cloud job pulls NOAA ENC data, runs it through `ogr2ogr` and `tippecanoe`, packages the output as a single PMTiles file, and uploads it to object storage. Clients — either a browser hitting the CDN or a small nginx on a boat hitting a local file — read individual tiles via HTTP range requests directly from the PMTiles archive. There is no GIS server, no database at runtime, and no per-user dynamic computation. All styling and dynamic behavior (depth-shaded contours, day/night palettes, safety-depth highlighting) is computed in the client from a MapLibre style sheet.

## Clean Architecture mapping

Mapping ChartTiles to Clean Architecture layers, with dependencies pointing inward:

- **Entities** — the marine domain model: cells, features (`DEPARE`, `SOUNDG`, `BOYLAT`, etc.), depth contours, navigation aids. These exist conceptually but aren't a runtime concern because all entity-to-MVT translation happens at build time.
- **Use Cases** — the build pipeline's individual steps (download a cell, extract a layer, tile a layer, package). Each is an idempotent function of inputs to outputs.
- **Interface Adapters** — `pmtiles.js` (which translates MapLibre's tile requests into HTTP range requests) and the MapLibre style JSON (which translates raw vector features into pixels). On the build side, the S-57 → GeoJSON step is the adapter from NOAA's domain format to the internal one.
- **Frameworks & Drivers** — GDAL, tippecanoe, MapLibre GL JS, nginx, Cloudflare R2 / Workers, GitHub Actions. These are all replaceable; the architecture does not depend on any specific one (see [ADRs](../adr/) for why each was chosen).

## Why Hexagonal-style boundaries are appropriate here

The pipeline has a single, narrow "port" facing the upstream world (NOAA's bulk endpoint, which is a directory of `.zip` files containing `.000` cells). The downstream port is "produce a PMTiles archive in object storage." Everything between is a chain of pure transforms. This shape is naturally hexagonal: the domain logic (tile selection, feature filtering, attribute normalization) is independent of the adapters (download mechanism, upload destination, runner environment). Swapping GitHub Actions for a self-hosted runner, or R2 for S3, requires no changes to the domain logic.

The client is shaped the same way: MapLibre is the framework, the style JSON is the adapter, the domain ("what features should appear at zoom Z with palette P") is data, not code.
