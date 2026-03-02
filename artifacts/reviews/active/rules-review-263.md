---
review_id: rules-review-263
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-020
domain: healing
commits_reviewed:
  - b3f7f063
  - e9efa594
  - c026b06a
  - 7782598c
  - 5580b955
  - 6ecac9b8
  - 30fd3bf2
mechanics_verified:
  - standard-action-enforcement
  - self-use-full-round-action
  - target-action-forfeit
  - medic-training-exemption
  - adjacency-requirement
  - inventory-consumption
  - forfeit-flag-lifecycle
  - target-refusal
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#page-276
  - core/03-skills-edges-and-features.md#medic-training
  - core/07-combat.md#action-types
reviewed_at: 2026-03-02T22:30:00Z
follows_up: rules-review-260
---

## Mechanics Verified

### 1. Standard Action Enforcement (Section J)

- **Rule:** "Applying Restorative Items, or X Items is a **Standard Action**" (`core/09-gear-and-items.md#page-276`)
- **Implementation:** `use-item.post.ts` lines 104-112 check `user.turnState.standardActionUsed` before allowing item use on another combatant. After successful application, line 165 sets `user.turnState.standardActionUsed = true`.
- **Status:** CORRECT

The Standard Action check correctly prevents item use when the action has already been consumed. The action is consumed after the item is successfully applied (line 155-168), not before, which is the correct order -- if the item application fails (validation error, etc.), no action is consumed.

### 2. Self-Use as Full-Round Action (Section L)

- **Rule:** "If you use a Restorative Item on yourself it is a Full-Round action, but you do not forfeit any further actions." (`core/09-gear-and-items.md#page-276`)
- **Implementation:** `use-item.post.ts` lines 96-103 detect self-use (`body.userId === body.targetId`) and check that BOTH `standardActionUsed` and `shiftActionUsed` are false. After application, lines 156-159 set both to true.
- **Status:** CORRECT

The Full-Round Action correctly requires both Standard and Shift to be unused. PTU p.227 defines Full-Round Actions as consuming both Standard and Shift but NOT Swift. The implementation does not touch `swiftActionUsed`, which is correct -- the user retains their Swift Action after self-use.

The "do not forfeit any further actions" clause is correctly handled by the `targetForfeitsActions` logic (line 179): since `isSelfUse` is true, the forfeit block is skipped entirely.

### 3. Target Action Forfeit (Section K)

- **Rule:** "[Using a Restorative Item] causes the target to forfeit their next Standard Action and Shift Action" (`core/09-gear-and-items.md#page-276`)
- **Implementation:** `use-item.post.ts` lines 179-186 set `target.turnState.forfeitStandardAction = true` and `target.turnState.forfeitShiftAction = true` when `!isSelfUse && !hasMedicTraining`.
- **Status:** CORRECT

The forfeit flags are correctly applied only to non-self, non-Medic-Training uses. The flags are boolean markers that persist on the combatant until consumed.

### 4. Forfeit Flag Consumption at Turn Start

- **Rule:** The target forfeits their NEXT Standard and Shift Actions (implied: at the start of their next turn).
- **Implementation:** `next-turn.post.ts` lines 409-434: After advancing `currentTurnIndex`, the new current combatant's forfeit flags are checked. If `forfeitStandardAction` is true, `standardActionUsed` is set to true and the flag is cleared. Same for `forfeitShiftAction`.
- **Status:** CORRECT

The consumption happens at the correct time -- when the new combatant's turn begins (after `currentTurnIndex++`), not at the end of the previous turn. This ensures the combatant starts their turn with those actions already consumed.

**Cross-round persistence:** The forfeit flags survive round transitions correctly:
- `resetCombatantsForNewRound` (lines 606-619) explicitly preserves `forfeitStandardAction` and `forfeitShiftAction` when resetting `turnState`.
- `resetResolvingTrainerTurnState` (lines 551-563) also preserves forfeit flags when resetting for League Battle resolution phase.
- This handles the edge case where an item is used near the end of a round and the target's turn comes in the next round.

### 5. Medic Training Edge Exemption

- **Rule:** "unless the user has the 'Medic Training' Edge" (`core/09-gear-and-items.md#page-276`). The Edge is defined as: "When you use Restorative Items on others, they do not forfeit their next turn." (`core/03-skills-edges-and-features.md#page-42`)
- **Implementation:** `use-item.post.ts` lines 173-175 check if the user is a `human` type combatant whose `edges` array contains an entry matching `medic training` (case-insensitive).
- **Status:** CORRECT

Key observations:
1. Medic Training only exempts the TARGET from forfeiting actions -- the user's Standard Action cost still applies. The code correctly implements this: the `hasMedicTraining` check only gates the forfeit logic (line 179), not the action consumption (lines 156-168). This matches the PTU text: the Edge says "they [the target] do not forfeit their next turn," not "item use costs no action."
2. The check uses `toLowerCase().includes('medic training')` which handles common variations in how edges might be stored (e.g., "Medic Training", "medic training"). This is a reasonable fuzzy match.
3. The check correctly restricts to `user.type === 'human'` since only trainers have edges.

### 6. Adjacency Requirement (Section M)

- **Rule:** PTU p.276 describes restorative items as physically applied spray bottles requiring contact. In combat, this means the user must be adjacent (within 1 meter/cell).
- **Implementation:** `healing-item.service.ts` `checkItemRange()` (lines 121-140) uses `ptuDistanceTokensBBox` for multi-cell token support, per decree-002 (PTU alternating diagonal distance). Returns `{ adjacent: boolean, distance: number }` with `adjacent = distance <= 1`.
- **Status:** CORRECT

Special cases handled correctly:
- Self-use: always adjacent (line 128) -- correct, self is distance 0.
- No positions defined: always adjacent (line 129) -- correct, supports gridless play.
- Multi-cell tokens: uses `ptuDistanceTokensBBox` which measures edge-to-edge distance via bounding box gap, then applies `ptuDiagonalDistance` on the gap. This is correct per decree-002.

The endpoint (`use-item.post.ts` lines 80-93) correctly calls `checkItemRange` with user position, user token size, target position, target token size, and the self-use flag.

The UI (`UseItemModal.vue` lines 404-422) mirrors this check client-side using the same `ptuDistanceTokensBBox` function, ensuring the adjacency indicator matches the server-side validation.

### 7. Target Refusal

- **Rule:** "The target of these items may refuse to stay still and be healed; in that case, the item is not used, and the target does not forfeit their actions." (`core/09-gear-and-items.md#page-276`)
- **Implementation:** `use-item.post.ts` lines 59-69 handle `body.targetAccepts === false` with an early return. No item effect, no action cost, no inventory consumption.
- **Status:** CORRECT

When the target refuses: no actions are consumed from the user, no forfeit flags are set on the target, no inventory is deducted, and the item is not applied. The response indicates `refused: true`. This correctly implements the PTU rule that refusal costs nothing.

### 8. Inventory Consumption (Section N)

- **Rule:** Items are consumable ("one time use spray bottles" -- p.276). Using an item should consume it from inventory.
- **Implementation:** `use-item.post.ts` lines 114-146 (pre-validation) and 188-226 (post-application deduction):
  1. Check inventory BEFORE applying (lines 119-146): resolve trainer (self or Pokemon's owner via `findTrainerForPokemon`), find item in inventory, validate quantity > 0.
  2. Apply item (line 149).
  3. Deduct AFTER success (lines 188-226): decrement quantity, filter out zero-quantity items, persist to DB via `prisma.humanCharacter.update`.
- **Status:** CORRECT

The apply-then-deduct ordering is correct: if the item application fails (validation error), no inventory is consumed. The response includes `remainingQuantity` for UI feedback.

`findTrainerForPokemon` (healing-item.service.ts lines 146-158) correctly resolves the Pokemon's owner via `ownerId` field, matching on `entityId` of human combatants. This handles the case where a trainer uses an item on their own Pokemon -- the inventory comes from the trainer, not the Pokemon.

The `skipInventory` GM override (line 115) correctly bypasses both the check and the deduction when true.

## Decree Compliance

| Decree | Applicability | Status |
|--------|--------------|--------|
| decree-002 | Adjacency uses PTU diagonal distance | COMPLIANT -- `checkItemRange` uses `ptuDistanceTokensBBox` |
| decree-017 | Healing respects effective max HP (injury cap) | N/A for P2 (healing logic unchanged from P0/P1) |
| decree-029 | Rest healing minimum 1 HP | N/A (applies to rest, not items) |
| decree-041 | Awakening at $200 | N/A for P2 (item catalog unchanged) |

No decree violations found. No new ambiguities requiring decree-need tickets.

## Edge Cases Verified

1. **Pokemon as item user:** When `user.type !== 'human'`, the code resolves the trainer via `findTrainerForPokemon` for inventory. Medic Training check correctly returns false for non-human users (line 173). This is correct -- Pokemon cannot have the Medic Training edge.

2. **Item used near round boundary:** Forfeit flags persist across rounds via `resetCombatantsForNewRound` and `resetResolvingTrainerTurnState` preserving the flags. Consumed only when the target's turn starts. Correct.

3. **League Battle phase transitions:** In League Battles, the forfeit flags survive declaration-to-resolution-to-pokemon phase transitions because all reset functions preserve them. Correct.

4. **Multiple items on same target:** If a target receives items from two different trainers before their turn, both sets of forfeit flags are set. Since the flags are boolean (not additive), the second item use doesn't "double" the forfeit -- the target still only forfeits one Standard and one Shift. This is correct per PTU rules (you can't forfeit the same action twice).

5. **Fainted target receiving revive:** The adjacency check still applies. Self-use on a fainted combatant would require the combatant to not be fainted (since fainted entities can't take actions). The action enforcement correctly blocks this because a fainted combatant's `standardActionUsed` would already be true (or they wouldn't have a turn). This is handled implicitly.

## Summary

All P2 combat integration mechanics are correctly implemented per PTU 1.05 rules. The implementation follows the rulebook text from p.276 faithfully:
- Standard Action cost for using items on others
- Full-Round Action cost for self-use (Standard + Shift, but not Swift)
- Target forfeits next Standard + Shift Actions (except with Medic Training)
- Target may refuse (no cost to anyone)
- Physical contact requirement (adjacency <= 1 meter)
- Inventory consumption with GM override

The forfeit flag lifecycle is well-designed: flags are set on item use, preserved across round/phase boundaries, and consumed at the start of the target's next turn. This correctly handles all timing scenarios.

## Rulings

No PTU rule ambiguities were discovered during this review. All mechanics have clear rulebook text supporting the implementation.

## Verdict

**APPROVED** -- All P2 healing item combat integration mechanics are correctly implemented per PTU 1.05 Core p.276, with proper decree-002 compliance for adjacency measurement. No critical, high, or medium issues found.

## Required Changes

None.
