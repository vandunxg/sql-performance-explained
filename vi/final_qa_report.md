# Final QA Report

Date: 2026-10-29

## Final Status

`FINAL_QA_PASSED_WITH_NAVIGATION_LIMITATION`

Final artifact: `vi/SQL_Performance_Explained_VI.pdf`

- SHA-256: `ecfcfc59882ae74634e687b78570ae19e73d40e42f4cc62288ef338261575fae`
- Page count: 239
- Merge tool: qpdf
- Merge order: `part_01` through `part_10`
- Source PDFs and English parts were not edited by this finalization run.

## Coverage

- `progress.json` reported `ALL_10_PARTS_FINALIZED` before the final merge; all ten part statuses were `FINALIZED`.
- All ten `vi/parts/part_XX.pdf` files exist.
- All 109 artifacts declared by the ten progress records exist, including translation, local review, boundary review, renderer, test, and PDF QA artifacts.
- `translation_manifest.json` source validation was `PASS`: 207 source pages, matching concatenated part text hash, and 10 parts.
- The per-part source/translation unit counts are 50, 92, 165, 165, 148, 169, 154, 149, 165, and 161, totaling 1,418 units.

## Semantic And Technical QA

- All ten local QA records report coverage and code-integrity `PASS`.
- Historical Critical/Major findings: 11. Open Critical/Major findings after review: 0. The historical findings are marked `FIXED`.
- No unresolved questions or glossary change proposals remain in the local QA records.
- The approved glossary contains 11 terms. A corpus check of non-protected translation units found no target-term occurrence deficit for any glossary mapping:

| Glossary mapping | Target occurrences |
|---|---:|
| SQL -> SQL | 204 |
| database -> database | 381 |
| query -> query | 240 |
| index -> index | 1,024 |
| execution plan -> execution plan | 184 |
| optimizer -> optimizer | 75 |
| cost -> cost | 37 |
| row -> row | 241 |
| table -> table | 377 |
| join -> join | 144 |
| pagination -> pagination | 9 |

This terminology check is a corpus-level consistency check. Protected raster content is intentionally excluded from selectable-text counts.

## Boundary QA

- 12 boundary QA artifacts were found, covering all 9 adjacent-part boundaries, including duplicate handoff records where both sides recorded the same boundary.
- Boundary status: all records pass.
- Open boundary findings, issues, continuity issues, terminology conflicts, and revision-required flags: 0.
- Part 10 is correctly treated as the book-final part; no next boundary is required.

## PDF Integrity And Ordering

- Fresh `qpdf --check` passed for all ten source part PDFs and the merged PDF. The merged check reported no syntax or stream encoding errors.
- Fresh page counts and ordered ranges:

| Part | Pages | Final range |
|---|---:|---:|
| 01 | 21 | 1-21 |
| 02 | 22 | 22-43 |
| 03 | 25 | 44-68 |
| 04 | 25 | 69-93 |
| 05 | 23 | 94-116 |
| 06 | 24 | 117-140 |
| 07 | 26 | 141-166 |
| 08 | 25 | 167-191 |
| 09 | 24 | 192-215 |
| 10 | 24 | 216-239 |

- Each range's UTF-8 text extraction SHA-256 exactly matched the corresponding source part extraction, proving the requested page order and range boundaries.
- Merged UTF-8 extraction: PASS.
- UTF-8 round trip through `iconv`: PASS.
- Replacement characters (`U+FFFD`): 0.
- `file://` URLs in extracted text: 0.
- Non-ASCII code points in extracted text: 67,039.
- Extracted text SHA-256: `e54b59c307686ddb5c4a2e30dfb2a52fff44b3fa122824512585fb603e2e1fb5`.

## Protected Content Checks

The per-part PDF QA artifacts report the following protected-block counts. Fresh checks verified every available protected mapping has `render_count: 1`, a passing result, and no duplicate unit IDs.

| Part | Typed protected | Additional table | Rendered once | Special source pages |
|---|---:|---:|---:|---:|
| 01 | 6 | 1 | 7 | 0 |
| 02 | 25 | 0 | 25 | 0 |
| 03 | 32 | 0 | 32 | 0 |
| 04 | 58 | 0 | 58 | 0 |
| 05 | 24 | 0 | 24 | 0 |
| 06 | 36 | 0 | 36 | 1 |
| 07 | 22 | 0 | 22 | 1 |
| 08 | 31 | 0 | 31 | 1 |
| 09 | 17 | 0 | 17 | 1 |
| 10 | 24 | 0 | 24 | 0 |
| **Total** | **275** | **1** | **276** | **4** |

- Total protected blocks rendered once: 276.
- No translation HTML file contains a generic `<pre>` protected block.
- Rasterized protected SQL, code, table, diagram, and execution-plan content remains intentionally non-selectable under the project policy.

## Rendering QA

Fresh representative renders were generated at 144 DPI and visually inspected:

| Position | Render | Result |
|---|---|---|
| First page 1 | 851 x 1,304 PNG, 610,020 bytes | PASS: complete cover artwork and no clipping |
| Middle page 120 | 840 x 1,293 PNG, 223,640 bytes | PASS: selectable Vietnamese prose and intact tip block |
| Last page 239 | 840 x 1,293 PNG, 30,354 bytes | PASS: intact back-matter barcode and pricing block |

The first-page geometry differs because Part 01 retains its source page size; this was not altered during merge. No clipping or blank-page issue was observed in the inspected first, middle, or last render.

## Bookmarks And TOC

- qpdf JSON inspection found 239 pages with zero page-level outlines and no `/Outlines` entry in the catalog.
- Therefore, bookmarks are **not present** in the merged PDF and are not claimed.
- The rendered table-of-contents content from the first part is present on merged pages 5-6, confirmed by extracted `Contents`, `Preface`, and `Anatomy of an Index` text.
- qpdf did not regenerate or update TOC navigation/page references. The report and manifests record the TOC as rendered content only, not as updated navigation.

## Unresolved Issues

- No open Critical, Major, or boundary findings.
- Known limitation: the qpdf page merge does not provide bookmarks and does not update TOC navigation. This is documented rather than falsely claimed as complete.
- Known policy limitation: protected source blocks are raster images and are not selectable text.

## Completion Evidence

The final PDF, manifests, and this report agree on the same SHA-256 and 239-page count. The final status is `FINAL_QA_PASSED_WITH_NAVIGATION_LIMITATION`, not an unconditional bookmark/TOC success claim.
