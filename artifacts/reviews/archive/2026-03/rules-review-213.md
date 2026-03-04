---
review_id: rules-review-213
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - 897920d0
  - 98ac8f2e
  - bc87faf8
  - eaa6a4c2
  - 825f6aff
  - 49dc745e
  - b9e92fca
  - cb080f25
  - 6ce92ba5
mechanics_verified:
  - ability-remapping-r032
  - evolution-move-learning-r033
  - capability-skill-update-r034
  - decree-035-nature-adjusted-base-relations
  - decree-036-stone-evolution-moves
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 1
ptu_refs:
  - core/05-pokemon.md#Evolution
  - errata-2.md
reviewed_at: 2026-03-01T10:30:00Z
follows_up: rules-review-207
---

## Mechanics Verified

### R032: Ability Remapping on Evolution

- **Rule:** "Abilities change to match the Ability in the same spot in the Evolution's Ability List." (`core/05-pokemon.md` line 599-600)
- **Implementation:** `remapAbilities()` in `app/server/services/evolution.service.ts` (lines 219-253) iterates over `currentAbilities`, finds each ability's index in the old species' flat ability list via case-insensitive match, and maps it to the same index in the new species' list. Abilities not found in the old species list (Feature-granted) are preserved. Abilities whose index exceeds the new list length are flagged for GM resolution with the full new list as options.
- **Status:** CORRECT

The positional mapping algorithm faithfully implements the PTU rule. The flat array approach is valid because the pokedex ability lists are stored in positional order (Basic1, Basic2, Advanced1, Advanced2, High). The spec had `numOldBasic`/`numNewBasic` parameters in the signature, but the algorithm itself does not need them -- pure index matching is sufficient and correct per PTU RAW. The three-bucket output (remapped, needsResolution, preserved) correctly separates auto-resolved from ambiguous cases.

`performEvolution()` (lines 376-392) correctly uses the GM-provided abilities if present, otherwise falls back to auto-remap. Ability effects are enriched from `AbilityData` after remapping (line 392), ensuring the final stored abilities have current effect text.

### R033: Evolution Move Learning

- **Rule:** "When Pokemon Evolve, they can immediately learn any Moves that their new form learns at a Level **lower than** their minimum Level for Evolution but that their previous form could not learn." (`core/05-pokemon.md` lines 601-604, emphasis added)
- **Implementation:** `getEvolutionMoves()` in `app/utils/evolutionCheck.ts` (lines 143-196) computes a `levelCeiling` as `evolutionMinLevel ?? currentLevel`, then filters the new learnset for `entry.level > levelCeiling` being false (i.e., `entry.level <= levelCeiling`).
- **Status:** INCORRECT -- uses `<=` instead of `<` for level-based evolutions

**CRITICAL ISSUE: Off-by-one in evolution move level filter.**

The PTU rulebook explicitly says "at a Level **lower than** their minimum Level for Evolution" -- this means strictly less than (`<`), not less-than-or-equal (`<=`). The implementation uses `entry.level > levelCeiling` which is equivalent to `entry.level <= levelCeiling`, including moves AT the minimum evolution level.

The design spec (spec-p1.md section 2.2, line 192) correctly specifies the algorithm as `level < evolutionMinLevel` for level-based evolutions and `level <= currentLevel` for stone evolutions (per decree-036).

The implementation must use different comparison operators:
- When `evolutionMinLevel` is set (level-based): filter for `entry.level < levelCeiling` (strictly less than)
- When `evolutionMinLevel` is null (stone/no-level): filter for `entry.level <= levelCeiling` (at or below, per decree-036)

Example impact: Charmeleon evolves at level 16. A move at level 16 in Charizard's learnset should NOT be offered as an evolution move, but the current code offers it. Only moves at levels 1-15 should be offered.

### R034: Capability and Skill Updates

- **Rule:** "Finally, check the Pokemon's Skills and Capabilities and update them for its Evolved form." (`core/05-pokemon.md` lines 606-607)
- **Implementation:** `performEvolution()` (lines 400-419) reads the target species' movement, power, jump, weight class, size, and other capabilities from `SpeciesData`, constructs a new capabilities object, reads the target species' skills JSON, and writes both to the Pokemon record.
- **Status:** CORRECT

The implementation correctly performs a wholesale replacement of capabilities and skills with the new species' values. All capability fields are mapped: overland, swim, sky, burrow, levitate, teleport, power, jump (high/long), weightClass, size, otherCapabilities. Skills are directly parsed from the target species' `skills` JSON field.

### decree-035: Nature-Adjusted Base Stats for Base Relations

- **Rule:** "Base Relations ordering uses nature-adjusted base stats." (decree-035)
- **Implementation:** `recalculateStats()` (lines 123-186) applies nature to new base stats first (line 132), then validates Base Relations using the nature-adjusted values (line 164). The `validateBaseRelations()` function receives the nature-adjusted base stats, matching the decree.
- **Status:** CORRECT -- per decree-035, this approach was ruled correct.

### decree-036: Stone Evolution Move Learning

- **Rule:** "Stone evolutions learn new-form moves at or below the Pokemon's current level." (decree-036)
- **Implementation:** `getEvolutionMoves()` uses `evolutionMinLevel ?? currentLevel` as the ceiling, which correctly falls back to `currentLevel` when no minimum level is set. For stone evolutions, the `<=` comparison is correct per decree-036's formula: "newFormMoves WHERE moveLevel <= currentLevel AND NOT IN oldFormLearnset."
- **Status:** CORRECT for stone evolutions -- the `<=` is right here. The bug is only with level-based evolutions (see R033 above).

## Summary

P1 implementation is structurally sound and follows the design spec closely. The ability remapping (R032) and capability/skill updates (R034) are correctly implemented per PTU rules. Both decree-035 and decree-036 are respected. The WebSocket broadcast (`pokemon_evolved`) correctly relays evolution changes to all connected clients.

One critical issue was found in the evolution move learning logic (R033): the level comparison uses `<=` universally when the PTU rule requires `<` (strictly less than) for level-based evolutions. This produces incorrect results by offering moves AT the minimum evolution level when those moves should be excluded.

One medium-severity UI display issue was found in the `EvolutionAbilityStep` component's `getOldAbilityName()` function.

## Rulings

1. **R033 level comparison (CRITICAL):** The code uses `entry.level > levelCeiling` (equivalent to `<=`) for all evolutions. The spec explicitly calls for `level < evolutionMinLevel` for level-based evolutions and `level <= currentLevel` for stone evolutions. The implementation must differentiate between these two cases. The fix is straightforward:

```typescript
// Current (WRONG for level-based):
if (entry.level > levelCeiling) return false

// Correct:
if (evolutionMinLevel !== null) {
  // Level-based: strictly less than (PTU: "lower than")
  if (entry.level >= evolutionMinLevel) return false
} else {
  // Stone/no-level: at or below current level (decree-036)
  if (entry.level > currentLevel) return false
}
```

2. **EvolutionAbilityStep display (MEDIUM):** `getOldAbilityName(remapIndex)` uses `remapIndex` to index into `currentAbilities`, but `remapIndex` is the position within `abilityRemap.remappedAbilities` -- not the position within `currentAbilities`. If any ability is preserved or needs resolution (splitting the current abilities into different buckets), the indices diverge and the wrong "old ability" name is displayed next to the remapped ability.

The `remapAbilities()` function does not preserve the original index information in its output. To fix, the function should include the original ability name in the `remappedAbilities` output, or the UI should track which current abilities were remapped and their original names.

## Verdict

**CHANGES_REQUIRED**

The critical off-by-one in R033 move learning produces incorrect game results (offering moves that should not be available per PTU RAW). This must be fixed before approval. The medium UI display bug should also be addressed but does not block approval on its own.

## Required Changes

1. **[CRITICAL] Fix `getEvolutionMoves()` level comparison** (`app/utils/evolutionCheck.ts` lines 166-168): Use `<` (strictly less than) for level-based evolutions and `<=` (at or below) for stone evolutions. Do not use a single `<=` for both cases. The function has access to `evolutionMinLevel` to distinguish the two cases.

2. **[MEDIUM] Fix `getOldAbilityName()` in EvolutionAbilityStep** (`app/components/pokemon/EvolutionAbilityStep.vue` lines 88-93): The `remapIndex` parameter does not correspond to the `currentAbilities` index when abilities are split across remapped/preserved/needsResolution buckets. Either include the original ability name (e.g., `fromAbility: string`) in the `remappedAbilities` output from `remapAbilities()`, or track the mapping in the UI. This is a display-only bug but shows incorrect information to the GM.
