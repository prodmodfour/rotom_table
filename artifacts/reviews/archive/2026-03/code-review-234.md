---
review_id: code-review-234
review_type: code
reviewer: senior-reviewer
trigger: fix-cycle-re-review
target_report: feature-007
domain: pokemon-lifecycle
commits_reviewed:
  - 4cb19e4
  - de8aedc
  - b344993
  - 7c1b779
  - 81c6f21
  - 774c64e
files_reviewed:
  - app/utils/baseRelations.ts
  - app/tests/unit/utils/baseRelations.test.ts
  - app/components/pokemon/StatAllocationPanel.vue
  - app/composables/useLevelUpAllocation.ts
  - app/server/api/pokemon/[id]/allocate-stats.post.ts
  - app/components/pokemon/PokemonLevelUpPanel.vue
  - app/components/encounter/LevelUpNotification.vue
  - app/assets/scss/components/_level-up-notification.scss
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/feature/feature-007.md
  - artifacts/designs/design-level-up-allocation-001/_index.md
  - app/server/services/evolution.service.ts
  - app/utils/evolutionCheck.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-01T09:30:00Z
follows_up: code-review-229
---

## Review Scope

Re-review of feature-007 P0 fix cycle. Six commits by slave-2 addressing all 5 issues from code-review-229 (2H + 3M). The rules-review-205 was already APPROVED and is not re-reviewed here -- only verifying that the code quality fixes do not break PTU correctness.

Decree check: decree-035 (nature-adjusted base stats for Base Relations ordering) remains correctly implemented -- the fix cycle commits did not alter the validation logic in `validateBaseRelations()`, only added the `warnings` field to `extractStatPoints()` and expanded test coverage. decree-036 (stone evolution move learning) is not applicable to P0 stat allocation.

## Prior Issue Resolution

### H1: No unit tests for `baseRelations.ts` -- RESOLVED

**Commit:** 4cb19e4 (`test: add comprehensive unit tests for baseRelations.ts`)

37 unit tests across 6 describe blocks covering all 4 core functions plus `formatStatName` and integration scenarios:

| Function | Tests | Coverage |
|----------|-------|----------|
| `buildStatTiers` | 6 | All-different, equal groups, all-same, single highest, zero values, large values |
| `validateBaseRelations` | 9 | Valid ordering, overtake violation, equal finals allowed, single-tier (all equal), single-pair inversion, equal-base divergence, multiple violations, tiers in result, zero allocation |
| `extractStatPoints` | 11 | Zero allocation, HP reverse formula, HP round-trip, negative clamping with warning, multiple warnings, no warnings on clean data, consistency true/false, level 1 minimal, level 100 high, HP negative extraction |
| `getValidAllocationTargets` | 7 | Zero allocation all valid, lower blocked from overtaking, boundary equality allowed, multi-tier block, all-equal unconstrained, cross-tier propagation, match-not-exceed |
| `formatStatName` | 2 | Known keys, unknown fallback |
| Integration | 2 | Full round-trip (allocate -> extract -> validate), progressive target restriction |

The test file is well-structured: uses a `makeStats()` helper for DRY test setup, each test has a clear intent comment, assertions cover both the happy path and the specific mechanic being tested. Edge cases requested in code-review-229 (equal tiers, single-stat-higher, negative clamping, budget consistency, budget exhaustion, constraint propagation) are all present.

The test file is 781 lines, which is under the 800-line limit. Test files are typically allowed more length than source files, and the tests are well-organized with clear section headers.

### H2: `app-surface.md` not updated -- RESOLVED

**Commit:** 81c6f21 (`docs: add level-up allocation files to app-surface.md`)

The app-surface.md now includes:
- `POST /api/pokemon/:id/allocate-stats` endpoint in the Pokemon API section (line 106)
- A dedicated "Level-up stat allocation" paragraph (line 146) documenting `utils/baseRelations.ts`, `composables/useLevelUpAllocation.ts`, and `components/pokemon/StatAllocationPanel.vue`

All 4 new files are registered with accurate descriptions including the `warnings` field, `decree-035` reference, and partial allocation support.

### M1: `extractStatPoints` clamping silently -- RESOLVED

**Commit:** 7c1b779 (`fix: add warnings field to extractStatPoints for negative clamping visibility`)

The function now:
1. Computes raw extraction values into a `rawExtractions` record before clamping
2. Iterates all raw values and pushes a warning string when any value is negative
3. Warning messages include the stat name, raw negative value, and the current vs base stat values for debugging
4. Returns `warnings: string[]` in the return type

The implementation correctly handles the HP special case by showing `hpStat` (derived from the formula) rather than `pokemon.currentStats.hp` in the warning message, since HP extraction uses the maxHp formula path.

Callers (composable and server endpoint) can surface these warnings to the GM. The composable exposes `currentExtraction` which includes warnings. The server endpoint calls `extractStatPoints` but uses the result only for `currentAllocation.statPoints`, not surfacing warnings in the API response -- this is acceptable since the warnings are diagnostic and the server-side use case (determining current allocation to build incremental mode) doesn't need to surface them.

Tests verify: single negative warning (defense below base), multiple warnings (attack and speed below base), no warnings when clean, and HP-specific negative extraction warning.

### M2: Partial allocation blocked in UI -- RESOLVED

**Commit:** de8aedc (`fix: allow partial stat allocation with confirmation dialog`)

The fix makes three changes:
1. New computed `isAllocationEmpty` checks if all pending allocation values are zero
2. Submit button disabled condition changed from `unallocatedPoints > 0` to `isAllocationEmpty` -- now only disabled when the GM hasn't allocated anything at all
3. `handleSubmit()` adds a `window.confirm()` dialog when `unallocatedPoints.value > 0`, warning the GM about remaining points before proceeding

This correctly aligns the UI with the server, which already accepts partial allocation (`proposedTotal > budget` rejects over-budget, but does not reject under-budget). The confirmation dialog prevents accidental partial submissions while still allowing intentional ones.

The `isAllocationEmpty` computed uses immutable access via `pendingAllocation.value[key]` -- no mutation. The `STAT_KEYS.every()` approach is clean.

### M3: SCSS hardcoded `gap: 4px` -- RESOLVED

**Commit:** b344993 (`fix: replace hardcoded gap with $spacing-xs in allocate-link`)

Single-line change: `gap: 4px` replaced with `gap: $spacing-xs` in `.allocate-link`. Verified no other `gap: Npx` patterns remain in the file. All gap/spacing properties in `_level-up-notification.scss` now use SCSS variables.

## What Looks Good

1. **Test quality is high.** The 37 tests cover not just the happy paths but meaningful edge cases: all-equal-base Pokemon (single tier, no constraints), negative extractions from data inconsistency, boundary equality (final stats equal is valid), cross-tier constraint propagation, and a full round-trip integration test (allocate -> calculate stats -> extract -> validate). The `makeStats()` helper keeps tests DRY without obscuring intent.

2. **Immutability preserved throughout fixes.** The `isAllocationEmpty` computed reads from `pendingAllocation.value` without mutation. The warnings implementation in `extractStatPoints` builds a new `rawExtractions` record, iterates it read-only, and returns a new object. No regression from the original immutability patterns.

3. **Backward compatibility maintained.** The `warnings` field is additive -- it extends the return type of `extractStatPoints` without changing existing fields. The `evolution.service.ts` has its own separate `extractStatPoints` with a different signature (operates on raw DB fields, no clamping) that is unaffected. The `evolutionCheck.ts` legacy wrapper continues to work unchanged.

4. **Commit granularity is correct.** 6 commits for 6 discrete changes. Each commit addresses exactly one issue from the prior review. The commit messages clearly reference which issue is being resolved.

5. **File sizes remain within limits.** `baseRelations.ts` grew from ~203 to 227 lines (warnings logic). `StatAllocationPanel.vue` remains at 375 lines. Test file at 781 lines is acceptable for comprehensive test coverage of a pure utility with 4 exported functions.

6. **Confirmation dialog UX is appropriate.** Using `window.confirm()` for the partial allocation warning is lightweight and consistent with the project's approach (no custom modal needed for a simple yes/no). The message clearly states how many points remain unallocated.

7. **PTU correctness unaffected.** The fix cycle did not modify `validateBaseRelations`, `buildStatTiers`, or `getValidAllocationTargets` logic. The `extractStatPoints` changes are additive (warnings field) and do not alter the clamping or calculation behavior. All PTU mechanics verified in rules-review-205 remain intact.

## Verdict

**APPROVED**

All 5 issues from code-review-229 are fully resolved. The unit tests provide comprehensive coverage of the foundational validation utility. The partial allocation fix correctly aligns UI behavior with server capabilities. The warnings field surfaces previously hidden data inconsistencies without changing calculation behavior. The SCSS and app-surface.md fixes are clean one-shot changes. No new issues introduced.
