---
review_id: rules-review-095
ticket_id: ptu-rule-074
commits: ["10184f3", "1503c04"]
verdict: FAIL
date: 2026-02-20
---

# Rules Review 095 -- Pass Action (ptu-rule-074)

## Verdict: FAIL

One PTU correctness issue found. The fix correctly moves the mutation to a server endpoint (architecture goal achieved), but the pass action does not forfeit the Swift Action, which contradicts PTU rules and causes a downstream bug in the `combatantsWithActions` getter.

---

## Scope

- `app/server/api/encounters/[id]/pass.post.ts` (new endpoint)
- `app/stores/encounterCombat.ts` (new `pass()` method)
- `app/composables/useEncounterActions.ts` (mutation replaced with server call)

## PTU Reference

- **Action Types (p.227):** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order."
- **Paralysis (p.1557):** "they cannot take any Standard, Shift, or Swift Actions" -- all three are forfeited together when a combatant loses their turn.
- **Flinch (p.1610):** "You may not take actions during your next turn" -- all actions forfeited.
- **Frozen (p.1544):** "The target may not act on their turn" -- all actions forfeited.

**Note:** PTU 1.05 does not define a formal "pass your turn" action. Passing is an implicit GM-level convention where a combatant voluntarily declines to use remaining actions. The closest defined mechanic is "hold action" (delay to lower initiative). The implementation correctly treats pass as "forfeit all remaining actions."

---

## Findings

### F1 -- `swiftActionUsed` not set on pass [MEDIUM - PTU correctness]

**Location:** `app/server/api/encounters/[id]/pass.post.ts`, lines 30-36

**Issue:** The pass endpoint sets `hasActed`, `standardActionUsed`, and `shiftActionUsed` to true, but does not set `swiftActionUsed` to true.

```typescript
// Current code
combatant.turnState = {
  ...combatant.turnState,
  hasActed: true,
  standardActionUsed: true,
  shiftActionUsed: true
  // swiftActionUsed is NOT set
}
```

**Why this matters (PTU rules):** Every PTU rule that describes a combatant losing their turn forfeits ALL action types -- Standard, Shift, AND Swift. Paralysis explicitly lists all three: "they cannot take any Standard, Shift, or Swift Actions" (p.1557). Flinch and Frozen use broader language that encompasses all actions. Passing is the voluntary equivalent -- the combatant is done acting. Leaving Swift available after a pass contradicts the semantic meaning of "all actions forfeited."

**Why this matters (code correctness):** The `combatantsWithActions` getter in `app/stores/encounter.ts` (line 87) checks all four flags:

```typescript
return !ts.hasActed || !ts.standardActionUsed || !ts.shiftActionUsed || !ts.swiftActionUsed
```

If `swiftActionUsed` remains false after a pass, the combatant will still appear in the `combatantsWithActions` list. This means the UI will show a passed combatant as still having actions available, which is a functional bug.

**Fix:** Add `swiftActionUsed: true` to the spread:

```typescript
combatant.turnState = {
  ...combatant.turnState,
  hasActed: true,
  standardActionUsed: true,
  shiftActionUsed: true,
  swiftActionUsed: true
}
```

### F2 -- Log message is accurate [PASS]

The move log entry reads "Passed turn -- all actions forfeited." This correctly describes the intent. Once F1 is fixed, the message will match the actual behavior.

### F3 -- Endpoint structure follows established patterns [PASS]

The endpoint correctly mirrors the `sprint.post.ts` and `breather.post.ts` patterns: load encounter, find combatant, apply state change with spread, update move log, persist, return `buildEncounterResponse`. No concerns.

### F4 -- Store method follows established patterns [PASS]

The `pass()` method in `encounterCombat.ts` matches the `sprint()` and `takeABreather()` wrappers. Returns `response.data` (the encounter object) to the caller, which replaces the store state.

### F5 -- Client-side call is correct [PASS]

The composable now calls `encounterCombatStore.pass(encounterId, combatantId)` and assigns the response to `encounterStore.encounter`, replacing the reactive state with the server-returned snapshot. No reactive mutation occurs on the client side.

---

## Summary

| ID | Severity | Description | Verdict |
|----|----------|-------------|---------|
| F1 | MEDIUM | `swiftActionUsed` not set, causes `combatantsWithActions` bug | FAIL |
| F2 | -- | Log message accurate | PASS |
| F3 | -- | Endpoint follows established patterns | PASS |
| F4 | -- | Store method follows established patterns | PASS |
| F5 | -- | Client-side call is correct | PASS |

**Action required:** Set `swiftActionUsed: true` in `pass.post.ts` to complete the "all actions forfeited" behavior and fix the `combatantsWithActions` getter interaction.
