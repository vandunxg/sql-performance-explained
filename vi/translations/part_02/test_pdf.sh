#!/usr/bin/env bash
set -u

directory="$(dirname "$0")"
root="$(cd "$directory/../.." && pwd)"
pdf="$root/parts/part_02.pdf"
html="$directory/part_02.print.html"
source_pdf="$root/../en_parts/part_02.pdf"
failed=0

protected_mappings() {
  cat <<'MAPPINGS'
p02-u011|2|42,340,235,25|part_02_p02-u011.png
p02-u013|2|42,419,150,44|part_02_p02-u013.png
p02-u014|2|42,468,318,110|part_02_p02-u014.png
p02-u016|3|56,150,149,34|part_02_p02-u016.png
p02-u017|3|56,189,264,101|part_02_p02-u017.png
p02-u024|4|80,338,253,143|part_02_p02-u024.png
p02-u027|5|74,156,153,43|part_02_p02-u027.png
p02-u030|5|66,404,225,23|part_02_p02-u030.png
p02-u033|6|42,217,313,110|part_02_p02-u033.png
p02-u040|9|56,133,289,42|part_02_p02-u040.png
p02-u042|9|66,237,308,120|part_02_p02-u042.png
p02-u044|9|56,527,289,51|part_02_p02-u044.png
p02-u046|10|52,106,283,101|part_02_p02-u046.png
p02-u053|12|52,235,307,120|part_02_p02-u053.png
p02-u055|12|52,472,229,13|part_02_p02-u055.png
p02-u057|13|66,121,302,120|part_02_p02-u057.png
p02-u063|14|52,356,205,32|part_02_p02-u063.png
p02-u065|15|66,97,253,100|part_02_p02-u065.png
p02-u067|15|66,318,205,33|part_02_p02-u067.png
p02-u072|16|52,107,176,22|part_02_p02-u072.png
p02-u074|16|52,256,302,110|part_02_p02-u074.png
p02-u078|17|66,140,302,110|part_02_p02-u078.png
p02-u081|17|66,510,287,23|part_02_p02-u081.png
p02-u088|19|66,226,258,81|part_02_p02-u088.png
p02-u090|19|66,370,253,32|part_02_p02-u090.png
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
  if ! pdftotext "$pdf" - | rg -F "Primary key không nhất thiết" > /dev/null; then
    printf 'FAIL: selectable Vietnamese prose is missing.\n' >&2
    failed=1
  fi
fi

exit "$failed"
