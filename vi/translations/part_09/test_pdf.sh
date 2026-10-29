#!/usr/bin/env bash
set -u

directory="$(dirname "$0")"
root="$(cd "$directory/../.." && pwd)"
pdf="$root/parts/part_09.pdf"
html="$directory/part_09.print.html"
translation="$directory/translation.json"
failed=0
expected_units=165

protected_mappings() {
  cat <<'MAPPINGS'
p09-u006|1|50,245,310,90|part_09_p09-u006.png
p09-u009|1|50,425,325,155|part_09_p09-u009.png
p09-u026|5|100,445,210,130|part_09_p09-u026.png
p09-u038|7|110,270,210,105|part_09_p09-u038.png
p09-u049|9|110,145,210,120|part_09_p09-u049.png
p09-u059|10|45,315,340,230|part_09_p09-u059.png
p09-u068|11|50,350,220,25|part_09_p09-u068.png
p09-u070|11|50,465,250,30|part_09_p09-u070.png
p09-u075|12|60,165,220,25|part_09_p09-u075.png
p09-u078|12|60,245,320,70|part_09_p09-u078.png
p09-u113|16|60,120,280,115|part_09_p09-u113.png
p09-u123|17|50,245,180,25|part_09_p09-u123.png
p09-u126|17|50,345,180,25|part_09_p09-u126.png
p09-u129|17|55,490,170,28|part_09_p09-u129.png
p09-u132|18|50,90,325,45|part_09_p09-u132.png
p09-u138|18|50,425,325,115|part_09_p09-u138.png
p09-u143|19|50,200,150,25|part_09_p09-u143.png
MAPPINGS
}

if [[ ! -f "$translation" ]]; then
  printf 'FAIL: translation artifact is missing: %s\n' "$translation" >&2
  failed=1
fi
if [[ ! -f "$pdf" ]]; then
  printf 'FAIL: output PDF is missing: %s\n' "$pdf" >&2
  failed=1
fi
if [[ ! -f "$html" ]]; then
  printf 'FAIL: generated HTML is missing: %s\n' "$html" >&2
  failed=1
fi

if [[ -f "$translation" ]]; then
  if ! jq -e --argjson expected "$expected_units" '
    (.source_unit_ids == (.translation | map(.unit_id))) and
    (.source_unit_ids | length == $expected) and
    ([.source_unit_ids[]] | unique | length == $expected) and
    ([.translation[].unit_id] | length == $expected) and
    (.status == "DRAFT")
  ' "$translation" > /dev/null; then
    printf 'FAIL: source_unit_ids are not the complete ordered translation IDs.\n' >&2
    failed=1
  fi
fi

if [[ -f "$html" ]]; then
  if rg -U '<pre\b' "$html" > /dev/null; then
    printf 'FAIL: generated HTML contains a protected or generic pre block.\n' >&2
    failed=1
  fi
  while IFS='|' read -r unit_id source_page source_rect asset; do
    if ! rg -U "<img[^>]*class=\"source-clone\"[^>]*data-unit-id=\"${unit_id}\"[^>]*data-source-page=\"${source_page}\"[^>]*data-source-rect=\"${source_rect}\"[^>]*src=\"../../assets/${asset}\"" "$html" > /dev/null; then
      printf 'FAIL: %s lacks its source-page, rectangle, and crop-asset mapping.\n' "$unit_id" >&2
      failed=1
    fi
    count="$(rg -o "data-unit-id=\"${unit_id}\"" "$html" | wc -l)"
    if [[ "$count" != 1 ]]; then
      printf 'FAIL: %s is rendered %s times instead of exactly once.\n' "$unit_id" "$count" >&2
      failed=1
    fi
    if [[ ! -s "$root/assets/$asset" ]]; then
      printf 'FAIL: %s crop asset is missing or empty.\n' "$unit_id" >&2
      failed=1
    fi
  done < <(protected_mappings)
  unit_count="$(rg -o 'data-unit-id="p09-u[0-9]+"' "$html" | wc -l)"
  if [[ "$unit_count" != "$expected_units" ]]; then
    printf 'FAIL: HTML has %s unit markers instead of %s.\n' "$unit_count" "$expected_units" >&2
    failed=1
  fi
  special_count="$(rg -o 'data-unit-id="p09-u013"' "$html" | wc -l)"
  if [[ "$special_count" != 1 || ! -s "$root/assets/part_09_special_p09-u013.png" ]]; then
    printf 'FAIL: source special page p09-u013 is not cloned exactly once.\n' >&2
    failed=1
  fi
fi

if [[ -f "$pdf" ]]; then
  if ! qpdf --check "$pdf"; then
    failed=1
  fi
  if pdftotext "$pdf" - | rg -F "file:///" > /dev/null; then
    printf 'FAIL: PDF contains Chromium file URLs.\n' >&2
    failed=1
  fi
  if ! pdftotext "$pdf" - | rg -F "Dùng window function" > /dev/null; then
    printf 'FAIL: selectable Vietnamese prose is missing.\n' >&2
    failed=1
  fi
fi

exit "$failed"
