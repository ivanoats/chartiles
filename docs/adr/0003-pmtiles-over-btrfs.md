# ADR-0003: Use PMTiles instead of a Btrfs partition image

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

The initial README proposed packaging vector tiles into a single Btrfs partition image with hard-linked deduplication of identical empty-ocean tiles, delivered via `btrfs send` / `btrfs receive` for incremental updates. The hosting model was loop-mount on the target and serve via nginx.

The architecture is technically interesting — Btrfs hard-links genuinely deduplicate at the block level, and `btrfs send` gives binary deltas for free. But evaluating it against the real distribution requirements surfaced several mismatches:

| Concern | Btrfs approach | PMTiles approach |
| --- | --- | --- |
| **Target OS** | Linux only (Btrfs not available on macOS/Windows without VM) | Filesystem-agnostic; works anywhere with HTTP |
| **Root required to deploy** | Yes (loop mount needs root) | No |
| **Single-file delivery** | Yes (.img file) | Yes (.pmtiles file) |
| **Tile deduplication** | Filesystem-level (hard links) | Format-level (content-hashed tile storage) |
| **Object storage compatibility** | Poor (need to download whole image, then mount) | Excellent (HTTP Range requests directly against object storage) |
| **Browser-readable directly** | No (need server to translate) | Yes (`pmtiles.js` issues Range requests) |
| **Incremental updates** | `btrfs send/receive` — clever, but proprietary to Btrfs | Application-level (regional splits, full re-download, or future v4 tile-by-tile updates) |
| **Operational complexity** | High (Btrfs version skew, mount-time errors, kernel dependencies) | Low (it's a file) |
| **Cultural fit with web infra** | Poor | Excellent — PMTiles is becoming the de facto open tile distribution format |

The original Btrfs scheme bundles three orthogonal concerns: (a) tile-format encoding, (b) tile deduplication, (c) delivery mechanism. PMTiles handles all three natively in a single, well-specified, filesystem-agnostic format.

The one capability we lose is `btrfs send/receive` for true tile-level incremental updates. v0.1 doesn't need it — a weekly full download of `pnw.pmtiles` is on the order of hundreds of MB, manageable over LTE/Starlink. Future versions can address this via regional file splits or PMTiles' planned incremental update story.

## Decision

ChartTiles will use **PMTiles** as its distribution format. We will not use Btrfs hard-linking, loop-mounted partition images, or `btrfs send/receive`.

Specifically:

- The build pipeline produces a single `pnw.pmtiles` archive (see [containers.md](../architecture/containers.md)).
- Browser clients use `pmtiles.js` to issue HTTP Range requests against the CDN.
- Onboard clients sync the full file with `aria2c` (or equivalent) and serve it with nginx, also via Range requests.
- The PMTiles format's native tile deduplication handles the empty-ocean-tile case that the Btrfs hard-links were designed to solve.

## Consequences

**Positive**

- The system works on macOS and Windows as developer / contributor environments (a Linux-only build chain would have shut out a meaningful chunk of contributors).
- No root required to deploy. The onboard rig can run unprivileged.
- Direct browser-to-object-storage tile delivery; no tile server process needed for online use.
- PMTiles is gaining ecosystem traction (Stamen, Protomaps, OpenStreetMap planet builds) — choosing it puts us in good company and benefits from third-party tooling.
- Tile deduplication is built into the format; we don't maintain a custom dedup script.

**Negative**

- We lose the "Btrfs send/receive for tiny incremental updates" story. Weekly updates require re-downloading the full PMTiles file. For Pacific Northwest at ~hundreds of MB this is fine; if we later host all-US (~10+ GB), incremental updates become a real concern and we'll revisit.
- Loses the "clever engineering essay" angle the Btrfs approach offered. This can be partially recovered via a blog post explaining the tradeoffs (this ADR is part of that material).

**Neutral**

- The Btrfs approach remains a possible future optimization for specific deployments (e.g., a fleet operator with hundreds of identical onboard rigs on Btrfs-supporting hardware). Documenting it as a future option, not as the core architecture, is the right framing.
