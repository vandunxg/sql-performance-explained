# RULE 02 — Translation QA: SQL Performance Explained (EN → VI)

**Version:** 1.1  
**Scope:** Chỉ áp dụng cho `REVIEW`, `REVISE`, `BOUNDARY_CHECK`, `FINALIZE` đối với các part của bản dịch *SQL Performance Explained*, bao gồm prose sau khi render ra PDF/HTML.  
**Reviewer role:** Technical Translation Reviewer có kiến thức SQL/database performance và khả năng biên tập tiếng Việt dành cho Junior Software Developer đang học sâu về SQL, database internals và performance optimization.  
**Goal:** Phát hiện và sửa semantic drift, technical errors, mất ý, văn phong dịch máy, lạm dụng hoặc thiếu English terminology và **đứt mạch lập luận giữa các part** trước khi cho phép đưa bản dịch vào PDF/HTML.  
**Chuẩn đánh giá chung:** Translation và QA dùng cùng một bộ tiêu chí — `RULE 01` §2 (văn phong), §3 (thuật ngữ Nhóm A/B/C), §4.1–§4.5 (natural sentence construction), §11 (translation ≠ explanation) và **Acceptance Criteria AC-01…AC-10 ở `RULE 01` §12**.

> **Nguyên tắc cao nhất:** Không chấm PASS chỉ vì bản Việt đọc mượt. Review phải đối chiếu **toàn bộ source**, không chỉ review bản tiếng Việt độc lập.

## 1. Quy tắc review độc lập

- Đọc `RULE 01 — Translation` để biết tiêu chuẩn nhưng không mặc định bản dịch đã tuân thủ.
- Ưu tiên reviewer ở session/context độc lập với lượt dịch đầu, hoặc model khác khi khả thi. Nếu chỉ dùng một model, thực hiện lượt review riêng với source + translated draft, không phụ thuộc vào kết luận tự đánh giá của translator.
- Đánh giá đúng/sai dựa vào **English source, neighboring context, glossary đã duyệt**. Không sửa chỉ vì sở thích văn phong.
- Review phải có **evidence gắn với `unit_id`**. Không bịa source quote, câu lân cận hoặc số trang.
- Không thêm kiến thức khác vào nội dung sách. Nếu nghi ngờ tác giả trình bày chưa chính xác, tạo `source_issue` riêng, không âm thầm sửa.
- Mỗi finding phải phân loại **nguồn gốc** (`origin`): `TRANSLATION_ERROR` (lỗi bản dịch), `SOURCE_ISSUE` (hạn chế/sai sót của chính source — không sửa bản dịch, chỉ ghi nhận), `PIPELINE_ARTIFACT` (lỗi phát sinh ở bước extract/build/render, ví dụ thay thế thuật ngữ tự động). Không được báo một `SOURCE_ISSUE` như lỗi dịch, và ngược lại.
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
10. Nếu part đã được render (HTML/PDF), lấy prose **đã render** của các unit (ví dụ `html/chap_NN.html` theo `id` = `unit_id`) để kiểm tra khác biệt do pipeline (A3).

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
- **Rendered prose check:** so prose trong `translation.json` với prose đã render. Mọi khác biệt về từ ngữ (không chỉ markup) phải có lý do hợp lệ theo `RULE 01` §3.6. Đặc biệt flag: động từ tiếng Việt bị đổi sang English verb, từ thông thường bị hiển thị như SQL keyword (`<code class="kw">`), danh sách bị cắt rời khi chuẩn hóa thuật ngữ. Ghi `origin: PIPELINE_ARTIFACT`.

A4. **Three-axis linguistic audit** — thực hiện **ba lượt riêng biệt** theo thứ tự dưới đây. Mỗi lượt ghi finding với `axis` tương ứng. Không được trộn ba lượt thành một nhận xét chung.

**A4.1. SEMANTIC FIDELITY** (đọc source trước, rồi target; AC-01, AC-02, AC-08)
- Không thiếu hoặc thêm thông tin so với source.
- Giữ đúng điều kiện, phủ định, hedge/modality, thứ tự và quan hệ nguyên nhân – kết quả.
- Technical terms không bị thay đổi semantics (ví dụ `reserve` ≠ “trừ”, `update` trong câu thường ≠ SQL `UPDATE`).
- Không nhầm technical entities: `leaf node`, `index entry`, `page`/`block`, `row`, `record`, `link`/`pointer`.
- Không biến ví dụ/mô hình đơn giản hóa của tác giả thành khẳng định tuyệt đối về database implementation; không làm mô hình cụ thể hơn hay tổng quát hơn source.
- Việc tái cấu trúc câu (tách, gộp, đảo mệnh đề, chuyển chủ động) chỉ hợp lệ khi qua được các điểm trên (`RULE 01` §4.3).
- Không tự sửa lỗi kỹ thuật nghi ngờ trong source; ghi `origin: SOURCE_ISSUE` và để translator note (nếu có) tách khỏi nội dung dịch (`RULE 01` §11).

**A4.2. TERMINOLOGY CONSISTENCY** (AC-03, AC-04, AC-05, AC-09)
- Nhóm A/B (`RULE 01` §3.1–§3.2) được giữ theo glossary; technical phrase không bị dịch từng từ.
- Cùng một concept được gọi nhất quán trong unit, part và qua ranh giới part.
- Không thay technical phrase bằng từ tiếng Việt dễ gây hiểu nhầm.
- Nhóm C (`RULE 01` §3.3): không lạm dụng English verb ở vị trí chỉ cần động từ tiếng Việt; ngược lại, giữ English khi từ đó chỉ SQL statement/API operation.
- Không ép các concept khác nhau dùng chung một từ chỉ vì nghĩa gần giống (`RULE 01` §3.4).

**A4.3. NATURAL TECHNICAL READABILITY** (đọc bản Việt **không nhìn source** trước, sau đó đối chiếu; AC-05, AC-06, AC-07)
- Câu văn có tự nhiên với Junior Software Developer Việt Nam không?
- Còn cấu trúc word-by-word hoặc calque (`RULE 01` §4.4) không?
- Đọc một lần có hiểu đoạn văn không, hay phải quay lại câu trước?
- English terms có được nối bằng ngữ pháp tiếng Việt mạch lạc không (`RULE 01` §2.1)?
- Các bước xử lý/cơ chế có đúng technical flow — điều kiện → operation → cơ chế → kết quả, đúng như source (`RULE 01` §4.2)?
- Có câu dài không cần thiết, nhiều hơn hai mệnh đề phụ, hoặc lặp ý không?
- Có câu đúng từng từ nhưng khó hình dung về mặt kỹ thuật không?
- Mỗi câu có chủ thể/referent rõ không (đặc biệt câu mở đầu bằng “Nó”)?

**Yêu cầu evidence cho A4.3:** mỗi finding readability phải chỉ ra **cụm từ chính xác** gây khó đọc (`translated_quote`), nêu **loại vấn đề** (`calque`, `nominalization`, `english_verb_chain`, `missing_subject`, `ambiguous_referent`, `overlong_sentence`, `broken_flow`, `inconsistent_term`, `other`) và đưa **bản sửa cụ thể** (`proposed_fix`) đã qua A4.1. Không chấp nhận kết luận chung chung như “văn phong chưa tự nhiên” mà không có evidence. Không sửa chỉ vì sở thích nếu bản hiện tại đã đạt AC-06/AC-07 (khi đó tối đa là `SUGGESTION`).

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
5. **Native-language edit audit:** Đọc bản tiếng Việt **không nhìn bản Anh** để bắt câu khó hiểu (A4.3), sau đó đối chiếu source trước khi đề xuất thay (A4.1). Kiểm tra cả prose đã render nếu có (A3).
6. **Boundary audit:** Kiểm tra cả `previous → current` và `current → next_source`; khi có `next_head_translation`, kiểm tra `current → next_translation`.
7. **Revision:** Sửa theo finding có evidence; giữ `unit_id` và chỉ thay đoạn bị ảnh hưởng; không rewrite vô cớ toàn part.
8. **Re-review:** Re-run checks liên quan, so diff source/target, kiểm tra các đoạn lân cận để tránh regression.
9. **Status & handoff:** Xuất report, glossary proposals, unresolved issues và cập nhật context handoff.

## 5. Severity và cách quyết định

| Severity | Ví dụ | Xử lý |
|---|---|---|
| **CRITICAL** | Đổi phủ định/điều kiện làm sai SQL behavior; thay code/SQL literal; thiếu đoạn technical quan trọng | Chặn PASS, sửa ngay |
| **MAJOR** | Bỏ caveat, đổi causal chain, nhầm concept/entity; thêm giải thích ngoài source vào phần dịch chính; làm yếu/mạnh mức độ chắc chắn; động từ thông thường bị dịch/hiển thị như SQL keyword; technical phrase Nhóm B bị dịch sai semantics; lệch mạch 2 part gây hiểu sai; thiếu unit; câu khó hiểu đến mức người đọc có thể hiểu sai cơ chế | Chặn PASS, sửa ngay |
| **MINOR** | Thuật ngữ chưa nhất quán nhưng chưa làm sai nghĩa; chuỗi English verb rời rạc; calque/danh từ hóa; câu cứng, quá dài, thiếu chủ thể nhưng vẫn hiểu đúng | Sửa trước Local QA PASS nếu đã xác định, hoặc ghi rõ exception có lý do |
| **SUGGESTION** | Có lựa chọn câu mượt hơn nhưng bản hiện tại đã đúng, đạt AC-06/AC-07 | Tùy chọn; không rewrite vì sở thích |

Một `SOURCE_ISSUE` không có severity của lỗi dịch và **không chặn PASS**; nó được liệt kê riêng trong `source_issues` để human review quyết định có thêm translator note hay không.

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
- `insert`/`update`/`delete` trong câu đang chỉ SQL statement hay chỉ là động từ thông thường? Bản dịch (và bản render) có phản ánh đúng không?
- Mô hình đơn giản hóa của tác giả (ví dụ doubly linked list, B-tree) có bị bản dịch làm cụ thể hoặc tổng quát hơn không?

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
  "rule_version": "1.1",
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
      "axis": "SEMANTIC_FIDELITY_OR_TERMINOLOGY_OR_READABILITY_OR_STRUCTURE_OR_CONTINUITY",
      "origin": "TRANSLATION_ERROR_OR_PIPELINE_ARTIFACT",
      "acceptance_criteria": ["AC-01"],
      "readability_issue_type": "ONLY_FOR_READABILITY_calque_nominalization_english_verb_chain_missing_subject_ambiguous_referent_overlong_sentence_broken_flow_inconsistent_term_other",
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
  "acceptance_criteria_result": {"AC-01": "PASS_OR_FAIL", "AC-02": "...", "AC-10": "..."},
  "source_issues": [
    {
      "unit_id": "P002-U010",
      "source_quote": "Relevant exact source text",
      "concern": "Vì sao có thể gây hiểu nhầm về cơ chế thực tế của DBMS",
      "translator_note_proposal": "Nội dung chú thích đề xuất (tách khỏi bản dịch) hoặc null",
      "status": "NEEDS_HUMAN_REVIEW"
    }
  ],
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
- Không kết luận “văn phong chưa tự nhiên” mà không có quote, loại vấn đề và bản sửa cụ thể.
- Không sửa nội dung tác giả để “đúng hơn với PostgreSQL/DBMS thực tế”; ghi `SOURCE_ISSUE`.
- Không coi ví dụ tham chiếu do người dùng/reviewer cung cấp là source; luôn đối chiếu English source.

**Output khi chạy QA:** bản dịch có revision (nếu cần), QA report có evidence theo unit, cập nhật glossary/handoff, trạng thái part theo lifecycle. Nếu chưa đủ điều kiện, ghi rõ chưa PASS và lý do.

## 11. Acceptance Criteria và cách quyết định PASS

QA dùng nguyên bộ **AC-01…AC-10** ở `RULE 01` §12. Một unit/part chỉ `LOCAL_QA_PASSED` khi:

1. Mọi AC đều `PASS`, hoặc chỉ còn finding `MINOR` đã ghi exception có lý do / `SUGGESTION`.
2. Ba lượt A4.1, A4.2, A4.3 đều đã chạy và được ghi trong `verified_manual_checks` (ghi rõ phạm vi unit đã đọc).
3. Nếu part đã render, rendered prose check (A3) đã chạy; mọi `PIPELINE_ARTIFACT` mức `MAJOR` trở lên đã được sửa ở pipeline và render lại.
4. Mọi `SOURCE_ISSUE` đã được liệt kê trong `source_issues`, không bị “sửa” âm thầm trong bản dịch.

Ánh xạ mặc định AC → trục → severity tối thiểu khi vi phạm:

| AC | Trục | Severity tối thiểu khi vi phạm |
|---|---|---|
| AC-01, AC-02 | Semantic fidelity | MAJOR (CRITICAL nếu làm sai SQL behavior) |
| AC-08 | Semantic fidelity | MAJOR |
| AC-03, AC-04 | Terminology | MINOR (MAJOR nếu làm sai semantics) |
| AC-05 | Terminology/Readability | MINOR (MAJOR nếu từ thường bị hiểu thành SQL keyword) |
| AC-06, AC-07 | Readability | MINOR (MAJOR nếu có thể dẫn đến hiểu sai cơ chế) |
| AC-09 | Terminology | MINOR |
| AC-10 | Structure | MAJOR (CRITICAL nếu hỏng SQL/code) |

Ví dụ finding đạt chuẩn evidence (từ `p01-u019`, bản render):

```json
{
  "finding_id": "QA-EX-01",
  "severity": "MAJOR",
  "axis": "TERMINOLOGY",
  "origin": "PIPELINE_ARTIFACT",
  "acceptance_criteria": ["AC-01", "AC-05", "AC-06"],
  "readability_issue_type": "english_verb_chain",
  "unit_id": "p01-u019",
  "source_quote": "New nodes are inserted between two existing nodes by updating their links to refer to the new node.",
  "translated_quote": "Node mới được insert giữa hai node hiện có bằng cách update link của chúng để reference đến node mới.",
  "issue": "Ba English verb liên tiếp (insert/update/reference) ở vị trí chỉ cần động từ tiếng Việt; insert/update còn hiển thị như SQL keyword dù câu nói về thao tác trên linked list. translation.json viết đúng (chèn/cập nhật/tham chiếu) — lỗi phát sinh ở terms.py.",
  "proposed_fix": "Một node mới được chèn vào giữa hai node hiện có bằng cách cập nhật link của hai node này để chúng trỏ tới node mới.",
  "status": "OPEN"
}
```
