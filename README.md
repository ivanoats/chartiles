# ChartTiles

**Open-source vector chart pipeline and viewer for NOAA Electronic Navigational Charts.**

> **Safety notice — not for primary navigation.** ChartTiles is reference and planning software. Mariners are responsible for maintaining redundant, type-approved navigation systems aboard their vessels. The data here is derived from NOAA ENCs and is subject to publication delays, processing errors, and the absence of any quality-management certification. Do not use as a primary nav aid.

## Status

**Pre-v0.1 — planning phase.** This repository currently contains documentation and ADRs; the pipeline and viewer are not yet implemented. See [docs/implementation-plan.md](docs/implementation-plan.md) for the build schedule and [docs/roadmap.md](docs/roadmap.md) for the broader timeline.

If you arrived here expecting to download charts: come back in roughly six months for the v0.1 Pacific Northwest release.

## What ChartTiles is

ChartTiles compiles NOAA's Electronic Navigational Charts into modern vector tiles, packaged as a single [PMTiles](https://github.com/protomaps/PMTiles) archive per region. The same archive serves:

- **A browser viewer**, via MapLibre GL JS + `pmtiles.js` reading HTTP byte ranges directly from object storage. No tile server.
- **An offline / onboard viewer**, via a small nginx serving the PMTiles file from local disk on a Raspberry Pi or mini-PC at the nav station.

The whole system is static files plus a weekly cloud build. There is no GIS database at runtime.

## Architecture in one diagram

```text
  NOAA ENC (S-57)
        │
        ▼   weekly build: ogr2ogr → tippecanoe → pmtiles convert
  Single PMTiles archive (e.g. pnw.pmtiles)
        │
        ├──────────────► Cloudflare R2 + CDN ──► Browser (MapLibre + pmtiles.js)
        │                          ▲
        └──────────────────────────┴──► Onboard sync (aria2c) ──► nginx ──► Nav-station browser
```

Full C4 model and sequence diagrams in [docs/architecture/](docs/architecture/).

## Repository layout

```
chartiles/
├── README.md            # this file
├── docs/                # all docs (start here)
│   ├── README.md        # docs index
│   ├── implementation-plan.md
│   ├── business-plan.md
│   ├── roadmap.md
│   ├── glossary.md
│   ├── risks-and-safety.md
│   ├── architecture/    # C4 levels 1–3 + data flows
│   └── adr/             # architecture decision records
└── (pipeline/, web/, onboard/ to be added during Phase 1)
```

## Documentation

Start with [docs/README.md](docs/README.md) for the full index. Highlights:

- [docs/implementation-plan.md](docs/implementation-plan.md) — phased v0 → v1 plan with deliverables and exit gates
- [docs/business-plan.md](docs/business-plan.md) — market, customers, revenue model, KPIs
- [docs/roadmap.md](docs/roadmap.md) — 18-month timeline with funding strategy
- [docs/architecture/](docs/architecture/) — system context, containers, components, data flows
- [docs/adr/](docs/adr/) — architecture decisions, including [why PMTiles instead of the Btrfs scheme this project originally proposed](docs/adr/0003-pmtiles-over-btrfs.md)
- [docs/risks-and-safety.md](docs/risks-and-safety.md) — safety posture, technical and strategic risk registers
- [docs/glossary.md](docs/glossary.md) — marine, GIS, and tile-format vocabulary

## Scope of v0.1

- **Geographic:** Pacific Northwest only — Salish Sea, Puget Sound, San Juans, Strait of Juan de Fuca, coastal Washington to the Columbia. See [ADR-0004](docs/adr/0004-pacific-northwest-scope-for-v0-1.md).
- **Data:** NOAA ENC. No other hydrographic offices in v0.1.
- **Deliverable:** a single `pnw.pmtiles` archive plus a working web viewer plus an onboard configuration.
- **Not in v0.1:** routing, AIS overlay, weather, crowdsourced soundings, native mobile SDKs.

## Quick start

Not available yet — Phase 1 hasn't started. The intended quick start, post-v0.1:

```bash
# Web viewer
open https://chartiles.com

# Onboard rig (Raspberry Pi / mini-PC)
git clone https://github.com/ivanoats/chartiles.git
cd chartiles/onboard
./sync.sh        # downloads latest pnw.pmtiles
docker compose up -d
# Point any device on the boat's wifi at http://chartiles.local:8080
```

This README will be updated with real instructions when v0.1 ships.

## Contributing

Contribution guidelines will be added before v0.1. In the meantime:

- Read the [ADRs](docs/adr/) before proposing architectural changes.
- File issues for missing edge cases in the docs, unclear safety language, or factual errors about the maritime / GIS domain.
- PRs against `docs/` are welcome now.

## License

MIT — see [LICENSE](LICENSE) (to be added).

NOAA chart data is in the public domain. We attribute NOAA in the viewer chrome and in PMTiles metadata as a matter of credit and provenance even though no attribution is legally required.

The license rationale, including why MIT over Apache 2.0 and the relationship to the safety disclaimer, is in [ADR-0008](docs/adr/0008-mit-license-with-not-for-navigation-disclaimer.md).
