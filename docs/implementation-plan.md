# Implementation Plan

## Current execution plan — 2026-09-29

This sequence supersedes the historical phase order below. The Puget Sound
pipeline, raster display, offline packaging, and light inspection cards are
implemented. The next objective is a useful, trustworthy inspection pilot and an
external developer integration, not a complete S-52 renderer.

The [Njord source review](njord-implementation-lessons.md) informs the technical
work. The [business-plan critique](business-plan-review.md) records the assumptions
that still need customer validation. Neither changes the static-serving decision.

### Slice 1 — Shared attributes and hazard inspection (implemented locally)

- Extract reusable, versioned S-57 decoding from the light card implementation.
- Add rock (`UWTROC`), wreck (`WRECKS`), and sounding (`SOUNDG`) cards.
- Show recorded water-level effect, wreck category, depth, and sounding quality
  when present. Describe classifications as recorded chart data, not a conclusion
  about whether a vessel can pass safely.
- Keep missing values distinct from zero, preserve unknown codes, support arrays
  and stringified arrays, and retain expandable raw attributes and source context.
- Validate meanings against source definitions independently of Njord.

Acceptance: existing light cases pass; known, missing, zero, negative, and uncertain
hazard depths have regression coverage; browser tests inspect real chart features
and verify readable cards alongside raw data. No archive rebuild is required.

Pilot defect backlog: investigate absent sounding labels on initial views.
Toggling SOUNDG off/on makes the tested label selectable. The first-slice
sounding browser check uses this workflow at zoom 15; initial label placement
remains unresolved and should be fixed before the pilot.

### Slice 2 — Build-time aid associations

Resolve unambiguous light/buoy links from explicit references within a source cell
before tiling. Preserve the original attributes plus related feature keys and
names. Continue reading older archives that lack enrichment.

Acceptance: identity remains stable across zoom and tile boundaries; missing,
ambiguous, duplicate, and cross-cell references have tests; version the enriched
schema and compare output before publishing a rebuilt archive. Add a static
feature index only if the pilot requires persistent selected-feature links.

### Slice 3 — Verified managed updates

Extend the existing catalog checker into a candidate-release workflow: detect
changed and newly relevant cells, flag withdrawals, build, validate, and publish
the manifest last. Expose installed release, source revisions, last successful
check, coverage, and download size. Retain the prior release for rollback.

Acceptance: unchanged inputs are a no-op; missed runs catch up; incomplete catalogs
and failed builds cannot replace a usable release; distinguish changed source
cells from binary archive deltas. Required before promising managed updates.

### Slice 4 — Multi-scale coverage policy

Define preferred-cell selection and build-time clipping before introducing more
chart usage bands or expanding geographically. Test overlapping harbor/coastal
cells for duplicate features, seams, and missing aids.

Acceptance: deterministic selection, preserved provenance, and reviewed overlap
fixtures. Do not claim that global layer zoom thresholds implement source scale.

### Later, conditional on pilot feedback

Light heights/ranges/sectors, day/dusk/night palettes, and richer vector symbols.
Keep user-specific display settings out of shared static archives where possible.
A complete S-52 engine, dynamic database tile server, and subscription machinery
remain outside this sequence.

### Business track and stop conditions

In parallel, interview five marine-web developers and observe three sailor
sessions. Seek one external integration and a bounded paid pilot. Record developer
budget/maintenance problems separately from sailor usability feedback. Review
evidence after 30 days; prioritize repeated problems, not feature completeness.
Unawarded grants are not operating runway. Production publication and outreach
remain separate actions from local implementation.


A phased plan from empty repo to v1.0. Each phase has a scope, deliverables, success metric, and an exit gate. Dates are indicative; gates are not.

## Operating principles

- **Dogfood weekly.** The maintainer sails the Salish Sea. Every release should be usable on his own boat by the end of its phase.
- **No premature scope.** Pacific Northwest only until v0.2. Other US regions are mechanical expansion after v0.2.
- **No premature ops.** No hosted tier until adoption signal exists. v0.1 is a downloadable bundle + open-source pipeline.
- **Decisions live in ADRs, not in code comments.** Any non-obvious choice gets its own ADR.

## Phase 0 — Decisions and scaffolding (Weeks 0–2)

**Scope:** Lock the direction and seed the repo with the structural pieces needed before code.

**Deliverables:**

- `docs/` populated (this commit).
- Repo scaffolding: license, `CONTRIBUTING.md` stub, GitHub issue templates, MIT license, "not for navigation" disclaimer in `README.md`.
- CI baseline: GitHub Actions runner with `markdownlint` and a Mermaid validation step.

**Exit gate:** All ADRs from [0001](adr/0001-record-architecture-decisions.md) through [0008](adr/0008-mit-license-with-not-for-navigation-disclaimer.md) are merged and `main` is buildable in CI.

## Phase 1 — Pacific Northwest pipeline prototype (Months 1–2)

**Scope:** End-to-end pipeline that turns the NOAA ENC suite for the Pacific Northwest into a single PMTiles file.

**Deliverables:**

- `pipeline/` directory with a single `build.sh` orchestrating:
  1. Download NOAA ENC `.000` cells covering the Salish Sea / Puget Sound / San Juans / Strait of Juan de Fuca.
  2. `ogr2ogr` extraction of the S-57 layers we care about for v0.1: `DEPARE`, `DEPCNT`, `SOUNDG`, `LNDARE`, `COALNE`, `BOYLAT`, `BOYSAW`, `BOYSPP`, `BCNLAT`, `LIGHTS`, `WRECKS`.
  3. `tippecanoe` MVT generation with tuned arguments (no tile-stats dropping, marine zoom levels 4–16).
  4. `pmtiles convert` to produce `pnw.pmtiles`.
- A Dockerfile that pins `gdal-bin`, `tippecanoe`, and `pmtiles` versions.
- A GitHub Action that runs the pipeline weekly on a schedule and uploads `pnw.pmtiles` as a release artifact (no R2 yet — keep ops surface small).

**Success metric:** `pnw.pmtiles` is under 500 MB, builds in under 30 minutes on a free-tier GitHub runner, and a hand-spot-check of 20 random nav-significant features matches the corresponding NOAA chart.

**Exit gate:** A second contributor can clone the repo, run `./pipeline/build.sh`, and produce a byte-identical PMTiles file within 1 hour.

## Phase 2 — Web client with S-52-styled rendering (Months 2–3)

**Scope:** A browser-based chart viewer that consumes `pnw.pmtiles` and renders a usable S-52-inspired stylesheet.

**Deliverables:**

- `web/` directory: a small static site (no framework — vanilla JS + MapLibre GL JS + `pmtiles.js`).
- A MapLibre style JSON in `web/styles/s52-day.json` covering: depth area fills, depth contours, soundings, lateral and special buoys (region B / IALA-B for US waters), lights, wrecks, coastline.
- A dropdown for day / dusk / night palettes (S-52 has three reference palettes; ours can be approximations).
- Deployed as a GitHub Pages site pointing at the latest release artifact via a small Worker (or direct GH Releases URL with `Range` support — to be confirmed during build).

**Success metric:** The maintainer can plan a real Salish Sea passage in the browser using only the v0.1 viewer.

**Exit gate:** Three sailors outside the maintainer's household use the demo site for a planning session and provide written feedback.

## Phase 3 — Offline / onboard mode (Months 3–5)

**Scope:** Run the same client and tiles on a Pi / mini-PC at the nav station with no internet.

**Deliverables:**

- `onboard/` directory: a `docker-compose.yml` that runs nginx serving the PMTiles file from a mounted volume, plus the static `web/` build.
- A sync script (`onboard/sync.sh`) that downloads the latest `pnw.pmtiles` over LTE / marina wifi / Starlink, with resume-on-failure and a bandwidth cap. Initial implementation: full-file `rsync --partial` or `aria2c`; incremental updates deferred to v0.2.
- Hardware notes (`onboard/HARDWARE.md`) documenting tested rigs (a known-good Raspberry Pi 5 image + a known-good Intel N100 mini-PC image).

**Success metric:** A clean install on a fresh Pi 5 boots, syncs, and serves charts in under 15 minutes.

**Exit gate:** Maintainer takes the rig on a one-week Salish Sea cruise and uses it as the primary chart display (with a backup, per [risks-and-safety.md](risks-and-safety.md)).

## Phase 4 — v0.1 release (Months 5–6)

**Scope:** Cut a tagged release and announce it.

**Deliverables:**

- v0.1.0 tag with release notes.
- Project website at `chartiles.com`: a one-pager + the embedded demo + download links.
- A long-form launch post on the maintainer's site walking through the architecture, the Btrfs-vs-PMTiles tradeoff (see [ADR-0003](adr/0003-pmtiles-over-btrfs.md)), and the rationale for the PNW-first scope.
- Submissions to: r/sailing, r/boating, Hacker News (Show HN), Sailing Anarchy forums, the OpenCPN dev list, Signal K Slack.

**Success metric:** 50 GitHub stars, 5 external issues filed, 1 unaffiliated person reports running it on their own boat.

**Exit gate:** Release announced; first-week feedback triaged into the v0.2 backlog.

## Phase 5 — Adoption and grant applications (Months 6–12)

**Scope:** Convert the v0.1 release into momentum on two parallel tracks: real users and grant funding.

**Deliverables:**

- East Coast scope added (Chesapeake / Long Island Sound / Maine — pick one for v0.2 based on the loudest external request).
- First grant application submitted to **NSF POSE** (Phase 1, $300K). See [roadmap.md](roadmap.md) for the funding strategy.
- A second application to **NOAA Sea Grant** or **Sloan Foundation** depending on POSE timing.
- A `SPONSORS.md` and GitHub Sponsors / Open Collective account (for signal more than dollars).

**Success metric:** Either (a) one grant moves to the next round, or (b) a regional hydrographic office reaches out about a custom pipeline build.

**Exit gate:** Decision point at month 12 on whether to take the project part-time or full-time based on grant outcomes.

## Phase 6 — Hosted tier and first consulting engagement (Year 2)

**Scope:** Stand up `data.chartiles.com` as a hosted PMTiles endpoint for app developers and indie boaters who don't want to self-host. Take the first paid consulting engagement.

**Deliverables:** Deliberately under-specified — informed by Phase 5 feedback. See [roadmap.md](roadmap.md) for the revenue thesis.

## What's deliberately not in scope through v1.0

- Routing / passage planning.
- AIS overlay or real-time data.
- Crowdsourced soundings (Navionics SonarChart-style).
- Native iOS / Android SDKs.
- International chart data (UKHO, SHOM, etc. — see [ADR-0004](adr/0004-pacific-northwest-scope-for-v0-1.md)).

Each of these is a plausible v2.0 axis. None of them is in the critical path to "free, open, vector NOAA charts that work offline on a boat."
