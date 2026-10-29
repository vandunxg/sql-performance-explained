# RULE 02 — Translation QA: SQL Performance Explained (EN → VI)

**Version:** 1.0  
**Scope:** Chỉ áp dụng cho `REVIEW`, `REVISE`, `BOUNDARY_CHECK`, `FINALIZE` đối với các part của bản dịch *SQL Performance Explained*.  
**Reviewer role:** Technical Translation Reviewer có kiến thức SQL/database performance và khả năng biên tập tiếng Việt dành cho Backend Developer.  
**Goal:** Phát hiện và sửa semantic drift, technical errors, mất ý, văn phong dịch máy và **đứt mạch lập luận giữa các part** trước khi cho phép đưa bản dịch vào PDF.

> **Nguyên tắc cao nhất:** Không chấm PASS chỉ vì bản Việt đọc mượt. Review phải đối chiếu **toàn bộ source**, không chỉ review bản tiếng Việt độc lập.

## 1. Quy tắc review độc lập

- Đọc `RULE 01 — Translation` để biết tiêu chuẩn nhưng không mặc định bản dịch đã tuân thủ.
- Ưu tiên reviewer ở session/context độc lập với lượt dịch đầu, hoặc model khác khi khả thi. Nếu chỉ dùng một model, thực hiện lượt review riêng với source + translated draft, không phụ thuộc vào kết luận tự đánh giá của translator.
- Đánh giá đúng/sai dựa vào **English source, neighboring context, glossary đã duyệt**. Không sửa chỉ vì sở thích văn phong.
- Review phải có **evidence gắn với `unit_id`**. Không bịa source quote, câu lân cận hoặc số trang.
- Không thêm kiến thức khác vào nội dung sách. Nếu nghi ngờ tác giả trình bày chưa chính xác, tạo `source_issue` riêng, không âm thầm sửa.
- Không tự ý chuyển giải thích của sách thành kiến thức PostgreSQL-specific nếu source không nói PostgreSQL.
- Không sử dụng chỉ BLEU, embedding similarity, back-translation hoặc một điểm số tổng quát để quyết định PASS.

## 2. Input phải có trước khi review

1. `part_id`, `chapter_id`, `section_path`, danh sách và thứ tự `source_unit_ids`.
2. Toàn bộ English source của Part N (và trang/asset gốc khi extraction không rõ).
3. Toàn bộ Vietnamese draft của Part N, map bằng `unit_id`.
4. `previous_tail`: 2–3 source units cuối + translation đã được review của Part N-1.
5. `previous_handoff`: kết luận đang hình thành, referents, terms, unresolved issues.
6. `next_head_source`: 2–3 source units đầu của Part N+1 (nếu không phải part cuối).
7. `shared_glossary` mới nhất và `translation_rule_version`.
8. Code blocks, table cells, caption IDs, image refs nếu liên quan.
9. Nếu Part N+1 đã có bản dịch mở đầu, lấy thêm `next_head_translation` để thực hiện **Boundary QA hoàn chỉnh**.

Nếu thiếu source hoặc translated draft, trả `BLOCKED_INPUT`. Nếu thiếu neighboring context ở một part không phải đầu/cuối, trả `BLOCKED_CONTEXT` và yêu cầu thu thập lại; không giả vờ đã kiểm tra continuity.

## 3. Hai cổng QA bắt buộc

### Gate A — Local QA (ngay sau khi dịch Part N)

Kiểm tra **100% semantic units** trong Part N, không chỉ lấy mẫu.

A1. **Completeness**
- Đối chiếu toàn bộ `unit_id`, thứ tự, headings, prose, list, tables, captions, footnotes, references.
- Không có source unit thiếu hoặc output unit dư do lặp context.
- Không bỏ mệnh đề, điều kiện, số liệu, ví dụ, exception hoặc caveat.
- Không tự thêm nhận định, ví dụ, conclusion hoặc giải thích không có ở source.

A2. **Technical correctness**
- Mô tả đúng SQL/database behavior, index usage, cost model, planner/optimizer, cardinality, selectivity, predicate, join, execution plan và performance trade-off.
- Không nhầm estimated cost với runtime, row với tuple, index scan với index-only scan, hoặc hành vi của các DB engine.
- Giữ đúng negation, modality (`may/might/can/usually/only/not necessarily`) và causal chain.
- Phân biệt fact được source khẳng định với giả định, ví dụ và ngoại lệ.

A3. **Code / structured content integrity**
- SQL/code/identifiers/literals giữ nguyên; có thể so sánh exact text sau khi chuẩn hóa line endings theo policy.
- Kiểm tra tables: row/cell mappings, số liệu, units, dấu +/- và caption references.
- Kiểm tra figure/caption pairing, links, equation notation, numbered references.
- Nếu bản text extraction có vấn đề, so lại render của trang PDF gốc trước khi đánh giá bản dịch; không “sửa theo suy đoán”.

A4. **Translation style**
- Văn phong tự nhiên cho Backend Developer, câu nối logic rõ, không dịch word-by-word.
- Không dịch technical terms sang tiếng Việt khó nhận ra concept; cũng không nhồi English vô cớ.
- Thuật ngữ nhất quán trong part và với glossary.
- Không làm câu tiếng Việt cứng, tối nghĩa, “mùi AI” hoặc thiếu chủ thể khiến lập luận sai.

A5. **Local continuity**
- Đọc **liền** đoạn cuối của Part N-1 (bản Việt) với 2–3 unit đầu Part N (bản Việt).
- Đối chiếu source để kiểm tra đúng phép nối: continuation, contrast, cause/effect, clarification, example, topic shift.
- Xác minh referents (`this`, `that`, `these`, `it`, `such`, `former/latter`), nhất là subject bị lược trong tiếng Việt.
- Đọc 2–3 unit cuối Part N với source mở đầu N+1 để phát hiện kết luận giả hoặc thuật ngữ có thể gây hiểu nhầm.
- Không chấp nhận việc dịch part mới “đúng từng câu” nhưng đọc nối lại thành sai mạch argument.

**Kết quả Gate A:** `LOCAL_QA_PASSED` nếu toàn bộ Critical/Major đã được xử lý, không còn missing/duplicate units và checks bắt buộc đều đạt. Đây **chưa phải** `FINALIZED` khi vẫn còn part tiếp theo.

### Gate B — Cross-part Boundary QA (khi có bản Việt mở đầu Part N+1)

Để tránh câu từ ở đầu part sau bị “lạc quẻ”, thực hiện Gate B theo cách hai chiều:

1. Lấy ít nhất 2–3 semantic units cuối **Part N (đã Local QA)**.
2. Lấy ít nhất 2–3 semantic units đầu **Part N+1 (bản dịch draft)**.
3. Đọc liên tiếp thành **một đoạn văn liền mạch**, trước tiên **không nhìn nhãn part**.
4. Đối chiếu cả hai dải English source tương ứng.
5. Kiểm tra liên tục của subject, pronoun antecedent, terminology, polarity, thời/điều kiện, logic `however/therefore/for example`, narrative focus.
6. Không thêm câu chuyển tự chế; chỉ sửa câu trong phạm vi semantic được source cho phép.
7. Nếu mạch bị đứt, chỉnh **tối thiểu các unit gây lỗi**, có thể sửa cả cuối Part N và đầu Part N+1; sau sửa phải re-run Local QA cho mọi unit bị thay đổi.
8. Ghi kết quả Boundary QA cho cả `Part N` và `Part N+1`; cập nhật handoff/glossary nếu có thay đổi.

**Điều kiện hoàn tất:** Part N chỉ được `FINALIZED` sau khi `LOCAL_QA_PASSED` **và** Boundary QA với Part N+1 đạt. Với part cuối sách, được `FINALIZED` sau Local QA và Boundary QA với part trước đã đạt; không cần “next part”.

**Quan trọng:** Không đợi đến khi toàn bộ Part N+1 dịch xong mới kiểm tra Boundary QA. Ngay khi 2–3 opening units của N+1 có draft, thực hiện review để lỗi không lan sang cả part.

## 4. Quy trình review và sửa lỗi

1. **Validate inputs:** Có đủ `unit_id`, neighboring context, source và draft.
2. **Mechanical verification:** Tự động kiểm tra unit coverage, code blocks, identifiers, numbers và structured references. Automated checks chỉ là hỗ trợ, không thay thế semantic review.
3. **Source-to-target audit:** Đọc source rồi target từng unit, đánh dấu các điểm sai/thiếu/thừa/hiểu sai.
4. **Technical reasoning audit:** Kiểm tra từng causal chain, conditional, quantitative statement, benchmark claim và SQL-specific semantic.
5. **Native-language edit audit:** Đọc bản tiếng Việt **không nhìn bản Anh** để bắt câu khó hiểu, sau đó đối chiếu source trước khi đề xuất thay.
6. **Boundary audit:** Kiểm tra cả `previous → current` và `current → next_source`; khi có `next_head_translation`, kiểm tra `current → next_translation`.
7. **Revision:** Sửa theo finding có evidence; giữ `unit_id` và chỉ thay đoạn bị ảnh hưởng; không rewrite vô cớ toàn part.
8. **Re-review:** Re-run checks liên quan, so diff source/target, kiểm tra các đoạn lân cận để tránh regression.
9. **Status & handoff:** Xuất report, glossary proposals, unresolved issues và cập nhật context handoff.

## 5. Severity và cách quyết định

| Severity | Ví dụ | Xử lý |
|---|---|---|
| **CRITICAL** | Đổi phủ định/điều kiện làm sai SQL behavior; thay code/SQL literal; thiếu đoạn technical quan trọng | Chặn PASS, sửa ngay |
| **MAJOR** | Bỏ caveat, đổi causal chain, nhầm concept; lệch mạch 2 part gây hiểu sai; thiếu unit | Chặn PASS, sửa ngay |
| **MINOR** | Thuật ngữ chưa nhất quán nhưng chưa làm sai nghĩa; câu cứng; lựa chọn từ chưa tự nhiên | Sửa trước Local QA PASS nếu đã xác định, hoặc ghi rõ exception có lý do |
| **SUGGESTION** | Có lựa chọn câu mượt hơn nhưng bản hiện tại đã đúng và dễ hiểu | Tùy chọn; không rewrite vì sở thích |

Không chấm `PASS` nếu còn bất kỳ `CRITICAL` hoặc `MAJOR` chưa giải quyết, hoặc chưa có đủ source/context để kiểm tra.

Nếu ambiguous source không thể xác minh bằng neighboring context/PDF gốc, gắn `NEEDS_HUMAN_REVIEW`; không tự suy diễn rồi chấm PASS.

## 6. Checklist chuyên sâu dành cho SQL Performance Explained

Khi gặp phát biểu về query performance, hỏi:

- Source đang nói về **khả năng**, xu hướng phổ biến hay một kết luận tuyệt đối?
- Optimizer đang **ước lượng** hay database đang **thực thi**?
- `cost` trong câu là optimizer estimate hay elapsed time?
- `scan` đang scan index hay table/heap?
- Có điều kiện về selectivity/cardinality, data distribution, I/O hoặc cache bị mất không?
- Có ví dụ để minh họa chứ không phải general rule bị dịch thành “luôn luôn” không?
- Có đổi phạm vi từ một DB engine sang tất cả DB engine không?
- Có dịch nhầm “có thể đọc từ index” thành “chắc chắn không đọc table” không?
- Có bỏ hạn định về điều kiện sử dụng index, statistics hoặc optimizer choice không?
- Các tên operation, SQL syntax và numeric values còn nguyên không?

Đây là **câu hỏi QA**, không phải lý do được phép thay đổi source bằng kiến thức bên ngoài.

## 7. Boundary QA: tình huống mẫu

**Kết Part N (English):** `The index makes the lookup fast, but reading many table rows can still be expensive.`  
**Kết Part N (VI đã duyệt):** `Index giúp bước lookup nhanh hơn, nhưng nếu vẫn phải đọc nhiều row từ table thì tổng cost có thể vẫn cao.`

**Đầu Part N+1 (English):** `However, this approach is still useful when the number of matching rows is small.`

Bản nối tự nhiên, giữ đúng semantic:

`Tuy nhiên, cách truy cập này vẫn hữu ích khi số row khớp điều kiện là nhỏ.`

Bản cần flag:

`Tuy nhiên, một phương pháp hoàn toàn khác sẽ tối ưu mọi query.`

Lý do: source không nói “phương pháp khác” hoặc “mọi query”; referent `this approach` bị đổi sai. Nếu antecedent thực tế vẫn mơ hồ, không tự chọn “cách truy cập này” mà đánh dấu để review.

## 8. QA report contract (bắt buộc)

Reviewer phải xuất cấu trúc có thể audit, tối thiểu:

```json
{
  "part_id": "P002",
  "rule_version": "1.0",
  "source_unit_count": 0,
  "translated_unit_count": 0,
  "coverage_check": "PASS_OR_FAIL",
  "code_integrity_check": "PASS_OR_FAIL_OR_NOT_APPLICABLE",
  "local_status": "LOCAL_QA_PASSED_OR_NEEDS_REVISION_OR_BLOCKED",
  "boundary_status": "PASS_OR_FAIL_OR_PENDING_NEXT_TRANSLATION_OR_NOT_APPLICABLE",
  "final_status": "FINALIZED_OR_PENDING_BOUNDARY_OR_NEEDS_REVISION_OR_BLOCKED",
  "findings": [
    {
      "finding_id": "QA-001",
      "severity": "MAJOR",
      "unit_id": "P002-U007",
      "source_quote": "Relevant exact source text",
      "translated_quote": "Relevant exact translated text",
      "issue": "Mô tả ngắn lý do sai",
      "proposed_fix": "Bản sửa tối thiểu giữ đúng source",
      "status": "OPEN_OR_FIXED_OR_REVIEW_REQUIRED"
    }
  ],
  "boundary_review": {
    "previous_part_id": "P001",
    "next_part_id": "P003",
    "referents_checked": [],
    "terminology_conflicts": [],
    "continuity_issues": []
  },
  "glossary_change_proposals": [],
  "unresolved_questions": [],
  "verified_automated_checks": [],
  "verified_manual_checks": []
}
```

Các string trong ví dụ trên mô tả schema; **không được copy giá trị placeholder như thể đã kiểm tra thật**. Báo cáo thực tế phải ghi đúng dữ liệu, kết quả và evidence của part đang review.

## 9. Handoff & lifecycle xuyên suốt các part

Dùng workflow:

`DRAFT → LOCAL_QA_PASSED → BOUNDARY_QA_PASSED → FINALIZED`

Nếu QA thất bại: `NEEDS_REVISION → sửa → re-review`. Nếu thiếu context: `BLOCKED_CONTEXT`. Nếu source không thể xác minh: `NEEDS_HUMAN_REVIEW`.

**Sau khi Local QA Part N:**

- Cập nhật `handoff` với 2–3 source/translation units cuối, các concept đang tiếp diễn, important referents và glossary decisions.
- Giữ `Part N = LOCAL_QA_PASSED`, chờ kiểm tra với đầu part sau nếu part sau tồn tại.

**Khi bắt đầu Part N+1:**

- Translator bắt buộc đọc handoff và cuối Part N trước khi viết opening units.
- Khi opening draft của N+1 có sẵn, reviewer chạy ngay Boundary QA với cuối Part N.
- Nếu pass, đánh dấu Part N `FINALIZED`; nếu fail, sửa các unit liên quan cả 2 phía và chạy lại review.
- Sau đó tiếp tục dịch và Local QA cho toàn bộ Part N+1.

**Trước khi dựng PDF cuối:**

- Mọi part phải `FINALIZED` (bao gồm last part sau khi kiểm tra boundary với part trước).
- `source_unit_ids` toàn sách phải được cover đúng một lần; không thiếu hoặc trùng content.
- Tổng hợp một final consistency pass theo chapter: glossary, headings, links, figures, code blocks, cross-references và toàn bộ part boundaries.
- Nếu reflow/layout làm hỏng content hoặc code, trả lại bước reconstruction QA; không âm thầm coi là translation PASS.

## 10. Điều tuyệt đối không được làm

- Không cho PASS chỉ nhờ câu Việt nghe mượt.
- Không xác nhận `FINALIZED` khi Boundary QA còn `PENDING` (trừ part cuối).
- Không coi previous/next context là nội dung phải dịch trong Part N.
- Không sửa source meaning vì reviewer “biết cách giải thích hay hơn”.
- Không đổi style/terminology toàn chapter nếu chưa đánh giá side effects.
- Không bỏ qua findings sau khi sửa một lỗi khác; phải theo dõi trạng thái.
- Không bịa kết quả automated checks hoặc manual review.
- Không dùng check marks để thay thế việc thực sự đối chiếu bản Anh với bản Việt.

**Output khi chạy QA:** bản dịch có revision (nếu cần), QA report có evidence theo unit, cập nhật glossary/handoff, trạng thái part theo lifecycle. Nếu chưa đủ điều kiện, ghi rõ chưa PASS và lý do.
