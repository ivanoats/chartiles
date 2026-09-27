# Architecture Decision Records

ADRs capture significant, contested, or non-obvious choices made about ChartTiles' architecture. The format is [Michael Nygard's](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md): title, status, context, decision, consequences.

## Why we keep ADRs

- A future contributor (or future you) should not have to re-derive a decision from a code search.
- The *why* of a decision rots faster than the code itself; ADRs preserve it.
- Disagreement gets recorded, not erased — if a decision is later reversed, the old ADR is marked superseded, not deleted.

## Index

| # | Title | Status | Date |
| --- | --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-06-29 |
| [0002](0002-open-source-infrastructure-direction.md) | Pursue open-source infrastructure as the primary direction | Accepted | 2026-06-29 |
| [0003](0003-pmtiles-over-btrfs.md) | Use PMTiles instead of a Btrfs partition image | Accepted | 2026-06-29 |
| [0004](0004-pacific-northwest-scope-for-v0-1.md) | Scope v0.1 to Pacific Northwest waters | Accepted | 2026-06-29 |
| [0005](0005-static-file-serving-no-gis-database.md) | Serve charts as static files; no GIS database at runtime | Accepted | 2026-06-29 |
| [0006](0006-tippecanoe-for-vector-tile-generation.md) | Use tippecanoe for vector tile generation | Accepted | 2026-06-29 |
| [0007](0007-maplibre-gl-js-for-client-rendering.md) | Use MapLibre GL JS for client rendering | Accepted | 2026-06-29 |
| [0008](0008-mit-license-with-not-for-navigation-disclaimer.md) | MIT-license the project with a prominent "not for navigation" disclaimer | Accepted | 2026-06-29 |
| [0009](0009-raster-chart-view-with-vector-inspection.md) | Add raster chart viewing alongside vector inspection | Accepted | 2026-09-27 |

## Authoring conventions

- Files are numbered sequentially: `NNNN-short-kebab-case-title.md`. Never reuse a number.
- Status values: `Proposed`, `Accepted`, `Superseded by ADR-NNNN`, `Deprecated`.
- An ADR is immutable once `Accepted`. To change a decision, write a new ADR that supersedes it.
- Keep ADRs short — one page in most cases. If you need more than a page, you're probably writing a design doc, not an ADR.
