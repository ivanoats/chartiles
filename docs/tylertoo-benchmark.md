# tylertoo comparison — October 12, 2026

Keep tippecanoe for the current Puget Sound pipeline. tylertoo passed the
maximum-zoom feature and attribute checks, but this fidelity-oriented workflow
took 21% longer, used about twice the maximum resident memory, and produced a
37% larger archive. This is one local run per configuration, not a statistical
performance study or a general comparison of the tools.

## Inputs and method

The September retained build was absent from this checkout and the local search
found no complete snapshot. Ivan authorized fresh NOAA inputs. The existing
pipeline downloaded all 99 configured cells and retained a new snapshot at
`build/puget-sound-iz5tvqyw`. It extracted 47,262 features, including 28,103
soundings, matching the previous documented totals. Matching totals do not prove
source editions or geometry are identical to September.

Both compilers received the exact same normalized per-layer GeoJSON from that
snapshot. Compilation excludes NOAA acquisition, S-57 extraction, and validation.
The tylertoo measurement includes conversion to GeoParquet, overview generation,
PMTiles export for each nonempty layer, and native merging into one archive.
The full fresh acquisition/extraction/current build took 277 seconds; that is
not compared with the September download-free 122.18-second measurement.

Environment: macOS 26.6.2, ARM64; tippecanoe 2.79.0, tylertoo 0.8.0 (Python and
CLI), PyArrow 26.0.0. Dependencies and the CLI were installed under `/tmp`.
The official CLI archive's SHA256 matched its published checksum:
`987c7d1dd39e79b8569101c1b01b4af98c95680f8c51b1e1d9673f3c3bb04945`.

## Measurements

| Metric | Current tippecanoe | tylertoo with native pyramid merge |
| --- | ---: | ---: |
| Compilation, including required input conversion/merging | 13.409 s | 16.194 s |
| Maximum RSS | 267.50 MiB | 545.83 MiB |
| Archive bytes | 56,891,449 | 77,745,152 |
| Archive size | 54.26 MiB | 74.14 MiB |
| Enhanced validation, measured separately | 35.576 s | 28.715 s |
| Missing input features at zoom 16 | 0 | 0 |
| Changed scalar properties at zoom 16 | 0 | 0 |
| Features in incorrect MVT layers at zoom 16 | 0 | 0 |

tylertoo phases: 5.596 seconds for GeoParquet preparation, 7.131 seconds for
overview generation and tile export, and 3.386 seconds for native merging.
An initial `tile-join` merge workflow took 39.272 seconds overall, including
25.513 seconds for merging, and produced 78,389,276 bytes. Native `pyramid`
merging is the appropriate path for this experiment. `merge` itself requires
disjoint tile IDs and is unsuitable for these overlapping spatial layers.

RSS comes from macOS `/usr/bin/time -l`; it represents the largest process's
reported maximum RSS, not the summed simultaneous process-tree footprint.
Validation is excluded from compiler RSS. Runs were sequential; preparation
and earlier runs can warm filesystem caches. No claim about a reliable 21%
difference follows from one run. The enhanced validation performs the existing
check and a second decode for layer and scalar-attribute checks; it costs more
than the production pipeline's existing check.

## Fidelity settings and findings

tippecanoe uses the production arguments: zooms 8–16, no feature/tile-size limit,
no line simplification or tiny-polygon reduction, full-detail 16, drop-rate 1,
and buffer 8.

tylertoo uses duplicating overviews, zooms 8–16, simplification factor 0, all
thinning factors and visibility gates 0, density dropping and line coalescing
disabled, buffer 8, tile-size limit 0, and extent 65,536. Extent matches the
maximum-zoom precision target; it applies at every tylertoo zoom, while
tippecanoe's detail varies by zoom. Therefore this is not a comparison with
identical geometry encoding at every zoom. Size differences cannot be
attributed solely to compression or compiler efficiency.

Sounding geometry is explicitly converted to XY and assigned EPSG:4326 before
GeoParquet output. Otherwise GDAL emits EPSG:4979 for the 3D inputs, which
tylertoo 0.8.0 rejects. The normalized `depth_m` property is retained and checked.

Both final archives pass the existing `pipeline.verify.verify` check for all
47,262 source rows and all 28,103 sounding depths at zoom 16. The enhanced check
also found no changed non-null scalar source properties, incorrect layers, or
unexpected feature keys. Two source keys each have two records with distinct
RCIDs; validation accepts those source variants and checks they remain
represented. Arrays, objects, and null properties are outside the scalar check.

The tiny coastline regression feature
`US5SEAGK:COALNE:0226585FA1A91923` is present and retained. The separate 39-feature
coastline smoke test also passed with the default extent of 4,096; that does
not establish full-region suitability of the default precision.

tylertoo export reports no skipped property columns or empty-geometry drops.
It reports 15 quantized/collapsed DEPARE tile geometries: nine at z8, three at
z9, one at z10, and two at z14; none at z16. These are tile-member counts, not
15 globally missing source features. Identity preservation does not validate
geometry equality, polygon topology, coverage, or portrayal. Lower-zoom geometry
and manual chart review remain outstanding for both tools.

## Reproduction and evidence

Create an isolated Python environment with `tylertoo==0.8.0` and
`pyarrow==26.0.0`, and obtain the matching tylertoo CLI. Run from the repository:

```bash
python3 pipeline/build.py --config pipeline/puget-sound.json
# Substitute the Build workspace path printed by the command above.
/tmp/chartiles-tylertoo-venv/bin/python pipeline/benchmark_tylertoo.py \
  --snapshot build/puget-sound-iz5tvqyw \
  --output build/tylertoo-benchmark/comparison \
  --merge-tool /tmp/tylertoo-0.8.0-aarch64-apple-darwin/tylertoo
```

The comparison script does not publish or change viewer manifests. The initial
`build.py` command runs the normal local build and updates local viewer assets.
Use `build.py --snapshot PATH` to reuse saved source ZIPs. `--resume` on the
comparison reuses the completed baseline after checking normalized input hashes
and configuration; it reruns tylertoo. Without `--merge-tool`, the comparison
uses the slower external `tile-join` fallback.

Raw final results, per-layer reports, source provenance, normalized-input hashes,
archive hashes, logs, timing files, and both final archives are retained under
`build/tylertoo-benchmark/comparison/`. The initial external-merge results are
saved as `build/tylertoo-benchmark/comparison-tilejoin.json`. Build artifacts are
gitignored. The snapshot manifest includes catalog and source ZIP SHA256 hashes.

Final archive SHA256:

- tippecanoe: `4eb98dd1dc4f072272a95059816e14b350d9ffb2cdb6afb0a4e58ab479066a67`
- tylertoo: `5c44e7e3ed752b35d1ff96f0aef8ef8160f6cca86d8a9ceeb19f4c62a8d7fc3d`

The existing 20 Python tests passed, and five targeted preservation tests
(including three new benchmark-check tests) passed after the final changes.

Tool references: [tylertoo](https://github.com/geoparquet-io/tylertoo),
[overview tuning](https://geoparquet-io.github.io/tylertoo/OVERVIEW_TUNING/),
[0.8.0 release](https://github.com/geoparquet-io/tylertoo/releases/tag/v0.8.0).
