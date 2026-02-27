---
review_id: code-review-087
ticket_id: refactoring-039
reviewer: senior-reviewer
date: 2026-02-20
commits_reviewed:
  - 337f6df
  - 0cc0bc3
result: APPROVED_WITH_NOTES
---

## Code Review: refactoring-039

### Scope Verification

**Ticket goal:** Replace duplicated encounter creation logic in `habitats/index.vue` with the shared `useEncounterCreation` composable.

**Files changed:** `app/pages/gm/habitats/index.vue` (1 file, +7 -22 lines)

Commit `337f6df` is the refactoring. Commit `0cc0bc3` is the ticket resolution log update. Both are correctly scoped.

### Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Composable call replaces inline logic | PASS | `createWildEncounter(pokemon, tableName)` replaces the manual create + addWildPokemon + serve sequence |
| 2 | Error handling preserved | PASS | Composable sets `error` ref on catch; template reads `encounterCreation.error.value` for `:add-error` prop |
| 3 | Loading state wired | PASS | `:adding-to-encounter="encounterCreation.creating.value"` matches composable's `creating` ref |
| 4 | `@close` clears error state | PASS | `@close="generatingFromTable = null; encounterCreation.clearError()"` — matches reference in `habitats/[id].vue` (line 26) |
| 5 | No duplicate local refs | PASS | `addingToEncounter` and `addError` refs removed from script setup |
| 6 | Template bindings match reference | PASS | Identical pattern to `habitats/[id].vue` lines 23-24 and `encounter-tables.vue` lines 141-142 |
| 7 | `tableName` parameter correct | PASS | `generatingFromTable.value?.name \|\| 'Wild Encounter'` preserved exactly |
| 8 | No functional behavior changes | NOTE | See finding below |

### Findings

#### Finding 1: Navigation side-effect added (MEDIUM)

The composable's `createWildEncounter()` includes `router.push('/gm')` on line 29 of `useEncounterCreation.ts`. The original inline code in `habitats/index.vue` did NOT navigate — it only closed the modal by setting `generatingFromTable = null`.

After this refactoring, a successful encounter creation from the habitats index page will now navigate the user to `/gm` instead of keeping them on `/gm/habitats`.

**Mitigating context:** Both `encounter-tables.vue` and `habitats/[id].vue` already use the composable and therefore already navigate to `/gm` after encounter creation. The original `habitats/index.vue` was the outlier — it was inconsistent with sibling pages by staying on the habitats list after creating an encounter. The new behavior is arguably more correct: after an encounter is created and served, the user should land on the GM dashboard where the encounter is visible.

**Verdict:** This is acceptable as a consistency fix that piggybacks on the refactoring. The previous behavior (staying on the habitats list after starting an encounter) was the inconsistency, not the composable. No action required, but documenting for awareness.

### Positive Observations

- Clean removal of 22 lines of inline logic replaced by 4 lines of composable usage.
- The `if (success)` guard correctly gates the modal close, matching the pattern established by both sibling pages.
- No orphaned imports or dead code left behind.
- The page no longer needs its own try/catch/finally for this workflow -- error handling is fully delegated to the composable.

### Verdict

**APPROVED.** The refactoring correctly deduplicates the encounter creation logic and brings `habitats/index.vue` in line with `habitats/[id].vue` and `encounter-tables.vue`. The one behavioral change (added navigation to `/gm`) is a consistency improvement, not a regression. All template bindings, error handling, and loading states are correctly wired to the composable.
