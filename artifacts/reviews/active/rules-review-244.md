---
review_id: rules-review-244
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-042
domain: combat
commits_reviewed:
  - 7e11ecf8
  - b4894ae7
  - a547e791
mechanics_verified:
  - hold-action-release
  - turn-order-management
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#hold-action
  - core/07-combat.md#initiative
reviewed_at: 2026-03-02T12:00:00Z
follows_up: null
---

## Mechanics Verified

### Hold Action — Turn Order Invariant (One Turn Per Round)

- **Rule:** "Combatants can choose to hold their action until a specified lower Initiative value once per round." (`core/07-combat.md`, p.227, line 76-77)
- **Worked Example (p.232):** "Trainer A is next in Initiative this time, but he holds his action until after his Graveler acts. [...] Finally, Trainer A takes his held action and throws a second Poké Ball, this time hitting the mark and successfully capturing the Raticate." The example demonstrates one hold, one release, one turn — the combatant does not act twice.
- **Implementation:** After splice-inserting the released combatant at `currentTurnIndex`, the fix searches for the original entry at `indexOf(combatantId, currentTurnIndex + 1)` and removes it. This maintains the invariant that each combatant appears exactly once in `turnOrder`.
- **Status:** CORRECT

### Hold Action — Action Economy on Release

- **Rule:** PTU p.232 example shows Trainer A taking a full Standard Action (throwing a Poke Ball) on the released turn. The hold delays the combatant's entire turn, not individual actions.
- **Implementation:** `releaseHeldAction()` in `out-of-turn.service.ts` (line 417-436) grants: `hasActed: false`, `actionsRemaining: 2`, `shiftActionsRemaining: 1`, and resets all `turnState` flags (`standardActionUsed`, `shiftActionUsed`, `swiftActionUsed` all set to `false`). This grants a full Standard + Shift + Swift action turn, consistent with the PTU example.
- **Status:** CORRECT

### Hold Action — Once Per Round Limit

- **Rule:** "once per round" (`core/07-combat.md`, p.227, line 77)
- **Implementation:** `canHoldAction()` in `out-of-turn.service.ts` (line 352-375) checks `holdState.holdUsedThisRound` and rejects if already used. The `applyHoldAction()` function sets `holdUsedThisRound: true`.
- **Status:** CORRECT (not modified by this fix, verified for completeness)

### Turn Order Dedup Pattern — Correctness Analysis

- **Mechanism:** After `turnOrder.splice(currentTurnIndex, 0, combatantId)`:
  - The newly inserted entry is at index `currentTurnIndex`
  - All entries at `currentTurnIndex` and beyond are shifted right by 1
  - The original combatant entry (which was somewhere after the hold point) is now at `originalIndex >= currentTurnIndex + 1`
  - `indexOf(combatantId, currentTurnIndex + 1)` correctly finds the original (shifted) entry, skipping the just-inserted copy
  - `splice(originalIndex, 1)` removes only the original entry
- **Edge cases handled:**
  - Combatant held from position 0, released later: original shifts right, found and removed
  - Combatant held from last position, released at position 0: original at end, found and removed
  - Combatant not in turnOrder (defensive): `indexOf` returns -1, `if (originalIndex !== -1)` guard prevents crash
  - Single combatant: splice inserts duplicate, indexOf finds the second, removes it — result is single entry
- **Pattern parity with priority.post.ts:** The code at `release-hold.post.ts` lines 85-91 is character-identical to `priority.post.ts` lines 99-105 (the CRIT-002 fix). Both use the same splice+indexOf+splice pattern.
- **Status:** CORRECT

### Decree Compliance

- **decree-021** (League Battle two-phase system): Confirmed that League Battles rebuild turnOrder at phase transitions, making duplicates in turnOrder self-correcting for League mode. The fix is still correct defensively — it deduplicates regardless of battle type. No conflict.
- **decree-033** (Fainted switch on trainer's next turn): Hold-release and fainted switching are orthogonal mechanics. Hold-release inserts the combatant at the current position for their delayed turn. Fainted switching happens on the trainer's next initiative arrival. No timing conflict between these two systems.
- **Status:** No decree violations.

### All turnOrder.splice Sites Verified

The ticket's fix log documents a codebase-wide scan of `turnOrder.splice` usage. Verified:

| Site | Pattern | Risk |
|------|---------|------|
| `release-hold.post.ts:85-91` | insert + dedup | FIXED (this commit) |
| `priority.post.ts:99-105` | insert + dedup | Already fixed (CRIT-002) |
| `combatants/[combatantId].delete.ts:48` | removal only | No duplication risk |

No other turnOrder insertion sites exist in the server codebase.

## Summary

The bug-042 fix correctly addresses a PTU rule violation where a held combatant could receive duplicate turns in Full Contact battles. The PTU rulebook is explicit that holding delays an action to "a specified lower Initiative value" and the worked example (p.232) demonstrates exactly one turn upon release. The pre-fix code violated this by leaving the original turnOrder entry intact when splicing the released combatant back in.

The dedup pattern (splice-insert at currentTurnIndex, then indexOf from currentTurnIndex+1 to find and remove the original) is mathematically sound: the splice operation shifts all elements at and beyond the insertion point right by 1, guaranteeing the original entry is findable at `currentTurnIndex + 1` or later. The defensive `if (originalIndex !== -1)` guard handles the impossible-but-safe case where the combatant has no original entry.

The 12 unit tests adequately cover the key scenarios: standard Full Contact dedup, pre-fix bug demonstration, various positions (first, last, middle), multiple hold-release cycles, League Battle defensive behavior, and single-combatant edge case.

## Rulings

1. **Hold-release must produce exactly one turnOrder entry per combatant.** PTU p.227 states "once per round" and the p.232 example shows one action upon release. Two entries means two turns — a clear rule violation. The fix is the correct resolution.

2. **The dedup pattern (splice + indexOf + splice) is the canonical approach** for inserting a combatant into turnOrder without creating duplicates. Both `release-hold.post.ts` and `priority.post.ts` now use this pattern consistently.

3. **No errata corrections apply.** `errata-2.md` contains no modifications to hold action or initiative mechanics. The only "hold" reference in errata is for the move "Hold Hands" (unrelated).

## Verdict

**APPROVED** — The fix correctly implements PTU hold action rules. Each combatant receives exactly one turn per round after hold-release, matching PTU p.227 and the worked example on p.232. No rule violations, no decree conflicts, no edge case gaps. The dedup pattern is proven (identical to CRIT-002 fix in priority.post.ts) and well-tested.

## Required Changes

None.
