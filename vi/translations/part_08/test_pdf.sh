#!/usr/bin/env bash
set -u

directory="$(dirname "$0")"
root="$(cd "$directory/../.." && pwd)"
pdf="$root/parts/part_08.pdf"
html="$directory/part_08.print.html"
translation="$directory/translation.json"
failed=0

protected_mappings() {
  cat <<'MAPPINGS'
p08-u003|1|95,95,235,155|part_08_p08-u003.png
p08-u005|1|65,288,330,55|part_08_p08-u005.png
p08-u008|1|95,430,235,155|part_08_p08-u008.png
p08-u011|2|50,165,330,55|part_08_p08-u011.png
p08-u014|2|50,325,330,75|part_08_p08-u014.png
p08-u019|3|95,95,235,160|part_08_p08-u019.png
p08-u026|4|55,180,320,165|part_08_p08-u026.png
p08-u032|5|65,355,320,55|part_08_p08-u032.png
p08-u034|5|65,485,320,75|part_08_p08-u034.png
p08-u040|6|50,385,330,55|part_08_p08-u040.png
p08-u041|6|50,438,330,85|part_08_p08-u041.png
p08-u060|10|60,345,300,55|part_08_p08-u060.png
p08-u063|10|60,475,300,80|part_08_p08-u063.png
p08-u067|11|75,135,290,55|part_08_p08-u067.png
p08-u070|11|75,245,290,55|part_08_p08-u070.png
p08-u075|11|55,440,330,100|part_08_p08-u075.png
p08-u082|12|55,345,330,105|part_08_p08-u082.png
p08-u089|13|60,205,330,120|part_08_p08-u089.png
p08-u097|14|65,185,320,55|part_08_p08-u097.png
p08-u100|14|65,320,320,100|part_08_p08-u100.png
p08-u104|14|65,525,320,65|part_08_p08-u104.png
p08-u108|15|75,140,290,65|part_08_p08-u108.png
p08-u111|15|60,290,330,185|part_08_p08-u111.png
p08-u116|16|55,245,330,80|part_08_p08-u116.png
p08-u124|17|65,260,320,85|part_08_p08-u124.png
p08-u129|18|55,140,330,90|part_08_p08-u129.png
p08-u132|18|55,370,330,170|part_08_p08-u132.png
p08-u137|19|55,135,330,180|part_08_p08-u137.png
p08-u142|20|55,150,330,125|part_08_p08-u142.png
p08-u146|21|75,145,290,70|part_08_p08-u146.png
p08-u148|21|75,360,290,65|part_08_p08-u148.png
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
  if ! jq -e '
    (.source_unit_ids == (.translation | map(.unit_id))) and
    (.source_unit_ids | length == 149) and
    ([.source_unit_ids[]] | unique | length == 149) and
    ([.translation[].unit_id] | length == 149) and
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
  unit_count="$(rg -o 'data-unit-id="p08-u[0-9]+[a-z]*"' "$html" | wc -l)"
  if [[ "$unit_count" != 149 ]]; then
    printf 'FAIL: HTML has %s unit markers instead of 149.\n' "$unit_count" >&2
    failed=1
  fi
  special_count="$(rg -o 'data-unit-id="p08-u046"' "$html" | wc -l)"
  if [[ "$special_count" != 1 || ! -s "$root/assets/part_08_special_p08-u046.png" ]]; then
    printf 'FAIL: source special page p08-u046 is not cloned exactly once.\n' >&2
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
  if ! pdftotext "$pdf" - | rg -F "Indexing ASC, DESC" > /dev/null; then
    printf 'FAIL: selectable Vietnamese prose is missing.\n' >&2
    failed=1
  fi
fi

exit "$failed"
