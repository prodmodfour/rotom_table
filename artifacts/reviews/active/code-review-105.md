# Code Review 105 -- ptu-rule-074: Pass action reactive mutation

**Ticket:** ptu-rule-074
**Commits:** `10184f3`, `1503c04`
**Author:** prodmodfour
**Reviewer:** Senior Reviewer
**Date:** 2026-02-20

---

## Verdict: CHANGES_REQUIRED

---

## Summary

The fix replaces a direct reactive mutation in `handleExecuteAction()` (the `pass` case) with a server-persisted endpoint, matching the pattern established by `sprint.post.ts` and `breather.post.ts`. Three files were changed:

1. **`app/server/api/encounters/[id]/pass.post.ts`** -- new server endpoint that marks turnState flags as used and logs to move history
2. **`app/stores/encounterCombat.ts`** -- thin `$fetch` wrapper (`pass()` method)
3. **`app/composables/useEncounterActions.ts`** -- replaced the 4-line reactive mutation with an `await encounterCombatStore.pass()` call

A fourth commit (`1503c04`) updates the ticket with a resolution log.

## Checklist

### 1. Pattern consistency with sprint.post.ts

**Good.** The endpoint structure is a faithful match:
- Same imports (`prisma`, `loadEncounter`, `findCombatant`, `buildEncounterResponse`, `getEntityName`)
- Same validation pattern (check `id`, check `body.combatantId`)
- Same try/catch with HTTP error re-throw
- Same `buildEncounterResponse` return shape
- Move log entry structure matches (id, round, actorId, actorName, moveName, targets, notes)

### 2. No remaining `.turnState.` mutations in client code

**Confirmed clean.** Grep for `\.turnState\.` across `composables/`, `stores/`, and `components/` returns zero matches. All remaining `turnState` references in client code are read-only:
- `stores/encounter.ts:86-87` -- read-only getter (`combatantsWithActions`)
- `stores/encounter.ts:384` -- sync handler replacing turnState from server response (not mutation)
- `components/encounter/GMActionModal.vue` -- all template bindings, computed reads, and `:disabled` checks

### 3. WebSocket chain

**Not required.** Neither `sprint.post.ts` nor `breather.post.ts` call `broadcastToGroup()` from the server side. All three maneuver endpoints rely on the client-side `broadcastUpdate()` call at line 171 of `useEncounterActions.ts`, which fires after `handleExecuteAction()` completes. The pass endpoint is consistent with this pattern.

### 4. Move log entry format

**Correct.** The log entry follows the same shape as Sprint and Take a Breather:
```typescript
{ id, round, actorId, actorName, moveName: 'Pass', targets: [], notes: '...' }
```

### 5. Store method pattern

**Correct.** The `pass()` method in `encounterCombat.ts` is structurally identical to `sprint()` and `takeABreather()` -- async, takes `(encounterId, combatantId)`, calls `$fetch` with POST, returns `response.data`.

### 6. Immutability on the server side

**Good.** The endpoint uses `{ ...combatant.turnState, hasActed: true, ... }` spread pattern rather than direct property assignment. This is actually more consistent than `breather.post.ts` lines 98-99 which use direct assignment (`combatant.turnState.standardActionUsed = true`). Both approaches work correctly on server-side plain JSON objects, but the spread pattern in `pass.post.ts` is the better style.

### 7. Composable integration

**Correct.** The composable assigns the server response back to `encounterStore.encounter`, replacing the entire encounter object. This is the same immutable replacement pattern used by Sprint and Take a Breather.

## Issues

### MEDIUM: `swiftActionUsed` not set to true (M1)

**File:** `app/server/api/encounters/[id]/pass.post.ts`, line 31-36

The `TurnState` interface (`types/combat.ts:43-55`) includes six fields: `hasActed`, `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed`, `canBeCommanded`, and `isHolding`. The pass endpoint only sets the first three to `true`:

```typescript
combatant.turnState = {
  ...combatant.turnState,
  hasActed: true,
  standardActionUsed: true,
  shiftActionUsed: true
  // missing: swiftActionUsed: true
}
```

The store getter `combatantsWithActions` (encounter.ts:86-87) checks all four action flags:
```typescript
return !ts.hasActed || !ts.standardActionUsed || !ts.shiftActionUsed || !ts.swiftActionUsed
```

This means a combatant who passes will still appear in `combatantsWithActions` if `swiftActionUsed` is `false` at the time of the pass. "Pass" semantically forfeits all remaining actions, so `swiftActionUsed` should also be set to `true`.

**Note:** This is a pre-existing bug -- the original client-side mutation also only set three flags. The developer faithfully replicated the existing behavior. However, since this endpoint is the definitive fix for the pass action, it should be correct rather than bug-compatible. Fix it now rather than filing a separate ticket.

**Fix:** Add `swiftActionUsed: true` to the spread object in `pass.post.ts`.

## Observations filed as tickets

None required -- the `swiftActionUsed` omission is small enough to fix inline with this commit.

## Final Notes

Clean, well-structured work. The endpoint follows the established pattern precisely, the store method is correct, and the reactive mutation is fully eliminated. The only required change is adding `swiftActionUsed: true` to make the pass action complete. Once that one-line fix is applied, this is APPROVED.
