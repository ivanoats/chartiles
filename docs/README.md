# ChartTiles Documentation

This directory is the canonical reference for ChartTiles' direction, architecture, and decisions.

## Map of the docs

| Path | What it covers |
| --- | --- |
| [implementation-plan.md](implementation-plan.md) | Phased build plan from v0 scaffolding to v1.0 |
| [business-plan.md](business-plan.md) | Strategic plan: market, customers, competition, revenue, KPIs |
| [roadmap.md](roadmap.md) | 18-month timeline tied to sustainability milestones (grants, hosted tier, consulting) |
| [glossary.md](glossary.md) | Maritime, GIS, and tile-format terminology |
| [risks-and-safety.md](risks-and-safety.md) | Liability posture, technical risk register, strategic risks |
| [architecture/](architecture/) | C4 model: system context → containers → components → data flows |
| [adr/](adr/) | Architecture Decision Records (Michael Nygard format) |

## How these docs are organized

The architecture follows the [C4 model](https://c4model.com/) at four levels of zoom. Diagrams are written inline as MermaidJS fenced code blocks; GitHub renders them natively and most IDEs have a preview extension.

Decisions live in [adr/](adr/). Each ADR captures a single, named, dated choice — context, the decision, and its consequences. New ADRs are appended; existing ones are marked superseded rather than deleted.

## Audience

These docs assume the reader is comfortable with:

- Web infrastructure (HTTP, CDN, object storage).
- Basic GIS terminology (tiles, projections, vector vs. raster). [glossary.md](glossary.md) covers the rest.
- The S-57 / S-52 / ENC vocabulary used by maritime hydrographic offices — also in [glossary.md](glossary.md).

## Working prototype

[Shilshole prototype](shilshole-prototype.md) — run instructions, measured results, validation boundaries and next gate.

[Puget Sound expansion](puget-sound-expansion.md) — next implementation steps, coverage decisions and measurement gates.

[Puget Sound benchmark](puget-sound-benchmark.md) — regional selection, measurements and review status.

[Update benchmark](update-benchmark.md) — source revision checks and measured full-replacement size.

[Offline bundle](offline-bundle.md) — package, extract and serve without npm or internet.
