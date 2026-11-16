# Architecture

This section describes how CharTiles works today. The
[architecture decision records](../adr/README.md) explain why particular
choices were made and preserve the context in which they were made. The
[implementation plan](../implementation-plan.md) tracks proposed work.

| View | What it explains |
| --- | --- |
| [System context](system-context.md) | People who use CharTiles and the systems it depends on |
| [Containers](containers.md) | What builds, runs, and stores the site and chart data |
| [Components](components.md) | Which repository modules implement those responsibilities |
| [Data flows](data-flows.md) | How charts are published, fetched online, and packaged offline |
| [Raster chart view](raster-chart-view.md) | How the imagery and vector inspection modes coexist |

CharTiles has two independent builds. A local data pipeline produces
content-addressed vector and raster PMTiles and a release manifest. Astro
builds the public content site and stages the standalone MapLibre viewer and
CUGOS talk for Netlify. A Cloudflare Worker serves chart files out of private
R2 storage. The offline ZIP uses the same viewer with a local Python range
server.

See the [hosting runbook](../../hosting/README.md) for release commands and
the [offline bundle guide](../offline-bundle.md) for packaging. Automated
managed updates and a multi-scale coverage policy are future slices.

When behavior changes, update the relevant architecture view and runbook.
When a major decision changes, record the new decision in an ADR.
