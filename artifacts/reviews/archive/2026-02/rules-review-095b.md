---
review_id: rules-review-095b
follows_up: rules-review-095
ticket_id: ptu-rule-074
commits: ["a0ff335"]
verdict: PASS
date: 2026-02-20
---

# Rules Review 095b -- Pass Action Follow-Up (ptu-rule-074)

## Verdict: PASS

The single-line fix correctly addresses the FAIL from rules-review-095. All four action flags are now set on pass, matching PTU turn forfeiture semantics and resolving the `combatantsWithActions` getter bug.

---

## Scope

- `app/server/api/encounters/[id]/pass.post.ts` (one-line addition)

## PTU Reference

- **Action Types (Chapter 7, p.227):** "each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn"
- **Paralysis (p.1557):** "they cannot take any Standard, Shift, or Swift Actions" -- all three forfeited together
- **Flinch (p.1610) / Frozen (p.1544):** broader "may not act" language encompassing all actions

Passing is the voluntary equivalent of these forced forfeitures. All three action types must be consumed.

---

## Verification

### V1 -- All 4 flags set [PASS]

The turnState spread now reads (lines 31-37 of `pass.post.ts`):

```typescript
combatant.turnState = {
  ...combatant.turnState,
  hasActed: true,
  standardActionUsed: true,
  shiftActionUsed: true,
  swiftActionUsed: true
}
```

All four flags are present and set to `true`. This matches the "all actions forfeited" semantic.

### V2 -- `combatantsWithActions` getter resolved [PASS]

The getter in `app/stores/encounter.ts` (line 87) uses:

```typescript
return !ts.hasActed || !ts.standardActionUsed || !ts.shiftActionUsed || !ts.swiftActionUsed
```

With all four flags `true`, every negation evaluates to `false`, and the OR chain evaluates to `false`. The passed combatant is correctly excluded from the "has actions remaining" list. The functional bug identified in rules-review-095 F1 is resolved.

### V3 -- Log message still accurate [PASS]

The log entry "Passed turn -- all actions forfeited" (line 49) now correctly describes the actual behavior. No change was needed here.

### V4 -- Immutability preserved [PASS]

The spread pattern `{ ...combatant.turnState, ... }` creates a new object rather than mutating properties in place. Consistent with codebase conventions.

---

## Summary

| ID | Description | Verdict |
|----|-------------|---------|
| V1 | All 4 action flags set to `true` | PASS |
| V2 | `combatantsWithActions` getter no longer returns passed combatants | PASS |
| V3 | Log message matches behavior | PASS |
| V4 | Immutability pattern preserved | PASS |

No further action required. The pass action now correctly forfeits Standard, Shift, and Swift actions per PTU 1.05 rules.
