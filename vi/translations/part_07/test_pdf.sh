#!/usr/bin/env bash
set -u

directory="$(dirname "$0")"
root="$(cd "$directory/../.." && pwd)"
pdf="$root/parts/part_07.pdf"
html="$directory/part_07.print.html"
translation="$directory/translation.json"
failed=0

protected_mappings() {
  cat <<'MAPPINGS'
p07-u009|2|45,245,340,90|part_07_p07-u009.png
p07-u012|2|45,405,340,125|part_07_p07-u012.png
p07-u021|4|45,120,340,50|part_07_p07-u021.png
p07-u023|4|45,235,340,140|part_07_p07-u023.png
p07-u046|6|45,320,340,30|part_07_p07-u046.png
p07-u057|8|55,245,315,65|part_07_p07-u057.png
p07-u066|9|45,255,345,185|part_07_p07-u066.png
p07-u071|10|45,180,345,225|part_07_p07-u071.png
p07-u077|11|55,140,330,150|part_07_p07-u077.png
p07-u080|11|55,390,330,175|part_07_p07-u080.png
p07-u091|13|55,290,320,65|part_07_p07-u091.png
p07-u099|13|55,470,320,85|part_07_p07-u099.png
p07-u113|16|45,205,340,70|part_07_p07-u113.png
p07-u115|16|45,315,340,100|part_07_p07-u115.png
p07-u117|16|45,420,340,50|part_07_p07-u117.png
p07-u118|16|45,485,340,100|part_07_p07-u118.png
p07-u124|17|45,190,340,60|part_07_p07-u124.png
p07-u127|17|95,420,250,150|part_07_p07-u127.png
p07-u130|18|45,100,340,65|part_07_p07-u130.png
p07-u132|18|45,250,340,115|part_07_p07-u132.png
p07-u144|20|45,190,340,75|part_07_p07-u144.png
p07-u146|20|45,320,340,100|part_07_p07-u146.png
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
    (.source_unit_ids | length == 154) and
    ([.source_unit_ids[]] | unique | length == 154) and
    ([.translation[].unit_id] | length == 154) and
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
  unit_count="$(rg -o 'data-unit-id="p07-u[0-9]+[a-z]*"' "$html" | wc -l)"
  if [[ "$unit_count" != 154 ]]; then
    printf 'FAIL: HTML has %s unit markers instead of 154.\n' "$unit_count" >&2
    failed=1
  fi
  special_count="$(rg -o 'data-unit-id="p07-u102"' "$html" | wc -l)"
  if [[ "$special_count" != 1 || ! -s "$root/assets/part_07_special_p14.png" ]]; then
    printf 'FAIL: source special page p07-u102 is not cloned exactly once.\n' >&2
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
  if ! pdftotext "$pdf" - | rg -F "Index-only scan" > /dev/null; then
    printf 'FAIL: selectable Vietnamese prose is missing.\n' >&2
    failed=1
  fi
fi

exit "$failed"
