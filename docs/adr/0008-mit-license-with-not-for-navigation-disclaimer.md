# ADR-0008: MIT-license the project with a prominent "not for navigation" disclaimer

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

Two related decisions: the open-source license for the code, and the safety disclaimer for the data.

**License options considered:**

| License | Permissive | Copyleft | Patent grant | Adoption friction |
| --- | --- | --- | --- | --- |
| **MIT** | Yes | No | No | Lowest |
| **Apache 2.0** | Yes | No | Yes | Low; some forks/embedders prefer it for the patent grant |
| **BSD-3-Clause** | Yes | No | No | Low |
| **MPL 2.0** | Yes | Weak (file-level copyleft) | Yes | Medium |
| **AGPL** | No | Strong (network copyleft) | Yes | High |

For an open-source-infrastructure project that wants maximum adoption — including by app developers who may want to embed code without distributing source changes — a permissive license is correct. The remaining question is MIT vs. Apache 2.0. We don't have patent risk in this domain (the underlying data is public domain, and our code is straightforward geospatial transformation). MIT's brevity and broad familiarity win at this scale; Apache 2.0 is the right answer if and when we have contributors from larger orgs that prefer it.

**Disclaimer:**

Marine charts have a regulated, safety-critical reputation. NOAA's own license terms for ENC derivative works require equivalent safety disclaimers. Beyond legal compliance, ChartTiles' actual safety posture (no type approval, single maintainer, no guaranteed update cadence) makes a clear "not for navigation" framing essential. See [risks-and-safety.md](../risks-and-safety.md) for the full risk analysis.

## Decision

- **License:** MIT, applied to all code, configuration, and documentation in the repository.
- **Disclaimer:** A prominent "not for primary navigation; mariners are responsible for redundant type-approved systems" notice appears in:
  - The repository `README.md` (top of file, before any usage instructions).
  - The project website landing page.
  - The web viewer's chrome (a persistent footer or banner, visible at all times the chart is displayed).
  - The onboard sync script's first-run output.
  - The PMTiles archive's metadata where the format supports it.
- **Attribution:** NOAA chart data is public domain and requires no attribution by law, but we attribute anyway (in the viewer chrome and in the PMTiles metadata) as a matter of credit and to make the data provenance clear.

The MIT license's warranty disclaimer is explicitly *not* sufficient to eliminate liability risk. The repeated "not for navigation" notice is a separate, deliberate layer.

## Consequences

**Positive**

- MIT removes the largest possible amount of adoption friction. App developers, hardware integrators, and forkers all know it well.
- The repeated disclaimer establishes a clear safety posture that's easy to point to in any legal or community discussion.
- Public-domain NOAA data + MIT code means no downstream license entanglement.

**Negative**

- MIT offers no patent grant; if a patent dispute ever materialized in the marine geospatial space, an Apache 2.0 project would have a stronger defensive position. We accept this risk for v1.
- The disclaimer's prominence creates a slight UX cost — chart screen real estate is partially occupied by safety chrome. We accept this.
- The disclaimer reduces but does not eliminate liability. If the project takes on paying enterprise customers (Tier 3 consulting in [roadmap.md](../roadmap.md)), we will need to revisit insurance and contractual indemnification.

**Neutral**

- This ADR is reversible — we can relicense to Apache 2.0 in the future. Going the other direction (Apache → MIT) is harder because contributors would have signed CLAs for the Apache version. MIT-first preserves the option to relicense later if the community demands it.
