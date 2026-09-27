# Update benchmark

The first check against the saved Puget Sound build found no new source revision: all 99 catalog records matched on edition, update number, issue date and compilation scale. All 99 downloaded ZIPs also matched their recorded SHA-256 hashes; uncompressed member contents matched as well. The source downloads totalled 7,977,831 bytes.

The current PMTiles archive is 56,891,449 bytes. That is the measured full-replacement size for this build, not an estimate of incremental transfer cost. There is no second changed source edition yet, so archive delta size remains unmeasured. Earlier local builds changed zoom levels and tile precision and must not be treated as chart-update comparisons.

## Repeat the check

```bash
python3 pipeline/check_updates.py build/puget-sound-REPLACE_WITH_BUILD_ID
# Also verify actual source bytes; downloads every selected cell:
python3 pipeline/check_updates.py build/puget-sound-REPLACE_WITH_BUILD_ID --verify-downloads
```

The first form compares catalog metadata only. It cannot prove source bytes are unchanged. The second verifies baseline ZIP hashes and compares current ZIPs both as whole files and as uncompressed member paths/content, ignoring packaging timestamps. Each check saves the downloaded catalog, optional ZIPs, and report.json under an ignored build/update-check-* directory. No current chart manifest or viewer data is replaced.

Missing or cancelled cells are reported for review and block download verification. The checker covers the existing selected cells; discovering replacements or newly introduced coverage requires a separate catalog-selection review. Concurrent NOAA publication can change files during a run; a changed-source benchmark should confirm catalog consistency before drawing conclusions.

## When source data changes

Use the downloaded snapshot with the same configuration and compiler versions as the baseline. Build and validate it, then compare artifact sizes and hashes. Only then measure a transfer strategy, such as complete replacement or an external binary patch. Track patch generation time, patch size, verification, and recovery from interruption. The application currently supports full replacement; this checker does not implement incremental updates.

Tests cover update-number changes, cancellations, unchanged records, packaging-only differences, and changed payload bytes. Run `npm test`.
