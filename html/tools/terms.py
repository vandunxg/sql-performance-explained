"""Chuẩn hóa thuật ngữ theo RUE.md §3: giữ English cho technical term, giữ tiếng Việt cho ngữ pháp/logic.

Áp dụng ở bước dựng HTML (lên prose, không đụng code); không sửa vi/translations.
Mỗi rule: (tên, regex, thay thế). Giữ chữ hoa đầu câu nếu bản gốc viết hoa.
"""
import re
from collections import Counter

STATS = Counter()
_KW = r"(SQL|insert|delete|update|select|create index|DDL|DML)"

RULES = [
    ("câu lệnh KW → KW statement", rf"câu lệnh {_KW}\b", r"\1 statement"),
    ("câu lệnh → statement", r"câu lệnh", "statement"),
    ("thực thi → execute", r"thực thi", "execute"),
    ("khả năng mở rộng theo logarit → logarithmic scalability", r"khả năng mở rộng theo logarit", "logarithmic scalability"),
    ("khả năng mở rộng → scalability", r"khả năng (?:được )?mở rộng", "scalability"),
    ("mở rộng system → scale system", r"mở rộng (?=system)", "scale "),
    ("mở rộng index/PK/concept → extend", r"mở rộng (?=(?:primary key|một index|index|concept))", "extend "),
    ("tham chiếu → reference", r"tham chiếu", "reference"),
    ("chèn → insert", r"\bchèn\b", "insert"),
    ("cập nhật → update", r"cập nhật", "update"),
    ("khớp → match", r"\bkhớp\b", "match"),
    ("tải → load", r"\btải\b", "load"),
    ("thuật toán → algorithm", r"thuật toán", "algorithm"),
    ("phần tử → element", r"phần tử", "element"),
    ("biểu thức → expression", r"biểu thức", "expression"),
    ("danh sách → list", r"danh sách(?! liên kết)", "list"),
    ("duyệt → traverse", r"\bduyệt\b", "traverse"),
    ("được phân phối → được distribute", r"được phân phối", "được distribute"),
    ("phân phối → distribution", r"phân phối", "distribution"),
    ("hàm → function", r"(?<!bao )\bhàm\b", "function"),
    ("cơ chế → mechanism", r"cơ chế", "mechanism"),
    ("truy cập → access", r"truy cập(?! http)", "access"),
    ("tiêu chí sắp xếp → sort criterion", r"tiêu chí sắp xếp", "sort criterion"),
    ("giá trị → value", r"giá trị", "value"),
]
_COMPILED = [(n, re.compile(p, re.I), r) for n, p, r in RULES]


def normalize(text):
    for name, rx, rep in _COMPILED:
        def sub(m, rep=rep, name=name):
            STATS[name] += 1
            out = m.expand(rep)
            return out[0].upper() + out[1:] if m.group(0)[0].isupper() else out
        text = rx.sub(sub, text)
    return text
