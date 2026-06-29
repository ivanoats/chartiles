# Risks and Safety

This document captures the risks the project is willingly running into and the safety posture we've chosen. New contributors should read this before writing user-facing copy, marketing material, or anything that could be construed as a navigation claim.

## Safety posture

> **ChartTiles is not for primary navigation. It is reference and planning software. Mariners are responsible for maintaining redundant, type-approved navigation systems aboard their vessels.**

That sentence (or a close variant) must appear in:

- The repository `README.md`.
- The project website landing page.
- The web viewer's chrome (a persistent footer or banner).
- The onboard sync script's first-run output.
- Tile metadata where the format supports it.

This is a deliberate, repeated, non-negotiable disclaimer. The rationale lives in [ADR-0008](adr/0008-mit-license-with-not-for-navigation-disclaimer.md).

### Why this matters

NOAA's own ENC license terms require derivative works to carry equivalent disclaimers. Beyond the legal requirement, the practical reason is that ChartTiles:

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
| Stale data: chart in production is missing a recent Notice to Mariners | Medium | Medium | Weekly pipeline build; sync script shows a clear "last updated" date in the viewer; refuse to display if older than 90 days unless user overrides |
| Maintainer becomes unavailable for >30 days | Medium | Medium | Build pipeline runs unattended via GitHub Actions; key bus-factor decisions documented in ADRs; sponsor list + Open Collective gives a continuity path |

We deliberately do **not** carry commercial maritime liability insurance at this stage. If the project takes on paying enterprise customers, this changes — see [ADR-0008](adr/0008-mit-license-with-not-for-navigation-disclaimer.md).

## Technical risk register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `pnw.pmtiles` exceeds 500 MB target, blowing the sync budget for boats on satellite | Medium | Medium | Aggressive zoom-level pruning; layer-by-layer size budgeting in CI; regional PMTiles splits if needed in v0.2 |
| Tippecanoe drops sounding labels at high zoom due to density | High | Medium | Use `--no-tile-stats` and per-layer minzoom tuning; CI check for `SOUNDG` feature count at z=14+ |
| MapLibre can't natively express some S-52 symbology (e.g. complex lateral mark shapes with topmarks) | High | Low | Use sprite sheets with pre-rendered symbols; document gaps in the style README; full S-52 fidelity is explicitly out of scope for v0.1 |
| Browser memory pressure on long passages (panning across hundreds of tiles) | Medium | Low | Use MapLibre's tile cache eviction defaults; document tested browsers in `web/README.md` |
| PMTiles `Range` requests not supported by some marina wifi captive portals / proxies | Low | Medium | Document required HTTP behavior; provide a `.tar.gz` fallback download for the onboard rig |
| NOAA's bulk download endpoint changes URL or schema | Low | Low | Pin endpoint in pipeline config; mirror to R2 weekly as a backup |

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

- **Performance at scale.** The hosted tier's COGS scales with R2 storage + CDN egress, both cheap and well-understood. The open-source pipeline runs on a free-tier GitHub runner.
- **Vendor lock-in to Cloudflare.** R2 is S3-compatible; the upload step can target any S3 endpoint. PMTiles is filesystem-agnostic.
- **Format obsolescence.** MVT is the de facto open standard. PMTiles is gaining ecosystem traction (Protomaps, Stamen, OpenStreetMap planet builds). If either disappears, we have a year+ to migrate.
- **Internationalization of the data.** US-only is a deliberate v0.1 choice ([ADR-0004](adr/0004-pacific-northwest-scope-for-v0-1.md)). Adding other hydrographic offices is a v2.0 decision.
