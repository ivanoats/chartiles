# System Context (C4 Level 1)

The widest view: who uses ChartTiles, what it does, and which external systems it depends on.

## Diagram

```mermaid
C4Context
    title System Context for ChartTiles

    Person(sailor, "Sailor / Boater", "Plans passages in a browser; views charts offline at the nav station underway")
    Person(appdev, "App Developer", "Embeds vector tiles in a marine app (planning tool, fishing app, regatta software)")
    Person(contributor, "Contributor", "Maintainer plus open-source contributors who run, modify, and extend the pipeline")

    System(chartiles, "ChartTiles", "Open-source vector chart pipeline, distribution, and viewer")

    System_Ext(noaa, "NOAA ENC Distribution", "Public-domain S-57 charts covering US waters, refreshed by NOAA Office of Coast Survey")
    System_Ext(github, "GitHub", "Source hosting, CI runner for the weekly build, release artifact storage")
    System_Ext(r2, "Cloudflare R2 + CDN", "Object storage and HTTP delivery of PMTiles archives")
    System_Ext(browser, "User's Browser", "Renders the web viewer via MapLibre GL JS")
    System_Ext(boat, "Onboard Computer", "Pi or mini-PC at the nav station serving charts locally")
    System_Ext(backupnav, "Backup Navigation System", "Type-approved chart plotter on the vessel — primary nav, not ChartTiles")

    Rel(sailor, chartiles, "Plans passages, views charts (browser or onboard)")
    Rel(appdev, chartiles, "Embeds PMTiles in apps")
    Rel(contributor, chartiles, "Runs build pipeline, contributes code, files issues")

    Rel(chartiles, noaa, "Pulls S-57 cells", "HTTPS, weekly")
    Rel(chartiles, github, "Runs CI, publishes releases", "Actions, Releases API")
    Rel(chartiles, r2, "Publishes PMTiles + manifest", "S3 API")
    Rel(browser, r2, "Fetches tiles", "HTTP Range requests")
    Rel(boat, r2, "Syncs latest PMTiles", "HTTPS / rsync")
    Rel(sailor, backupnav, "Uses for primary navigation", "Per safety policy")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Actors

**Sailor / Boater** — The primary end user. Two modes of use: planning (in a browser, at a marina with wifi, the day before a passage) and underway (at the nav station, offline, on the onboard rig). The same chart, the same viewer, the same data — different transport.

**App Developer** — Builds marine apps and wants vector chart data without standing up their own NOAA ingestion pipeline. Uses either the downloadable PMTiles directly (`pnw.pmtiles`) or, once available, the hosted endpoint at `data.chartiles.com`.

**Contributor** — The maintainer and the eventual open-source contributor community. Reads the [implementation plan](../implementation-plan.md), opens issues, sends PRs, runs the build locally to verify changes.

## External systems

**NOAA ENC Distribution** — The upstream source of all chart data. NOAA publishes S-57 cells via a [bulk download endpoint](https://charts.noaa.gov/ENCs/ENCs.shtml) refreshed on Notice to Mariners cycles. Public domain. The single most important external dependency; the project's entire data supply chain originates here.

**GitHub** — Source repository, CI runner via GitHub Actions, and release artifact host for the weekly PMTiles build. The build is fully reproducible in CI; nothing runs on the maintainer's laptop.

**Cloudflare R2 + CDN** — Object storage for PMTiles archives plus Cloudflare's global CDN for low-latency `Range` request serving. Chosen for zero egress fees and S3-compatible API. Substitutable with any S3-compatible store plus any CDN that honors `Range` headers.

**User's Browser** — A modern browser running MapLibre GL JS, `pmtiles.js`, and our style JSON. No backend involved in the viewing path.

**Onboard Computer** — A Raspberry Pi 5 or Intel N100 mini-PC at the nav station. Runs nginx + the static web bundle + a sync script. May be offline for days or weeks at a time.

**Backup Navigation System** — Explicitly noted in this diagram because ChartTiles' safety posture (see [risks-and-safety.md](../risks-and-safety.md)) requires its existence. Type-approved chart plotters from Garmin, B&G, Raymarine, Furuno, etc. ChartTiles is reference and planning software, not a replacement for these.

## What ChartTiles is responsible for

- Ingesting raw NOAA ENC data on a weekly cadence.
- Translating it to a modern vector tile format (PMTiles).
- Hosting the result in a way that's cheap, cacheable, and offline-capable.
- Providing a reference web client and onboard configuration.
- Defining a stylesheet that approximates S-52 well enough to be usable for planning.

## What ChartTiles is not responsible for

- Real-time data (AIS, weather, currents).
- Routing or passage planning logic.
- Acting as a primary nav aid.
- Hosting derivative chart data (other hydrographic offices, custom overlays). These are deferred to v2.0+.
