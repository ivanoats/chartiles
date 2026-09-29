# Readable feature inspection

The inspector presents light characteristics above expandable raw ENC attributes.
Depth areas appear in separate cards and are labeled as polygon ranges, not point
soundings or current water depth. Rocks, wrecks, and soundings have readable
cards; other feature types retain a basic card and raw attributes.

## First supported examples

The retained NOAA cell `US5SEAGK` supplies two Shilshole Bay entrance examples:

| Buoy | Light LNAM | Display |
| --- | --- | --- |
| Entrance Lighted Buoy 1 | `022600019A4E0001` | Fl G 2.5s |
| Entrance Lighted Buoy 2 | `022600019A360001` | Fl R 2.5s |

Both record 0.3 seconds lit followed by 2.2 seconds dark. Matching periods do not
establish synchronization. Their feature source date is 2014-05-27, which is not
the chart update date or a verification of current conditions.

Buoy titles use an explicit `LNAM_REFS` link from a buoy to the selected light,
within the same source cell. The viewer searches loaded source tiles, including
buoy records whose symbols are hidden by collision handling. Duplicate tile
copies are collapsed. A unique linked buoy name takes precedence over the light’s
own `OBJNAM`. Missing, unnamed, or ambiguous associations fall back to the light’s
`OBJNAM`, then a colour/light title;
spatial proximity alone never supplies a buoy name. No archive rebuild is needed.

## Interpretation boundaries

The initial decoder supports flashing (`LITCHR=2`) and white, red, green, and
yellow colours. It accepts arrays and the stringified arrays in vector tiles.
Unknown codes, missing attributes, and unsupported sequences remain available
without invented translations. Simple flashing sequences use the S-57
light-plus-parenthesized-eclipse format. Other characteristics retain their codes
and raw sequences. Heights, ranges, sectors, and operational status are not yet
translated.

References: [S-57 light characteristic](https://docs.teledynecaris.com/s-57/attribut/litchr.htm),
[signal sequence](https://docs.teledynecaris.com/s-57/attribut/sigseq.htm),
and [depth area](https://docs.teledynecaris.com/s-57/object/depare.htm).

## Shared vocabulary and hazard cards

`web/s57-attributes.mjs` defines supported vocabulary version 1. Both light and
hazard cards consume it. It handles scalar values, arrays, and stringified arrays;
unknown codes remain visible. Numeric parsing keeps missing values separate from
zero and negative charted depths.

- Rocks and wrecks show `WATLEV` (water-level effect) and `VALSOU` when recorded.
- Wrecks show `CATWRK` as the **recorded wreck category**, not a new assessment.
- Soundings use the point depth retained as `depth_m` by our pipeline.
- All three show recorded `QUASOU` qualifications, including uncertain or reported
  values. Missing quality is labeled "Not recorded", not assumed reliable.
- Depths remain chart values, not current water depth or vessel clearance. The
  original values remain in raw attributes even when an unknown code is present.

Mappings were checked on 2026-09-29 against
[GDAL's S-57 attribute dictionary](https://github.com/OSGeo/gdal/blob/9a119bc210ec54ffd76a34179c3ef28cc44a0421/ogr/ogrsf_frmts/s57/data/s57expectedinput.csv)
(attribute IDs 71, 125, and 187), and the
[CARIS WATLEV reference](https://docs.teledynecaris.com/s-57/attribut/watlev.htm)
including code 7. Display labels use sentence case, shorten the hull/superstructure
wording, and correct the dictionary's spelling of "regularly". No Njord source
code or symbol assets are included.

## Verification

`npm test` exercises the retained examples, cross-cell and ambiguous associations,
unknown codes, and incomplete depth ranges. `npm run test:browser` clicks both
lights in the local Puget Sound tiles and checks titles, timing, depth separation,
raw details, and clearing the selection when changing display modes. Additional
browser cases inspect a real wreck with unknown depth, an awash rock with zero
charted depth, and a sounding from the retained `US5SEAGK` cell.

Aid icons are preloaded when the style loads so switching from initially hidden
vector layers produces inspectable symbols. Existing collision rules still apply.

Next is build-time aid association enrichment, as sequenced in the implementation
plan. Light ranges and sectors remain conditional on pilot feedback.

## Observed rendering limitation

Some sounding labels were absent on initial views even though the tile feature
and generated label image were loaded. Toggling the SOUNDG layer off and on made
the tested label selectable. The sounding browser regression uses that workflow
at zoom 15; it verifies the new card, not a fix for initial label placement.
This remains a separate portrayal/picking defect. Rocks and wrecks are tested
without toggling their layers. Existing symbol collision rules also still apply.
