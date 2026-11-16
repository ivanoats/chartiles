# System context (C4 level 1)

CharTiles makes selected NOAA chart features inspectable in a browser.
The public release covers a bounded Puget Sound region. The viewer is for
experimental chart inspection and carries a not-for-navigation notice.

```mermaid
flowchart LR
    Reader[Site visitor or sailor] --> CT[CharTiles]
    Developer[Marine app developer] --> CT
    Maintainer[Project maintainer] --> CT
    NOAA[NOAA Office of Coast Survey] -->|ENC cells and chart imagery| CT
    CT -->|Public pages and viewer| Netlify[Netlify]
    CT -->|Versioned chart data| Cloudflare[Cloudflare Worker and R2]
    CT -->|Source, pull requests, and tests| GitHub[GitHub]
```

Visitors use the public pages, read the blog, or open the experimental viewer.
Sailors can review the same chart artifacts using a locally served bundle.
Marine app developers can load the public archive in their own MapLibre app.
The maintainer selects NOAA inputs, validates each chart build, and publishes
it separately from the site. GitHub Actions runs PR tests with retained
fixtures.

NOAA supplies the source records and prepares the raster imagery. CharTiles
selects and repackages those inputs. Survey accuracy, official chart
publication, and chart carriage compliance remain outside its role.

See the [container view](containers.md) for the runtime boundary between the
site, chart service, and offline viewer.
