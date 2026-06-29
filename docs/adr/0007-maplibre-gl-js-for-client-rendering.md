# ADR-0007: Use MapLibre GL JS for client rendering

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

The web viewer needs a vector-tile-aware map rendering library. The options:

| Library | License | Vector tiles | Notes |
| --- | --- | --- | --- |
| **MapLibre GL JS** | BSD-3-Clause | Native | Community fork of Mapbox GL JS v1 (the last open-source version before Mapbox closed the source). No account or token required. Active development. |
| **Mapbox GL JS** (current) | Proprietary | Native | Excellent library, but requires a Mapbox account and is governed by Mapbox's commercial terms. Not appropriate for an open-source-infra project. |
| **OpenLayers** | BSD-2-Clause | Yes (via plugin) | Older API, less polished MVT rendering, weaker WebGL story. |
| **Leaflet** | BSD-2-Clause | Raster only natively (vector via plugins) | Wrong architecture; we'd be forcing vector tiles through a raster-shaped pipe. |
| **deck.gl** | MIT | Vector via plugins | Optimized for data overlays, not basemap rendering. |
| **Custom WebGL** | — | — | Order of magnitude too much engineering for v0.1. |

For onboard and mobile use, native SDKs (MapLibre Native, MapLibre iOS, MapLibre Android) exist and share the same style spec. v0.1 targets browsers only; native SDKs are deferred but compatible.

MapLibre's style specification is a superset of Mapbox GL JS v1's spec. Our S-52-inspired stylesheet is a MapLibre style JSON. This is portable to any renderer that implements the spec (including the native SDKs above).

## Decision

The web client uses **MapLibre GL JS** (latest stable) as its rendering library. The S-52-inspired stylesheet is written as a MapLibre style JSON file (`web/styles/s52-day.json`, `s52-dusk.json`, `s52-night.json`).

We will:

- Pin MapLibre to a specific minor version in `web/package.json`; bump deliberately, not automatically.
- Use `pmtiles.js` as the PMTiles protocol handler (see [components.md](../architecture/components.md)).
- Build marine symbology as a sprite sheet for symbols MapLibre can't express natively (lateral marks with topmarks, complex lighthouse symbols).
- Treat the style JSON as the *primary asset* the project produces — it is what people will fork and modify.

## Consequences

**Positive**

- No commercial terms, no API key, no per-user cost. Aligns with the open-source-infrastructure direction.
- Style spec compatibility means our stylesheet works on iOS, Android, and browser without reauthoring.
- Active and growing community; multiple companies (MapTiler, Stamen, Felt) contribute and depend on it.
- WebGL renderer is performant enough for the densest harbor zoom levels.

**Negative**

- S-52's symbology is more expressive than MapLibre's style spec. Specifically:
  - Some lateral marks have topmarks (small shapes on top of the buoy) that MapLibre can't natively compose; we work around this with pre-rendered sprite sheets.
  - S-52 specifies complex sector-light rendering (variable arcs by bearing); we approximate with simplified symbols.
  - Pattern fills are limited compared to S-52's specified pattern library.
- Style JSON gets large. A full S-52-approximating style is thousands of lines. We'll need linting, validation, and a generation script for some repetitive blocks (per-buoy-type rules, etc.).

**Neutral**

- If MapLibre's governance shifts (acquisition, fork, license change), we are no worse off than any other MapLibre user — and we'd have time to migrate, because the style spec is portable.
- Native iOS/Android viewer apps are a plausible v2 axis; the style JSON we author now would carry over directly.
