"""Chuẩn hóa thuật ngữ theo RUE.md §3.6: chỉ đổi danh từ/cụm thuật ngữ Nhóm A/B không phụ thuộc ngữ cảnh.

Không đổi động từ Nhóm C (chèn, cập nhật, tham chiếu, duyệt, truy cập, khớp, tải, thực thi...)
hay từ thông thường (giá trị, cơ chế, phân phối): thay thế context-blind làm câu rời rạc và biến
động từ thường thành SQL keyword (RE_KW trong build.py), ví dụ "update link", "update danh bạ".

Áp dụng ở bước dựng HTML (lên prose, không đụng code); không sửa vi/translations.
Mỗi rule: (tên, regex, thay thế). Giữ chữ hoa đầu câu nếu bản gốc viết hoa.
"""
import re
from collections import Counter

STATS = Counter()
_KW = r"(SQL|insert|delete|update|select|create index|DDL|DML)"

RULES = [
    # không áp dụng cho danh sách "câu lệnh insert, delete và update" (sẽ thành "statement insert, delete và update")
    ("câu lệnh KW → KW statement", rf"câu lệnh {_KW}\b(?!(?:,| và| hoặc) (?:{_KW[1:-1]})\b)", r"\1 statement"),
    ("câu lệnh → statement", r"câu lệnh", "statement"),
    ("khả năng mở rộng theo logarit → logarithmic scalability", r"khả năng mở rộng theo logarit", "logarithmic scalability"),
    ("khả năng mở rộng → scalability", r"khả năng (?:được )?mở rộng", "scalability"),
    ("mở rộng system → scale system", r"mở rộng (?=system)", "scale "),
    ("mở rộng index/PK/concept → extend", r"mở rộng (?=(?:primary key|một index|index|concept))", "extend "),
    ("thuật toán → algorithm", r"thuật toán", "algorithm"),
    ("phần tử → element", r"phần tử", "element"),
    ("biểu thức → expression", r"biểu thức", "expression"),
    ("danh sách → list", r"danh sách(?! liên kết)", "list"),
    ("hàm → function", r"(?<!bao )\bhàm\b", "function"),
    ("tiêu chí sắp xếp → sort criterion", r"tiêu chí sắp xếp", "sort criterion"),
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
