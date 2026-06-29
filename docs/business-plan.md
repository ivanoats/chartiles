# Business Plan

This is the planning document, not a pitch deck. It exists so the maintainer (and any future collaborator or grant reviewer) can read a single file and understand what the project is trying to be, who it's for, how it pays for itself, and what failure looks like.

For a tighter strategic decision, see [ADR-0002](adr/0002-open-source-infrastructure-direction.md). For timeline and milestones, see [roadmap.md](roadmap.md). For the technical plan, see [implementation-plan.md](implementation-plan.md).

## Executive summary

ChartTiles is open-source infrastructure: a pipeline that turns NOAA Electronic Navigational Charts into modern vector tiles (PMTiles + MapLibre), distributed for free, with a hosted convenience tier and consulting services as the revenue model.

The project's success criterion is **sustainability for one maintainer** within 24 months — roughly $120–180K gross annual revenue split across grants (50%), hosted tier (25%), consulting (20%), and sponsorships (5%). The project is explicitly not pursuing venture funding, acquisition, or growth-stage scale.

v0.1 covers Pacific Northwest waters only, shipping ~6 months from project start (see [implementation-plan.md](implementation-plan.md)). National coverage is mechanical expansion in v0.2 and beyond.

## Problem

Three groups have an unmet need for modern, open, vector-tile NOAA chart data:

1. **Indie marine app developers** building planning, fishing, regatta, or charter tools. Today they either roll their own ENC ingestion pipeline (high effort, easy to do wrong) or pay for proprietary commercial data (Navionics, C-Map) with restrictive licenses and per-user economics that don't fit indie apps.
2. **Recreational cruisers** running their own nav-station hardware (OpenCPN, custom builds). Today they use raster chart tiles or wrestle with desktop GIS tools to display ENCs. There is no "drop in a small box, get modern vector charts" path.
3. **The open-source marine community** (OpenCPN, Signal K, SailfishOS-style projects). They need a clean vector tile source they can embed without bringing in a full GIS stack.

A fourth, narrower group exists: **national hydrographic offices** outside the US that are modernizing their chart distribution and want a known-good open pipeline to adapt. These are not v0.1 customers but they're a real consulting market by year 2.

## Why now

Several preconditions converged in the 2024–2026 window:

- **NOAA discontinued paper chart production in 2025.** ENC is the only future. The data is fully public domain, federally maintained, and standardized.
- **PMTiles hit production maturity.** Protomaps' work made single-file, HTTP-range-served tile archives a real architecture rather than a research project.
- **MapLibre GL JS reached production quality.** Open-source vector rendering in the browser is now table stakes, not a Mapbox-only capability.
- **Bandwidth on boats stopped being a hard constraint.** Starlink Maritime, LTE coverage in coastal US, and marina wifi have collectively made "weekly sync of a few hundred MB" a non-event for most cruisers.
- **Public-benefit OSS funding is having a moment.** NSF POSE, Sovereign Tech Fund, Sloan, and similar programs now exist explicitly to fund open infrastructure.

None of these alone enables ChartTiles. Together they make it a project that wouldn't have been viable in 2018 and could be late by 2030.

## Solution and value proposition

A free, MIT-licensed pipeline + viewer + onboard configuration that:

- Pulls NOAA ENC weekly and produces a single PMTiles archive per region.
- Serves it directly from object storage to browsers via `pmtiles.js` (no tile server needed).
- Runs offline at the nav station on a $35 Raspberry Pi.
- Ships with a usable, S-52-inspired MapLibre stylesheet.

**Value to app developers:** "Drop a PMTiles URL into your MapLibre setup, get NOAA charts. No pipeline, no API key, no per-user fees."

**Value to cruisers:** "Sync a few hundred MB before leaving the marina, have working charts at the nav station for weeks."

**Value to the OSS marine community:** "A shared, modern, vector chart foundation we can all build on instead of duplicating effort."

## Competition and positioning

| Competitor | Their strength | Where we win |
| --- | --- | --- |
| **Navionics** (Garmin) | Best-in-class crowdsourced detail, OEM relationships | We're free, open, embeddable; they're a paid app |
| **C-Map** (Brunswick) | Commercial maritime market | We don't compete; different segment |
| **OpenCPN** | Established cruising community, plugin ecosystem | We're complementary — OpenCPN could consume our tiles |
| **OpenSeaMap** | Open-source, community-maintained | OSM-derived data, not authoritative; we use NOAA, which is. Different position |
| **Mapbox / MapTiler marine styles** | Polished tooling, hosted infrastructure | They don't ingest NOAA ENC; if they did, they're proprietary and per-user-priced |
| **iSailor, Aqua Map, Savvy Navvy** | Polished consumer apps | Customers, not competitors — they could use our tiles |

The defensible position is **the authoritative open-source NOAA-ENC-to-MVT pipeline**. Anyone *could* build this; nobody has. Once the pipeline exists, has a real maintainer, has community adoption, and is the obvious choice, the cost of a competitor entering is low but the payoff for them is also low — there's no monopoly rent to extract from public-domain data. The result is a stable niche.

## Customer segments and go-to-market

### Year 1 GTM: free OSS users

- **OpenCPN and Signal K communities** — direct outreach via dev lists, slack, marine OSS conferences (FOSS4G has a maritime track; SOTM has a hydrography corner).
- **Pacific Northwest cruising clubs** — Seattle Yacht Club, Corinthian YC, Sloop Tavern YC, Bellingham YC. Maintainer is local and known here.
- **r/sailing, r/boating, Hacker News (Show HN), Sailing Anarchy forums** — broad-strokes launch posts.
- **Long-form launch post** on the maintainer's site explaining the architecture and the PMTiles-over-Btrfs tradeoff. This doubles as evidence for grant applications.

Success metric for year 1 GTM: **3 unaffiliated boaters reporting they ran v0.1 on their own boat**.

### Year 2 GTM: hosted tier + consulting

- **Hosted tier** marketed via the OSS project itself ("self-host or use our hosted version"). Pricing on the website, Stripe self-serve, no sales team.
- **Consulting** is inbound-only. The project's visibility from year 1 should generate a small but real flow of inquiries from charter operators and (if lucky) one foreign hydrographic office.

### Year 3+ GTM: positioned for organic growth

By year 3 the project should be the obvious choice for anyone wanting NOAA vector tiles. GTM becomes "keep shipping, keep showing up at conferences, let inbound build."

## Business model

Detailed breakdown lives in [roadmap.md, Funding strategy](roadmap.md#funding-strategy). Summary:

| Tier | Revenue line | Year 1 target | Year 2 target | Year 3 target |
| --- | --- | --- | --- | --- |
| 1 | Grants | $0–25K | $60–80K | $80–100K |
| 2 | Hosted tier | $0 | $15–30K | $40–60K |
| 3 | Consulting | $0 | $20–40K | $40–80K |
| 4 | Sponsorships | $0–5K | $5–10K | $10–20K |
| | **Total** | **$0–30K** | **$100–160K** | **$170–260K** |

Notes:

- Year 1 is intentionally near-zero revenue. The project is unpaid OSS work for 12 months while building credibility, the v0.1 release, and the first grant application.
- Year 2 depends on at least one grant landing. If all grants miss in year 1, year 2's target floor drops to ~$40K and the project remains a side project per the decision gate in [roadmap.md](roadmap.md).
- Year 3 numbers assume the year 2 grant lands a second-phase renewal AND the hosted tier finds 30+ paying customers. Both are plausible but neither is guaranteed.

## Operating model

- **Headcount:** one maintainer. No hires planned within the 24-month horizon.
- **Contributors:** open contribution model from day one. Goal: 5 external contributors with merged PRs by month 12.
- **Time allocation:** roughly 60% engineering, 20% community / docs / support, 15% grant writing and applications, 5% admin (billing, taxes, legal).
- **No co-founder, no equity, no investors.** The project's success or failure rests on the maintainer plus the community.

## Financials (rough)

### Cost structure (annualized at steady state)

| Line | Cost |
| --- | --- |
| Cloudflare R2 storage (~50 GB versioned PMTiles) | $0.75/month |
| Cloudflare CDN egress | $0 (R2 has zero egress fees) |
| Cloudflare Workers (hosted tier) | $5–25/month at v0.2 scale |
| Domain renewal | $20/year |
| GitHub (free for OSS) | $0 |
| Stripe fees (~3%) | scales with hosted tier revenue |
| Liability insurance (year 2+) | $1–3K/year if we take enterprise customers |
| Conference travel (1–2 events/year) | $1–3K/year |
| **Total fixed annual costs** | **$2–7K** |

The cost structure is intentionally tiny. This is a high-margin business at the unit level; the bottleneck is grant capture and adoption, not infrastructure cost.

### Use of funds (if NSF POSE Phase 1 lands)

NSF POSE Phase 1 is a typical $300K over 2 years. Hypothetical allocation:

- Maintainer salary (50% time, 2 years): $200K
- Conference travel and outreach (FOSS4G, SOTM, marine industry events): $15K
- Contractor / contributor stipends (1–2 paid contributor sprints): $40K
- Infrastructure (R2 storage, CI overage, monitoring): $5K
- Legal / fiscal sponsor / org overhead (likely via Open Source Collective): $40K

This is a budget shape, not a committed proposal. The actual POSE application will be more specific.

## Success metrics and KPIs

| Horizon | Metric | Target |
| --- | --- | --- |
| Month 6 | v0.1 shipped, demo site live | Yes / No |
| Month 6 | GitHub stars | 50 |
| Month 6 | Unaffiliated boaters running v0.1 | 3 |
| Month 12 | External contributors with merged PRs | 5 |
| Month 12 | Grant applications submitted | 2 |
| Month 12 | Grant applications advanced to next round | 1 |
| Month 18 | Hosted tier customers (paying) | 5 |
| Month 18 | Consulting engagements completed | 1 |
| Month 24 | Annualized revenue | $120–180K |
| Month 24 | Maintainer working at least part-time on project from project income | Yes / No |

The two binary metrics at month 24 are the ones that matter. Everything else is a leading indicator.

## Risks

Brief summary only — full risk register in [risks-and-safety.md](risks-and-safety.md).

**Strategic risks** that could end the project as a viable business:

- Adoption stalls — no users on v0.1 within 6 months of launch. Mitigation: PNW scope reduces the threshold; OpenCPN community is targeted.
- All grants miss. Mitigation: stagger across NSF POSE, Sloan, Sovereign Tech Fund, NLnet; consulting and hosted tiers are partial offset.
- Mapbox or MapTiler adds NOAA ENC ingestion as a feature. Mitigation: out-execute on offline mode and marine-specific styling; community moat is real but not infinite.
- Maintainer burnout from juggling grant writing, on-call, and community moderation. Mitigation: cap commitments per quarter; no SLAs on hosted tier until paid; success criterion is sustainability, not growth.

## What this plan is not

- **Not a pitch deck.** No hockey stick projections, no TAM/SAM/SOM math, no Series A storyline.
- **Not a commitment to specific numbers.** Revenue targets are scenarios, not promises.
- **Not an exit plan.** The project is not for sale and is not optimizing for acquisition.
- **Not a hiring plan.** It is explicitly a single-maintainer project. If that becomes wrong, this document gets a new ADR.

## Decision gates

The project's continued viability is checked at three points (also in [roadmap.md](roadmap.md)):

- **Month 6:** Did v0.1 ship?
- **Month 12:** Did any grant advance OR did 3 paying hosted customers materialize?
- **Month 18:** Is the project at $80K+ annualized revenue?

If the answer at any gate is no, the plan changes — not the project's existence, but its time allocation. The project always continues as nights-and-weekends OSS work. The business plan above is specifically the plan for it to *also* be paying work for the maintainer.
