---
review_id: code-review-064
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-023
domain: combat
commits_reviewed:
  - 9f54006
files_reviewed:
  - app/composables/useMoveCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/utils/damageCalculation.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
scenarios_to_rerun:
  - combat-accuracy
reviewed_at: 2026-02-20T12:00:00Z
---

## Review Scope

Review of bug-023 fix: Speed Evasion was ignored in accuracy auto-selection. The fix adds `Math.max(matchingEvasion, speedEvasion)` to both client (composable) and server (API endpoint) code paths. Commit `9f54006` (code changes only; the commit also contains bug-026 docs updates which are out of scope).

## Issues

### CRITICAL

None.

### HIGH

1. **`evasionTypeLabel` is now misleading** -- `app/composables/useMoveCalculation.ts:97-99`

   The label always displays "Phys Evasion" or "Spec Evasion" based on damage class, but `getTargetEvasion()` now returns the *maximum* of the damage-class-matching evasion and Speed Evasion. When Speed Evasion wins, the UI shows the wrong label for the evasion value being used.

   This is displayed in `MoveTargetModal.vue:85`:
   ```vue
   <span class="evasion-label">{{ evasionTypeLabel }}:</span>
   <span class="evasion-value">+{{ getTargetEvasion(target.id) }}</span>
   ```

   The GM sees "Phys Evasion: +4" when the actual evasion is Speed Evasion +5. This is actively misleading.

   **Current code:**
   ```typescript
   const evasionTypeLabel = computed((): string => {
     return move.value.damageClass === 'Physical' ? 'Phys Evasion' : 'Spec Evasion'
   })
   ```

   **Fix:** Make the label per-target and reflect which evasion was actually selected. Since `evasionTypeLabel` is a single computed but evasion selection is per-target, the cleanest fix is to either:
   - (a) Return a `{ value, label }` pair from `getTargetEvasion` (breaking change to callers), or
   - (b) Add a new `getTargetEvasionLabel(targetId)` function that mirrors the logic in `getTargetEvasion` and returns "Phys Evasion", "Spec Evasion", or "Speed Evasion", then use it in the template.

   Option (b) is lower risk. The label function should compare the matching evasion vs speed evasion and return the winner's name.

### MEDIUM

None.

## What Looks Good

- The core fix is correct: `Math.max(matchingEvasion, speedEvasion)` on both client and server paths matches the PTU p.234 rule exactly.
- Server-side code already calculated `speedEvasion` but never used it in selection -- the fix cleanly wires it in without restructuring.
- Client-side code correctly pulls `calculateSpeedEvasion` from `useCombat()` and `getPokemonSpeedStat` from `useEntityStats()` -- no new dependencies invented.
- The `evasionBonus` (from `stages.evasion`) is correctly applied to Speed Evasion the same way it applies to Physical/Special -- consistent with PTU rules.
- The `AccuracyCalcResult.applicableEvasion` docstring was updated to reflect the new behavior.
- Both code paths (composable for client-side preview, API for server-side calculation) are in sync.

## Verdict

CHANGES_REQUIRED -- The evasion label in `MoveTargetModal` is misleading when Speed Evasion is the winning evasion. The fix is ~15 lines (new function + template update) and should be done while the developer is already in this code.

## Required Changes

1. Add `getTargetEvasionLabel(targetId: string): string` to `useMoveCalculation.ts` that returns "Phys Evasion", "Spec Evasion", or "Speed Evasion" based on which evasion value won the `Math.max`. Export it from the composable.
2. Replace `evasionTypeLabel` usage in `MoveTargetModal.vue:85` with `getTargetEvasionLabel(target.id)`.
3. The old `evasionTypeLabel` computed can be removed or kept for backward compat -- removing is preferred since it is now incorrect.

## Scenarios to Re-run

- combat-accuracy: Accuracy threshold calculations use evasion selection; the label fix doesn't change calculation logic but needs visual verification.
