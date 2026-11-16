# Data flows

## Build and publish chart data

```mermaid
sequenceDiagram
    participant Maintainer
    participant Pipeline
    participant NOAA
    participant R2
    Maintainer->>Pipeline: Build configured region
    Pipeline->>NOAA: Read catalog and download selected cells
    NOAA-->>Pipeline: Catalog and source ZIPs
    Pipeline->>Pipeline: Extract, tile, and verify
    Pipeline-->>Maintainer: Archive and manifest
    Maintainer->>Pipeline: Authorize chart publication
    Pipeline->>R2: Upload content-addressed archives and optional audit
    Pipeline->>R2: Upload release manifest last
```

A rebuild can also use a retained catalog and ZIP snapshot. NOAA raster
imagery is imported separately. The publisher verifies the referenced files
before upload. If an archive upload fails, the public manifest continues to
refer to the previous release. The update checker reports changes for a
retained release. A scheduled candidate-release workflow is still planned.
See [hosting and publication](../../hosting/README.md).

## Browser viewing path

```mermaid
sequenceDiagram
    participant Browser
    participant Netlify
    participant Worker
    participant R2
    Browser->>Netlify: Get inspection viewer
    Netlify-->>Browser: HTML, CSS, and JavaScript
    Browser->>Netlify: Get chart manifest
    Netlify-->>Browser: Redirect to the chart service
    Browser->>Worker: Get chart manifest
    Worker->>R2: Read manifest
    R2-->>Worker: Manifest
    Worker-->>Browser: Manifest and archive references
    Browser->>Worker: Request PMTiles byte range directly
    Worker->>R2: Read selected bytes
    Worker-->>Browser: HTTP 206 with tile or directory bytes
```

The viewer resolves archive paths using the host that returned the manifest.
This keeps byte-range requests away from the Netlify redirect.
Raster and vector mode behavior is documented in the
[raster chart view architecture](raster-chart-view.md).

## Offline bundle path

```mermaid
sequenceDiagram
    participant Maintainer
    participant Packager
    participant User
    participant Server as Local Python server
    Maintainer->>Packager: Package map build and selected charts
    Packager->>Packager: Verify artifact hashes and write ZIP
    Packager-->>User: ZIP and checksum
    User->>Server: Extract ZIP and run serve.py
    Server-->>User: Viewer and local archive byte ranges
```

The default package includes the active vector archive. The combined package
adds matching raster imagery. When available, the vector coverage audit is
bundled with its archive. The ZIP is a point-in-time release with a local
manifest and no automatic sync. See [offline bundle instructions](../offline-bundle.md).
