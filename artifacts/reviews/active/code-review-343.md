---
review_id: code-review-343
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-117
domain: combat
commits_reviewed:
  - 8cc1b195
  - 4bdc700d
files_reviewed:
  - app/composables/useOutOfTurnState.ts
  - app/stores/encounter.ts
  - app/components/encounter/PriorityActionPanel.vue
  - app/pages/gm/index.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-05T12:00:00Z
follows_up: null
---

## Review Scope

Refactoring-117 extracts 11 out-of-turn reactive getters from `app/stores/encounter.ts` into a new `app/composables/useOutOfTurnState.ts` composable. The goal is to reduce the encounter store below the 800-line project limit. Two commits were reviewed:

1. `8cc1b195` -- Created `useOutOfTurnState.ts` with all 11 getters as `computed` refs.
2. `4bdc700d` -- Removed the getters from the store, updated `PriorityActionPanel.vue` and `gm/index.vue` to use the composable.

## Issues

No issues found.

## Verification Details

**Behavioral equivalence confirmed.** All 11 extracted getters were compared line-by-line against the original store getters. The logic is identical:

- Store getters accessed `state.encounter?.pendingOutOfTurnActions` etc. The composable accesses `encounterStore.encounter?.pendingOutOfTurnActions` -- semantically identical since Pinia exposes state on the store instance.
- `isBetweenTurns` forwarded `state.betweenTurns` in the store. The composable reads `encounterStore.betweenTurns` -- same value, same reactivity.
- Vue `computed()` refs are cached and reactive, matching Pinia getter behavior exactly.

**No orphaned consumers.** A codebase-wide search for `encounterStore.pendingAoOs`, `encounterStore.isBetweenTurns`, `encounterStore.priorityEligibleCombatants`, and all other 11 extracted getter names returned zero results outside the composable itself. The only two files that consumed these getters were `PriorityActionPanel.vue` and `gm/index.vue`, both updated in the second commit.

**`AoOPrompt.vue` receives `pendingAoOs` as a prop** (not from the store), so it was never affected by this extraction. Same for `InterceptPrompt.vue`.

**Import cleanup correct.** The `OutOfTurnAction` type import was removed from `encounter.ts` since no remaining getter uses it. `AoOTrigger` and `InterruptTrigger` remain for the store's action method signatures.

**PriorityActionPanel simplification is correct.** The old code had `const eligibleCombatants = computed(() => encounterStore.priorityEligibleCombatants)` -- a redundant computed wrapping a Pinia getter. The new code assigns the composable's `ComputedRef` directly: `const eligibleCombatants = priorityEligibleCombatants`. This is cleaner and avoids double-wrapping.

**Line count verified.** The encounter store is now 723 lines (down from 1132 originally, 784 before the second commit). Well under the 800-line limit. The composable is 90 lines.

**Commit granularity is good.** First commit adds the new composable (additive, non-breaking). Second commit removes old getters and wires consumers (atomic swap). Each commit produces a working state.

**Decree compliance.** This is a pure structural refactoring with no behavioral changes. No combat logic was modified. Decrees 021 (League Battle phases), 033 (fainted switch timing), and all other combat domain decrees remain unaffected.

**CLAUDE.md files already updated.** Both `app/composables/CLAUDE.md` and `app/stores/CLAUDE.md` reference the new composable and the extraction. `app/components/encounter/CLAUDE.md` lists `useOutOfTurnState()` in its composable delegation table.

**app-surface.md is stale** but this is a collector/orchestrator concern, not the developer's responsibility. Lines 177, 179, and 181 still reference the getters as being on the store. This will be corrected during the next collection cycle and is not blocking.

## What Looks Good

- Clean 1:1 extraction with no logic changes. The composable is a faithful copy of the store getters with the only difference being the reactive source (`encounterStore` vs `state`).
- Good composable structure: single responsibility, clear JSDoc, proper typing with explicit return types on all computed refs.
- Proper Nuxt auto-import convention (`use` prefix, exported named function).
- Consumer updates are minimal and correct -- only the two files that actually used the extracted getters were changed.
- The comment `// Out-of-turn getters extracted to useOutOfTurnState composable (refactoring-117)` left in the store provides a breadcrumb for future developers.

## Verdict

**APPROVED.** This is a clean, well-executed extraction refactoring. No behavioral changes, no missed consumers, correct reactivity, and the store is now well under the 800-line limit.

## Required Changes

None.
