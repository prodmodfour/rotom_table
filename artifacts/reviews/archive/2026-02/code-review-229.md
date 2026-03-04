---
review_id: code-review-229
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-007
domain: pokemon-lifecycle
commits_reviewed:
  - 06f21f5
  - ae5dbeb
  - 9c0f826
  - da32fa1
  - ff62e08
  - 1dc50f0
  - bd4eade
  - 9e5e90f
files_reviewed:
  - app/utils/baseRelations.ts
  - app/server/api/pokemon/[id]/allocate-stats.post.ts
  - app/composables/useLevelUpAllocation.ts
  - app/components/pokemon/StatAllocationPanel.vue
  - app/components/encounter/LevelUpNotification.vue
  - app/components/pokemon/PokemonLevelUpPanel.vue
  - app/pages/gm/pokemon/[id].vue
  - app/utils/evolutionCheck.ts
  - app/assets/scss/components/_level-up-notification.scss
  - artifacts/designs/design-level-up-allocation-001/_index.md
  - artifacts/tickets/open/feature/feature-007.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 3
reviewed_at: 2026-02-28T22:30:00Z
follows_up: null
---

## Review Scope

First review of feature-007 P0: Pokemon Level-Up Stat Allocation with Base Relations Validation. 8 commits implementing interactive stat point allocation for Pokemon level-ups. 4 new files (utility, endpoint, composable, component) and 4 modified files.

Decree check: decree-035 (nature-adjusted base stats for Base Relations ordering) is correctly cited and implemented throughout. decree-036 (stone evolution move learning) is not applicable to P0 stat allocation.

## Issues

### HIGH

#### H1: No unit tests for `baseRelations.ts` validation logic

`baseRelations.ts` is a pure utility with 4 exported functions that are the correctness foundation for this entire feature. Per Senior Reviewer L1: "Verify test coverage for behavioral changes -- check if unit tests exist for baseRelations validation edge cases." No tests were found anywhere (`app/tests/unit/`). This is a pure utility -- the most testable code possible. Edge cases that need coverage:

- Equal base stats forming a single tier (all-same-stat Pokemon)
- Two-tier configurations (e.g., all stats equal except one higher)
- Negative stat points in `extractStatPoints` when currentStat < baseStat (rounding/floor issues with HP formula)
- Budget consistency check (`isConsistent`) returning false for partially-allocated Pokemon
- `getValidAllocationTargets` returning all-false when budget is exhausted

The design spec includes a `testing-strategy.md` with specific test cases. These should have been implemented as part of P0.

**Required:** Add unit tests for `validateBaseRelations`, `buildStatTiers`, `extractStatPoints`, and `getValidAllocationTargets` covering at minimum 5 edge cases per function.

#### H2: `app-surface.md` not updated with new files

The `.claude/skills/references/app-surface.md` file was not updated to register the 4 new files:
- `app/utils/baseRelations.ts`
- `app/server/api/pokemon/[id]/allocate-stats.post.ts`
- `app/composables/useLevelUpAllocation.ts`
- `app/components/pokemon/StatAllocationPanel.vue`

Per project conventions, new endpoints, components, composables, and utilities must be registered in `app-surface.md` for discoverability by other skills and developers.

**Required:** Update `app-surface.md` with the 4 new files.

### MEDIUM

#### M1: `extractStatPoints` uses `Math.max(0, ...)` masking negative extraction values

In `baseRelations.ts` lines 170-177, all stat point extractions are clamped to `Math.max(0, ...)`. This silently masks data inconsistencies. If a Pokemon has `currentAttack < baseAttack`, the function returns 0 stat points for attack instead of surfacing the inconsistency. The `isConsistent` flag on line 186 could then return `true` (total matches expected) even when individual stats are wrong if other stats compensate.

For HP specifically (line 167-168), `Math.round` is used for the division `(maxHp - level - 10) / 3`. If the stored `maxHp` is not cleanly derivable from the formula (e.g., due to a manual edit or rounding in a prior operation), the extracted HP points could be off by 1, and `Math.max(0, ...)` would hide the error.

**Required:** Add a `warnings: string[]` field to the return value of `extractStatPoints`. When any individual stat extraction yields a negative value before clamping, push a warning explaining which stat is inconsistent. The caller (composable and server endpoint) can decide whether to surface these warnings to the GM.

#### M2: `StatAllocationPanel` submit button requires ALL points allocated

In `StatAllocationPanel.vue` line 89, the submit button is disabled when `unallocatedPoints > 0`. This forces the GM to allocate every available point before applying. In practice, GMs sometimes want to allocate partially (e.g., allocate some points now and revisit later after thinking about the build). PTU rules say you *gain* stat points -- there is no rule requiring immediate allocation of all points.

The server endpoint already supports partial allocation (it validates `proposedTotal <= budget`, not `proposedTotal === budget`). The UI should match.

**Required:** Change the disabled condition from `unallocatedPoints > 0` to `pendingAllocation is all-zeros` (i.e., disable only when nothing has been changed). Optionally add a confirmation dialog when unallocatedPoints > 0 warning the GM that not all points are allocated.

#### M3: SCSS uses hardcoded pixel value `gap: 4px` instead of spacing variable

In `_level-up-notification.scss` line 136, the `.allocate-link` uses `gap: 4px` instead of `$spacing-xs` (which equals 4px). While functionally identical, this deviates from the project convention of always using SCSS spacing variables for consistency and future-proofing.

**Required:** Replace `gap: 4px` with `gap: $spacing-xs`.

## What Looks Good

1. **Base Relations validation logic is correct.** The `validateBaseRelations` function correctly implements the PTU Base Relations Rule: stats with strictly higher base stats must maintain >= relationship in final stats, equal base stats form free tiers. The optimized triangular loop (j = i+1) is cleaner than the spec's full loop + deduplication. Per decree-035, the function correctly operates on nature-adjusted base stats.

2. **HP formula is correct.** Both `extractStatPoints` (reverse: `hpStat = (maxHp - level - 10) / 3`) and `allocate-stats.post.ts` (forward: `newMaxHp = level + (newHpStat * 3) + 10`) correctly implement PTU Core p.198. The HP preservation logic (full HP stays full, damaged HP capped at new max) matches the existing pattern in `add-experience.post.ts`.

3. **Immutability patterns followed.** The composable uses spread operators for all state mutations (`pendingAllocation.value = { ...pendingAllocation.value, [stat]: ... }`). The utility functions are pure with no side effects. The server endpoint builds new objects rather than mutating inputs.

4. **Server-side validation is thorough.** The endpoint validates: Pokemon existence (404), stat key validity, positive integers in incremental mode, non-negative integers in batch mode, total budget enforcement, and Base Relations. The `skipBaseRelations` escape hatch for Features that break ordering (PTU Core p.228-232: Enduring Soul, Stat Ace, Attack Conflict) is a good forward-thinking design.

5. **evolutionCheck.ts refactoring is clean.** The legacy wrapper maintains backward compatibility by delegating to the shared `baseRelations.ts` utility. The import alias (`_validateBaseRelations`) avoids naming conflicts. Existing callers of `evolutionCheck.validateBaseRelations` continue to work.

6. **Component architecture follows SRP.** The allocation flow is properly separated: pure logic (baseRelations.ts), server validation (allocate-stats.post.ts), reactive state (useLevelUpAllocation.ts), and UI (StatAllocationPanel.vue). Each file has a single responsibility.

7. **File sizes within limits.** All files are well under the 800-line maximum: baseRelations.ts (203), allocate-stats.post.ts (207), useLevelUpAllocation.ts (189), StatAllocationPanel.vue (361).

8. **Commit granularity is appropriate.** 8 commits for 8 logical units of work, each producing a working state. The implementation order matches the spec's recommended sequence.

9. **Phosphor Icons used correctly.** PhMinus, PhPlus, PhWarning, PhSliders, PhCaretRight, PhChartBar -- all from `@phosphor-icons/vue`, no emojis.

10. **Composable returns readonly refs for state.** `pendingAllocation`, `isAllocating`, `isSaving`, `error` are all wrapped in `readonly()`, preventing accidental external mutation.

## Verdict

**CHANGES_REQUIRED**

Two HIGH issues (missing unit tests, missing app-surface.md update) and three MEDIUM issues. The core logic is correct and well-structured, but the P0 tier cannot be considered complete without test coverage for the foundational validation utility. The app-surface.md omission is a process gap that should be fixed alongside the tests.

## Required Changes

1. **[H1]** Write unit tests for `baseRelations.ts` -- at minimum: `validateBaseRelations` (5+ cases including equal tiers, single-stat-higher, violation detection), `buildStatTiers` (grouping correctness), `extractStatPoints` (HP formula round-trip, negative clamping, consistency flag), `getValidAllocationTargets` (budget exhaustion, constraint propagation).

2. **[H2]** Update `.claude/skills/references/app-surface.md` to include the 4 new files: `app/utils/baseRelations.ts`, `app/server/api/pokemon/[id]/allocate-stats.post.ts`, `app/composables/useLevelUpAllocation.ts`, `app/components/pokemon/StatAllocationPanel.vue`.

3. **[M1]** Add `warnings: string[]` to `extractStatPoints` return value. Populate when individual stat point extraction yields negative values before clamping.

4. **[M2]** Change `StatAllocationPanel.vue` submit disabled condition to allow partial allocation. The server already supports it.

5. **[M3]** Replace `gap: 4px` with `gap: $spacing-xs` in `_level-up-notification.scss`.
