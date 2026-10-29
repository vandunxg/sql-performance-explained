#!/usr/bin/env python3
"""Dựng html/chap_NN.html từ vi/translations/part_NN/translation.json.

Dùng:  python3 html/tools/build.py 1      # dựng chap_01.html
       python3 html/tools/build.py        # dựng index.html + mọi chương có cấu hình

Nội dung prose lấy từ bản dịch VI. Code / table / execution plan / figure lấy từ
bản EN gốc (override theo unit_id trong tools/chapters/chap_NN.py) vì translation.json
làm mất khoảng trắng và xuống dòng của các khối này.
"""
import html
import importlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML = ROOT / "html"
sys.path.insert(0, str(Path(__file__).parent))

CHAPTER_COUNT = 10
ICONS = {  # icon SVG nhỏ cho callout, dùng currentColor
    "note": '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 6v.01" stroke-linecap="round"/></svg>',
    "important": '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 2.5l2.2 4.6 5 .7-3.6 3.5.9 5L10 13.9 5.5 16.3l.9-5L2.8 7.8l5-.7z" stroke-linejoin="round"/></svg>',
    "tip": '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 14h6M8 17h4M10 2.5a5 5 0 0 0-3 9c.6.5 1 1.2 1 2h4c0-.8.4-1.5 1-2a5 5 0 0 0-3-9z" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "warning": '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 2.8L18 16.5H2z" stroke-linejoin="round"/><path d="M10 8v4M10 14.2v.01" stroke-linecap="round"/></svg>',
}
ICONS["caution"] = ICONS["warning"]
ICONS["think_about_it"] = ICONS["tip"]
ICONS["sidebar"] = ""

# ---------- inline ----------
CAPS_EXCLUDE = {"SQL", "IOT", "DBA", "KISS", "API", "PDF", "HTML", "URL"}
RE_URL = re.compile(r"https?://[^\s<>\"“”]+")
RE_CAPS = re.compile(r"\b[A-Z][A-Z0-9_]{2,}(?: [A-Z][A-Z0-9_]{2,})*\b")
RE_KW = re.compile(r"\b(create index|order by|group by|insert|delete|update|where)\b")


def inline(text, figs=None):
    s = html.escape(terms.normalize(text), quote=False)
    stash = []

    def hold(markup):
        stash.append(markup)
        return f"\x00{len(stash) - 1}\x00"

    s = RE_URL.sub(lambda m: hold(f'<a href="{m.group(0)}">{m.group(0)}</a>'), s)
    s = RE_CAPS.sub(
        lambda m: m.group(0) if m.group(0) in CAPS_EXCLUDE else hold(f'<code class="id">{m.group(0)}</code>'), s)
    s = RE_KW.sub(lambda m: hold(f'<code class="kw">{m.group(1)}</code>'), s)
    if figs:
        s = re.sub(r"Hình (\d+)\.(\d+)",
                   lambda m: f'<a href="#fig-{m.group(1)}-{m.group(2)}">{m.group(0)}</a>'
                   if f"fig-{m.group(1)}-{m.group(2)}" in figs else m.group(0), s)
    s = re.sub(r"\x00(\d+)\x00", lambda m: stash[int(m.group(1))], s)
    return s


def paras(text, figs=None):
    return "\n".join(f"<p>{inline(l, figs)}</p>" for l in text.split("\n") if l.strip())


def raw_code(text):
    """Escape + **bold** marker -> <b>."""
    s = html.escape(text.strip("\n"), quote=False)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)


def code_block(text, kind="", label=""):
    lab = f'<span class="label">{label}</span>' if label else ""
    return f'<div class="code {kind}">{lab}<pre><code>{raw_code(text)}</code></pre></div>'


def table_html(head, rows, num_cols=(), mono_cols=(), caption=""):
    def cell(tag, i, v):
        cls = " ".join(c for c, cols in (("num", num_cols), ("mono", mono_cols)) if i in cols and (tag == "td" or c == "num"))
        return f'<{tag}{f" class={chr(34)}{cls}{chr(34)}" if cls else ""}>{html.escape(v)}</{tag}>'
    cap = f"<caption>{html.escape(caption)}</caption>" if caption else ""
    th = "".join(cell("th", i, v) for i, v in enumerate(head))
    tb = "".join("<tr>" + "".join(cell("td", i, v) for i, v in enumerate(r)) + "</tr>" for r in rows)
    return f'<div class="table-wrap"><table class="data">{cap}<thead><tr>{th}</tr></thead><tbody>{tb}</tbody></table></div>'


def callout(kind, title, body_html, extra_cls=""):
    icon = ICONS.get(kind, "")
    return (f'<aside class="callout {kind} {extra_cls}"><p class="title">{icon}<span>{html.escape(title)}</span></p>'
            f'{body_html}</aside>')


def figure(fig_id, caption, src, alt=""):
    return (f'<figure class="fig" id="{fig_id}"><figcaption>{inline(caption)}</figcaption>'
            f'<div class="img-wrap"><img src="{src}" alt="{html.escape(alt or caption)}" loading="lazy"></div></figure>')


# ---------- chapter build ----------
class Ctx:
    def __init__(self, cfg, units):
        self.cfg = cfg
        self.units = units
        self.toc = []  # (level, id, title)
        self.figs = set(cfg.FIGURES.values()) if hasattr(cfg, "FIGURES") else set()

    def add_toc(self, level, uid, title):
        self.toc.append((level, uid, title))


def render_heading(u, ctx):
    uid = u["unit_id"]
    lines = [l for l in u["translated_text"].split("\n") if l.strip()]
    if len(lines) >= 2:  # "Chương N" + tên chương -> chapter head
        ctx.add_toc(1, uid, f"{lines[0]}: {lines[1]}")
        return (f'<header class="chapter-head" id="{uid}"><p class="eyebrow">{html.escape(lines[0])}</p>'
                f'<h1>{inline(lines[1])}</h1></header>')
    level = ctx.cfg.HEADING_LEVEL.get(uid, 2)
    ctx.add_toc(level + 0, uid, lines[0])
    return f'<h{level} id="{uid}">{inline(lines[0])}<a class="anchor" href="#{uid}" aria-label="Liên kết">#</a></h{level}>'


def render_unit(u, ctx):
    uid, t = u["unit_id"], u["unit_type"]
    ov = ctx.cfg.OVERRIDES.get(uid)
    if ov is not None:
        return ov(u, ctx) if callable(ov) else ov
    text = u.get("translated_text", "")
    if t in ("heading", "subheading"):
        return render_heading(u, ctx)
    if t == "paragraph":
        return f'<div class="para" id="{uid}">{paras(text, ctx.figs)}</div>'
    if t == "sql_code":
        return code_block(text, "sql", "SQL")
    if t == "code":
        return code_block(text, "", "")
    if t == "execution_plan":
        return code_block(text, "plan", "Execution plan")
    if t == "terminal":
        return code_block(text, "terminal", "Terminal")
    if t in ICONS:
        lines = [l for l in text.split("\n") if l.strip()]
        kind = ctx.cfg.CALLOUT_KIND.get(uid, t)
        return callout(kind, lines[0], paras("\n".join(lines[1:]), ctx.figs), "")
    raise SystemExit(f"{uid}: chưa có renderer cho unit_type={t!r}; thêm vào OVERRIDES")


import shutil
import terms
import engine
import collections

ORDER = ["front"] + [f"chap_{n:02d}" for n in range(1, 9)] + ["app_a", "back"]
LABEL = {"front": "Mở đầu"}


def load_units(cfg):
    """Gom unit của chương từ một hay nhiều part, cắt theo (part, unit_id) đầu/cuối."""
    units = []
    for part, first, last in cfg.RANGES:
        tr = json.loads((ROOT / f"vi/translations/part_{part:02d}/translation.json").read_text("utf-8"))
        ids = [u["unit_id"] for u in tr["translation"]]
        a, b = ids.index(first), ids.index(last)
        units += tr["translation"][a:b + 1]
    return units


def build_chapter(name):
    cfg = importlib.import_module(f"chapters.{name}")
    if getattr(cfg, "AUTO", False):
        ctx, out, units = render_auto(cfg)
    else:
        units = load_units(cfg)
        ctx = Ctx(cfg, units)
        out = render_manual(units, ctx, cfg)
    return finish_chapter(name, cfg, ctx, out, units)


def render_manual(units, ctx, cfg):
    out, i = [], 0
    while i < len(units):
        u = units[i]
        if u["unit_type"] == "caption":  # caption + figure đi cùng nhau
            nxt = units[i + 1]
            fig_id = cfg.FIGURES[nxt["unit_id"]]
            out.append(figure(fig_id, u["translated_text"], cfg.FIGURE_SRC[nxt["unit_id"]]))
            i += 2
            continue
        out.append(render_unit(u, ctx))
        i += 1
    return out


DEFAULT_LABEL = {"note": "Lưu ý", "important": "Quan trọng", "tip": "Mẹo", "warning": "Cảnh báo", "caution": "Cẩn trọng",
                 "think_about_it": "Hãy suy nghĩ"}
RE_FIG = re.compile(r"(?:Hình|Figure) (\d+)\.(\d+)")


class AutoCfg:
    FIGURES = {}


def render_auto(cfg):
    levels = getattr(cfg, "LEVELS", {})
    stats = collections.defaultdict(list)
    units = engine.collect(cfg.RANGES)
    blocks = engine.clean(units, stats, levels)
    ctx = Ctx(AutoCfg, units)
    ctx.figs = {f"fig-{m.group(1)}-{m.group(2)}" for b in blocks if b["kind"] == "figure"
                for m in [RE_FIG.search(b["caption"])] if m}
    out = []
    for b in blocks:
        k, uid = b["kind"], b["uid"]
        if k == "chapter":
            ctx.add_toc(1, uid, f"{b['label']}: {b['title']}")
            out.append(f'<header class="chapter-head" id="{uid}"><p class="eyebrow">{b["label"]}</p><h1>{inline(b["title"])}</h1></header>')
        elif k == "heading":
            lv = b["level"]
            if lv == 1:
                ctx.add_toc(1, uid, b["text"])
                out.append(f'<header class="chapter-head" id="{uid}"><h1>{inline(b["text"])}</h1></header>')
                continue
            if lv <= 3:
                ctx.add_toc(lv, uid, b["text"])
            out.append(f'<h{lv} id="{uid}">{inline(b["text"])}<a class="anchor" href="#{uid}" aria-label="Liên kết">#</a></h{lv}>')
        elif k == "paragraph":
            out.append(f'<div class="para" id="{uid}">{paras(b["text"], ctx.figs)}</div>')
        elif k == "sql_code":
            out.append(code_block(b["text"], "sql", "SQL"))
        elif k == "code":
            out.append(code_block(b["text"], "", ""))
        elif k == "execution_plan":
            out.append(code_block(b["text"], "plan", "Execution plan"))
        elif k == "terminal":
            out.append(code_block(b["text"], "terminal", "Terminal"))
        elif k == "figure":
            part = b["unit"]["_part"]
            src_file = ROOT / f"vi/assets/part_{part:02d}_{uid}.png"
            if not b["caption"]:  # unit image chỉ có "[Image preserved verbatim: Figure 2.1. Title]"
                mm = re.search(r"(?:Figure|Hình) (\d+\.\d+\.[^\]]*)", b["unit"].get("translated_text", ""))
                b["caption"] = f"Hình {mm.group(1).strip()}" if mm else ""
            m = RE_FIG.search(b["caption"])
            fid = f"fig-{m.group(1)}-{m.group(2)}" if m else uid
            if not src_file.exists():
                stats["fig_missing"].append(uid)
                continue
            shutil.copyfile(src_file, HTML / "assets/img" / f"{uid}.png")
            fg = figure(fid, b["caption"], f"assets/img/{uid}.png") if b["caption"] else (
                f'<figure class="fig" id="{uid}"><div class="img-wrap"><img src="assets/img/{uid}.png" alt="" loading="lazy"></div></figure>')
            out.append(fg.replace('class="fig"', 'class="fig shot"') if b.get("shot") else fg)
        elif k == "term":
            terms_run = out[-1].startswith("<dl ") and out[-1].endswith("</dl>") and 'class="defs"' in out[-1][:20]
            item = f'<dt><code class="kw">{html.escape(b["term"])}</code></dt><dd>{paras(b["text"], ctx.figs)}</dd>'
            if terms_run:
                out[-1] = out[-1][:-5] + item + "</dl>"
            else:
                out.append(f'<dl class="defs">{item}</dl>')
        elif k == "list":
            ordered = re.match(r"\d+\. ", b["items"][0]) is not None
            lis = "".join(f"<li>{inline(re.sub(r'^(?:\d+\.|») ?', '', it))}</li>" for it in b["items"])
            out.append(f"<{'ol' if ordered else 'ul'} class=\"plain\">{lis}</{'ol' if ordered else 'ul'}>")
        elif k == "caption":
            out.append(f'<p class="figcap">{inline(b["text"])}</p>')
        elif k == "footnote":
            t = " ".join(l for l in b["text"].split("\n") if l.strip())
            out.append(f'<div class="footnotes"><p>{inline(t)}</p></div>')
        elif k == "quote":
            out.append(f'<blockquote>{paras(b["text"])}</blockquote>')
        elif k in ICONS:
            lines = [l for l in b["text"].split("\n") if l.strip()]
            if k != "sidebar" and (len(lines[0]) > 30 or lines[0].endswith((".", ":"))):  # thiếu dòng nhãn
                lines.insert(0, DEFAULT_LABEL[k])
            out.append(callout(k, lines[0], paras("\n".join(lines[1:]), ctx.figs)))
        else:
            raise SystemExit(f"{uid}: chưa hỗ trợ kind={k!r}")
    print(f"  [{cfg.__name__}] blocks={len(blocks)} code_ok={len(stats['code_ok'])} code_miss={stats['code_miss']} "
          f"rect_ok={len(stats['rect_ok'])} rect_miss={stats['rect_miss']} merged={stats['merged']} fig_missing={stats['fig_missing']}")
    return ctx, out, units


def finish_chapter(name, cfg, ctx, out, units):
    sidebar = "".join(
        f'<li class="l{lv}"><a href="#{uid}">{html.escape(title)}</a></li>' for lv, uid, title in ctx.toc)
    k = ORDER.index(name)

    def link(j, cls, arrow):
        if 0 <= j < len(ORDER) and (HTML / f"{ORDER[j]}.html").exists():
            t = importlib.import_module(f"chapters.{ORDER[j]}").TITLE
            return f'<a class="{cls}" href="{ORDER[j]}.html"><small>{arrow}</small>{html.escape(t)}</a>'
        return '<span class="disabled"></span>'
    page = PAGE.format(
        title=f"{cfg.TITLE} — SQL Performance Explained (VI)",
        crumb=html.escape(cfg.TITLE), sidebar=sidebar, body="\n".join(out),
        prev=link(k - 1, "prev", "← Trước"), next=link(k + 1, "next", "Sau →"))
    (HTML / f"{name}.html").write_text(page, "utf-8")
    print(f"{name}.html  units={len(units)}  toc={len(ctx.toc)}")


def build_index():
    cards = []
    for k, name in enumerate(ORDER):
        try:
            cfg = importlib.import_module(f"chapters.{name}")
        except ModuleNotFoundError:
            cfg = None
        ready = cfg is not None and (HTML / f"{name}.html").exists()
        label = {"front": "Mở đầu", "app_a": "Phụ lục A", "back": "Cuối sách"}.get(name) or f"Chương {int(name[5:])}"
        title = re.sub(r"^Chương \d+ — ", "", cfg.TITLE) if cfg else "Chưa dựng"
        sub = cfg.SUMMARY if cfg else "Đang chờ bản dịch / dựng HTML"
        tag, cls, href = ("a", "chap-card", f' href="{name}.html"') if ready else ("div", "chap-card todo", "")
        cards.append(f'<li><{tag} class="{cls}"{href}><div class="n">{label}</div>'
                     f'<div class="t">{html.escape(title)}</div><div class="s">{html.escape(sub)}</div></{tag}></li>')
    (HTML / "index.html").write_text(INDEX.format(cards="\n".join(cards)), "utf-8")
    print("index.html")


HEAD = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<script>
(function(){{try{{var t=localStorage.getItem("spe-theme");if(t&&t!=="auto")document.documentElement.setAttribute("data-theme",t);
var s=parseFloat(localStorage.getItem("spe-scale"));if(s)document.documentElement.style.setProperty("--font-scale",s);}}catch(e){{}}}})();
</script>
<link rel="stylesheet" href="assets/css/book.css">
<script src="assets/js/book.js" defer></script>
</head>
"""

TOPBAR = """<div class="progress"></div>
<header class="topbar">
  <button id="toc-toggle" type="button" aria-label="Mục lục chương">☰</button>
  <a class="brand" href="index.html">SQL Performance Explained</a>
  <span class="crumb">/ {crumb}</span>
  <span class="spacer"></span>
  <span class="group"><button id="font-minus" type="button" aria-label="Giảm cỡ chữ">A−</button><button id="font-plus" type="button" aria-label="Tăng cỡ chữ">A+</button></span>
  <button id="theme-btn" type="button" aria-label="Đổi giao diện">◐</button>
</header>
"""

PAGE = (HEAD + "<body>\n" + TOPBAR + """<div class="layout">
<nav class="sidebar-toc" aria-label="Mục lục chương"><h2>Trong chương này</h2><ol>{sidebar}</ol></nav>
<main class="book"><div class="prose">
{body}
</div>
<nav class="pager">{prev}{next}</nav>
</main>
</div>
</body>
</html>
""")

INDEX = (HEAD.replace("{title}", "SQL Performance Explained — Bản tiếng Việt") + "<body>\n"
         + TOPBAR.replace("{crumb}", "Mục lục").replace('<button id="toc-toggle" type="button" aria-label="Mục lục chương">☰</button>\n  ', "")
         + """<main class="home">
<h1>SQL Performance Explained</h1>
<p class="sub">Markus Winand · Bản dịch tiếng Việt, dựng lại dạng HTML để đọc trên web.</p>
<ul class="chap-grid">
{cards}
</ul>
</main>
</body>
</html>
""")

if __name__ == "__main__":
    names = sys.argv[1:] or [n for n in ORDER if (Path(__file__).parent / "chapters" / f"{n}.py").exists()]
    for n in names:
        build_chapter(n)
    build_index()
    for k, v in terms.STATS.most_common():
        print(f"  term {v:4d}  {k}")
