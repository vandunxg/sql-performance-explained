import html
import re
from pathlib import Path

import build as B

TITLE = "Mở đầu và Lời nói đầu"
SUMMARY = "Bìa, license, mục lục sách, Lời nói đầu"
RANGES = [(1, "p01-u001", "p01-u013")]
HEADING_LEVEL = {}
CALLOUT_KIND = {}
FIGURES, FIGURE_SRC = {}, {}

LAYOUT = Path(__file__).resolve().parents[3] / "vi/source/part_01/source_layout.txt"
# tiêu đề mục lục -> trang đích (None = chưa dựng)
TOC_LINKS = {
    "Preface": "#p01-u008",
    "1. Anatomy of an Index": "chap_01.html", "The Index Leaf Nodes": "chap_01.html#p01-u018",
    "The Search Tree (B-Tree)": "chap_01.html#p01-u025", "Slow Indexes, Part I": "chap_01.html#p01-u036",
}


def cover(u, ctx):
    return ('<section class="cover"><div class="logo"><div class="l1">SQL</div><div class="l2">PERFORMANCE</div>'
            '<div class="l3">EXPLAINED</div><div class="edition">Ấn bản tiếng Anh · bản dịch tiếng Việt</div></div>'
            '<img src="assets/img/cover.png" alt="Ảnh bìa: con sóc chạy trên cỏ">'
            '<div class="tagline">Mọi điều developer cần biết về SQL performance</div>'
            '<div class="author">Markus Winand</div></section>')


def legal(u, ctx):
    uid = u["unit_id"]
    t = u["translated_text"]
    if uid == "p01-u002":
        return f'<div class="legal"><h2 id="{uid}">{html.escape(t)}</h2>'
    if uid == "p01-u003":
        return B.paras(t)
    if uid == "p01-u004":  # dòng 1 + người được cấp phép
        a, b = t.split("\n", 1)
        return f'<p>{html.escape(a)}</p><p style="padding-left:2rem">{html.escape(b)}</p>'
    # u005: front matter - nhà xuất bản, bản quyền, ...
    blocks = [b for b in t.split("\n") ]
    out, dl = [], []
    labels = ("Nhà xuất bản:", "Thiết kế bìa:", "Ảnh bìa:", "Biên tập viên:")
    i = 0
    while i < len(blocks):
        l = blocks[i]
        if l in labels:
            j = i + 1
            vals = []
            while j < len(blocks) and blocks[j].strip() and blocks[j] not in labels and not blocks[j].startswith(("Bản quyền", "DGS")):
                vals.append(blocks[j]); j += 1
                if l != "Nhà xuất bản:":
                    break
            dl.append(f'<dt>{html.escape(l.rstrip(":"))}</dt><dd>{"<br>".join(html.escape(v) for v in vals)}</dd>')
            i = j
            continue
        if l.strip():
            out.append(f"<p>{html.escape(l)}</p>")
        i += 1
    return f'<dl>{"".join(dl)}</dl>{"".join(out)}</div>'


def titlepage(u, ctx):
    l = u["translated_text"].split("\n")
    return (f'<section class="titlepage"><div class="t1">{html.escape(l[0])}</div>'
            f'<div class="t2">{html.escape(l[1])}</div>'
            f'<div class="t3">{html.escape(l[2])}<br>{html.escape(l[3])}</div></section>')


def toc(u, ctx):
    items = []
    for line in LAYOUT.read_text("utf-8").splitlines():
        m = re.match(r"^(\s*)(\S.*?)\s*\.{3,}\s*\S+$", line)
        if not m:
            continue
        lv = 1 if len(m.group(1)) == 0 else 2 if len(m.group(1)) <= 4 else 3
        title = m.group(2)
        if title == "Index":
            lv = 1
        a = TOC_LINKS.get(title)
        label = html.escape(title)
        items.append(f'<li class="l{lv}">' + (f'<a href="{a}">{label}</a>' if a else label) + "</li>")
    return f'<nav class="toc" aria-label="Mục lục sách"><h2 id="toc">Mục lục</h2><ol>{"".join(items)}</ol></nav>'


def preface_chapters(u, ctx):
    lines = u["translated_text"].split("\n")
    out = [f"<p>{B.inline(lines[0])}</p>", '<dl class="chapter-list">']
    for k in range(1, len(lines), 2):
        title = re.sub(r"^CHƯƠNG", "Chương", re.sub(r"^PHỤ LỤC", "Phụ lục", lines[k]))
        out.append(f"<dt>{html.escape(title)}</dt><dd>{B.inline(lines[k + 1])}</dd>")
    out.append("</dl>")
    return "".join(out)


OVERRIDES = {
    "p01-u001": cover,
    "p01-u002": legal, "p01-u003": legal, "p01-u004": legal, "p01-u005": legal,
    "p01-u006": titlepage, "p01-u007": toc, "p01-u013": preface_chapters,
}
