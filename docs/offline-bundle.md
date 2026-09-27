# Offline bundle

Run `npm run package:offline` after building charts and, optionally, their matching coverage audit. The ZIP and adjacent SHA-256 checksum are written under build/. Packaging verifies the active chart hash and includes exactly one PMTiles archive, its manifest, matching coverage audit if present, and locally bundled viewer assets. Previous chart versions and source data are excluded.

Extract the ZIP, then run `python3 serve.py` from its directory. Open http://127.0.0.1:8080/ and keep the process running. Requires Python 3.10+; no npm installation or internet connection is needed on the receiving machine. Use `--port 8081` if necessary. The server binds to localhost; sharing over a boat's LAN is not configured in this prototype.

The included server supports HTTP byte ranges required by PMTiles. The viewer cannot be opened directly via file://. SHA256SUMS lists individual artifact hashes; these are integrity checks, not signatures. The bundle README contains these instructions and the inspection-only limitation. This remains a development bundle without an installer or automated update mechanism.

Validation: extracted ZIP checksums and single-archive selection; local browser rendering with external requests blocked; explicit prefix, suffix and unsatisfiable HTTP range checks; existing browser integration suite. The first bundle was 57,019,267 bytes. The generated ZIP is deliberately excluded from Git; it has not been published as a release asset.

## Optional raster imagery

Use `npm run package:offline:raster` to include the imported NOAA raster archive
alongside the vector chart. The default command remains vector-only. The combined
package is much larger; see [source sizes and mode behavior](raster-chart-view.md).
