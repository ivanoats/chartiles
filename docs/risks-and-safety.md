# Risks and Safety

This document captures the risks the project is willingly running into and the safety posture we've chosen. New contributors should read this before writing user-facing copy, marketing material, or anything that could be construed as a navigation claim.

## Safety posture

> **CharTiles is for experimental chart inspection. Not for navigation.**

That sentence (or a close variant) must appear in:

- The repository `README.md`.
- The project website landing page.
- The web viewer's chrome (a persistent footer or banner).
- The offline viewer and bundled README.
- Tile metadata where the format supports it.

This is a deliberate, repeated, non-negotiable disclaimer. The rationale lives in [ADR-0008](adr/0008-mit-license-with-not-for-navigation-disclaimer.md).

### Why this matters

The disclaimer reflects the project’s limitations. CharTiles:

- Has no type approval (IMO / SOLAS / Coast Guard).
- Has no formal Quality Management System.
- Has a single maintainer and no on-call rotation.
- Cannot guarantee that the latest NOAA Notice to Mariners corrections are reflected within a navigationally-relevant time window.

A boat running aground because ChartTiles was used as primary nav is a real failure mode. The disclaimer is the floor of our risk mitigation; the rest of this document is how we keep the actual risk low.

## Liability risk register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| User treats ChartTiles as primary nav, runs aground, sues | Low | High | Repeated disclaimer; MIT license disclaims warranty; no marketing language that implies certified use |
| NOAA upstream changes ENC license or format | Low | Medium | Pin format version; monitor NOAA Office of Coast Survey announcements; S-100 migration is the watch item |
| Stale data: chart in production is missing a recent Notice to Mariners | Medium | Medium | Show the build date and source revisions. The catalog checker can report source changes. Scheduled managed updates remain planned. |
| Maintainer becomes unavailable for >30 days | Medium | Medium | Record build and release steps in the runbook. PR tests run in GitHub Actions and chart publication is manual. |

We deliberately do **not** carry commercial maritime liability insurance at this stage. If the project takes on paying enterprise customers, this changes — see [ADR-0008](adr/0008-mit-license-with-not-for-navigation-disclaimer.md).

## Technical risk register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `pnw.pmtiles` exceeds 500 MB target, blowing the sync budget for boats on satellite | Medium | Medium | Aggressive zoom-level pruning; layer-by-layer size budgeting in CI; regional PMTiles splits if needed in v0.2 |
| Tippecanoe drops sounding labels at high zoom due to density | High | Medium | Verify sounding identity and depth at maximum archive zoom. Chromium tests check initial labels on a real feature at multiple display zooms. |
| MapLibre can't natively express some S-52 symbology (e.g. complex lateral mark shapes with topmarks) | High | Low | Use simplified symbols in inspection and upstream imagery in Chart view. Full S-52 portrayal remains outside the current scope. |
| Browser memory pressure on long passages (panning across hundreds of tiles) | Medium | Low | Use MapLibre tile caching. Chromium CI tests fixture-scale use. Long sessions on onboard hardware remain unmeasured. |
| PMTiles `Range` requests not supported by some marina wifi captive portals / proxies | Low | Medium | Verify Worker byte-range responses and prepare an offline ZIP before disconnecting. |
| NOAA's bulk download endpoint changes URL or schema | Low | Low | Use the pipeline’s known source endpoint and retain input snapshots for reproduction. |

## Strategic risk register

These are the risks to the project's existence as an open-source infrastructure play.

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Mapbox / MapTiler / Stadia adds NOAA ENC ingestion as a feature | Medium | High | Out-execute on marine-specific styling and offline mode; lean into the open-source-community moat |
| Adoption stalls — no unaffiliated users on `pnw.pmtiles` 6 months after launch | Medium | High | Decision gate at month 12 (see [roadmap.md](roadmap.md)); fall back to side-project cadence if so |
| All grant applications miss | Medium | Medium | Stagger applications across NSF / Sloan / NLnet / STF; consulting and hosted tiers provide partial offset |
| OpenCPN or similar incumbent forks the pipeline and bundles it without contributing back | Medium | Low | MIT license accepts this outcome; the loss is reputational, not financial |
| Maintainer burns out from grant-writing + on-call + community moderation | High | High | Cap grant-writing at one cycle per quarter; no SLAs on the hosted tier until paid; the project's success criterion is sustainability, not growth |

## What we don't worry about (and why)

- **Performance at scale.** Hosted operations currently use static site delivery and metered Worker and R2 requests. See the [business-plan review](business-plan-review.md) for cost assumptions that need measurement.
- **Vendor lock-in to Cloudflare.** R2 is S3-compatible; the upload step can target any S3 endpoint. PMTiles is filesystem-agnostic.
- **Format obsolescence.** MVT is the de facto open standard. PMTiles is gaining ecosystem traction (Protomaps, Stamen, OpenStreetMap planet builds). If either disappears, we have a year+ to migrate.
- **Internationalization of the data.** US-only is a deliberate v0.1 choice ([ADR-0004](adr/0004-pacific-northwest-scope-for-v0-1.md)). Adding other hydrographic offices is a v2.0 decision.
