# Chartiles.com

## Part 1: System Architecture

The core philosophy of this architecture is **"Zero-Runtime Database overhead."** Instead of running a resource-heavy GIS stack (PostGIS + GeoServer) on a boat's navigation computer, we pre-compile the entire United States ENC dataset into static vector tile files (`.pbf`).

By leveraging **Btrfs**, we can radically optimize storage via hard-linking empty-ocean tiles and deliver daily chart corrections over low-bandwidth satellite/cellular links using binary diffs.

### The Data & Delivery Pipeline

1. **Ingestion Engine (Cloud/Build Server):** * Downloads NOAA's bulk S-57 ENC files daily.
* Uses `GDAL/OGR` and `tippecanoe` to translate maritime layers into Mapbox Vector Tile (MVT) specifications.


2. **Btrfs Optimizing Packager:** * Slices tiles into a raw directory tree structure (`/tiles/{z}/{x}/{y}.pbf`).
* Runs a deduplication script to find identical empty-water tiles and converts them into Btrfs **hard links**.
* Packages the directory tree into a single raw Btrfs partition image (`charts.img`).


3. **The Deployment Edge (Onboard Computer / Local Server):**
* Loop-mounts `charts.img` read-only.
* Uses **Nginx** to serve the static files directly. The Linux kernel automatically handles RAM caching of heavily trafficked local waters.
* **MapLibre GL JS** frontend consumes the tiles and applies an S-52 compliant stylesheet entirely client-side.



---

## Part 2: Implementation Plan

### Phase 1: Data Pipeline Proto 

* Setup a build container with `gdal-bin` and `tippecanoe`.
* Script the automated downloading of NOAA's Coast-wide ENC suites.
* Write an OGR2OGR extraction script to map S-57 objects (e.g., `DEPARE` for depth areas, `BOYSPP` for special purpose buoys) into simplified GeoJSON layers.

### Phase 2: Btrfs Compilation Engine 

* Implement `tippecanoe` arguments optimized for marine data (e.g., preventing sounding label dropping at high zoom levels using `--no-tile-stats`).
* Build a Python/Bash deduplication script that hashes `.pbf` tiles and converts duplicates to hard links.
* Automate the creation of a blank loopback image, formatting it to Btrfs, and copying the deduplicated tile asset tree into it.

### Phase 3: Frontend & Rendering

* Port open-source IHO S-52 presentation rules into a cohesive MapLibre GL JSON style sheet.
* Develop custom MapLibre expressions to handle complex marine symbology (e.g., drawing lateral buoy shapes dynamically based on attributes, rendering dynamic safety depth contours based on user draft).

### Phase 4: Delta Sync & Deployment 

* Create the update mechanism using `btrfs send` and `btrfs receive` to calculate daily incremental map updates.
* Test end-to-end orchestration via Docker Compose.

---

## Part 3: Project Repository Blueprint (`README.md`)

Save the following content directly as your project's `README.md`.

```markdown
# ChartTiles

ChartTiles is an open-source, ultra-high-performance, zero-database nautical chart server designed for web apps and offline/onboard marine navigation. 

Inspired by the architecture of OpenFreeMap, it compiles raw NOAA S-57 Electronic Navigational Charts (ENCs) into standard vector tiles (`.pbf`) packed inside a deduplicated, loop-mounted **Btrfs partition image**. By using Btrfs hard links for empty ocean tiles and serving raw files via Nginx, it eliminates GIS server overhead and relies completely on the Linux kernel cache for lightning-fast tile delivery.

## Key Features
* **Zero Database Runtime:** No PostGIS, MapServer, or GeoServer required. It operates purely on static files.
* **Extreme Storage Optimization:** Millions of identical empty-ocean tiles share the exact same physical blocks on disk using Btrfs hard links.
* **MapLibre Native:** Delivers raw vector data allowing the frontend to dynamically handle IHO S-52 styling, day/dusk/night navigation modes, and safety depth contours.
* **Delta Updates:** Ship tiny, daily incremental updates to vessels at sea via `btrfs send/receive` streams without redownloading the entire map image.
```
---

## Architecture Overview

```text
  [ NOAA S-57 ENCs ] 
          │
          ▼  (GDAL + Tippecanoe)
  [ Raw Vector Tiles ] 
          │
          ▼  (Deduplication & Hard Linking)
  [ Btrfs Partition Image (.img) ] ──► Loop-mounted on target machine
          │
          ▼  (Zero-overhead Static File Serving)
      [ Nginx ]
          │
          ▼  (Vector .pbf Data over HTTP)
   [ MapLibre GL JS ] ──► Renders S-52 Stylesheet on client browser

```

---

## Getting Started (Quick Start Deployment)

To deploy a ready-made NOAA chart server for all US waters, you can spin up the environment using Docker Compose.

### Prerequisites

* A Linux host system with **Btrfs support** installed (`apt-get install btrfs-progs`).
* Docker and Docker Compose.

### 1. Clone the Repository

```bash
git clone [https://github.com/ivanoats/chartiles.git](https://github.com/ivanoats/chartiles.git)
cd chartiles

```

### 2. Download the Latest Btrfs Chart Image

Download the pre-compiled NOAA Chart Image (~12GB compressed, expands to ~35GB containing hundreds of millions of hard-linked files):

```bash
wget [https://data.chartiles.com/latest/noaa_usa_waters.img.gz](https://data.chartiles.com/latest/noaa_usa_waters.img.gz)
gunzip noaa_usa_waters.img.gz

```

### 3. Loop-Mount the Image

Mount the chart image read-only into your data directory:

```bash
mkdir -p data/tiles
sudo mount -o loop,ro,subvol=@tiles noaa_usa_waters.img data/tiles

```

### 4. Spin up the Stack

```bash
docker compose up -d

```

Your vector tile server is now live at `http://localhost:8080/tiles/{z}/{x}/{y}.pbf`. Access `http://localhost:8080` in your browser to view the built-in MapLibre chart plotter interface.

---

## Configuration & Compose Stack

The deployment utilizes a high-performance Nginx configuration tweaked specifically for high-concurrency static file lookups.

```yaml
# docker-compose.yml
version: '3.8'

services:
  chart-server:
    image: nginx:alpine
    container_name: chartfreemap_nginx
    ports:
      - "8080:80"
    volumes:
      - ./data/tiles:/usr/share/nginx/html/tiles:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./public:/usr/share/nginx/html/public:ro
    restart: unless-stopped

```

---

## Data Compiling Pipeline (For Developers)

If you want to compile your own custom charts from raw NOAA S-57 files:

1. **Download NOAA ENCs:** Place raw `.000` charting files inside the `./import` directory.
2. **Run Pipeline Parsing:** Build the tiles using Tippecanoe:
```bash
docker run --rm -v $(pwd):/data chartfreemap-builder /data/scripts/compile.sh

```


3. **Generate Optimized Btrfs Image:**
```bash
# Create a sparse loopback file
dd if=/dev/zero of=custom_charts.img bs=1M count=0 seek=50000
mkfs.btrfs custom_charts.img

# Mount and run deduplication script
sudo mount -o loop custom_charts.img /mnt
python3 scripts/deduplicate_and_copy.py --src ./tiles --dest /mnt
sudo umount /mnt

```



---

## License

This project is licensed under the MIT License. Mapping data is sourced from NOAA (National Oceanic and Atmospheric Administration) and is in the public domain.

