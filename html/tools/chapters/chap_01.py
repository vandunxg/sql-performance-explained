import html
import re
from pathlib import Path

import build as B

TITLE = "Chương 1 — Giải phẫu một Index"
SUMMARY = "Leaf node, B-tree, vì sao index chậm"
RANGES = [(1, "p01-u014", "p01-u039")]
HEADING_LEVEL = {}
CALLOUT_KIND = {"p01-u016": "sidebar"}
FIGURES = {"p01-u023": "fig-1-1", "p01-u028": "fig-1-2", "p01-u032": "fig-1-3"}
FIGURE_SRC = {k: f"assets/img/{v}.png" for k, v in FIGURES.items()}


def intro_table(u, ctx):
    return B.table_html(["Programming Language", "Name"],
                        [["Java", "java.util.LinkedList"], [".NET Framework", "System.Collections.Generic.LinkedList"],
                         ["C++", "std::list"]], mono_cols=(1,), caption="")


def index_ops(u, ctx):  # p01-u039: đoạn dẫn + 3 operation + kết luận
    l = u["translated_text"].split("\n")
    out = [f"<p>{B.inline(l[0], ctx.figs)}</p>", '<dl class="chapter-list">']
    for k in (1, 3, 5):
        out.append(f'<dt style="font-variant:normal"><code class="kw">{html.escape(l[k])}</code></dt><dd>{B.inline(l[k + 1])}</dd>')
    out.append("</dl>")
    out.append(f"<p>{B.inline(l[7])}</p>")
    return "".join(out)


def log_sidebar(u, ctx):
    l = u["translated_text"].split("\n")
    p1 = B.inline(l[1]).replace("[Wikipedia 1]", '[Wikipedia<sup class="fn"><a href="#fn-1">1</a></sup>]')
    p2 = B.inline(l[2])
    p2 = re.sub(r"\(4\^(\d)\)", r"(4<sup>\1</sup>)", p2).replace("log4", "log<sub>4</sub>")
    p3 = B.inline(l[3])
    rows = [[l[k], l[k + 1]] for k in range(6, 22, 2)]
    tbl = '<div class="side-table">' + B.table_html([l[4], l[5]], rows, num_cols=(0, 1)) + "</div>"
    p4 = B.inline(l[22])
    fn = f'<div class="footnotes" id="fn-1"><p><sup class="fn">1</sup> {B.inline(l[24])}</p></div>'
    return B.callout("sidebar", l[0], f"<p>{p1}</p><p>{p2}</p>{tbl}<p>{p3}</p><p>{p4}</p>{fn}").replace(
        'class="callout sidebar "', 'class="callout sidebar" id="p01-u038"')


OVERRIDES = {
    "p01-u020": intro_table,
    "p01-u039": index_ops,
    "p01-u038": log_sidebar,
}
