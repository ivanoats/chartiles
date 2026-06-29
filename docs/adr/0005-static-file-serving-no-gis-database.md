# ADR-0005: Serve charts as static files; no GIS database at runtime

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

The conventional architecture for serving vector chart data is a GIS stack:

- **PostgreSQL + PostGIS** as the spatial database.
- **GeoServer** / **MapServer** / **pg_tileserv** to translate map requests into spatial queries.
- A web tier in front for caching and authentication.

This stack is mature, well-documented, and capable of serving live spatial queries, per-user customization, and complex on-the-fly geoprocessing. It is also operationally heavy: PostGIS requires tuning, GeoServer is a JVM service with non-trivial memory footprint, and the whole pile needs monitoring, backups, and version-coordinated upgrades.

ChartTiles' actual runtime requirements are narrow:

- Serve byte ranges from a single archive.
- Cache aggressively.
- Be deployable offline on a Pi at the nav station.

None of these benefit from a database. The S-57 → MVT translation is a build-time concern, not a runtime one. The chart data is read-only between weekly builds. There is no per-user state to query.

PMTiles + a CDN (online) or PMTiles + nginx (offline) covers the entire runtime need with two off-the-shelf components and no database.

## Decision

ChartTiles has **no runtime database**. The system state at any moment is:

- One PMTiles archive in object storage (online) or on local disk (offline).
- One `manifest.json` describing it.
- The client's local memory (selected palette, viewport, safety-depth setting).

All chart data transformations happen at build time. The pipeline writes a single archive; clients read from it via HTTP Range requests. There is no PostGIS, no GeoServer, no MapServer, no tile server process anywhere in the runtime path.

## Consequences

**Positive**

- Ops surface is minimal. The "production runtime" online is "an object storage bucket and a CDN." Offline it is "nginx + a file."
- The system is trivially horizontally scalable — every CDN node already has a copy.
- Cost is dominated by storage and CDN egress; both are cheap and well-understood.
- Offline deployment is achievable on a $35 Raspberry Pi.
- No database to back up, migrate, or recover.

**Negative**

- No live geoprocessing. We cannot answer queries like "what's the depth at this point?" server-side; the client must download tiles containing the relevant area and inspect them. For ChartTiles' use cases this is fine; for a future routing or weather-overlay product it might not be.
- No per-user customization at the server level. Every user gets the same tiles. Personalization happens entirely in the client.
- The full chart dataset must be rebuilt to incorporate any data change. There is no "edit a single feature and propagate"; the only update unit is "rebuild the whole regional PMTiles file." Acceptable at NOAA's weekly Notice to Mariners cadence; would be wrong for a crowdsourced-data product.

**Neutral**

- If a future ChartTiles product needs live spatial queries (e.g., real-time AIS overlay, weather routing), it should be built as a separate service, not retrofitted onto this static-file architecture. The boundary is deliberate.
