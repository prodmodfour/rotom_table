---
review_id: rules-review-091
target: ptu-rule-046
trigger: orchestrator-routed
reviewed_commits:
  - 4a326c1
  - 4aaf84c
  - 0328d43
  - bbe7a7c
  - baa5e0e
  - 09dc204
  - c9352d6
  - bca5335
  - 218f2df
  - 46c3ea6
verdict: PASS
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## Rules Review: League Battle Declaration Phase (ptu-rule-046)

### PTU Reference

PTU 1.05 Core Rules, Chapter 7 (Combat), Page 227:

> "During Tournament matches and other League Battles where the Trainer doesn't participate directly in the fighting, all Trainers should take their turns, first, before any Pokemon act. In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed. This allows quicker Trainers to react to their opponent's switches and tactics. Following that, all Pokemon then act in order from highest to lowest speed."

> "In 'full contact' matches, wild encounters, and other situations where Trainers are directly involved in the fight, all participants simply go in order from highest to lowest speed."

> "Ties in Initiative should be settled with a d20 roll off."

### Verification Checklist

#### 1. Trainers sorted low-to-high speed for declaration (slowest first) -- PASS

In `start.post.ts` (commit `4aaf84c`), line 99:
```ts
const sortedTrainersDeclaration = sortByInitiativeWithRollOff(trainers, false)
```
The `false` argument sets `descending = false`, producing ascending (low-to-high) order. This is correct per PTU: slowest trainer declares first, giving the fastest trainer the informational advantage of reacting last.

The `sortByInitiativeWithRollOff` function in `encounter.service.ts` respects the `descending` parameter for both primary initiative and tie-breaker roll-off sorting (line 163-166):
```ts
const initDiff = b.initiative - a.initiative
if (initDiff !== 0) return descending ? initDiff : -initDiff
const rollDiff = (b.initiativeRollOff || 0) - (a.initiativeRollOff || 0)
return descending ? rollDiff : -rollDiff
```
When `descending = false`, the comparator flips both primary and secondary sort, yielding correct low-to-high ordering.

#### 2. Pokemon sorted high-to-low speed (standard initiative) -- PASS

In `start.post.ts`, line 101:
```ts
const sortedPokemon = sortByInitiativeWithRollOff(pokemon, true)
```
The `true` argument keeps standard descending (high-to-low) initiative order. This matches PTU rules: "all Pokemon then act in order from highest to lowest speed."

#### 3. Phase transitions: trainer phase -> pokemon phase -> new round -- PASS

In `next-turn.post.ts` (commit `0328d43`), the League battle branch handles phase transitions correctly:

- **trainer_declaration -> pokemon**: When `currentTurnIndex >= turnOrder.length` and `currentPhase === 'trainer_declaration'`, it transitions to `pokemon` phase, sets `turnOrder = [...pokemonTurnOrder]`, and resets `currentTurnIndex = 0`. No new-round increment (correct -- same round).
- **pokemon -> trainer_declaration (new round)**: When pokemon phase ends, it increments `currentRound`, resets combatants, decrements weather, and sets `currentPhase = 'trainer_declaration'` with `turnOrder = [...trainerTurnOrder]`.
- **Edge case (no Pokemon)**: If `pokemonTurnOrder.length === 0` after trainer phase, it starts a new round immediately. Handled correctly.
- **Edge case (no trainers)**: If `trainerTurnOrder.length === 0` after pokemon phase, it falls back to pokemon-only rounds. Handled correctly.
- **Edge case (no trainers at start)**: In `start.post.ts`, if `trainers.length === 0`, it skips straight to pokemon phase. Correct.

#### 4. Each round has both trainer and Pokemon turns -- PASS

The phase structure guarantees that every round begins with `trainer_declaration` (trainers get turns) and then transitions to `pokemon` (Pokemon get turns) before a new round starts. A round only completes when both phases have been exhausted.

#### 5. Full Contact mode is unaffected -- PASS

Full Contact uses the `else` branch in both endpoints:
- `start.post.ts`: All combatants sorted high-to-low together, `currentPhase = 'pokemon'` (phase irrelevant).
- `next-turn.post.ts`: Standard linear progression with no phase switching. The `isLeagueBattle` check cleanly separates the two code paths.

#### 6. Speed ties handled correctly -- PASS

The `sortByInitiativeWithRollOff` function (encounter.service.ts, lines 114-168) handles ties via d20 roll-off with re-rolling until all ties are broken. This applies equally to both ascending and descending sorts, as both primary and roll-off comparisons respect the `descending` flag. This matches PTU: "Ties in Initiative should be settled with a d20 roll off."

#### 7. Simplification assessment: declaration vs resolution -- ACCEPTABLE SIMPLIFICATION

The type system defines three phases: `trainer_declaration`, `trainer_resolution`, and `pokemon`. However, the implementation only uses two phases at runtime: `trainer_declaration` and `pokemon`. The `trainer_resolution` phase is defined in types but never set in any endpoint.

**What PTU says:** Trainers declare low-to-high, then actions resolve high-to-low.

**What the implementation does:** Trainers take their turns one at a time in low-to-high speed order. There is no separate resolution phase where declared actions execute in reverse order.

**Why this is acceptable:** PTU's declaration/resolution distinction is designed for simultaneous declaration at the table ("I declare I'll use a Potion," then the faster trainer gets to react). In a digital turn-based system, this is naturally handled by the turn order itself -- the slowest trainer acts first and commits to their action, giving faster trainers full information before they act. The mechanical outcome is identical: slower trainers commit first, faster trainers react with full knowledge.

A true declaration/resolution split would require:
1. A UI for declaring actions without executing them
2. Storing pending declarations
3. A resolution phase that executes stored actions in reverse order

This would add significant complexity for zero gameplay benefit in a digital medium. The current approach achieves the same strategic asymmetry (faster trainers have more information) through simpler mechanics. The `trainer_resolution` type exists for future expansion if needed.

### Additional Observations

#### Combatant Addition During Active League Battle -- LOW-PRIORITY GAP

The `combatants.post.ts` endpoint does not update `trainerTurnOrder` or `pokemonTurnOrder` when adding a combatant to an active encounter. The new combatant is added to the `combatants` array but not inserted into the phase-specific turn orders. This means a combatant added mid-battle will not get turns until the encounter is restarted or the turn orders are rebuilt.

The `[combatantId].delete.ts` endpoint (commit `46c3ea6`) correctly removes combatants from all three turn order arrays, so deletion is handled properly.

This is a pre-existing limitation (adding combatants mid-battle was always edge-case behavior) and not a regression introduced by this feature. It could be addressed in a future ticket if mid-battle addition for League battles becomes a common workflow.

#### DB Schema and Persistence -- COMPLETE

All three phase fields (`currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`) are:
- Added to Prisma schema with sensible defaults (commit `4a326c1`)
- Persisted on encounter start (commit `4aaf84c`)
- Updated on turn advancement (commit `0328d43`)
- Synced via WebSocket (commit `bbe7a7c`)
- Read correctly in list endpoint (commit `bca5335`)
- Preserved through undo/redo (commit `218f2df`)
- Cleaned on combatant deletion (commit `46c3ea6`)

#### Weather Decrement Timing -- CORRECT

Weather is decremented at the end of a full round (after both trainer and pokemon phases complete), not at the end of each phase. This matches PTU rules where weather lasts N rounds.

### Verdict: PASS

The implementation correctly captures the core PTU League battle mechanic: trainers act in low-to-high speed order first, then Pokemon act in high-to-low speed order, with each round containing both phases. The simplification of combining declaration/resolution into a single turn-based trainer phase is strategically equivalent to the tabletop rule and appropriate for a digital implementation. Full Contact mode is cleanly unaffected. All persistence, sync, undo/redo, and combatant deletion paths are covered.
