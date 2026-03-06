---
review_id: code-review-360
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-060
domain: encounter-tables
commits_reviewed:
  - 4809bfa6
  - a20c6c85
  - 15234f8e
  - d74ae83e
  - b16fd6bc
  - e9cabeb0
files_reviewed:
  - app/server/api/encounter-tables/[id]/export.get.ts
  - app/server/api/encounter-tables/import.post.ts
  - app/components/encounter-table/ImportTableModal.vue
  - app/tests/integration/encounter-tables.test.ts
  - app/pages/gm/encounter-tables.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-06T18:45:00Z
follows_up: code-review-354
---

## Review Scope

D2 re-review of bug-060 (encounter table density field lost on export/import round-trip). The original D1 fix (4 commits: 4809bfa6, a20c6c85, 15234f8e, d74ae83e) was reviewed in code-review-354 which returned CHANGES_REQUIRED with 3 findings: H1 (density fallback test coverage), M1 (modal dismiss navigation), M2 (densityMultiplier filed as bug-068). This review verifies the D2 fix commits (b16fd6bc, e9cabeb0) resolve all outstanding findings.

Checked encounter-tables decrees: decree-031 (encounter budget formula), decree-048 (cave blindness presets). Neither applies to density export/import serialization. No decree violations.

## Issue Resolution Verification

### H1: Density fallback tests -- RESOLVED (b16fd6bc)

Two test cases added to `encounter-tables.test.ts`:

1. **Missing density** (`'should fall back to moderate when density is missing'`): Import body has no `density` field. Asserts `result.data.density === 'moderate'` and verifies `prisma.encounterTable.create` was called with `density: 'moderate'`. This covers the backwards-compatibility path for legacy exports created before the density field existed.

2. **Invalid density** (`'should fall back to moderate when density is invalid'`): Import body has `density: 'extreme'`. Same assertions -- fallback to `'moderate'`. This covers the corrupted/tampered data path.

Both tests correctly verify both the response value AND the Prisma create call argument, confirming the fallback logic at `import.post.ts:123-127` is exercised end-to-end. The test structure matches the existing pattern in the file (mock setup, dynamic import, assertion on result + Prisma call).

### M1: Modal dismiss navigation -- RESOLVED (e9cabeb0)

The fix adds a `handleDismiss()` function (lines 88-94 of ImportTableModal.vue) that checks `importedTableId.value`:
- If set (import succeeded with warnings): emits `'imported'` with the table ID, triggering navigation in the parent
- If not set (no import yet): emits `'close'` as before

Both dismiss triggers are updated:
- Line 2: overlay `@click.self` changed from `$emit('close')` to `handleDismiss`
- Line 6: X button `@click` changed from `$emit('close')` to `handleDismiss`

The Cancel button (line 55) still uses `$emit('close')` directly, but this is correct -- it's inside the `<template v-else>` block that only renders when `importedTableId` is falsy (pre-import state). After a successful-with-warnings import, the footer switches to show only the "Continue" button.

Verified parent wiring in `encounter-tables.vue`: `@imported="handleImported"` (line 153) calls `handleImported` (lines 278-281), which closes the modal and navigates via `router.push`. All dismiss paths now converge on the same navigation behavior post-import.

### M2: densityMultiplier ticket -- RESOLVED

Bug-068 was filed as `artifacts/tickets/open/bug/bug-068.md` with P3 priority, correctly scoped to the `densityMultiplier` field on `TableModification`. No code change was required for this finding.

## What Looks Good

1. **Test quality**: The two new fallback tests (b16fd6bc) are well-structured. They test both the response shape AND the Prisma call arguments, catching bugs where the mock return value might mask incorrect input. The test names clearly describe the scenario being covered.

2. **handleDismiss pattern**: The approach of routing through a single function (e9cabeb0) is cleaner than the alternatives suggested in code-review-354 (disabling X button or hiding overlay dismiss). It preserves user expectations -- X and overlay click always "do the right thing" based on current modal state -- without removing affordances.

3. **No regressions in existing code**: The D2 commits are purely additive. b16fd6bc adds 83 lines of tests with no changes to production code. e9cabeb0 modifies only 3 template lines and adds 8 lines of script, with no changes to the import logic or parent page.

4. **Commit granularity**: Two D2 commits, one per finding, each self-contained. Good separation.

5. **Original D1 implementation remains solid**: Export adds `density` at the correct position (export.get.ts:49). Import validation uses allowlist approach matching the DensityTier type exactly (import.post.ts:124-127). Fallback to `'moderate'` matches Prisma schema default. Species warning flow correctly separates the table creation (which succeeds) from the user notification (which is informational).

## Verdict

**APPROVED**

All three findings from code-review-354 are resolved. The density export/import fix is correct, tested (happy path + both fallback paths), and the modal dismiss behavior is now consistent across all dismiss triggers. Bug-068 is filed for the densityMultiplier gap. No new issues found.
