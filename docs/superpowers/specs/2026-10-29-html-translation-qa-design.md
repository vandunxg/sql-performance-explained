# HTML Translation QA Design

## Goal

Revise every Vietnamese string visible to readers in `html/` so it faithfully preserves the English source and reads naturally for Vietnamese software developers. The review follows `RUE.md` and `QA_RULE.md`, both version 1.1.

## Scope

- Review `front.html`, `chap_01.html` through `chap_08.html`, `app_a.html`, `back.html`, and `index.html`.
- Include headings, navigation labels, prose, callouts, captions, table prose, alt text, and visible link labels.
- Preserve SQL, code, identifiers, execution-plan operation names, numeric data, anchors, HTML structure, CSS classes, and assets.
- Do not modify `html/tools/terms.py` unless rendered prose exposes a context-blind replacement defect that cannot be corrected in the affected HTML alone.

## Review Method

1. Inventory reader-visible Vietnamese text per file and map each prose unit to the matching English source in `en_parts/` or the source PDF when extraction is unclear.
2. Audit each unit source-to-target for completeness, technical semantics, conditions, negation, modality, causal flow, terminology, and structured content integrity.
3. Independently read the Vietnamese text in context to identify calques, English verb chains, ambiguous referents, unnecessary nominalization, overly long sentences, and broken paragraph flow.
4. Apply only minimal revisions that resolve an evidenced issue. Keep English terms where they identify stable technical concepts or operations; translate ordinary explanatory verbs into natural Vietnamese.
5. Read chapter boundaries and navigation text for terminology and continuity consistency.
6. Re-check changed passages against source and validate that the edited HTML remains structurally sound.

## Quality Bar

- Preserve all source meaning without adding explanation or DBMS-specific claims.
- Retain Group A/B technical terminology consistently; choose Group C verbs by contextual role under `RUE.md` section 3.3.
- Write Vietnamese grammar and logical connectors naturally for junior developers.
- Keep every technical actor and referent clear where Vietnamese would otherwise be ambiguous.
- Do not report completion until semantic, terminology, readability, and rendered-content checks have passed for the reviewed scope.

## Deliverables

- Revised reader-facing translation in the HTML files.
- A QA report with concrete source/target evidence for revised material, including source issues or unresolved ambiguity if any.
- Verification results for HTML structure and retained code/SQL content.
