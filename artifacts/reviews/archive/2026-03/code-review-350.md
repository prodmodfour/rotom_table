---
review_id: code-review-350
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-065+bug-066
domain: encounter-tables
commits_reviewed:
  - c9bfeeb6d5bb07163917774d37e94beed3ed8aab
  - 08e52cb262179bbffdfd8c688f525a7206620717
  - a6162d30136eae30cac6c66937d3956b30e76e4f
files_reviewed:
  - app/public/icons/phosphor/upload-simple.svg
  - app/pages/gm/encounter-tables/[id].vue
  - app/pages/gm/habitats/[id].vue
  - app/pages/gm/encounter-tables.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-06T11:30:00Z
follows_up: null
---

## Review Scope

Three commits addressing two related P1 bugs in the encounter-tables domain:

1. **bug-065** (c9bfeeb6): Missing `upload-simple.svg` icon caused HTTP 500 on `/gm/encounter-tables`.
2. **bug-066** (08e52cb2): `<EncounterTableTableEditor>` component name not resolved — should be `<TableEditor>` due to `pathPrefix: false` in `nuxt.config.ts`.
3. **Related fix** (a6162d30): Same `pathPrefix: false` class of bug for `<EncounterTableImportTableModal>` renamed to `<ImportTableModal>`.

**Files changed:** 4 files, 6 insertions, 5 deletions.

## Decree Check

- **decree-048** (encounter-tables domain: dark cave blindness penalties) — not relevant to these bug fixes.
- **decree-030** / **decree-031** (encounter domain: significance caps, budget formula) — not relevant.
- No decree violations found.

## Issues

No issues found.

## Verification Results

### SVG Icon (bug-065)

Verified `upload-simple.svg` against existing Phosphor icons in the project:

- **Format match:** 256x256 viewBox, invisible `<rect>` background, stroke-based paths with `currentColor`, `stroke-width="16"`, `stroke-linecap="round"`, `stroke-linejoin="round"` — identical structure to `download-simple.svg`, `trash.svg`, `dice-five.svg`, and all other icons in the directory.
- **Usage confirmed:** Line 7 of `encounter-tables.vue` references `/icons/phosphor/upload-simple.svg` via `<img>` tag with empty alt text and `btn-icon` class, matching the project's existing icon usage pattern.

### Component Name Fixes (bug-066 + related)

Verified `pathPrefix: false` is set at line 14 of `nuxt.config.ts` for the `~/components` directory. This means components register by filename only, not by directory path.

**Components in `encounter-table/` directory:**
- `TableEditor.vue` registers as `<TableEditor>` (not `<EncounterTableTableEditor>`)
- `ImportTableModal.vue` registers as `<ImportTableModal>` (not `<EncounterTableImportTableModal>`)
- `TableCard.vue` registers as `<TableCard>` (already used correctly on line 61 of `encounter-tables.vue`)
- `EntryRow.vue` and `ModificationCard.vue` — no path-prefixed misuses found.

**All page files verified post-fix:**
- `encounter-tables/[id].vue` — uses `<TableEditor>` (lines 2, 13). Correct.
- `habitats/[id].vue` — uses `<TableEditor>` (lines 2, 41). Correct.
- `encounter-tables.vue` — uses `<ImportTableModal>` (line 150), `<TableCard>` (line 61). Both correct.

### Broader pathPrefix Sweep

Searched all `.vue` files under `app/pages/` for any remaining path-prefixed references to `encounter-table/` components (pattern: `<EncounterTable(TableEditor|ImportTableModal|EntryRow|ModificationCard|TableCard)>`). **No matches found.** The systemic issue is fully resolved.

Also confirmed no naming collisions: `TableEditor`, `TableCard`, and `ImportTableModal` are each unique across the entire `components/` tree. The `habitat/` directory has `EncounterTableCard.vue` and `EncounterTableModal.vue` — these filenames already include "EncounterTable" as part of the component name itself, so they register correctly as `<EncounterTableCard>` and `<EncounterTableModal>` and are used correctly in `habitats/index.vue`.

### Commit Quality

- Three separate commits for three distinct fixes — correct granularity per project guidelines.
- Conventional commit format (`fix:` prefix) with descriptive messages referencing the bug tickets.
- No AI attribution in commit metadata.
- Author is `prodmodfour`, consistent with project norms.

## What Looks Good

- The developer caught the related `ImportTableModal` naming bug proactively while fixing bug-065, and committed it as a separate focused commit. Good instinct.
- The SVG icon is a genuine Phosphor icon matching the exact format of its counterpart (`download-simple.svg`), not a hand-crafted approximation.
- The root cause (pathPrefix:false) is correctly identified and all instances in the encounter-table domain are addressed. No stragglers remain.

## Verdict

**APPROVED.** All three fixes are correct, minimal, and well-scoped. The SVG matches the existing icon format. Component names are now consistent with the `pathPrefix: false` configuration. No remaining instances of the naming confusion were found across the codebase.
