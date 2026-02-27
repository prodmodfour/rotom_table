---
review_id: rules-review-091b
target: ptu-rule-046
trigger: follow-up-review
follows_up: rules-review-091
reviewed_commits:
  - 4f8a299
  - 6783d14
verdict: PASS
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## Follow-up Rules Review: League Battle Code Quality Fixes (ptu-rule-046)

### Context

rules-review-091 verified the League Battle declaration phase implementation across 10 commits. Two follow-up commits applied code quality improvements to files touched by that feature. This review verifies neither commit altered PTU mechanics.

### Commit 4f8a299 -- buildEncounterResponse refactor in combatant delete

**Change:** Replaced manual JSON parsing in `[combatantId].delete.ts` with a call to `buildEncounterResponse()` from `encounter.service.ts`.

**Before (removed):**
```ts
const parsedEncounter = {
  ...updatedEncounter,
  combatants: JSON.parse(updatedEncounter.combatants || '[]'),
  turnOrder: JSON.parse(updatedEncounter.turnOrder || '[]'),
  moveLog: JSON.parse(updatedEncounter.moveLog || '[]'),
  defeatedEnemies: JSON.parse(updatedEncounter.defeatedEnemies || '[]')
}
```

**After (added):**
```ts
const response = buildEncounterResponse(updatedEncounter, combatants)
```

**PTU impact analysis: NONE**

1. **No game logic change.** The combatant removal logic (lines 34-57) is untouched: finding the combatant, splicing from the combatants array, removing from `turnOrder`, `trainerTurnOrder`, and `pokemonTurnOrder`, and adjusting `currentTurnIndex`. All of this is identical before and after.

2. **Response now includes more fields, not fewer.** The old manual parsing omitted `trainerTurnOrder`, `pokemonTurnOrder`, `currentPhase`, `gridConfig`, `weather`, `battleType`, and other fields. `buildEncounterResponse()` includes all of these. This is a bug fix (the old code broke client `.map()` calls on league battle encounters) but not a rules change.

3. **Consistent with the rest of the codebase.** `buildEncounterResponse` is used across 22 encounter endpoint files. The delete endpoint was the only one still using manual JSON parsing. This refactor eliminates a consistency gap.

4. **Turn order mechanics preserved.** The DB write at line 66-75 persists the modified `combatants`, `turnOrder`, `trainerTurnOrder`, and `pokemonTurnOrder` arrays. `buildEncounterResponse` reads these back from the `updatedEncounter` record, so the response accurately reflects the post-deletion state.

### Commit 6783d14 -- JSDoc correction on resetCombatantsForNewRound

**Change:** Updated the comment above `resetCombatantsForNewRound` from:
```
Reset all combatants for a new round (immutable pattern applied to each combatant in-place)
```
to:
```
Reset all combatants for a new round by mutating each object in the array.
Acceptable here because combatants are freshly parsed from JSON (no shared references).
```

**PTU impact analysis: NONE**

1. **Documentation-only change.** The diff modifies exactly one line of JSDoc comment text and adds one line. No executable code was touched.

2. **Function body unchanged.** `resetCombatantsForNewRound` still resets `hasActed`, `actionsRemaining`, `shiftActionsRemaining`, and `readyAction` on each combatant via `.forEach()`. These are the correct PTU new-round resets as verified in rules-review-091 (Section 3, phase transitions).

3. **The new comment is more accurate.** The function does mutate in-place (it uses `c.hasActed = false`, not spread/copy). The old comment's "immutable pattern" wording was misleading. The new comment correctly describes the mutation and justifies it (freshly parsed JSON means no aliasing risk).

### Verdict: PASS

Both commits are code quality improvements with zero PTU mechanics impact. The buildEncounterResponse refactor fixes a response completeness bug without changing any combat, turn order, or phase transition logic. The JSDoc fix is purely documentation. No game rules were altered, added, or removed.
