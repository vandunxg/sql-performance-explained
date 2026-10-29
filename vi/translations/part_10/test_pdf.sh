#!/usr/bin/env bash
set -u

directory="$(dirname "$0")"
root="$(cd "$directory/../.." && pwd)"
pdf="$root/parts/part_10.pdf"
html="$directory/part_10.print.html"
translation="$directory/translation.json"
failed=0
expected_units=161

protected_mappings() {
  cat <<'MAPPINGS'
p10-u014|1|55,510,300,75|part_10_p10-u014.png
p10-u016|2|42,100,327,150|part_10_p10-u016.png
p10-u020|2|42,445,330,35|part_10_p10-u020.png
p10-u022|2|42,500,330,85|part_10_p10-u022.png
p10-u034|4|60,470,290,30|part_10_p10-u034.png
p10-u037|5|80,45,300,120|part_10_p10-u037.png
p10-u042|5|55,330,320,30|part_10_p10-u042.png
p10-u045|5|60,450,340,145|part_10_p10-u045.png
p10-u047|6|45,125,330,55|part_10_p10-u047.png
p10-u049|6|45,205,170,25|part_10_p10-u049.png
p10-u079|9|55,378,300,85|part_10_p10-u079.png
p10-u081|9|55,488,180,55|part_10_p10-u081.png
p10-u084|10|40,145,345,260|part_10_p10-u084.png
p10-u088|11|60,165,140,120|part_10_p10-u088.png
p10-u090|11|60,335,300,75|part_10_p10-u090.png
p10-u096|12|48,207,100,25|part_10_p10-u096.png
p10-u098|12|48,260,315,65|part_10_p10-u098.png
p10-u124|15|55,92,235,245|part_10_p10-u124.png
p10-u128|16|45,102,305,120|part_10_p10-u128.png
p10-u131|16|45,292,255,65|part_10_p10-u131.png
p10-u132|17|0,0,425.196,651.968|part_10_p10-u132.png
p10-u133|18|0,0,425.196,651.968|part_10_p10-u133.png
p10-u134|19|0,0,425.196,651.968|part_10_p10-u134.png
p10-u161|21|230,520,165,85|part_10_p10-u161.png
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
     (.status == "DRAFT" or .status == "FINALIZED")
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
  unit_count="$(rg -o 'data-unit-id="p10-u[0-9]+"' "$html" | wc -l)"
  if [[ "$unit_count" != "$expected_units" ]]; then
    printf 'FAIL: HTML has %s unit markers instead of %s.\n' "$unit_count" "$expected_units" >&2
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
  if ! pdftotext "$pdf" - | rg -F "PostgreSQL" > /dev/null; then
    printf 'FAIL: selectable Vietnamese prose is missing.\n' >&2
    failed=1
  fi
fi

exit "$failed"
