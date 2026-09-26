# Puget Sound expansion

## Starting point

The Shilshole prototype works end to end. On September 26, 2026, Ivan confirmed completion of the manual NOAA checks with no discrepancies. Proceed with regional expansion; do not repeat that approval gate.

The documented small-area baseline is 472,065 archive bytes, 922 features including 479 soundings, and roughly six seconds to build on the development machine. Preserve its config and source artifacts for regression comparisons. The implementation is on `codex/shilshole-prototype` with uncommitted changes; account for that work before committing the expansion.

## Scope

Build a local Puget Sound inspection bundle covering Admiralty Inlet, Hood Canal, central Puget Sound and South Sound. San Juan Islands, the Strait of Juan de Fuca beyond the entrance area, and coastal Washington stay outside this increment. Final clipping bounds and the selected cell list must be recorded after catalog and coverage inspection.

Keep the existing object classes, source attributes, sounding identifiers and depth-retention checks. This increment measures regional feasibility. S-52 portrayal, hosting, scheduled builds and onboard synchronization remain later work.

## Implementation sequence

1. **Inventory regional source coverage.** Retain a NOAA catalog snapshot and list active cells intersecting the proposed bounds, including compilation scale, edition and update. Use catalog boxes to nominate candidates, then inspect actual `M_COVR` coverage and no-coverage areas. Produce an explicit cell list, clipping bounds, and a report of gaps and overlaps. Start by evaluating the existing 1:12,000 scale. If it cannot cover the region, document the gap and choose a scale/coverage policy before combining cells of different scales; do not silently stack overlapping detail.

2. **Generalize build configuration.** Add `pipeline/puget-sound.json` after the coverage review. Derive workspace prefixes and archive titles from the region instead of hardcoded Shilshole strings. Save the exact config with each build. Keep the Shilshole bundle selectable alongside Puget Sound, using separate regional manifests so a new build cannot overwrite its entry point. Preserve atomic manifest replacement and fail on unexpected source status or scale changes.

3. **Build and measure.** Run acquisition, extraction, compilation and maximum-zoom verification separately enough to record stage durations and peak process memory. Record archive size, input size, tile count and largest tile sizes, feature counts by cell/layer, tool versions and source hashes. The current pipeline retains all extracted features in memory; measure that cost before deciding whether to stream extraction or verification. Keep feature-dropping and geometry-simplification safeguards enabled as currently configured.

4. **Adapt the viewer and browser checks.** Make the region selectable and derive labels, bounds and initial view from its manifest. Choose a minimum tile zoom that fits the regional extent; the current minimum of 12 prevents a useful regional overview. Measure lower-zoom tile density before adopting it. Replace the browser test's fixed four-cell count, 479-sounding label and screen-coordinate selection with region-aware assertions and known feature locations. Preserve inspection, layer toggles, local assets and HTTP range checks.

5. **Validate the regional result.** Run pipeline tests, build the viewer, and run browser checks for both regions. Verify extracted feature identities and sounding depths survive maximum-zoom encoding. Add targeted tests for region isolation and source-selection failures. Inspect newly included cell boundaries, gaps and overlap areas, and record representative regional source comparisons. These checks validate the expanded area; they do not reopen the completed Shilshole review.

6. **Record results and choose the next increment.** Write a regional measurement report with the exact source snapshot, machine, browser, viewport, timings and failures. Compare against the small-area baseline. Retain two distinct source editions when available to measure archive churn; rebuilding the same edition does not establish update size. Use those results to decide whether a single Puget Sound download is practical before expanding to the full Pacific Northwest.

## Measurement gates

| Area | Evidence required |
| --- | --- |
| Coverage | Explicit selected cells and bounds; actual coverage gaps and overlaps documented; any mixed-scale policy justified |
| Data retention | No missing extracted feature identities or changed sounding depths at maximum zoom |
| Build | Stage and total durations, peak memory, archive size and largest tiles recorded; failures leave previous bundles usable |
| Browser | Both regions load and support inspection and toggles with external requests blocked; range requests succeed and no page errors occur |
| Performance | Five cold and five warm loads on a recorded setup; median and worst time to first chart render; scripted pan/zoom frame timings and transferred bytes at regional, harbor and detail views |
| Packaging | Regional manifests resolve to the intended archives; selecting or rebuilding one region preserves the other |

Use the broader plan's under-500 MB archive and under-30-minute build as provisional ceilings, not measured results. A local build cannot establish the GitHub-runner target. Set browser performance acceptance thresholds after the first measured regional run and record the rationale before tuning.

## First implementation task

Create the reproducible Puget Sound cell inventory and coverage report. That determines the regional config and whether the existing single-scale selection rule can remain intact. Then generalize region output and run the first benchmark build.
