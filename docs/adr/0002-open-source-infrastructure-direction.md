# ADR-0002: Pursue open-source infrastructure as the primary direction

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

Three plausible directions for ChartTiles were considered in the initial planning conversation:

1. **Open-source infrastructure** (OpenFreeMap / Protomaps-style): free pipeline + free tiles, revenue from grants, hosted tier, consulting, sponsorships.
2. **Cruiser appliance**: bundle into a Pi / mini-PC product sold to recreational boaters. Revenue from hardware + software bundle.
3. **Marine tile SaaS**: hosted API targeted at marine app developers. Recurring SaaS revenue.

Fork 3 was pressure-tested and found structurally weak: NOAA data is commodity, the buyers are either too cheap (indies) or unreachable without enterprise-sales muscle (commercial maritime), the market is geographically broken (US-only), and the work skews 80% toward non-engineering. Fork 2 is viable but ties the maintainer to hardware ops and a narrow recreational customer base.

Fork 1 best fits the maintainer's profile (senior engineer, OSS-leaning, sailor, sustainability-focused) and the actual underserved gap (no modern open vector tile pipeline for NOAA ENC data).

## Decision

ChartTiles is an open-source infrastructure project. The financial model is grants (primary), hosted tier (secondary), consulting (tertiary), sponsorships (signal).

We will:

- Ship the entire pipeline, viewer, and onboard configuration under MIT (see [ADR-0008](0008-mit-license-with-not-for-navigation-disclaimer.md)).
- Apply for NSF POSE, NOAA Sea Grant, Sloan, Sovereign Tech Fund grants on the schedule in [roadmap.md](../roadmap.md).
- Defer the hosted tier until v0.2 / month 12, conditional on adoption signal.
- Treat consulting as inbound-only, not a sales motion.

We will not:

- Take venture funding.
- Sell hardware.
- Build a closed-source commercial product on top of the OSS core in v1.

## Consequences

**Positive**

- The project's success criterion is clear: adoption + sustainability, not growth.
- The grant-funding ecosystem aligns well with the public-benefit narrative (open marine safety data, NOAA upstream).
- The hosted tier is a downstream of the OSS project, not a competitor to it.

**Negative**

- Revenue ceiling is Protomaps-scale ($120–180K/year), not VC-scale.
- Heavy upfront unpaid work (months 0–12) before any revenue lands.
- Grant funding is high-variance and slow; a missed POSE cycle pushes timelines a year.

**Neutral**

- The decision is reversible. If adoption is strong but grants miss and the hosted tier outperforms expectations, the project could evolve toward Fork 3 (with the OSS core as the funnel). The reverse — going closed-source from open — is much harder, so OSS-first preserves optionality.

## Decision gate

Re-evaluate at month 12 per the gate in [roadmap.md](../roadmap.md). If neither a grant moves to a next round nor 3 paying hosted-tier customers exist, the OSS-as-primary-work thesis has failed and the project becomes a side project at nights-and-weekends cadence.
