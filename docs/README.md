# CharTiles documentation

Start with the page that matches what you want to do.

## Use and integrate

| Document | What it covers |
| --- | --- |
| [Public developer guide](https://chartiles.com/integrate/) | Integrating chart data in an existing MapLibre map |
| [Developer quickstart](developer-quickstart.md) | Running a minimal wreck inspection example against the public archive |
| [Offline bundle](offline-bundle.md) | Building, extracting, and serving the map without an internet connection |
| [Raster chart view](raster-chart-view.md) | Chart view, vector inspection, and how to import raster imagery |
| [Feature inspection](feature-inspection.md) | Readable light and hazard cards, source attributes, and validation |
| [Hosting and site publishing](../hosting/README.md) | Chart uploads, Astro pages, Markdown drafts, and Netlify previews |
| [CUGOS talk](../talks/cugos/README.md) | Presentation, localhost rehearsal, and sources |

## Understand the system

| Document | What it covers |
| --- | --- |
| [Architecture](architecture/README.md) | What runs today, where it runs, and how components interact |
| [Architecture decision records](adr/README.md) | Why we chose the architecture and when those decisions were made |
| [Risks and safety](risks-and-safety.md) | Inspection limits, data risks, and planned mitigations |
| [Glossary](glossary.md) | Maritime, GIS, and tile-format vocabulary |

Update the architecture reference when implementation changes. Add an ADR
when the project makes a significant decision. Accepted ADRs preserve
historical context.

## Measure and validate

- [Shilshole prototype](shilshole-prototype.md) for the small-area build and original measurements.
- [Puget Sound benchmark](puget-sound-benchmark.md) for regional selection, tile checks, and measurements.
- [Coverage audit](coverage-audit.md) for what the coverage overlay measures.
- [Puget Sound release baseline](puget-sound-release-baseline.md) for recorded build and package sizes and publication checks.
- [Update benchmark](update-benchmark.md) for source revisions and replacement archive costs.
- [tylertoo benchmark](tylertoo-benchmark.md) for the vector compiler comparison.

## Plan the next pilot

- [Implementation plan](implementation-plan.md) for current status and acceptance criteria.
- [Business-plan review](business-plan-review.md) for assumptions that need customer evidence.
- [Developer interviews](developer-interview-guide.md) and [sailor walkthrough](sailor-walkthrough.md) for the two pilot audiences.

## Historical plans and research

- [Original implementation phases](implementation-plan-history.md)
- [Puget Sound expansion plan](puget-sound-expansion.md)
- [Raster implementation plan](raster-chart-plan.md)
- [Original business plan](business-plan.md) and [sustainability roadmap](roadmap.md)
- [Njord implementation review](njord-implementation-lessons.md)
