---
review_id: code-review-069
review_type: code
reviewer: senior-reviewer
trigger: follow-up
follows_up: code-review-064
target_report: bug-023
domain: combat
commits_reviewed:
  - ffdf19a
files_reviewed:
  - app/composables/useMoveCalculation.ts
  - app/components/encounter/MoveTargetModal.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun: []
reviewed_at: 2026-02-20T14:00:00Z
---

## Review Scope

Follow-up review of bug-023 fix (commit `ffdf19a`). The previous review (code-review-064) required three changes:
1. Add `getTargetEvasionLabel(targetId: string): string` to `useMoveCalculation.ts`
2. Replace `evasionTypeLabel` usage in `MoveTargetModal.vue` with `getTargetEvasionLabel(target.id)`
3. Remove the old `evasionTypeLabel` computed

## Verification of Required Changes

### 1. `getTargetEvasionLabel` added -- CONFIRMED

New function at `useMoveCalculation.ts:132-158`. Logic mirrors `getTargetEvasion` (lines 97-125) exactly:
- Same null guard returning `'Evasion'` as fallback (line 134)
- Same `getStageModifiers` + `evasionBonus` extraction (lines 136-138)
- Same speed evasion calculation from `calculateSpeedEvasion(speedStat, stages.speed, evasionBonus)` (lines 140-143)
- Same Physical/Special branching on `move.value.damageClass` (lines 145-157)
- Returns `'Speed Evasion'` when speed wins, `'Phys Evasion'` or `'Spec Evasion'` otherwise

Tie-breaking is consistent with `getTargetEvasion`: when physEvasion === speedEvasion (or specEvasion === speedEvasion), `Math.max` returns the equal value and the label defaults to the damage-class-specific name. This is correct -- when tied, the defender gains no advantage from Speed Evasion, so labeling with the standard evasion type is accurate.

### 2. Template updated -- CONFIRMED

`MoveTargetModal.vue:85` now reads:
```vue
<span class="evasion-label">{{ getTargetEvasionLabel(target.id) }}:</span>
```

The destructured imports at line 259 include `getTargetEvasionLabel` and no longer include `evasionTypeLabel`.

### 3. Old `evasionTypeLabel` removed -- CONFIRMED

Grep for `evasionTypeLabel` across the codebase returns zero hits outside of documentation artifacts (ticket bug-023.md and code-review-064.md). The computed is fully removed from `useMoveCalculation.ts` and from the composable's return object.

## Edge Cases Checked

- **Move with no accuracy check (`move.ac` is falsy):** The evasion preview is gated by `v-else-if="selectedTargets.includes(target.id) && move.ac && !hasRolledAccuracy"` (line 84), so `getTargetEvasionLabel` is never called for status moves. No issue.
- **Target with null entity:** The function returns `'Evasion'` as a safe fallback (line 134). The template also won't reach this line since targets without entities won't render meaningfully, but the guard is there.
- **Human targets:** `getHumanStat(entity, 'speed')` / `getHumanStat(entity, 'defense')` / `getHumanStat(entity, 'specialDefense')` are used for non-pokemon targets -- same as `getTargetEvasion`. Consistent.

## What Looks Good

- The new function mirrors `getTargetEvasion` line-for-line, meaning the label will always reflect the same evasion that was selected for the accuracy threshold. There is zero drift risk between value and label.
- The JSDoc comment (lines 127-131) clearly documents the purpose: "which evasion type won the Math.max selection."
- Clean removal of the old computed with no dead references left behind.
- The diff is minimal and focused -- only the two files that needed changing were touched.

## Verdict

APPROVED -- All three required changes from code-review-064 are implemented correctly. The new `getTargetEvasionLabel` function is logically consistent with `getTargetEvasion`, the template uses it correctly per-target, and the old misleading computed is fully removed.
