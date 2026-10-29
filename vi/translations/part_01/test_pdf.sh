#!/usr/bin/env bash
set -euo pipefail

pdf="$(dirname "$0")/../../parts/part_01.pdf"
html="$(dirname "$0")/part_01.print.html"
source_pdf="$(dirname "$0")/../../../en_parts/part_01.pdf"
failed=0

check_protected_source_clones() {
  local mapping unit_id source_page source_rect asset count

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
    if [[ ! -s "$(dirname "$0")/../../assets/${asset}" ]]; then
      printf 'FAIL: %s crop asset is missing or empty.\n' "$unit_id" >&2
      failed=1
    fi
  done <<'MAPPINGS'
p01-u010|8|42,300,147,36|part_01_p01-u010.png
p01-u020|13|56,71,327,59|part_01_p01-u020.png
p01-u038-table|17|244,266,125,141|part_01_p01-u038-table.png
p01-u046|20|42,170,270,85|part_01_p01-u046.png
p01-u048|20|42,337,155,38|part_01_p01-u048.png
p01-u050|20|42,450,320,115|part_01_p01-u050.png
MAPPINGS
}

page_one_content_object() {
  local pdf="$1" line in_first_page=false in_content=false
  while IFS= read -r line; do
    if [[ "$line" == "page 1:"* ]]; then
      in_first_page=true
      continue
    fi
    if "$in_first_page" && [[ "$line" == "  content:" ]]; then
      in_content=true
      continue
    fi
    if "$in_content" && [[ "$line" =~ ^[[:space:]]+([0-9]+)[[:space:]]+0[[:space:]]+R$ ]]; then
      printf '%s\n' "${BASH_REMATCH[1]}"
      return 0
    fi
  done < <(qpdf --show-pages "$pdf")
  return 1
}

page_one_stream_sha256() {
  local pdf="$1" object
  object="$(page_one_content_object "$pdf")"
  qpdf --show-object="$object" --filtered-stream-data "$pdf" | sha256sum | cut -d' ' -f1
}
for diagram in part_01_diagram_1_1.png part_01_diagram_1_2.png part_01_diagram_1_3.png; do
  test -s "$(dirname "$0")/../../assets/$diagram"
  rg -F "$diagram" "$html"
done
test -f "$pdf"
qpdf --check "$pdf"
check_protected_source_clones

# The cover must be a cloned source PDF page, not Chromium's reflowed cover.
if [[ "$(page_one_stream_sha256 "$source_pdf")" != "$(page_one_stream_sha256 "$pdf")" ]]; then
  printf '%s\n' 'FAIL: output page 1 content stream does not match source page 1.' >&2
  failed=1
fi

# The source ToC is two original PDF pages, never a flattened HTML table.
if rg -U '<pre[^>]*data-unit-id="p01-u007"' "$html" > /dev/null; then
  printf '%s\n' 'FAIL: p01-u007 is still rendered as a flattened HTML pre block.' >&2
  failed=1
fi
test "$failed" -eq 0
if pdftotext "$pdf" - | rg -F "file:///" > /dev/null; then
  exit 1
fi
pdftotext "$pdf" - | rg -F "Các vấn đề SQL performance đã tồn tại từ khi SQL xuất hiện"
