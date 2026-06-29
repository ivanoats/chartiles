# ADR-0004: Scope v0.1 to Pacific Northwest waters

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

NOAA's ENC suite covers all US waters — the contiguous US coasts, Alaska, Hawaii, Puerto Rico, Pacific Trust Territories, the Great Lakes, and major navigable rivers. That's roughly 1,200 cells totaling tens of GB of source S-57 data, producing a PMTiles archive in the 10+ GB range.

A v0.1 that targets all US waters has three problems:

1. **Build time and disk:** A full US build at high quality (z=4–16) takes hours on consumer hardware and produces a single PMTiles file too large to comfortably ship as a GitHub release artifact.
2. **Iteration speed:** Every styling change requires re-validating against a huge dataset. Bug surface increases linearly with cell count.
3. **Dogfooding gap:** The maintainer can only test the parts of the chart he sails. Without focused use he won't notice quality regressions in his own cruising area, let alone in Alaska or the Gulf.

The Pacific Northwest (Salish Sea, Puget Sound, San Juans, Strait of Juan de Fuca, BC border waters) is:

- The maintainer's home waters — testable every weekend.
- ~30 NOAA cells, well under 5% of the full US dataset.
- Operationally diverse: deep open water, tight channels, heavy ferry traffic, complex tidal flats, dense buoyage. A real test of styling and zoom behavior.
- Covered by a substantial recreational cruising community (PNW yacht clubs, the Waggoner Cruising Guide audience, the OpenCPN PNW user base) — a realistic source of early external users.

## Decision

v0.1 covers only Pacific Northwest waters. Specifically, the bounding box and cell list will be defined in `pipeline/regions/pnw.yaml` and will include:

- Puget Sound and Hood Canal.
- The San Juan Islands and Gulf Islands (US side only — Canadian charts are CHS, not NOAA, and out of scope).
- The Strait of Juan de Fuca, from Tatoosh Island to Admiralty Inlet.
- Coastal Washington from the Strait south to the Columbia River entrance.

Other US regions (East Coast, Gulf, Great Lakes, Alaska, Hawaii) are explicitly out of scope for v0.1. They are mechanical expansion targets for v0.2 onward.

## Consequences

**Positive**

- v0.1 ship date is plausible at 6 months (see [implementation-plan.md](../implementation-plan.md)).
- The pipeline can run weekly on a free-tier GitHub Action without runtime concerns.
- The maintainer can dogfood every Salish Sea passage. This is the strongest possible quality signal.
- The PNW cruising community is a tight enough audience that early adopters are findable and reachable.

**Negative**

- Adoption pool is smaller than a national release would generate. A sailor in Maine or Florida cannot use v0.1 at all.
- The "this works in your backyard" framing risks reading as parochial in launch materials. Mitigation: be explicit that v0.2 expansion is mechanical, not architectural.
- Some pipeline edge cases (cell sizes, projection oddities, IALA region differences) won't surface until expansion. The pipeline must be designed to make these expand-safe even though v0.1 doesn't exercise them.

**Neutral**

- The Canadian chunk of the Salish Sea (Vancouver Island, Gulf Islands proper) uses CHS data, not NOAA. Sailing across the border in v0.1 will show a hard boundary at the international line. This is the right tradeoff for v0.1; Canadian coverage is a separate question and probably belongs in a sibling project rather than ChartTiles itself.
