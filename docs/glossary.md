# Glossary

ChartTiles sits at the intersection of marine hydrography, geospatial tooling, and web infrastructure. The vocabularies don't overlap much. This glossary keeps everyone honest.

## Maritime and hydrographic terms

**ENC — Electronic Navigational Chart.** The digital equivalent of a paper nautical chart, published by national hydrographic offices. ChartTiles uses NOAA's ENCs (US waters).

**IHO — International Hydrographic Organization.** The standards body that defines the data format (S-57) and the rendering specification (S-52) for ENCs worldwide. [iho.int](https://iho.int).

**IALA — International Association of Marine Aids to Navigation and Lighthouse Authorities.** Defines the buoy and beacon system. The world is split into IALA-A and IALA-B regions; the difference matters because lateral buoy colors (red vs. green, port vs. starboard) are reversed. **US waters are IALA-B** ("red right returning" — red lateral marks are kept to starboard when returning from sea).

**NOAA — National Oceanic and Atmospheric Administration.** US federal agency that publishes ENCs covering all US territorial and coastal waters. Data is public domain. [charts.noaa.gov](https://charts.noaa.gov).

**S-57.** IHO Special Publication 57. The transfer format ENCs are distributed in. File extension is `.000` (cell base data). Cell-based, object-oriented, weird. The pipeline parses this with GDAL's S-57 driver.

**S-52.** IHO Special Publication 52. The presentation library: how S-57 features should be rendered visually (symbols, colors, day/dusk/night palettes). Not a file format — a spec. ChartTiles approximates S-52 in a MapLibre style; full compliance is a stretch goal.

**S-100.** The successor framework to S-57; modern, XML/GML-based, modular. NOAA is migrating. Out of scope until v2.0.

**Sounding.** A depth measurement. On a chart, the small numbers scattered across blue areas. The S-57 object code is `SOUNDG`.

**Depth area (DEPARE).** A polygon describing water of a given depth range. Drives the deep-blue → light-blue → white fill gradient.

**Depth contour (DEPCNT).** An isobath — a line of equal depth. The chart's "topo lines" underwater.

**Lateral mark / lateral buoy.** A buoy marking the edge of a navigable channel. `BOYLAT` in S-57. Colors and shapes vary by IALA region.

**Cardinal mark.** A buoy indicating the safe side to pass relative to a danger (N / E / S / W). `BOYCAR` in S-57.

**Safety contour.** The depth contour a navigator declares "shallower than my draft plus margin." Dynamic per-user setting; the chart renderer should make it visually prominent.

**Type approval.** Regulatory certification (often under IMO or SOLAS) that an electronic chart system is fit for primary navigation on commercial vessels. ChartTiles is **not** type-approved and explicitly outside this regulatory scope. See [risks-and-safety.md](risks-and-safety.md).

## GIS and tile-format terms

**MVT — Mapbox Vector Tile.** The de facto vector tile format. Protocol buffer encoding. File extension `.pbf` or `.mvt`. Specification is open and not Mapbox-controlled. [github.com/mapbox/vector-tile-spec](https://github.com/mapbox/vector-tile-spec).

**PBF.** Protocol Buffer Format. Generic term for any protobuf-encoded file. In tile context, used as a shorthand for MVT. (Also used by OpenStreetMap for OSM PBF, which is a different schema.)

**PMTiles.** A single-file archive format for vector or raster tiles, designed to be served via HTTP range requests directly from object storage with no tile server in front. [github.com/protomaps/PMTiles](https://github.com/protomaps/PMTiles). ChartTiles' chosen distribution format — see [ADR-0003](adr/0003-pmtiles-over-btrfs.md).

**MBTiles.** Predecessor to PMTiles. A SQLite database packaging tiles. Easy to inspect, but requires a server process to convert range requests into tile fetches. ChartTiles uses it as an intermediate format only.

**Tippecanoe.** A command-line tool for building MVTs from GeoJSON. Originally Mapbox; now maintained at [github.com/felt/tippecanoe](https://github.com/felt/tippecanoe). The de facto standard. See [ADR-0006](adr/0006-tippecanoe-for-vector-tile-generation.md).

**GDAL / OGR.** Geospatial Data Abstraction Library / OGR Simple Features Library. The Swiss Army knife of geospatial format conversion. Used in ChartTiles to translate S-57 to GeoJSON. [gdal.org](https://gdal.org).

**MapLibre GL JS.** Open-source fork of Mapbox GL JS v1 (the last open-source version before Mapbox closed the source). Renders MVT in the browser via WebGL. [maplibre.org](https://maplibre.org).

**Tile pyramid.** The set of tile zoom levels (0 = whole world in one tile, ~22 = millimeter resolution). Each zoom level has 4× the tiles of the previous. Marine charts care about z=4 (regional overview) through z=16 (harbor detail).

**XYZ scheme.** The Slippy Map tile addressing convention: `/{z}/{x}/{y}.pbf`. z is zoom, x and y are tile coordinates. The world coordinate system is Web Mercator (EPSG:3857).

**Web Mercator (EPSG:3857).** The projection used by ~all web maps. Distorts area badly at high latitudes (Alaska looks huge) but preserves angles, which is what navigators care about. Same projection used by paper charts in their Mercator form, conveniently.

## Tile pipeline shorthand used in this repo

- `pnw.pmtiles` — the v0.1 distribution artifact. Pacific Northwest only, single file, ~500 MB target.
- "The pipeline" — the build process documented in [implementation-plan.md, Phase 1](implementation-plan.md).
- "The viewer" — the web client in `web/`.
- "The onboard rig" — the Raspberry Pi or mini-PC running locally at the nav station.

## Infrastructure terms

**R2.** Cloudflare's S3-compatible object storage with zero egress fees. ChartTiles' chosen hosting for PMTiles distribution.

**Range request.** An HTTP request with a `Range:` header asking for a byte range of a file. The mechanism by which PMTiles serves individual tiles from a multi-gigabyte file without downloading the whole thing.
