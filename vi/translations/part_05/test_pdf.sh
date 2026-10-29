#!/usr/bin/env bash
set -u

directory="$(dirname "$0")"
root="$(cd "$directory/../.." && pwd)"
pdf="$root/parts/part_05.pdf"
html="$directory/part_05.print.html"
failed=0

protected_mappings() {
  cat <<'MAPPINGS'
p05-u002|1|60,70,305,60|part_05_p05-u002.png
p05-u006|1|60,282,320,132|part_05_p05-u006.png
p05-u009|1|60,520,320,70|part_05_p05-u009.png
p05-u010|2|47,72,338,119|part_05_p05-u010.png
p05-u014|2|47,350,320,42|part_05_p05-u014.png
p05-u040|5|60,170,270,50|part_05_p05-u040.png
p05-u042|5|60,250,270,50|part_05_p05-u042.png
p05-u045|5|60,375,270,50|part_05_p05-u045.png
p05-u047|5|60,466,270,50|part_05_p05-u047.png
p05-u049|5|60,555,330,35|part_05_p05-u049.png
p05-u062|8|47,250,310,55|part_05_p05-u062.png
p05-u065|8|117,385,195,115|part_05_p05-u065.png
p05-u070|9|50,230,330,130|part_05_p05-u070.png
p05-u075|10|45,100,330,100|part_05_p05-u075.png
p05-u076|10|45,195,330,75|part_05_p05-u076.png
p05-u082|11|47,70,330,132|part_05_p05-u082.png
p05-u083|11|47,202,330,100|part_05_p05-u083.png
p05-u089|12|47,165,330,28|part_05_p05-u089.png
p05-u092|12|47,300,330,32|part_05_p05-u092.png
p05-u099|13|60,345,330,200|part_05_p05-u099.png
p05-u104|14|55,230,330,130|part_05_p05-u104.png
p05-u117|16|55,155,330,125|part_05_p05-u117.png
p05-u146|21|70,118,325,200|part_05_p05-u146.png
p05-u148|21|70,340,325,185|part_05_p05-u148.png
MAPPINGS
}

if [[ ! -f "$pdf" ]]; then
  printf 'FAIL: output PDF is missing: %s\n' "$pdf" >&2
  failed=1
fi
if [[ ! -f "$html" ]]; then
  printf 'FAIL: generated HTML is missing: %s\n' "$html" >&2
  failed=1
fi

if [[ -f "$html" ]]; then
  while IFS='|' read -r unit_id source_page source_rect asset; do
    if rg -U "<pre[^>]*data-unit-id=\"${unit_id}\"" "$html" > /dev/null; then
      printf 'FAIL: %s is rendered as a reflowing HTML pre block.\n' "$unit_id" >&2
      failed=1
    fi
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
  unit_count="$(rg -o 'data-unit-id="p05-u[0-9]+"' "$html" | wc -l)"
  if [[ "$unit_count" != 148 ]]; then
    printf 'FAIL: HTML has %s unit markers instead of 148.\n' "$unit_count" >&2
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
  if ! pdftotext "$pdf" - | rg -F "Smart Logic" > /dev/null; then
    printf 'FAIL: selectable Vietnamese prose is missing.\n' >&2
    failed=1
  fi
fi

exit "$failed"
