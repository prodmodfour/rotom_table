---
review_id: code-review-264
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-016
domain: combat
commits_reviewed:
  - 974b2073
  - e8e9456e
  - ee7d29e8
  - 6ea734f2
  - 4f868a57
  - cd1c7cd4
  - a50c3b14
  - 1fa94a71
  - 2015015f
  - d4b32319
  - 7a911ffc
files_reviewed:
  - app/stores/encounter.ts
  - app/server/services/out-of-turn.service.ts
  - app/server/api/encounters/[id]/hold-action.post.ts
  - app/server/api/encounters/[id]/release-hold.post.ts
  - app/server/api/encounters/[id]/priority.post.ts
  - app/server/api/encounters/[id]/interrupt.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/components/encounter/PriorityActionPanel.vue
  - app/components/encounter/HoldActionButton.vue
  - app/pages/gm/index.vue
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 1
reviewed_at: 2026-03-01T23:15:00Z
follows_up: code-review-259
---

## Review Scope

Re-review of feature-016 P1 fix cycle. 11 commits by slave-1 (plan-20260301-220000) addressing all issues from code-review-259 (2C + 4H + 5M) and rules-review-235 (2H + 1M). Verified each fix against the original issue description and checked for regressions or new issues introduced by the fixes.

## Verification of Previous Issues

### CRITICAL Issues (code-review-259)

#### CRIT-001: `betweenTurns` never set to `true` -- RESOLVED

**Commit:** 974b2073

The fix adds `this.betweenTurns = true` in the store's `nextTurn()` action after `this.encounter = response.data` (line 459). The GM page (`app/pages/gm/index.vue`) now renders `PriorityActionPanel` when `encounterStore.isBetweenTurns && encounter.isActive` (line 49). Two handlers are wired: `handlePriorityDeclaration` (calls `declarePriority`, broadcasts WS, refreshes undo) and `handlePriorityProceed` (calls `exitBetweenTurns`). The `declarePriority` store action sets `this.betweenTurns = false` (line 1025) after the server call succeeds.

Verified: The priority declaration window is now reachable. The between-turns state is entered after every `nextTurn` call and exited either by declaring priority or clicking "No Priority -- Continue."

#### CRIT-002: Standard Priority duplicate `turnOrder` entry -- RESOLVED

**Commit:** e8e9456e

The fix in `priority.post.ts` (lines 100-105) searches for the combatant's original entry after the insertion point (`turnOrder.indexOf(combatantId, currentTurnIndex + 1)`) and removes it with `splice`. This correctly handles the case where the combatant's ID was shifted right by 1 after the Priority insertion.

Verified: After a Standard Priority, the combatant appears exactly once in the turn order at the insertion point. Their original position is removed.

### HIGH Issues (code-review-259)

#### HIGH-001: `nextTurn()` doesn't return `holdReleaseTriggered` -- RESOLVED

**Commit:** 974b2073 (same commit as CRIT-001)

The store's `nextTurn()` method now includes `holdReleaseTriggered` in both the `$fetch` generic type (line 453) and the return value (line 462). The return type signature includes `holdReleaseTriggered: Array<{ combatantId: string }>` (line 445).

Verified: The data flows from server through store to caller. The GM page's `nextTurn` function receives the result but does not yet display hold release notifications to the GM. This is acceptable for P1 -- the data is surfaced; the UI notification is a P2 concern.

#### HIGH-002: `hold-action.post.ts` doesn't advance the turn -- RESOLVED

**Commit:** ee7d29e8

The fix adds turn advancement logic (lines 93-100): `currentTurnIndex = record.currentTurnIndex + 1` with a wrap-around check for Full Contact battles (`currentTurnIndex >= turnOrder.length && record.battleType !== 'trainer'`). The new index is persisted to the database (line 108) and passed to `buildEncounterResponse` (line 124).

Verified: After a hold action is declared, the turn advances to the next combatant. The holding combatant no longer appears as the active combatant.

#### HIGH-003: `applyAdvancedPriority` missing `standardActionUsed` -- RESOLVED

**Commit:** 6ea734f2

The fix adds `turnState: { ...combatant.turnState, standardActionUsed: true }` (lines 571-574) to the return object of `applyAdvancedPriority`. This matches the pattern in `applyLimitedPriority` and correctly consumes the Standard Action.

Verified: An Advanced Priority declaration now consumes the Standard Action, leaving only Shift + Swift for the combatant's normal turn.

#### HIGH-004: Unused import `removeFromHoldQueue` -- RESOLVED

**Commit:** 4f868a57

The import was removed from `next-turn.post.ts` line 22. The import now only includes `expirePendingActions, cleanupResolvedActions, checkHoldQueue`.

Verified: No unused imports remain.

### HIGH Issues (rules-review-235)

#### rules-HIGH-001: Advanced Priority must consume Standard Action -- RESOLVED

Same fix as HIGH-003 above (commit 6ea734f2). Both code-review-259 and rules-review-235 identified the same issue.

#### rules-HIGH-002: Interrupt `skipNextRound` too broad -- RESOLVED

**Commit:** cd1c7cd4

The fix in `applyInterruptUsage` (lines 642-645) narrows the `skipNextRound` condition from `isLeagueBattle && combatant.type === 'pokemon'` to `isLeagueBattle && combatant.type === 'pokemon' && combatant.turnState?.canBeCommanded === false`. The JSDoc (lines 633-636) now correctly documents that only switched-in Pokemon that cannot be commanded forfeit their next round turn.

Verified: The `canBeCommanded` field is set to `false` by the switching service (`canSwitchedPokemonBeCommanded`) when a Pokemon is released during a League Battle voluntary switch. This correctly targets only the specific PTU p.229 case.

### MEDIUM Issues (code-review-259)

#### MED-001: `app-surface.md` not updated -- RESOLVED

**Commit:** d4b32319

The fix adds comprehensive entries for all P1 surface elements: four new endpoints (hold-action, release-hold, priority, interrupt) with descriptions, the Hold/Priority/Interrupt system paragraph (component descriptions, store getters/actions, types, WebSocket events), and updated the out-of-turn service description to include Hold/Priority/Interrupt functions.

Verified: All new endpoints, components, store state, store actions, and WS events are documented.

#### MED-002: `encounter.ts` store exceeds 800-line limit -- RESOLVED (ticket filed)

The store is now at 1148 lines (grew by 16 lines from the fix cycle due to the `priorityEligibleCombatants` getter). Refactoring ticket `refactoring-117` was filed as `EXT-GOD` / `P3` with source `code-review-259 MED-002`. Acceptable for P1.

#### MED-003: Interrupt decline blocked by eligibility check -- RESOLVED

**Commit:** a50c3b14

The fix moves the `resolution === 'decline'` early return (lines 96-106) before the `canUseInterrupt()` eligibility check (line 109). A decline no longer validates eligibility -- it simply acknowledges the decline and returns the current encounter state.

Verified: A combatant that has already used their interrupt this round can now decline subsequent interrupt prompts without a 400 error.

#### MED-004: `checkHoldQueue` returns only the first match -- RESOLVED

**Commit:** 1fa94a71

The fix changes `checkHoldQueue` to build a `results` array and return all matching entries (lines 449-456). The return type is `Array<{ combatantId: string }>`. Both callers were updated: `next-turn.post.ts` (line 223) directly assigns the array result, and the encounter store's `nextTurn()` (line 462) uses `response.holdReleaseTriggered ?? []`.

Verified: Multiple held combatants whose target initiative is reached simultaneously will all be flagged for release.

#### MED-005: `PriorityActionPanel` client-side filter -- RESOLVED

**Commit:** 2015015f

The fix adds a `priorityEligibleCombatants` getter to the encounter store (lines 160-169) that applies the same filter logic (alive, not used Priority, not holding). The `PriorityActionPanel` now uses `encounterStore.priorityEligibleCombatants` instead of a local computed filter.

Verified: The component delegates eligibility to the store getter. The `combatants` prop is still accepted but the component uses the store getter for eligibility determination.

### MEDIUM Issues (rules-review-235)

#### rules-MEDIUM-002: `app-surface.md` not updated -- RESOLVED

Same fix as MED-001 above (commit d4b32319).

## New Issues Found

### HIGH

#### HIGH-001 (NEW): `release-hold.post.ts` creates duplicate `turnOrder` entry

**File:** `app/server/api/encounters/[id]/release-hold.post.ts` (line 85)

When a held combatant is released, `turnOrder.splice(currentTurnIndex, 0, combatantId)` inserts them at the current position. However, the combatant's original entry in the turn order was never removed when they held (hold-action.post.ts does not remove them from turnOrder -- it only advances currentTurnIndex past them). After release, the combatant's ID appears twice in the turn order: once at the insertion point (active turn) and once at their original position (already passed).

For League Battles this is acceptable because the turn order is rebuilt from `trainerTurnOrder`/`pokemonTurnOrder` at each phase transition. For Full Contact battles, the turn order persists across rounds. At round reset, `resetCombatantsForNewRound` resets `hasActed = false` for all combatants but does NOT deduplicate the turn order. The combatant would get two turns in every subsequent round.

This is the same class of bug as CRIT-002 (Standard Priority duplicate entry). The fix pattern is identical: after splicing the combatant in at the current position, find and remove their original entry:

```typescript
turnOrder.splice(currentTurnIndex, 0, combatantId)
// Remove the original entry to prevent duplicate turns
const originalIndex = turnOrder.indexOf(combatantId, currentTurnIndex + 1)
if (originalIndex !== -1) {
  turnOrder.splice(originalIndex, 1)
}
```

**Note:** This bug existed in the original P1 implementation and was NOT introduced by the fix cycle. However, it was missed by code-review-259 and must be fixed now. The CRIT-002 fix for priority.post.ts demonstrates the exact pattern to apply.

**Severity rationale:** HIGH rather than CRITICAL because (a) League Battles are unaffected (phase transitions rebuild turnOrder), (b) the combatant gets extra turns rather than losing turns (less harmful direction), and (c) the GM could manually notice and remove the duplicate. But it must be fixed before P2.

### MEDIUM

#### MED-001 (NEW): `interrupt.post.ts` file header comment is stale

**File:** `app/server/api/encounters/[id]/interrupt.post.ts` (lines 16-17)

The file header still says: "Per spec F3: In League Battles, Pokemon using Interrupt forfeit their next round turn (skipNextRound = true)." This was narrowed by commit cd1c7cd4 to only apply to uncommandable switched-in Pokemon (`canBeCommanded === false`). The `applyInterruptUsage` JSDoc in `out-of-turn.service.ts` was correctly updated, but the endpoint file header was not. Stale comments mislead future developers.

**Fix:** Update the comment to: "Per PTU p.229 + spec F3: In League Battles, only switched-in Pokemon that cannot be commanded this round forfeit their next round turn when using an Interrupt."

## Decree Compliance

- **decree-032** (Cursed tick on Standard Action only): Not relevant to this fix cycle. Tick damage logic in `next-turn.post.ts` was not modified. COMPLIANT.
- **decree-033** (Fainted switch on next turn): Not relevant to this fix cycle. No switching mechanics modified. COMPLIANT.
- **decree-040** (Flanking penalty after evasion cap): Not relevant to this fix cycle. No evasion/flanking logic. COMPLIANT.
- **decree-006** (Initiative reorder): `checkHoldQueue` still uses absolute initiative values per decree-006. COMPLIANT.
- **decree-021** (League Battle three-phase): Phase-specific handling in hold-action.post.ts correctly skips League Battle wrap-around. Priority and Interrupt are phase-agnostic as designed. COMPLIANT.

## What Looks Good

1. **Each fix is surgical and well-scoped.** Every commit addresses exactly one issue from the review, with clear commit messages referencing the issue ID (e.g., "CRIT-001", "HIGH-003", "MED-004"). The 11-commit granularity is exemplary.

2. **CRIT-002 fix is clean and defensive.** The `indexOf(combatantId, currentTurnIndex + 1)` search correctly accounts for the splice shifting the original entry right by 1. The `if (originalIndex !== -1)` guard handles edge cases where the original entry might not exist.

3. **MED-004 (checkHoldQueue) correctly propagated the type change.** The return type change from `{ combatantId: string } | null` to `Array<{ combatantId: string }>` was consistently updated in the service function, the `next-turn.post.ts` caller, and the store's `nextTurn()` return type and value. No type mismatches.

4. **MED-003 (interrupt decline ordering) is the correct pattern.** Early-returning for declines before eligibility validation matches the established pattern in `aoo-resolve.post.ts`, which checks eligibility only for accepts.

5. **MED-005 store getter is well-placed.** The `priorityEligibleCombatants` getter (lines 160-169) sits alongside `holdingCombatants`, `pendingInterrupts`, and other P1 getters in the getters block. The filter logic is identical to what was in the component, ensuring no behavior change.

6. **Hold action turn advance handles Full Contact wrap-around.** The `currentTurnIndex >= turnOrder.length && record.battleType !== 'trainer'` check (line 98) correctly avoids wrapping for League Battles (where phase transitions handle the wrap).

7. **Immutability is preserved throughout the fix cycle.** All service functions return new objects. Store updates go through `this.encounter = response.data`. No mutation patterns were introduced.

8. **The GM page PriorityActionPanel integration follows established patterns.** The `handlePriorityDeclaration` handler captures an undo snapshot, calls the store action, broadcasts via WebSocket, and refreshes undo/redo state -- exactly matching the patterns used for `nextTurn`, `executeMove`, and other GM actions.

## Verdict

**APPROVED**

All 11 issues from code-review-259 and rules-review-235 are verified as resolved. The fixes are clean, well-scoped, and follow established patterns. One new HIGH issue was found (`release-hold.post.ts` duplicate turnOrder entry) and one new MEDIUM issue (stale comment in `interrupt.post.ts`), but neither was introduced by the fix cycle -- they are pre-existing issues from the original P1 implementation that were missed in the first review.

The new HIGH-001 must be fixed before P2 proceeds (it causes Full Contact combatants to get duplicate turns after hold-release). A separate ticket should be filed. The pattern for the fix was already demonstrated in commit e8e9456e (CRIT-002).

## Required Changes (Post-Approval)

These do NOT block the fix cycle approval but must be addressed before P2:

| Priority | Issue | File | Fix |
|----------|-------|------|-----|
| HIGH | NEW HIGH-001 | release-hold.post.ts | Remove original turnOrder entry after splicing in the released combatant (same pattern as CRIT-002 fix) |
| MEDIUM | NEW MED-001 | interrupt.post.ts | Update file header comment to reflect narrowed skipNextRound scope |
