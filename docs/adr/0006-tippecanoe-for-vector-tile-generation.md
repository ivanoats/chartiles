# ADR-0006: Use tippecanoe for vector tile generation

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

The pipeline needs a step that turns GeoJSON (one file per S-57 layer) into a tile pyramid in MVT format. The mainstream options are:

| Tool | Strengths | Weaknesses for this project |
| --- | --- | --- |
| **tippecanoe** (Felt, originally Mapbox) | Battle-tested, single binary, marine-relevant flags well documented, simple invocation, active maintenance | Single-threaded; slower than planetiler at very large datasets |
| **planetiler** (Onthegomap) | Extremely fast, parallel, built for the OSM planet workload | Java toolchain, designed around an OSM-shaped schema, less idiomatic for arbitrary GeoJSON |
| **tegola** (Go-Spatial) | Good if you have a PostGIS source | Designed as a tile server, not a pre-compiler — wrong shape for our static pipeline |
| **Custom (Go / Rust)** | Maximum control | Massive engineering cost for marginal benefit |

Our data scale is modest (one US region per pipeline run, ~30 cells, tens of MB of GeoJSON). The full US dataset is still well under the threshold where planetiler's speed advantage justifies its toolchain overhead. Tippecanoe is the right size for the job and has explicit documentation for the marine-data edge cases we'll hit (sounding label drops at high zoom, feature filtering, per-layer minzoom).

## Decision

The pipeline uses **tippecanoe** for the GeoJSON → MBTiles step. The MBTiles output is then converted to PMTiles via the `pmtiles convert` command.

We will:

- Pin the tippecanoe version in the pipeline Dockerfile.
- Maintain marine-tuned tippecanoe arguments in `pipeline/tippecanoe.args`, version-controlled.
- Test the args explicitly: at minimum, CI checks that `SOUNDG` (sounding) feature counts at z=14+ are above a known threshold (catches the silent label-drop failure mode).

Initial argument starter set:

```
--no-tile-stats           # avoid the default drop-features-at-high-zoom behavior
--no-feature-limit        # marine charts have dense buoyage; default limits drop too much
--no-tile-size-limit      # we'll re-tune if tiles get problematic
--maximum-zoom=16         # harbor-level detail
--minimum-zoom=4          # regional overview
--coalesce-densest-as-needed
--layer=depths            # per-layer flags follow
```

(These are starting points; expect tuning over Phase 1.)

## Consequences

**Positive**

- Mature, well-documented tool. Decisions are well-understood and reversible.
- Single binary, easy to ship in the pipeline Docker image.
- Marine-data tuning is a known problem space; we benefit from prior art.
- The pipeline step is a pure function of GeoJSON inputs + args — easy to test and reproduce.

**Negative**

- Single-threaded build. For PNW this is fine (minutes). For all-US it may push CI runtime past an hour. If so, we either split by region (acceptable) or migrate to planetiler (a known fork-in-the-road, but not for v0.1).
- Tippecanoe occasionally has quirky behavior with specific feature attributes; we'll need a CI suite that validates output structure.

**Neutral**

- Tippecanoe's maintenance moved from Mapbox to Felt in 2024. Felt is a serious geospatial company with sustained investment in the tool. Project health is good.
- If we ever need to inject custom MVT post-processing (e.g., merging features across layer boundaries), tippecanoe's output is standard MVT and we can pipe through any third-party transformer.
