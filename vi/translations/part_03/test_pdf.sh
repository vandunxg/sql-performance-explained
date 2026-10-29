#!/usr/bin/env bash
set -u

directory="$(dirname "$0")"
root="$(cd "$directory/../.." && pwd)"
pdf="$root/parts/part_03.pdf"
html="$directory/part_03.print.html"
failed=0

protected_mappings() {
  cat <<'MAPPINGS'
p03-u011|2|64,108,145,55|part_03_p03-u011.png
p03-u012|2|64,167,315,125|part_03_p03-u012.png
p03-u014|2|64,338,145,55|part_03_p03-u014.png
p03-u015|2|64,395,260,120|part_03_p03-u015.png
p03-u031|5|68,108,305,65|part_03_p03-u031.png
p03-u033|5|68,209,305,84|part_03_p03-u033.png
p03-u037|5|68,364,305,65|part_03_p03-u037.png
p03-u039|5|68,464,305,75|part_03_p03-u039.png
p03-u043|6|82,108,285,75|part_03_p03-u043.png
p03-u045|6|82,218,245,75|part_03_p03-u045.png
p03-u049|6|82,364,295,40|part_03_p03-u049.png
p03-u051|6|82,435,300,95|part_03_p03-u051.png
p03-u055|7|68,108,275,38|part_03_p03-u055.png
p03-u057|7|68,179,220,48|part_03_p03-u057.png
p03-u061|7|58,455,310,45|part_03_p03-u061.png
p03-u071|9|48,120,280,45|part_03_p03-u071.png
p03-u074|9|48,260,270,60|part_03_p03-u074.png
p03-u080|10|125,88,210,265|part_03_p03-u080.png
p03-u084|11|42,88,295,265|part_03_p03-u084.png
p03-u089|12|64,225,305,90|part_03_p03-u089.png
p03-u095|13|50,230,315,90|part_03_p03-u095.png
p03-u097|13|48,428,250,35|part_03_p03-u097.png
p03-u099|13|48,503,250,35|part_03_p03-u099.png
p03-u103|14|48,205,310,40|part_03_p03-u103.png
p03-u104|14|48,244,325,80|part_03_p03-u104.png
p03-u109|15|60,90,270,195|part_03_p03-u109.png
p03-u117|16|75,410,205,25|part_03_p03-u117.png
p03-u136|18|64,225,220,50|part_03_p03-u136.png
p03-u153|20|64,340,160,45|part_03_p03-u153.png
p03-u156|20|64,493,320,40|part_03_p03-u156.png
p03-u159|21|48,115,250,45|part_03_p03-u159.png
p03-u165|21|48,443,280,40|part_03_p03-u165.png
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
fi

if [[ -f "$pdf" ]]; then
  if ! qpdf --check "$pdf"; then
    failed=1
  fi
  if pdftotext "$pdf" - | rg -F "file:///" > /dev/null; then
    printf 'FAIL: PDF contains Chromium file URLs.\n' >&2
    failed=1
  fi
  if ! pdftotext "$pdf" - | rg -F "bind parameter" > /dev/null; then
    printf 'FAIL: selectable Vietnamese prose is missing.\n' >&2
    failed=1
  fi
fi

exit "$failed"
