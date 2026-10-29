#!/usr/bin/env bash
set -u

directory="$(dirname "$0")"
root="$(cd "$directory/../.." && pwd)"
pdf="$root/parts/part_04.pdf"
html="$directory/part_04.print.html"
failed=0

protected_mappings() {
  cat <<'MAPPINGS'
p04-u004|1|60,253,290,165|part_04_p04-u004.png
p04-u006|1|60,460,115,87|part_04_p04-u006.png
p04-u012|2|47,282,165,68|part_04_p04-u012.png
p04-u014|2|47,395,255,47|part_04_p04-u014.png
p04-u016|2|47,500,155,39|part_04_p04-u016.png
p04-u017|3|62,72,265,106|part_04_p04-u017.png
p04-u019|3|60,220,275,30|part_04_p04-u019.png
p04-u021|3|60,303,155,47|part_04_p04-u021.png
p04-u022|3|62,352,310,123|part_04_p04-u022.png
p04-u027|4|47,144,280,29|part_04_p04-u027.png
p04-u034|4|47,458,255,75|part_04_p04-u034.png
p04-u035|5|62,72,315,115|part_04_p04-u035.png
p04-u037|5|62,226,225,58|part_04_p04-u037.png
p04-u038|5|62,285,265,65|part_04_p04-u038.png
p04-u042|5|62,486,315,95|part_04_p04-u042.png
p04-u043|6|47,72,155,38|part_04_p04-u043.png
p04-u044|6|47,111,270,65|part_04_p04-u044.png
p04-u047|6|47,296,215,48|part_04_p04-u047.png
p04-u048|6|47,345,310,75|part_04_p04-u048.png
p04-u051|6|47,515,300,68|part_04_p04-u051.png
p04-u052|7|62,72,155,38|part_04_p04-u052.png
p04-u053|7|62,111,305,76|part_04_p04-u053.png
p04-u055|7|62,233,260,87|part_04_p04-u055.png
p04-u056|7|62,320,295,77|part_04_p04-u056.png
p04-u058|7|62,442,225,55|part_04_p04-u058.png
p04-u059|7|62,500,265,68|part_04_p04-u059.png
p04-u063|8|47,209,165,39|part_04_p04-u063.png
p04-u065|8|47,292,328,126|part_04_p04-u065.png
p04-u068|8|47,487,292,30|part_04_p04-u068.png
p04-u070|9|62,93,225,39|part_04_p04-u070.png
p04-u071|9|62,132,290,75|part_04_p04-u071.png
p04-u079|10|47,357,300,38|part_04_p04-u079.png
p04-u082|10|47,480,215,29|part_04_p04-u082.png
p04-u085|11|62,120,200,45|part_04_p04-u085.png
p04-u088|11|62,273,215,45|part_04_p04-u088.png
p04-u093|12|65,95,290,185|part_04_p04-u093.png
p04-u095|12|65,323,250,195|part_04_p04-u095.png
p04-u097|13|79,95,295,155|part_04_p04-u097.png
p04-u099|13|79,294,250,175|part_04_p04-u099.png
p04-u102|14|65,128,255,28|part_04_p04-u102.png
p04-u104|14|47,203,265,38|part_04_p04-u104.png
p04-u107|14|47,353,260,38|part_04_p04-u107.png
p04-u110|14|47,503,280,58|part_04_p04-u110.png
p04-u114|15|75,122,120,20|part_04_p04-u114.png
p04-u117|15|75,239,185,29|part_04_p04-u117.png
p04-u121|16|47,160,145,39|part_04_p04-u121.png
p04-u123|16|47,249,135,38|part_04_p04-u123.png
p04-u125|16|47,325,185,38|part_04_p04-u125.png
p04-u127|16|47,413,180,38|part_04_p04-u127.png
p04-u129|16|47,525,40,58|part_04_p04-u129.png
p04-u136|17|62,355,145,38|part_04_p04-u136.png
p04-u138|17|62,462,185,38|part_04_p04-u138.png
p04-u142|18|47,214,210,48|part_04_p04-u142.png
p04-u145|18|47,358,205,48|part_04_p04-u145.png
p04-u149|18|52,535,225,48|part_04_p04-u149.png
p04-u153|19|62,287,265,65|part_04_p04-u153.png
p04-u156|19|62,471,215,48|part_04_p04-u156.png
p04-u159|20|47,156,215,48|part_04_p04-u159.png
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
  if ! pdftotext "$pdf" - | rg -F "NULL" > /dev/null; then
    printf 'FAIL: selectable Vietnamese prose is missing.\n' >&2
    failed=1
  fi
fi

exit "$failed"
