# Business plan review — 2026-09-29

ChartTiles has a credible engineering direction and a useful inspection prototype.
The business plan does not yet demonstrate a repeatable path to paying its
maintainer. Its strongest choices are open-source distribution, a bounded region,
and a simple delivery architecture. Its weakest assumptions are an uncontested
market, grant-funded development, and revenue arriving through inbound adoption.

This review recommends retaining the project direction while replacing the
financial forecast with a short customer-validation plan. It does not change the
accepted ADR or the original plan.

## Findings, in priority order

### 1. The funding model needs correction before it can support a budget

The business plan describes POSE Phase I as $300K over two years and allocates
money to maintainer salary and contributor sprints. NSF currently describes Phase
I as up to $300K for one year. Its FAQ explicitly excludes compensation for core
open-source product development; it funds ecosystem work. Salary is not inherently
excluded, but funded activities must fit the program. The example budget therefore
cannot be treated as an engineering runway without being redesigned.[^plan-funds]
[NSF award structure](https://www.nsf.gov/funding/initiatives/pathways-enable-open-source-ecosystems/funding).
[NSF funding restrictions](https://www.nsf.gov/funding/information/faq-nsf-pathways-enable-open-source-ecosystems-pose-program).

Recommendation: put unawarded grants at zero in the operating base case. Maintain
an opportunity register with applicant eligibility, a current solicitation,
allowable work, dates, and a program-contact check. Ecosystem adoption could make a
future proposal stronger, but it is not evidence of an award. This review does not
validate the other named funders or their current calls.

### 2. The competitive premise is overstated

The plan claims nobody has built an open NOAA-ENC-to-MVT pipeline and presents
commercial data or building everything oneself as the developer's alternatives.
Neither is a sound starting point.[^plan-market]

NOAA provides chart-display services and offline raster MBTiles. OpenCPN already
supports S-57 vector charts. Njord describes an open-source S-57-to-MVT server.
These are not identical products, but they invalidate the broad absence-of-options
claim. This review inspected Njord's documentation, not its production quality.
[NOAA services](https://www.nauticalcharts.noaa.gov/data/gis-data-and-services.html).
[OpenCPN chart formats](https://opencpn.org/wiki/dokuwiki/doku.php?id=opencpn%3Amanual_advanced%3Acharts%3Aformats).
[Njord](https://github.com/manimaul/njord).

Recommendation: compete on a specific combination to be tested: easy browser
integration, inspectable attributes, explicit provenance, reproducible regional
bundles, and delivery without a database-backed tile server. PMTiles conversion
alone is a convenience, not a proven reason to pay. Treat NOAA as the authoritative
source; describe ChartTiles as a derived product rather than claiming authority
for the conversion.

### 3. The plan mixes beneficiaries with buyers

The plan targets developers, cruisers, OSS projects, and hydrographic offices, but
its early adoption metric is three boaters using it onboard. That could validate
a viewer experience while providing little evidence for developer subscriptions
or institutional consulting.[^plan-buyers]

Recommendation: choose one initial buyer hypothesis: a small team maintaining a
marine web application that needs queryable NOAA chart features but wants to avoid
operating the ingestion and update pipeline. Sailors remain valuable usability
testers; they are not a substitute for interviews with that team's budget owner.

The paid job should be concrete: integrate chart inspection into an existing app,
maintain a regional dataset, or deliver a supported offline package. Determine
which job actually has a budget before building subscription machinery.

### 4. The revenue model quietly restores assumptions rejected in Fork 3

ADR-0002 rejects marine tile SaaS partly because buyers are difficult to monetize
and sales requires substantial non-engineering work. The plan later assumes
hosted subscriptions and commercial consulting will arrive through open-source
visibility. Open-source distribution might help acquisition, but the plan supplies
no evidence that it changes those buyer economics.[^adr]

Recommendation: replace inbound-only consulting with a small, deliberate customer
discovery effort. Quote one bounded integration engagement when a prospect has a
real need. Keep the software open; charge for specific delivery and maintenance
work. This is a hypothesis to test, not a claim that consulting demand exists.

### 5. Revenue targets do not follow from the customer targets

The roadmap proposes $19 and $99 monthly tiers. At those hypothetical prices:[^prices]

| Scenario | Annual subscription revenue |
| --- | ---: |
| 30 customers at $19/month | $6,840 |
| 30 customers at $99/month | $35,640 |
| 5 customers at $99/month | $5,940 |

The plan's year-three hosted target is $40–60K. At $99/month, that needs roughly
34–51 full-year customers, before churn and acquisition timing; a $19-heavy mix
needs substantially more. Its five-paying-customer milestone does not by itself
explain the month-18 $80K annualized total. Larger contracts or grants could close
the gap, but they need explicit quantities and assumptions.[^plan-revenue]

Recommendation: model subscription customers, price mix, churn, contract hours,
collections, and grant cash separately. Distinguish recurring run rate, one-off
project revenue, restricted project funding, and money available to compensate the
maintainer. Do not treat one consulting invoice as recurring annual revenue.

### 6. Cheap hosting does not establish a high-margin supported business

The cost section emphasizes infrastructure while the operating model divides one
person across engineering, community, grants, and administration. It does not
connect support, acquisition, chart QA, update failures, or contract delivery hours
to the revenue scenarios.[^plan-costs]

Recommendation: track actual hours per release, integration, and customer. Include
maintainer time and delivery capacity in the model even while cash spending is low.
Two simultaneous consulting engagements may be too much once maintenance and
support obligations are included; establish capacity from a first engagement.

### 7. The free and paid offers need a sharper boundary

Free hosted tiles, a free pipeline, and easy self-hosting reduce the pain the
hosted tier intends to monetize. The plan does not say which maintenance or
service obligation a paid account buys. Its attribution-based distinction is also
not developed enough to explain customer value.[^prices]

Recommendation: test a paid offer based on managed updates, compatibility support,
release history, or an agreed integration deliverable. Specify what stays free.
Avoid promising service levels until workload and costs have been measured.

### 8. The gates are too late and insufficiently diagnostic

The plan permits a year of unpaid work before its main revenue test and accepts
an advancing grant or three paying users as alternatives. These measure different
things. Stars and onboard trials measure reach and usability, not repeatable paid
demand.[^plan-gates]

Recommendation: use separate adoption, commercial, and funding gates. Cap the
next discovery cycle's hours. If evidence is weak, reduce business investment
without declaring the open-source project a failure.

## Proposed next 30 days

These are suggested decision thresholds, not forecasts:

1. Interview five relevant developers or small app teams. Document their current
   solution, an actual integration or maintenance problem, and who controls budget.
2. Run three sailor usability sessions on the existing inspector. Keep these
   findings separate from commercial evidence.
3. Help one unaffiliated developer integrate the existing data and viewer pieces.
   Measure time to first successful inspection and ongoing maintenance concerns.
4. Where a budgeted problem exists, propose a fixed-scope paid pilot with explicit
   deliverables and exclusions. No billing platform is necessary to test interest.
5. Continue commercial investment if at least two teams describe the same costly
   problem and one accepts a paid pilot. If interest remains generic praise or free
   usage, narrow the buyer hypothesis or maintain the project as bounded OSS work.

During this cycle, prioritize integration documentation, source/update visibility,
and defects that block the trial. Defer national coverage, a complete S-52 engine,
and subscription infrastructure until a buyer need justifies them. Further
inspection cards should follow observed user problems rather than completeness.

## Recommended positioning to test

> ChartTiles helps marine web developers add inspectable NOAA chart features
> without operating their own chart-processing stack. Use the open-source tools
> yourself, or pay for integration and managed updates.

This is proposed positioning and a possible paid offer, not a claim that those
services are already packaged or that demand has been demonstrated.

## Confidence and limits

High confidence: the POSE corrections, existence of the cited alternatives, and
arithmetic from the plan's prices. Medium confidence: a developer integration
service is the most economical next business experiment. Low confidence: market
size, willingness to pay, sales conversion, grant likelihood, and achievable
maintainer income. No customer interviews, funding eligibility determination, or
competitor deployment benchmark was performed for this review.

## Document references

[^plan-funds]: `docs/business-plan.md:128` and `docs/roadmap.md:48`, funding assumptions and use of funds.
[^plan-market]: `docs/business-plan.md:15` and `docs/business-plan.md:52`, problem and competition.
[^plan-buyers]: `docs/business-plan.md:17` and `docs/business-plan.md:65`, segments and go-to-market.
[^adr]: `docs/adr/0002-open-source-infrastructure-direction.md:12`, rejection of Fork 3 and selection of Fork 1.
[^prices]: `docs/roadmap.md:60`, hosted offer and placeholder pricing.
[^plan-revenue]: `docs/business-plan.md:89` and `docs/business-plan.md:140`, revenue scenarios and KPIs.
[^plan-costs]: `docs/business-plan.md:103` and `docs/business-plan.md:110`, operating model and costs.
[^plan-gates]: `docs/business-plan.md:175`, decision gates; `docs/business-plan.md:99`, unpaid first year.
