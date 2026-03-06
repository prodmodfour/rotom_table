---
review_id: code-review-354
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
files_reviewed:
  - app/server/api/encounter-tables/[id]/export.get.ts
  - app/server/api/encounter-tables/import.post.ts
  - app/components/encounter-table/ImportTableModal.vue
  - app/tests/integration/encounter-tables.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-06T16:30:00Z
follows_up: null
---

## Review Scope

Bug-060 fix: encounter table density field lost on export/import round-trip. 4 code commits across 4 files. Also includes a UI improvement for species warnings on import.

Checked encounter-tables decrees: decree-030 (significance cap), decree-031 (encounter budget formula), decree-048 (cave blindness). None apply to density export/import. No decree violations.

## Issues

### HIGH

**H1: No test for density fallback behavior (missing/invalid density defaults to 'moderate')**

The import handler at `import.post.ts:123-127` validates density and falls back to `'moderate'` when the field is missing or contains an invalid value. This is a meaningful behavioral choice -- old exports created before this fix will lack the density field entirely, so the fallback is the primary path for backwards-compatible imports. However, zero test coverage exists for this fallback. The test only exercises the happy path where `density: 'dense'` is provided.

Required: Add at least two test cases:
1. Import with no `density` field -- assert the created table gets `'moderate'`
2. Import with an invalid `density` value (e.g., `'extreme'`) -- assert fallback to `'moderate'`

Per Lesson 1: behavioral branches added during a fix require test coverage for the delta. The fallback is new behavior that handles the common case (legacy exports) and the error case (corrupted data).

**File:** `app/tests/integration/encounter-tables.test.ts`

### MEDIUM

**M1: Closing the import modal via X button or overlay click after successful-with-warnings import does not navigate to the imported table**

When the import succeeds but has species warnings, the modal transitions to showing a "Continue" button. However, the X button (`line 6: @click="$emit('close')"`) and overlay click (`line 2: @click.self="$emit('close')"`) still emit `close`, which just sets `showImportModal = false` in the parent (`encounter-tables.vue:152`) without navigating to the newly imported table.

The table was already created server-side and added to the store's local array, so no data is lost. But the user sees the table list page without being taken to their import. This is a UX gap: if the user dismisses the warning by clicking X instead of "Continue", they have to find their imported table manually.

Required fix: Either (a) disable/hide the X button and overlay-dismiss when `importedTableId` is set, forcing the user through the "Continue" button, or (b) emit `imported` on close when `importedTableId` is set so navigation always happens.

**File:** `app/components/encounter-table/ImportTableModal.vue`

**M2: `densityMultiplier` on `TableModification` is not included in export/import**

The Prisma schema (`schema.prisma:406`) defines `densityMultiplier Float @default(1.0)` on `TableModification`. Neither the export handler nor the import handler includes this field. This is the exact same category of round-trip data loss that bug-060 was filed to fix, just for a different field on a related model. While technically out of scope for the original ticket (which only mentions table-level density), the developer was already in these files and the fix is straightforward.

Required: File a new ticket for `densityMultiplier` round-trip loss. This can be a P3 since the default is 1.0 and most modifications won't have customized it, but it should be tracked.

## What Looks Good

1. **Export implementation** (`export.get.ts:49`): Clean single-line addition of `density: table.density` in the correct position within the export object. The field is read directly from Prisma, no transformation needed.

2. **Import validation** (`import.post.ts:123-127`): Solid defensive coding. The allowlist approach (`validDensities.includes()`) is correct -- it matches the `DensityTier` type definition exactly (`'sparse' | 'moderate' | 'dense' | 'abundant'`). Fallback to `'moderate'` matches the Prisma schema default (`@default("moderate")`). Handles both missing field and invalid value.

3. **Import response** (`import.post.ts:229`): Density is included in the response body, so the frontend receives it.

4. **Interface update** (`import.post.ts:34`): `density?: string | null` correctly marks the field as optional with null support, matching the fact that older exports won't have it.

5. **Modal UX pattern** (`ImportTableModal.vue:45-66`): The `v-if/v-else` template swap between post-import and pre-import footer states is clean. The `importedTableId` ref gates the state transition correctly.

6. **Commit granularity**: Four commits, each touching 1 file, each doing one logical thing. Good separation of export fix, import fix, UI fix, and test.

7. **Store integration**: The `importTable` store method (`encounterTables.ts:497-513`) returns `{ table: response.data, warnings: response.warnings }`, and the modal correctly accesses `result.table.id` and `result.warnings`. The plumbing is sound.

## Verdict

**CHANGES_REQUIRED**

The core density fix (export + import + validation) is correct and well-implemented. Two issues require fixes before approval:

## Required Changes

1. **H1**: Add test cases for density fallback (missing density, invalid density). This is the most common real-world path since all existing exports lack the field.

2. **M1**: Fix the modal dismiss behavior when `importedTableId` is set. The X button and overlay click should either be disabled or should navigate to the imported table.

3. **M2**: File a ticket for `densityMultiplier` missing from modification export/import. No code change needed in this PR -- just the ticket.
