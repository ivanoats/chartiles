# Coverage footprint audit

The current Puget Sound archive has 99 extracted coverage footprints and no positive-area overlap pairs. This is a geometric check of M_COVR footprints, not a check of feature agreement across cell edges, survey accuracy, or complete coverage of navigable water.

Use the **Coverage** button at the bottom left of the map. Blue lines mark individual coverage footprints; grey fill marks parts of the benchmark rectangle outside their union; magenta would mark overlaps. Areas outside the rectangle are not audited. The overlay does not enter the nautical feature inspector.

The audit subtracts CATCOV=2 exclusions from CATCOV=1 coverage within each cell, clips to the benchmark rectangle, then checks every pair for positive-area intersection. A shared edge is not an overlap. Invalid geometries and unknown categories fail the audit rather than being silently repaired. Areas use UTM zone 10N after segmentizing geographic edges; this projection is specific to the Puget Sound prototype.

Uncovered areas include land. No independent land/water mask has been applied, so the audit cannot report a percentage of navigable water covered or establish that there are no water gaps. Checking source-feature continuity and the 1:12,000 / 1:22,000 boundaries remains manual follow-up.

## Reproduce

```bash
python3 -m venv .venv
.venv/bin/pip install -r pipeline/requirements-audit.txt
.venv/bin/python pipeline/coverage.py build/puget-sound-REPLACE_WITH_BUILD_ID
.venv/bin/python -m unittest discover -s tests/audit
npm run build
npm run test:browser
```

Use a successful build directory containing manifest.json and M_COVR.geojson. Audit artifacts are keyed to the PMTiles SHA-256 in web/public/charts, so a different archive does not accidentally display an older audit. Run the audit after each chart build; it is currently an explicit step. The viewer reports an unavailable audit when no matching artifact exists.
