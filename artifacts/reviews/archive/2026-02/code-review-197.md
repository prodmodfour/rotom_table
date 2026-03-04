---
review_id: code-review-197
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-099+104
domain: combat
commits_reviewed:
  - 65cfcc8
  - 654b97b
  - b9e452a
  - 44e9b49
  - 7d757e0
files_reviewed:
  - app/server/api/encounters/[id]/stages.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/services/combatant.service.ts
  - app/server/services/encounter.service.ts
  - app/components/encounter/StatusConditionsModal.vue
  - app/utils/typeStatusImmunity.ts
  - app/constants/statusConditions.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-27T10:02:00Z
follows_up: code-review-192
---

## Review Scope

Re-review of fix cycle 2 for ptu-rule-099 (dynamic initiative reorder on Speed CS change, decree-006) and ptu-rule-104 (type-based status immunity enforcement, decree-012). Five commits total, with the primary focus on commit 65cfcc8 which addresses the CRITICAL-1 issue from code-review-192 and the HIGH-1 issue from rules-review-169.

Both previous reviews identified the same root cause: `stageResult.changes.speed?.change !== 0` in `stages.post.ts` evaluates to `true` when `speed` is not in the changes object at all, because `undefined !== 0` is `true` in JavaScript. This caused initiative reorders to trigger on ALL stage change operations, not just speed changes.

## Decrees Checked

- **decree-006** (initiative-speed-cs): Dynamic initiative reorder on speed CS change. All three trigger points (stages.post.ts, breather.post.ts, status.post.ts) verified against decree requirements.
- **decree-012** (type-immunity-enforcement): Server-side type-immunity check with GM override. Implementation verified in status.post.ts and StatusConditionsModal.vue.
- **decree-005** (status-cs-auto-apply): Auto-apply/reverse CS from status conditions. Verified in combatant.service.ts and breather.post.ts re-apply cycle.

No decree violations found.

## Fix Verification

### CRITICAL-1 Fix (65cfcc8): stages.post.ts speedChanged check -- RESOLVED

**Previous code (commit 7d757e0):**
```typescript
const speedChanged = stageResult.changes.speed?.change !== 0
```

**Fixed code (commit 65cfcc8):**
```typescript
const speedChanged = stageResult.changes.speed != null && stageResult.changes.speed.change !== 0
```

Trace through all scenarios:

1. **GM sends `{ attack: 2 }` (no speed key):** `updateStageModifiers` only iterates over `{ attack: 2 }`, so `stageResult.changes` = `{ attack: { previous: 0, change: 2, current: 2 } }`. `stageResult.changes.speed` = `undefined`. `undefined != null` = `false`. Short-circuits to `speedChanged = false`. CORRECT -- no initiative reorder.

2. **GM sends `{ speed: 2 }` and speed was at 0:** `stageResult.changes.speed` = `{ previous: 0, change: 2, current: 2 }`. `speed != null` = `true`. `change !== 0` = `true` (2). `speedChanged = true`. CORRECT -- initiative reorder triggers.

3. **GM sends `{ speed: 2 }` but speed already at +6 (clamped):** `stageResult.changes.speed` = `{ previous: 6, change: 0, current: 6 }`. `speed != null` = `true`. `change !== 0` = `false`. `speedChanged = false`. CORRECT -- no reorder for no-op changes.

4. **GM sends `{ speed: -1, attack: 2 }` with speed at 0:** `stageResult.changes.speed` = `{ previous: 0, change: -1, current: -1 }`. `speed != null` = `true`. `change !== 0` = `true`. `speedChanged = true`. CORRECT -- reorder triggers.

The fix uses the exact pattern recommended in code-review-192 (`!= null` null check before delta comparison). The `!= null` operator correctly rejects both `undefined` and `null`, which is the right check here since `stageResult.changes` is a `Record<string, ...>` where absent keys return `undefined`.

No similar buggy patterns exist elsewhere in the codebase. The `status.post.ts` trigger uses `effect?.stat === 'speed'` which is safe because `undefined === 'speed'` is `false` (strict equality with a string, unlike the `!== 0` footgun). The `breather.post.ts` trigger uses explicit before/after value comparison, also safe.

### HIGH-1 Fix (rules-review-169): Same as CRITICAL-1 -- RESOLVED

The game logic perspective of this bug was the same root cause. The spurious tie-breaker re-rolls that were corrupting turn order on non-speed stage changes are now eliminated by the null guard. Only actual speed CS changes trigger `reorderInitiativeAfterSpeedChange`, which is the only codepath that calls `sortByInitiativeWithRollOff` (the function that re-rolls d20 tie-breakers).

## All Commits Reviewed

### 65cfcc8: fix: correct speedChanged check to avoid false positive on non-speed stage changes
Single-line fix in `stages.post.ts`. Correctly resolves CRITICAL-1/HIGH-1. Commit message accurately describes the bug and fix.

### 654b97b: fix: only trigger breather initiative reorder when speed CS actually changed
Captures `speedCsBefore` before the reset+reapply cycle and compares with `speedCsAfter` afterward. The comparison `speedCsBefore !== speedCsAfter` correctly handles all edge cases:
- Non-speed stages only: speed unchanged, no reorder.
- Speed CS with no surviving conditions: speed resets to 0, reorder triggers.
- Paralysis surviving breather: speed goes from -4 to 0 (reset) to -4 (re-applied), net unchanged, no reorder.
The `speedCsBefore` is captured from `stages.speed ?? 0` and `speedCsAfter` from `entity.stageModifiers?.speed ?? 0`, both using nullish coalescing to 0 which is correct since default CS is 0.

### b9e452a: refactor: replace mutable array ops with immutable patterns in StatusConditionsModal
`toggleStatus` correctly uses `[...statusInputs.value, status]` for add and `.filter(s => s !== status)` for remove. Both create new arrays instead of mutating the ref's underlying array. Follows project immutability conventions.

### 44e9b49: fix: reset turnState in resetCombatantsForNewRound
The `turnState` object is now reset alongside legacy fields (`hasActed`, `actionsRemaining`, `shiftActionsRemaining`, `readyAction`). The reset values match the defaults used in `buildCombatantFromEntity` (combatant.service.ts line 738-745). The `resetResolvingTrainerTurnState` helper (line 191-206) in the same file also correctly resets `turnState` for League Battle resolution phase transitions.

### 7d757e0: fix: only trigger initiative reorder on actual speed CS change
Original fix that introduced the `?.change !== 0` pattern (subsequently corrected in 65cfcc8). The commit correctly identifies the problem with `'speed' in body.changes` but the implementation had the undefined footgun. Now superseded by 65cfcc8.

## What Looks Good

1. **Three trigger points are now consistent and correct.** Each uses a different but appropriate detection mechanism:
   - `stages.post.ts`: Checks if speed is in the result changes and had non-zero delta (null guard + value check).
   - `breather.post.ts`: Compares speed CS before and after the full reset+reapply cycle (value comparison).
   - `status.post.ts`: Checks if any changed status has a speed CS effect via the status constants lookup (semantic check).
   All three patterns are safe from the `undefined !== 0` footgun.

2. **Decree compliance is thorough.** Decree-006 (dynamic reorder, no extra turns) is implemented via the acted/unacted split in `reorderInitiativeAfterSpeedChange`. Decree-012 (server-side immunity with override) is implemented in `status.post.ts` with 409 rejection and `body.override` escape hatch. Decree-005 (auto-CS from statuses) is implemented in `applyStatusCsEffects`/`reverseStatusCsEffects`/`reapplyActiveStatusCsEffects`.

3. **No regressions detected.** The `resetCombatantsForNewRound` fix does not interfere with League Battle phases -- the `resetResolvingTrainerTurnState` function handles its own separate reset path. The immutability refactor in StatusConditionsModal does not change any behavior, only reactivity correctness.

4. **Commit granularity is correct.** Each commit addresses exactly one concern with a clear, descriptive message. The 65cfcc8 fix commit accurately describes both the bug mechanism and the resolution.

5. **Type-immunity system is clean.** `typeStatusImmunity.ts` is a well-structured pure utility with four focused exports. The server/client integration is clean: server rejects with 409 + informative message, client shows IMMUNE tags and provides a Force Apply button that sends the `override` flag.

## Verdict

**APPROVED**

All five issues from the original code-review-186 are now correctly resolved across two fix cycles. The CRITICAL-1 speedChanged false positive from code-review-192 is fixed with the proper null guard pattern. No new issues found. The initiative reorder system, type-immunity enforcement, and supporting fixes (turnState reset, immutability refactor, breather speed tracking) are all correct and complete.

## Required Changes

None.
