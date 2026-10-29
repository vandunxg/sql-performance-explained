"""Làm sạch unit của nhiều part thành các block cho một chương, và khôi phục code/plan từ bản EN."""
import json
import re
import subprocess
from bisect import bisect_left
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
_layout_cache, _tr_cache = {}, {}

# --- heading ---
H3 = {"Primary Key", "Concatenated Index", "Index Chậm, Phần II", "Tìm Kiếm Không Phân Biệt Hoa Thường Bằng UPPER hoặc LOWER",
      "User-Defined Function", "Greater, Less and BETWEEN", "Indexing LIKE Filters", "Index Merge", "Indexing NULL",
      "NOT NULL Constraints", "Emulating Partial Indexes", "Date Types", "Numeric Strings", "Combining Columns",
      "Smart Logic", "Math", "Enabling SQL Logging", "Over-Indexing"}
H4 = {"Primary Key Không Có Unique Index", "Full Table Scan", "Security", "Performance", "C#", "Java", "Perl", "PHP", "Ruby",
      "Cursor Sharing and Auto Parameterization", "MySQL", "Oracle Database", "PostgreSQL", "SQL Server",
      "Partial Indexes, Part II", "LIKE on Date Types", "Eventual Consistency and the CAP Theorem",
      "Solid State Disks (SSD) and Caching", "Column Stores", "The Index Clustering Factor"}
DROP_IDS = {"p07-u001", "p08-u001", "p08-u017", "p10-u001", "p10-u122"}
SKIP_IDS = {"p09-u059", "p10-u161"}  # mục lục phụ lục (sinh lại) và mã vạch bìa sau  # heading dịch lặp lại ở đầu trang
RUNNING = re.compile(r"^Chapter \d+: ")


def tr_part(p):
    if p not in _tr_cache:
        _tr_cache[p] = json.loads((ROOT / f"vi/translations/part_{p:02d}/translation.json").read_text("utf-8"))["translation"]
    return _tr_cache[p]


def _syn(uid, part, items):
    return [{"unit_id": f"{uid}-{k}", "unit_type": t, "translated_text": x, "_part": part} for k, (t, x) in enumerate(items)]


# p02-u092 trong bản dịch gộp nhiều khối (callout, heading, code) vào một paragraph -> tách lại thủ công
FIX = {"p02-u092": [
    ("paragraph", "Ngoài việc phải deterministic, PostgreSQL và Oracle database yêu cầu function được khai báo deterministic khi dùng trong index, nên bạn phải dùng keyword DETERMINISTIC (Oracle) hoặc IMMUTABLE (PostgreSQL)."),
    ("caution", "Cẩn trọng\nPostgreSQL và Oracle database tin vào khai báo DETERMINISTIC hoặc IMMUTABLE, nghĩa là chúng tin developer. Bạn có thể khai báo function GET_AGE là deterministic và dùng nó trong định nghĩa index. Bất kể khai báo đó, nó sẽ không hoạt động như dự định vì tuổi lưu trong index sẽ không tăng theo năm tháng; nhân viên sẽ không già đi, ít nhất là trong index."),
    ("paragraph", "Các ví dụ khác về function không thể được “index” là random number generator và function phụ thuộc environment variable."),
    ("think_about_it", "Hãy suy nghĩ\nLàm sao vẫn có thể dùng index để tối ưu query cho tất cả nhân viên 42 tuổi?"),
    ("heading", "Over-Indexing"),
    ("paragraph", "Nếu khái niệm function-based indexing còn mới, bạn có thể bị cám dỗ index mọi thứ, nhưng thực tế đây là điều cuối cùng bạn nên làm. Lý do là mọi index đều tạo ra maintenance liên tục. Function-based index đặc biệt rắc rối vì chúng khiến việc tạo index dư thừa rất dễ dàng."),
    ("paragraph", "Tìm kiếm không phân biệt hoa thường ở trên cũng có thể triển khai bằng function LOWER:"),
    ("sql_code", "SELECT first_name, last_name, phone_number\nFROM employees\nWHERE LOWER(last_name) = LOWER('winand');"),
    ("paragraph", "Một index không thể hỗ trợ cả hai cách bỏ qua chữ hoa thường. Dĩ nhiên, chúng ta có thể tạo index thứ hai trên LOWER(last_name) cho query này, nhưng điều đó nghĩa là database phải duy trì hai index cho mỗi statement insert, update và delete (xem thêm Chương 8, “Modifying Data”). Để một index là đủ, bạn nên dùng nhất quán cùng một function trong toàn application."),
    ("tip", "Mẹo\nHợp nhất access path để một index có thể được dùng bởi nhiều query."),
    ("tip", "Mẹo\nLuôn hướng đến việc index dữ liệu gốc vì đó thường là thông tin hữu ích nhất có thể đưa vào index."),
]}
LABELS = {"Lưu ý": "note", "Cảnh báo": "warning", "Mẹo": "tip", "Cẩn trọng": "caution", "Quan trọng": "important",
          "Hãy suy nghĩ": "think_about_it"}


def collect(ranges):
    out = []
    for part, first, last in ranges:
        ids = [u["unit_id"] for u in tr_part(part)]
        for u in tr_part(part)[ids.index(first):ids.index(last) + 1]:
            if u["unit_id"] in FIX:
                out += _syn(u["unit_id"], part, FIX[u["unit_id"]])
                continue
            lines = u.get("translated_text", "").split("\n")
            if u["unit_type"] == "paragraph" and any(l.strip() in LABELS for l in lines):
                k = next(i for i, l in enumerate(lines) if l.strip() in LABELS)  # paragraph + callout gộp
                out += _syn(u["unit_id"], part, [("paragraph", "\n".join(lines[:k]).strip()),
                                                 (LABELS[lines[k].strip()], "\n".join(lines[k:]).strip())])
                continue
            out.append(dict(u, _part=part))
    return out


# --- khôi phục code từ source_layout ---
FOOTER = re.compile(r"Ex Libris GHEORGHE|^\s*Chapter \d+: ")


def layout(part):
    if part not in _layout_cache:
        raw = (ROOT / f"vi/source/part_{part:02d}/source_layout.txt").read_text("utf-8").splitlines()
        lines = [l for l in raw if not FOOTER.search(l)]
        stream, idx = [], []
        for i, l in enumerate(lines):
            for ch in l:
                if not ch.isspace():
                    stream.append(ch)
                    idx.append(i)
        _layout_cache[part] = (lines, "".join(stream), idx, {"pos": 0})
    return _layout_cache[part]


def _find(stream, needle, start):
    p = stream.find(needle, start)
    return p if p >= 0 else stream.find(needle)


def recover(part, text, loose=False):
    """Trả về (text có định dạng gốc, ok). loose=True: execution plan bị xáo ô -> khớp theo đầu/cuối, bỏ dấu '-'."""
    lines, stream, idx, st = layout(part)
    norm = re.sub(r"\s+", "", text)
    if not norm:
        return text, False
    pos = stream.find(norm, st["pos"])
    if pos < 0:
        pos = stream.find(norm)
    if pos >= 0:
        s0, e0 = pos, pos + len(norm) - 1
    elif loose:
        dl = norm.replace("-", "")
        # đầu: chuỗi sau header; cuối: đoạn cuối của unit
        head, tail = dl[:40], dl[-24:]
        sd = re.sub(r"-", "", stream[st["pos"]:])  # không dùng offset gốc -> tìm trên stream gốc bằng regex linh hoạt
        hp = re.compile(".{0,3}".join(re.escape(c) for c in "")) if False else None
        # tìm theo vị trí trong stream gốc: ánh xạ bỏ dấu '-'
        keep = [i for i, c in enumerate(stream) if c != "-"]
        flat = "".join(stream[i] for i in keep)
        base = bisect_left(keep, st["pos"])
        h = flat.find(head, base)
        if h < 0:
            return text, False
        t = flat.find(tail, h)
        if t < 0 or t - h > len(dl) * 1.8 + 200:
            return text, False
        s0, e0 = keep[h], keep[t + len(tail) - 1]
        # kéo lùi/tiến để lấy cả dòng gạch '---'
        while s0 > 0 and stream[s0 - 1] == "-" and idx[s0 - 1] == idx[s0]:
            s0 -= 1
    else:
        return text, False
    st["pos"] = e0 + 1
    a, b = idx[s0], idx[e0]
    block = lines[a:b + 1]
    if loose:  # lấy thêm dòng gạch ngang ngay sau/trước nếu có
        while a > 0 and re.fullmatch(r"\s*-{5,}\s*", lines[a - 1]):
            a -= 1
        while b + 1 < len(lines) and re.fullmatch(r"\s*-{5,}\s*", lines[b + 1]):
            b += 1
        block = lines[a:b + 1]
    ind = min((len(l) - len(l.lstrip()) for l in block if l.strip()), default=0)
    return "\n".join(l[ind:].rstrip() for l in block), True


_print_cache = {}


def rect_text(part, uid):
    """Text trong vùng cắt (page, rect) của unit từ PDF gốc; dùng khi translation.json không giữ text của khối code."""
    if part not in _print_cache:
        _print_cache[part] = (ROOT / f"vi/translations/part_{part:02d}/part_{part:02d}.print.html").read_text("utf-8")
    m = re.search(rf'data-unit-id="{uid}" data-source-page="(\d+)" data-source-rect="([\d.]+),([\d.]+),([\d.]+),([\d.]+)"', _print_cache[part])
    if not m:
        return ""
    pg, x, y, w, h = m.groups()
    out = subprocess.run(["pdftotext", "-f", pg, "-l", pg, "-x", x, "-y", y, "-W", w, "-H", h, "-layout",
                          str(ROOT / f"en_parts/part_{part:02d}.pdf"), "-"], capture_output=True, text=True).stdout
    lines = [l.rstrip() for l in out.splitlines()]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    ind = min((len(l) - len(l.lstrip()) for l in lines if l.strip()), default=0)
    return "\n".join(l[ind:] for l in lines)


# --- làm sạch ---
def norm_h(t):
    return re.sub(r"\s+", " ", t.replace(" và ", " and ").replace(" hoặc ", " or ")).strip()


def clean(units, stats, levels=None):
    """Trả về list block: dict(kind=..., unit=..., ...)."""
    levels = levels or {}
    blocks, last_section = [], None
    i = 0
    while i < len(units):
        u = units[i]
        t, uid, text = u["unit_type"], u["unit_id"], u.get("translated_text", "")
        i += 1
        if uid in SKIP_IDS or t == "special_page":
            continue
        if t in ("sql_code", "code", "execution_plan", "terminal", "table") and not text.strip():
            rt = rect_text(u["_part"], uid)
            if rt:
                kind = "sql_code" if t == "sql_code" else "execution_plan" if t in ("execution_plan", "table") else t
                stats["rect_ok"].append(uid)
                blocks.append({"kind": kind, "uid": uid, "text": rt, "unit": u})
                continue
            stats["rect_miss"].append(uid)
        if t in ("table", "image", "figure", "diagram") and not text.strip().strip("[]"):
            blocks.append({"kind": "figure", "uid": uid, "caption": "", "unit": u, "shot": t == "image"})
            continue
        if not text.strip() and t not in ("figure", "image", "diagram"):
            continue
        if t == "heading":
            first = text.split("\n")[0].strip()
            if RUNNING.match(first) or uid in DROP_IDS:
                continue
            if re.fullmatch(r"(Chapter \d+|Appendix [A-Z])", first) and i < len(units) and units[i]["unit_type"] == "heading":
                nxt = units[i]
                i += 1
                lab = "Chương" if first.startswith("Chapter") else "Phụ lục"
                blocks.append({"kind": "chapter", "uid": uid, "label": f"{lab} {first.split()[1]}", "title": nxt["translated_text"].strip(), "unit": u})
                last_section = None
                continue
            mm = re.fullmatch(r"Chương (\d+)\n(.+)", text.strip())
            if mm:
                blocks.append({"kind": "chapter", "uid": uid, "label": f"Chương {mm.group(1)}", "title": mm.group(2).strip(), "unit": u})
                last_section = None
                continue
            h = norm_h(text)
            if h == last_section:
                continue
            lv = levels.get(h) or (4 if h in H4 else 3 if h in H3 else 2)
            blocks.append({"kind": "heading", "level": lv, "uid": uid, "text": re.sub(r"\s+", " ", text).strip(), "unit": u})
            if lv <= 3:
                last_section = h
            continue
        if t == "subheading" and "\n" in text.strip():
            head, body = text.strip().split("\n", 1)
            blocks.append({"kind": "term", "uid": uid, "term": head.strip(), "text": body.strip(), "unit": u})
            continue
        if t == "list_item":
            if blocks and blocks[-1]["kind"] == "list":
                blocks[-1]["items"].append(text.strip())
            else:
                blocks.append({"kind": "list", "uid": uid, "items": [text.strip()], "unit": u})
            continue
        if t == "subheading":
            blocks.append({"kind": "heading", "level": 4, "uid": uid, "text": text.strip(), "unit": u})
            continue
        if t == "caption":
            nxt = units[i] if i < len(units) else None
            if nxt and nxt["unit_type"] in ("figure", "image", "diagram"):
                i += 1
                blocks.append({"kind": "figure", "uid": nxt["unit_id"], "caption": text.strip(), "unit": nxt})
            else:
                blocks.append({"kind": "caption", "uid": uid, "text": text.strip(), "unit": u})
            continue
        if t in ("figure", "image", "diagram"):
            blocks.append({"kind": "figure", "uid": uid, "caption": "", "unit": u})
            continue
        if t in ("sql_code", "code", "execution_plan", "terminal"):
            rec, ok = recover(u["_part"], text, loose=(t == "execution_plan"))
            stats["code_ok" if ok else "code_miss"].append(uid)
            blocks.append({"kind": t, "uid": uid, "text": rec, "unit": u})
            continue
        if t == "paragraph":
            prev = blocks[-1] if blocks else None
            if (prev and prev["kind"] == "paragraph" and re.match(r"[a-zà-ỹ]", text.strip()[:1])
                    and not re.search(r"[.!?:;”\")]$", prev["text"].strip())):
                prev["text"] = prev["text"].rstrip() + " " + text.strip()
                stats["merged"].append(uid)
                continue
            blocks.append({"kind": "paragraph", "uid": uid, "text": text, "unit": u})
            continue
        blocks.append({"kind": t, "uid": uid, "text": text, "unit": u})
    return blocks
