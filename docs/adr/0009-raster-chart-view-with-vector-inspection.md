# 0009. Add raster chart viewing alongside vector inspection

Date: 2026-09-27

## Status

Accepted for implementation. Source archive selection remains pending validation.

## Context

ChartTiles delivers inspectable ENC vector features but currently uses basic
symbols. Implementing broad S-52 portrayal requires substantial rules and
validation work. The reciprocal-clubs app demonstrates a simpler display path:
serve pre-rendered NOAA raster charts in PMTiles through R2 and a Worker.

## Decision

Add a raster Chart view and retain a separate Inspect features vector mode.
Use the existing MapLibre, PMTiles and static range-serving architecture. Qualify
the source's coverage, provenance, redistribution terms and size before integration.

Keep independent raster/vector artifact descriptors and dates. Preserve the
camera when switching; identify and vector coverage controls apply only to the
vector mode. Never silently substitute a different chart source on failure.

This changes the order of the implementation plan: raster viewing precedes
further S-52-inspired styling. It does not replace the vector pipeline, PMTiles
or MapLibre decisions, and does not establish S-52 conformity.

## Consequences

Users can access familiar chart imagery sooner. We retain feature inspection
and a future vector portrayal path without operating a rendering server.

Raster imagery cannot supply feature attributes or respond to safety-depth
settings. The two sources may have different dates and coverage. Raster storage
and offline downloads may be substantially larger and must be measured.

A combined overlay and dynamic portrayal are deferred. The initial integration
uses separate modes to avoid implying that raster symbols and vector feature
records necessarily correspond.

See the [implementation plan](../raster-chart-plan.md) for acceptance gates.
