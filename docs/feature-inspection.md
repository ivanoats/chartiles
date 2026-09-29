# Readable feature inspection

The inspector presents light characteristics above expandable raw ENC attributes.
Depth areas appear in separate cards and are labeled as polygon ranges, not point
soundings or current water depth. Other feature types retain a basic card and raw
attributes.

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

## Verification

`npm test` exercises the retained examples, cross-cell and ambiguous associations,
unknown codes, and incomplete depth ranges. `npm run test:browser` clicks both
lights in the local Puget Sound tiles and checks titles, timing, depth separation,
raw details, and clearing the selection when changing display modes.

Aid icons are preloaded when the style loads so switching from initially hidden
vector layers produces inspectable symbols. Existing collision rules still apply.

Next candidates are wrecks, rocks, and soundings, followed by light ranges and
sectors with explicitly verified attribute meanings.
