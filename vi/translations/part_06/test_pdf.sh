#!/usr/bin/env bash
set -u

directory="$(dirname "$0")"
root="$(cd "$directory/../.." && pwd)"
pdf="$root/parts/part_06.pdf"
html="$directory/part_06.print.html"
translation="$directory/translation.json"
failed=0

protected_mappings() {
  cat <<'MAPPINGS'
p06-u004|1|70,105,330,105|part_06_p06-u004.png
p06-u006|1|70,230,330,125|part_06_p06-u006.png
p06-u009|1|55,445,340,145|part_06_p06-u009.png
p06-u012|2|55,90,340,145|part_06_p06-u012.png
p06-u016|2|90,300,270,25|part_06_p06-u016.png
p06-u019|2|90,378,270,30|part_06_p06-u019.png
p06-u021|2|90,425,270,35|part_06_p06-u021.png
p06-u024|2|90,500,270,45|part_06_p06-u024.png
p06-u028|3|40,150,370,35|part_06_p06-u028.png
p06-u038|4|70,310,330,150|part_06_p06-u038.png
p06-u040|4|70,500,330,120|part_06_p06-u040.png
p06-u045|5|70,120,330,115|part_06_p06-u045.png
p06-u047|5|70,280,330,115|part_06_p06-u047.png
p06-u052|6|70,110,330,75|part_06_p06-u052.png
p06-u054|6|70,220,330,115|part_06_p06-u054.png
p06-u057|6|70,390,330,130|part_06_p06-u057.png
p06-u059|6|70,545,330,75|part_06_p06-u059.png
p06-u061|7|45,90,340,180|part_06_p06-u061.png
p06-u071|8|70,300,330,75|part_06_p06-u071.png
p06-u074|9|45,70,340,175|part_06_p06-u074.png
p06-u079|9|40,510,370,35|part_06_p06-u079.png
p06-u082|10|45,80,340,155|part_06_p06-u082.png
p06-u089|11|55,125,340,75|part_06_p06-u089.png
p06-u091|11|45,255,340,120|part_06_p06-u091.png
p06-u096|11|55,535,340,55|part_06_p06-u096.png
p06-u102|12|90,310,270,55|part_06_p06-u102.png
p06-u105|12|70,450,300,65|part_06_p06-u105.png
p06-u110|13|55,150,340,180|part_06_p06-u110.png
p06-u113|13|55,405,340,95|part_06_p06-u113.png
p06-u119|14|55,100,340,140|part_06_p06-u119.png
p06-u122|14|55,325,340,100|part_06_p06-u122.png
p06-u124|15|55,70,340,155|part_06_p06-u124.png
p06-u156|20|45,78,340,130|part_06_p06-u156.png
p06-u166|21|40,265,370,55|part_06_p06-u166.png
p06-u168|21|45,365,340,140|part_06_p06-u168.png
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
    (.source_unit_ids | length == 169) and
    ([.source_unit_ids[]] | unique | length == 169) and
    (.source_unit_ids == [range(1;170) | ("p06-u" + (tostring | if length == 1 then "00" + . elif length == 2 then "0" + . else . end))])
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
  unit_count="$(rg -o 'data-unit-id="p06-u[0-9]+"' "$html" | wc -l)"
  if [[ "$unit_count" != 169 ]]; then
    printf 'FAIL: HTML has %s unit markers instead of 169.\n' "$unit_count" >&2
    failed=1
  fi
  special_count="$(rg -o 'data-unit-id="p06-u136"' "$html" | wc -l)"
  if [[ "$special_count" != 1 || ! -s "$root/assets/part_06_special_p17.png" ]]; then
    printf 'FAIL: source special page p06-u136 is not cloned exactly once.\n' >&2
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
  if ! pdftotext "$pdf" - | rg -F "Nested loops join" > /dev/null; then
    printf 'FAIL: selectable Vietnamese prose is missing.\n' >&2
    failed=1
  fi
fi

exit "$failed"
