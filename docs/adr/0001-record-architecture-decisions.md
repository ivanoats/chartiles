# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

ChartTiles is a single-maintainer open-source project today, but the goal is to grow contributors and to be picked up by the marine OSS community. A future contributor — including future-Ivan — should not have to reverse-engineer the reasoning behind a non-obvious choice.

We need a lightweight, file-based convention for capturing decisions that:

- Doesn't require an issue tracker or wiki.
- Lives next to the code, in version control.
- Survives renames, moves, and contributor turnover.

## Decision

We will record significant architecture decisions as ADRs in `docs/adr/`, using [Michael Nygard's template](https://github.com/joelparkerhenderson/architecture-decision-record). One file per decision, numbered sequentially, immutable once accepted, superseded (not deleted) when a decision is reversed.

A decision is "significant" if any of these are true:

- It involves a non-trivial tradeoff that another competent engineer would resolve differently.
- It establishes a constraint that all future code must respect.
- It would be re-litigated within a year if not written down.

## Consequences

**Positive**

- A future contributor can read the ADR index and understand the shape of the project's decision space in 30 minutes.
- Bikeshedding is reduced: "this is in ADR-NNNN, here's the link, let's move on."
- Reversing a decision is a deliberate act (writing a new ADR) rather than a quiet drift.

**Negative**

- Authoring overhead: ~30 minutes per ADR. We accept this cost.
- Risk of over-ADR-ing trivial choices. Mitigated by the "significant" definition above.

**Neutral**

- We do not adopt any tooling for ADRs (no `adr-tools` CLI, no GitHub Action). Plain Markdown files plus the index in `adr/README.md` are sufficient at this scale.
