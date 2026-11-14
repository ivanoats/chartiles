# Implementation plan

Last revised 2026-11-14. The Puget Sound pipeline, raster display, offline
packaging, and light and hazard inspection cards are implemented. The objective is
a useful, trustworthy inspection pilot and one external developer integration, not
a complete S-52 renderer.

The [Njord source review](njord-implementation-lessons.md) informs the technical
work. The [business-plan critique](business-plan-review.md) records the assumptions
that still need customer validation. Neither changes the static-serving decision.
The original Phase 0–6 plan is kept in
[implementation-plan-history.md](implementation-plan-history.md); where it
disagrees with this file, this file wins.

## Status

| Item | Status | Reference |
| --- | --- | --- |
| Slice 1 — Shared attributes and hazard inspection | Done, merged 2026-09-29 | [PR #4](https://github.com/ivanoats/chartiles/pull/4) |
| Slice 1.1 — Sounding labels on initial view | Done, merged 2026-11-14 | [PR #9](https://github.com/ivanoats/chartiles/pull/9) |
| Slice 1.2 — Continuous integration and license | CI verified on GitHub | [PR #10](https://github.com/ivanoats/chartiles/pull/10) |
| Business review | Overdue, was due 2026-10-29 | [Evidence log](#evidence-log) |
| Slice 2 — Build-time aid associations | Not started | — |
| Slice 3 — Verified managed updates | Not started; catalog checker exists | `pipeline/check_updates.py` |
| Slice 4 — Multi-scale coverage policy | Not started | — |

Update this table in the same pull request that changes a slice's state.

## Sequence

1. Slice 1.1, then Slice 1.2. Both are small and unblock everything after them.
2. Hold the business review. If no interviews have happened, they are the next
   action, ahead of more code.
3. Slice 2 or Slice 3, chosen by the review (see
   [Choosing between Slice 2 and Slice 3](#choosing-between-slice-2-and-slice-3)).
4. Slice 4, before adding usage bands or expanding geographically.

## The pilot

Every slice below is justified by the pilot, so it needs a definition before
Slice 2 or 3 starts. Fill these in at the business review; until then they are
open questions, not assumptions.

- **Participant:** to be decided. The working hypothesis from the business-plan
  critique is a small team maintaining a marine web application that needs
  queryable NOAA chart features without operating the ingestion and update
  pipeline.
- **Task:** to be decided. Candidates: integrate chart inspection into an existing
  app, maintain a regional dataset, or deliver a supported offline package.
- **Success:** to be decided. It should be observable, such as a named external
  integration running against a published archive for a stated period.
- **Duration and end date:** to be decided.

## Slice 1 — Shared attributes and hazard inspection (done)

- Extract reusable, versioned S-57 decoding from the light card implementation.
- Add rock (`UWTROC`), wreck (`WRECKS`), and sounding (`SOUNDG`) cards.
- Show recorded water-level effect, wreck category, depth, and sounding quality
  when present. Describe classifications as recorded chart data, not a conclusion
  about whether a vessel can pass safely.
- Keep missing values distinct from zero, preserve unknown codes, support arrays
  and stringified arrays, and retain expandable raw attributes and source context.
- Validate meanings against source definitions independently of Njord.

Acceptance: existing light cases pass; known, missing, zero, negative, and uncertain
hazard depths have regression coverage; browser tests inspect real chart features
and verify readable cards alongside raw data. No archive rebuild is required.

## Slice 1.1 — Sounding labels on initial view

Fixed locally on 2026-11-14. The `styleimagemissing` event generated label images
after MapLibre had assembled the tile worker response. Using
`setMissingStyleImageResolver()` supplies those images before the response.
The browser regression now selects the fixture sounding on fresh loads at each
zoom from 14 through 18 without toggling `SOUNDG`. All 16 browser tests pass,
including the existing buoy, rock, and wreck checks. Collision rules are unchanged.

Acceptance: a sounding label is selectable on first load at zoom 14 and above
without touching the layer toggle; the toggle workaround is removed from the
browser test; other point layers still place as before.

## Slice 1.2 — Continuous integration and license

The acceptance criteria in every slice rest on tests that only run locally, and
the repository's license state contradicts
[ADR-0008](adr/0008-mit-license-with-not-for-navigation-disclaimer.md).

- Add a GitHub Actions workflow that runs `npm test` on every pull request.
- Run the Playwright suite in CI if a chart archive small enough to fetch or
  commit as a fixture is available; otherwise record why not and what covers the
  gap.
- Add a `LICENSE` file and set `license` in `package.json` to match ADR-0008, or
  amend the ADR if the decision has changed.

Acceptance: a pull request with a failing unit test cannot show green; the license
in `package.json`, the `LICENSE` file, and ADR-0008 agree.

The CI workflow runs Python and JavaScript unit tests and the Chromium suite on
pull requests. The [browser fixtures](../tests/fixtures/README.md) contain small
extracts of both chart archives, so the browser job runs without live chart
downloads. The [ruleset for `main`](https://github.com/ivanoats/chartiles/rules/27277677)
requires the `Unit tests` and `Browser tests` status checks.

## Slice 2 — Build-time aid associations

Resolve unambiguous light/buoy links from explicit references within a source cell
before tiling. Preserve the original attributes plus related feature keys and
names. Continue reading older archives that lack enrichment. The client currently
resolves these links itself from features rendered in the same cell
(`web/feature-cards.mjs`); this slice moves that work to the build so identity
survives tiling.

Acceptance: identity remains stable across zoom and tile boundaries; missing,
ambiguous, duplicate, and cross-cell references have tests; version the enriched
schema and compare output before publishing a rebuilt archive. Add a static
feature index only if the pilot requires persistent selected-feature links.

## Slice 3 — Verified managed updates

Extend the existing catalog checker into a candidate-release workflow: detect
changed and newly relevant cells, flag withdrawals, build, validate, and publish
the manifest last. Expose installed release, source revisions, last successful
check, coverage, and download size. Retain the prior release for rollback.

Decide before starting: where the scheduled check runs (it depends on Slice 1.2 if
it runs in GitHub Actions) and how many prior releases are retained and for how
long.

Acceptance: unchanged inputs are a no-op; missed runs catch up; incomplete catalogs
and failed builds cannot replace a usable release; a rollback to the prior release
is exercised in a test, not only described; distinguish changed source cells from
binary archive deltas. Required before promising managed updates.

## Slice 4 — Multi-scale coverage policy

Define preferred-cell selection and build-time clipping before introducing more
chart usage bands or expanding geographically. Test overlapping harbor/coastal
cells for duplicate features, seams, and missing aids.

Decide before starting: which overlapping cell pairs become the fixtures. Name
them here.

Acceptance: deterministic selection (the same inputs select the same cells on
every run), preserved provenance, reviewed overlap fixtures, and no physical
feature emitted from more than one cell inside a fixture's overlap. Do not claim
that global layer zoom thresholds implement source scale.

## Choosing between Slice 2 and Slice 3

This is a decision for the business review, recorded here with its reason.

- Slice 2 improves a card that already works within a cell. Choose it first if
  pilot participants need stable feature identity or links.
- Slice 3 is required before promising managed updates, the job the business-plan
  critique considers most likely to have a budget. Choose it first if interviews
  confirm that.

Decision: not yet made.

## Later, conditional on pilot feedback

Light heights/ranges/sectors, day/dusk/night palettes, and richer vector symbols.
Keep user-specific display settings out of shared static archives where possible.
A complete S-52 engine, dynamic database tile server, and subscription machinery
remain outside this sequence.

## Business track

In parallel with engineering, interview five marine-web developers and observe
three sailor sessions. Seek one external integration and a bounded paid pilot.
Record developer budget/maintenance problems separately from sailor usability
feedback. Prioritize repeated problems, not feature completeness. Unawarded grants
are not operating runway. Production publication and outreach remain separate
actions from local implementation.

### Evidence log

One row per conversation or session. Do not record private contact details here.

| Date | Who (role, not name) | Type | Problem described | Budget or maintenance signal |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

Target: five developer interviews and three sailor sessions.

### Review and stop conditions

The first review was due 2026-10-29 and has not been recorded. Set a new date
when this revision merges and write the outcome below.

At each review:

- If fewer than five developer interviews are logged, interviews take priority
  over starting a new slice.
- If the interviews show no developer with a budgeted problem this project
  addresses, pause Slices 2–4 and revisit the buyer hypothesis in
  [business-plan-review.md](business-plan-review.md) before building more.
- Otherwise, fill in [The pilot](#the-pilot) and make the Slice 2 or Slice 3
  decision.

Next review date: to be set.

## Decisions since the 2026-09-29 revision

- 2026-10-12: keep tippecanoe for the Puget Sound pipeline. tylertoo passed the
  maximum-zoom identity, depth, layer, and scalar-property checks but was slower
  and produced a larger archive in a single local run. Geometry, portrayal, and
  lower-zoom fidelity remain unvalidated. See
  [tylertoo-benchmark.md](tylertoo-benchmark.md) and
  [PR #6](https://github.com/ivanoats/chartiles/pull/6). This work was not on the
  plan.
