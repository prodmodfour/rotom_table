---
review_id: rules-review-008
target: refactoring-005
reviewer: game-logic-reviewer
verdict: APPROVED
date: 2026-02-16
trigger: refactoring-review
commits_reviewed:
  - 8168ecc
files_reviewed:
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/utils/diceRoller.ts
  - app/types/encounter.ts
ptu_references:
  - books/markdown/core/07-combat.md (p.227 — Initiative)
  - books/markdown/errata-2.md (no initiative errata found)
mechanics_verified: 4
correct: 4
incorrect: 0
needs_review: 0
---

## PTU Rules Verification Report

### Scope
- [x] Initiative sorting logic extracted from `start.post.ts` to `encounter.service.ts`
- [x] d20 tie-breaking roll-off mechanic
- [x] League Battle phase ordering (trainers then Pokemon)
- [x] Full Contact / Wild Encounter initiative ordering
- [x] `rollDie(20)` equivalence with removed `rollD20()`

### Mechanics Verified

#### 1. Initiative Order — Highest to Lowest
- **Rule:** "Combat in Pokemon Tabletop United takes place in a sequence of 10 second rounds where combatants take turns acting in order of their Initiative values." — PTU p.227. "all participants simply go in order from highest to lowest speed" — PTU p.227
- **Implementation:** `sortByInitiativeWithRollOff()` at `encounter.service.ts:107` sorts with `b.initiative - a.initiative` (descending), producing highest-first order. All three call sites in `start.post.ts` pass `descending = true`.
- **Status:** CORRECT

#### 2. Tie-Breaking via d20 Roll-Off
- **Rule:** "Ties in Initiative should be settled with a d20 roll off." — PTU p.227
- **Implementation:** `encounter.service.ts:120-151` groups combatants by initiative value, rolls `rollDie(20)` for each tied combatant, and re-rolls only the still-tied subset until all roll-offs are unique. The `rollDie(20)` function (`diceRoller.ts:32-33`) produces `Math.floor(Math.random() * 20) + 1` — range 1-20, matching a d20.
- **Status:** CORRECT
- **Note:** PTU doesn't specify behavior for roll-off sub-ties. Re-rolling only the still-tied combatants is the natural interpretation and is consistent with the spirit of the rule.

#### 3. League Battle Phase Separation
- **Rule:** "all Trainers should take their turns, first, before any Pokemon act. In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed. Following that, all Pokemon then act in order from highest to lowest speed." — PTU p.227
- **Implementation:** `start.post.ts:56-75` filters combatants by type (`human` vs `pokemon`), sorts each group independently via `sortByInitiativeWithRollOff(_, true)` (high-to-low), and concatenates as `[...trainerTurnOrder, ...pokemonTurnOrder]` — trainers first, then Pokemon.
- **Status:** CORRECT
- **Note:** The stored `trainerTurnOrder` is the resolution order (high-to-low). The declaration order (low-to-high) can be derived by reversing the list. This is a pre-existing design choice, not introduced by the refactoring.

#### 4. Full Contact / Wild Encounter — Mixed Initiative
- **Rule:** "In 'full contact' matches, wild encounters, and other situations where Trainers are directly involved in the fight, all participants simply go in order from highest to lowest speed." — PTU p.227
- **Implementation:** `start.post.ts:77-81` sorts all combatants together via `sortByInitiativeWithRollOff(combatants, true)` — trainers and Pokemon in a single initiative list, highest first.
- **Status:** CORRECT

### Behavioral Equivalence Check

The extracted `sortByInitiativeWithRollOff()` is logically identical to the removed inline version. Specific equivalences:

| Aspect | Before (inline) | After (service) |
|--------|-----------------|-----------------|
| Die roll | `rollD20()`: `Math.floor(Math.random() * 20) + 1` | `rollDie(20)`: `Math.floor(Math.random() * sides) + 1` |
| Parameter type | `any[]` | `Combatant[]` |
| Grouping logic | Identical `Map<number, T[]>` pattern | Identical |
| Re-roll loop | Identical `while(hasTies)` with subset re-roll | Identical |
| Sort comparator | `b.initiative - a.initiative`, then `b.initiativeRollOff - a.initiativeRollOff` | Identical |
| Return | `[...combatants].sort(...)` (new array) | Identical |
| Mutation | Sets `c.initiativeRollOff` on tied combatants | Identical (documented in JSDoc) |

No formula changes, no logic changes, no behavioral delta.

### Errata Check

Searched `books/markdown/errata-2.md` for initiative-related corrections. Only match is "Paralyze Heal: The target gains +1 Speed Combat" — unrelated to initiative sorting. No errata applies to this mechanic.

### Summary
- Mechanics checked: 4
- Correct: 4
- Incorrect: 0
- Needs review: 0

### Verdict

**APPROVED** — The extracted initiative sorting logic correctly implements all four PTU initiative mechanics: descending speed order, d20 tie-breaking, League Battle phase separation, and Full Contact mixed ordering. The `rollDie(20)` replacement is mathematically identical to the removed `rollD20()`. No PTU rules were altered by this refactoring.
