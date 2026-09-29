# Lessons from Njord for ChartTiles

Reviewed 2026-09-29 at commit `4af5d1f4f599c8368032d0e88845a2fc90720696`.

Njord is primarily Kotlin, with a Kotlin/Native server and Kotlin/JS frontend,
not a Java server. Its server uses GDAL and PostGIS to generate MVT; it also has
regional offline exports. ChartTiles can learn from its domain modeling and data
lifecycle without adopting its database-backed serving architecture. The highest
priority transfers are a shared attribute vocabulary, reliable feature identity,
and guarded chart updates.[^architecture][^export]

This is source inspection, not a running-system benchmark or a correctness audit.
The recommendations below are proposals, not changes to the accepted architecture.

## What to learn and how to adapt it

### 1. Separate attribute interpretation from presentation

Njord loads object classes, attributes, and expected inputs from shared JSON
resources. Its inspector uses the dictionary to expand attribute names, with raw
fallbacks, and displays chart information and positions.[^dictionary][^inspector]

ChartTiles currently translates a small set of light attributes in
`web/feature-cards.mjs`. Proposed next step: a versioned S-57 dictionary module,
shared by cards and future styling. Keep original values and unknown codes visible.
Derive translations from verified source definitions rather than treating another
renderer as the specification.

Acceptance: scalar and list attributes decode consistently; unknown values remain
available; supported codes have sourced definitions and regression cases.

### 2. Use one rule module per feature class

Njord's layer classes derive symbol and colour properties before MVT encoding.
`Lights.kt` handles colour and sector symbols; `Depare.kt` uses depth thresholds;
`Wrecks.kt` and `Uwtroc.kt` select hazard symbols from attributes.[^lights][^depths][^wrecks][^rocks]

For ChartTiles, adopt the separation, not necessarily where evaluation runs.
A decoder can produce semantic fields such as water-level effect or depth quality;
MapLibre and inspection cards can consume those fields. Keep user-specific display
settings client-side where possible so changing them does not require new PMTiles.

Do not bake a user's draft or safety threshold into a shared static archive. Start
with truthful attribute descriptions, not personalized safe/unsafe conclusions.

### 3. Extend inspection to rocks, wrecks, and sounding quality

Njord has explicit helpers for water-level effects and sounding quality. Its
`QUASOU` helper distinguishes unknown, doubtful, unreliable, reported, and other
depth qualifications.[^quality][^rocks]

Proposed feature order: rock/wreck cards showing recorded water-level effect and
available depth; sounding cards showing available quality attributes; then light
height, nominal range, and sectors. Show absent information as absent. Our cards
should retain unknown codes: Njord's quality helper drops unrecognized values,
which is a behavior we should not copy.

Acceptance: include examples of missing depth and uncertain quality alongside
ordinary known-depth examples. Verify interpretations against authoritative
attribute definitions before implementation.

### 4. Resolve associations independently of what is painted

Njord stores LNAM references and queries explicit reverse references for topmark
associations. It also has a feature lookup endpoint keyed by LNAM. This is not a
buoy-title implementation identical to ours, but it demonstrates the value of
separating identity lookup from rendered symbol selection.[^associations][^lookup]

Our current buoy naming depends on the matching buoy being in loaded source tiles.
Proposal: resolve unambiguous same-cell light/buoy associations during conversion,
record the related feature keys and names, and preserve the original references.
A small static feature index can support selected-feature links if the pilot needs
that capability. No live database endpoint is required.

Acceptance: the same light retains its linked identity across zooms and tile
boundaries; duplicate, ambiguous, and cross-cell references do not invent a match.

### 5. Treat chart overlap as a data policy

Njord requests charts ordered by ascending scale denominator and subtracts each
chart's coverage from the remaining inclusion geometry. It filters by chart and
feature zoom eligibility. LIGHTS receives special handling in the encoder, so this
is not a universal clipping rule.[^associations][^mosaic]

ChartTiles should define and test its own preferred-cell and clipping policy
before mixing more chart usage bands. Perform it at build time. Test a detailed
harbor chart within a broader coastal chart for duplicates, seams, and lost point
features. Do not infer full scale handling from global layer zoom thresholds.

This is a prerequisite for broader coverage, not an immediate reason to expand.

### 6. Make updates reconcile state, rather than depend on a daily download

Njord compares the catalog against stored revision keys, catches missed changes,
supports dry runs and bounded batches, and guards optional orphan deletion with
producer checks and a maximum deletion count. An earlier comment says orphans are
report-only, but the executable path can delete them when configured: code and
comments are not fully synchronized.[^updates]

ChartTiles already has catalog comparison in `pipeline/check_updates.py`, so the
next work is completing the lifecycle: detect changed and newly relevant cells,
review withdrawn cells, build a candidate release, verify it, then publish its
manifest last. Keep a previous release for rollback. Reject or quarantine an
implausibly incomplete catalog rather than publishing mass removals.

Acceptance: unchanged catalog is a no-op; missed runs catch up; malformed catalogs
and failed builds leave the published release usable. Changed-cell downloading
must not be advertised as a binary PMTiles delta.

### 7. Keep offline release identity explicit

The examined exporter writes MBTiles to a temporary file, renames it into place,
writes a checksum, and records export completion. It also constructs regional
manifest entries. This is more specific than the README's generic SQLite export
description.[^export]

ChartTiles already has hashes and offline packages. Improve the user-facing
release information: installed version, source revisions, last successful update
check, download size, and coverage. Preserve PMTiles for our delivery architecture;
Njord is not evidence that a format migration is necessary.

## Proposed implementation sequence

| Priority | Work | Reason |
| --- | --- | --- |
| Next small PR | Shared attribute decoding plus rock/wreck/sounding cards | Extends the existing sailor pilot with interpretable information |
| Next reliability PR | Build-time explicit aid associations | Removes loaded-tile dependence from buoy identity |
| Before paid managed updates | Guarded catalog-to-release workflow and visible freshness | Makes the prospective paid maintenance offer concrete |
| Before coverage expansion | Multi-scale chart selection and overlap fixtures | Prevents duplicate or conflicting display across chart bands |
| Later, if requested | Sector display, palettes, richer vector symbols | Adds portrayal without committing to an S-52 engine |

Keep developer discovery in parallel. These are technical learning opportunities,
not evidence that customers will pay for every feature.

## What not to import blindly

- PostGIS, a native application server, Kubernetes, and dynamic MVT serving are
  coherent choices for Njord; they are not prerequisites for our static pipeline.
- Njord explicitly does not claim strict S-52 conformance. For example, its rock
  comments discuss depth and safety context, while the implemented symbol choice
  switches on water-level effect alone. Use it to discover cases, then verify them
  independently.[^architecture][^rocks]
- The root license is Apache-2.0, but bundled OpenCPN reference assets carry a
  separate GPL-2.0+ notice. Inventory the provenance of any exact code or artwork
  proposed for reuse. No upstream code or assets were copied in this review.[^license][^assets]

## Confidence and open questions

High confidence in the source-level behaviors cited here. Moderate confidence in
the proposed adaptation sequence, which still depends on pilot feedback. No
claims are made about Njord's runtime performance, complete nautical correctness,
commercial adoption, or compatibility of particular copied assets. No upstream
build or tests were run; we did not contact its maintainer.

## Source references

[^architecture]: [README.md](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/README.md).
[^lights]: [server/src/nativeMain/kotlin/io/madrona/njord/layers/Lights.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/layers/Lights.kt).
[^rocks]: [server/src/nativeMain/kotlin/io/madrona/njord/layers/Uwtroc.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/layers/Uwtroc.kt).
[^wrecks]: [server/src/nativeMain/kotlin/io/madrona/njord/layers/Wrecks.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/layers/Wrecks.kt).
[^depths]: [server/src/nativeMain/kotlin/io/madrona/njord/layers/Depare.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/layers/Depare.kt).
[^dictionary]: [server/src/nativeMain/kotlin/io/madrona/njord/geo/symbols/S57ObjectLibrary.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/geo/symbols/S57ObjectLibrary.kt).
[^quality]: [server/src/nativeMain/kotlin/io/madrona/njord/layers/attributehelpers/Quasou.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/layers/attributehelpers/Quasou.kt).
[^inspector]: [shared_fe/src/jsMain/kotlin/io/madrona/njord/ui/ChartQuery.js.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/shared_fe/src/jsMain/kotlin/io/madrona/njord/ui/ChartQuery.js.kt).
[^associations]: [server/src/nativeMain/kotlin/io/madrona/njord/db/ChartDao.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/db/ChartDao.kt).
[^lookup]: [server/src/nativeMain/kotlin/io/madrona/njord/endpoints/FeatureHandler.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/endpoints/FeatureHandler.kt).
[^mosaic]: [server/src/nativeMain/kotlin/io/madrona/njord/geo/TileEncoder.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/geo/TileEncoder.kt).
[^updates]: [enc_cron/src/nativeMain/kotlin/io/madrona/njord/enccron/Main.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/enc_cron/src/nativeMain/kotlin/io/madrona/njord/enccron/Main.kt).
[^export]: [server/src/nativeMain/kotlin/io/madrona/njord/ingest/RegionExporter.kt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/server/src/nativeMain/kotlin/io/madrona/njord/ingest/RegionExporter.kt).
[^license]: [LICENSE](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/LICENSE).
[^assets]: [docs/reference_material/opencpn/copyright.txt](https://github.com/manimaul/njord/blob/4af5d1f4f599c8368032d0e88845a2fc90720696/docs/reference_material/opencpn/copyright.txt).
