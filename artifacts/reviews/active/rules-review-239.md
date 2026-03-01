---
review_id: rules-review-239
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-132, bug-041
domain: character-lifecycle, combat
commits_reviewed:
  - f78a8962
  - ec07a28e
  - 2b4a7623
  - 3fee2a90
  - 5862ccd8
mechanics_verified:
  - evolution-species-xp
  - whirlwind-forced-switch-removal
  - recall-side-effects
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/11-running-the-game.md#trainer-experience (p.461)
  - core/10-indices-and-reference.md#roar (p.406)
  - core/10-indices-and-reference.md#whirlwind (p.412)
  - core/07-combat.md#switching (p.229)
  - core/07-combat.md#recall-side-effects (p.247-248)
reviewed_at: 2026-03-01T22:15:00Z
follows_up: null
---

## Mechanics Verified

### 1. Evolution Species XP (ptu-rule-132)

- **Rule:** "Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience." (`core/11-running-the-game.md`, p.461, lines 2957-2960)
- **Implementation:** `app/server/api/pokemon/[id]/evolve.post.ts` (lines 207-249, commit f78a8962):
  1. After successful evolution, loads the owning trainer's `capturedSpecies` JSON array and XP/level from DB
  2. Calls `isNewSpecies(evolvedSpecies, existingSpecies)` for case-insensitive comparison
  3. If new species: appends normalized species name to the list, calls `applyTrainerXp({ currentXp, currentLevel, xpToAdd: 1 })` for +1 XP
  4. Updates DB with new `capturedSpecies`, `trainerXp`, and `level`
  5. Broadcasts `character_update` on level-up
  6. Returns `speciesXp` block in response (awarded flag, species name, xpResult)
- **Status:** CORRECT

**Detail verification:**

| Check | Result |
|-------|--------|
| XP amount is +1 (not 2, not 10) | CORRECT: `xpToAdd: 1` (line 231) |
| Uses new species name (post-evolution), not old | CORRECT: `result.changes.newSpecies` (line 222) |
| Normalization matches capture flow | CORRECT: `toLowerCase().trim()` (line 223), same as `attempt.post.ts` line 128 |
| `isNewSpecies()` comparison is case-insensitive | CORRECT: both sides `.toLowerCase().trim()` in `trainerExperience.ts` lines 92-93 |
| `applyTrainerXp()` handles multi-level jumps | CORRECT: verified in `trainerExperience.ts` lines 64-75 |
| Max level cap (50) respected | CORRECT: `TRAINER_MAX_LEVEL` check at line 52 in utility |
| XP bank cannot go below 0 | CORRECT: `Math.max(0, ...)` at line 49 in utility |
| Only awards if Pokemon has owner | CORRECT: `if (ownerId)` guard at line 213 |
| Broadcast only on actual level-up | CORRECT: `if (xpCalc.levelsGained > 0)` at line 245 |
| Species stored as normalized string | CORRECT: `normalizedSpecies` (lowercase, trimmed) at line 225 |
| Pattern matches capture endpoint | CORRECT: identical structure to `attempt.post.ts` lines 120-155 |

**Correctness of reuse:** The evolution endpoint correctly reuses the same `isNewSpecies()` and `applyTrainerXp()` utilities from `trainerExperience.ts` that the capture flow uses. The code structure is nearly identical to the capture endpoint's species XP block, ensuring consistency. The response shape (`speciesXp: { awarded, species, xpResult }`) also matches the capture response.

**Error handling:** The species XP block is wrapped inside the existing try/catch. If the trainer lookup or XP update fails, the error propagates correctly. The `trainerRecord` null check at line 219 prevents crashes for edge cases where the owner was deleted between the evolution and the XP check.

### 2. Whirlwind Forced Switch Removal (bug-041)

- **Rule (Roar, p.406):** "Targets hit by Roar immediately Shift away from the target using their highest usable movement capability, and towards their Trainer if possible. If the target is an owned Pokemon and ends this shift within 6 meters of their Poke Ball, they are immediately recalled to their Poke Ball." (`core/10-indices-and-reference.md`, lines 8861-8868)
- **Rule (Whirlwind, p.412):** "All targets are pushed X meters, where X is 8 minus their weight class. If the Line targets into a Smokescreen, the smoke is dispersed. All hazards in the Whirlwind are destroyed." (`core/10-indices-and-reference.md`, lines 9514-9517)
- **Decree:** Per decree-034: "Whirlwind is a push move, not a forced switch." Roar has its own 6m recall range per move text; Whirlwind has NO recall mechanic.
- **Implementation:** Commit ec07a28e updated 5 files:
  1. `CombatantCard.vue`: Tooltip changed from "Force Switch (Roar, Whirlwind, etc.)" to "Force Switch (Roar, etc.)"; comment updated with decree-034 note
  2. `switching.service.ts`: `validateForcedSwitch` doc updated; `canSwitchedPokemonBeCommanded` comment updated with decree-034 citation
  3. `spec-p1.md` Section I: Whirlwind removed from forced switch list, Dragon Tail/Circle Throw marked TBD
  4. `spec-p0.md`: SwitchAction `forced` field doc updated
  5. `shared-specs.md`: SwitchAction `forced` field doc updated
- **Status:** CORRECT

**Completeness check:**

| Location | Whirlwind reference status |
|----------|--------------------------|
| `CombatantCard.vue` tooltip (line 212) | REMOVED -- now "Roar, etc." |
| `CombatantCard.vue` comment (line 491) | UPDATED -- decree-034 note added |
| `switching.service.ts` validateForcedSwitch doc (line 565) | UPDATED -- decree-034 citation |
| `switching.service.ts` canSwitchedPokemonBeCommanded (line 658) | UPDATED -- decree-034 citation |
| `spec-p1.md` Section I (line 188) | UPDATED -- Whirlwind removed, TBD note for Dragon Tail/Circle Throw |
| `spec-p1.md` UI section (line 222) | UPDATED -- Roar only, Dragon Tail/Circle Throw TBD |
| `spec-p0.md` SwitchAction doc (line 36) | UPDATED -- "Roar, etc." |
| `shared-specs.md` SwitchAction doc (line 185) | UPDATED -- "Roar, etc." |
| `moves.csv` Smokescreen entry (line 596) | NOT A FORCED-SWITCH REF -- this is Smokescreen's description saying Whirlwind disperses smoke, which is correct RAW behavior |
| `design-flanking-001/shared-specs.md` (line 301) | NOT A FORCED-SWITCH REF -- refers to "Whirlwind Strikes" trainer class feature, not the Whirlwind move |

All forced-switch references to Whirlwind have been removed. The remaining Whirlwind mentions in `app/` are move data (moves.csv) and code comments that correctly describe Whirlwind as a push, which is appropriate.

### 3. Recall Side-Effects Refactor (commit 3fee2a90)

- **Rule:** PTU p.247-248: When a Pokemon is recalled, volatile status conditions are cleared, temp HP is lost, and combat stages are reset.
- **Implementation:** `applyRecallSideEffects()` extracted from duplicated code in `switch.post.ts` and `recall.post.ts` into `switching.service.ts` (lines 753-771).
  1. Fetches the Pokemon DB record
  2. Parses `statusConditions` JSON array
  3. Filters out conditions where `clearsOnRecall = true` (per `RECALL_CLEARED_CONDITIONS` derived from decree-038 definitions)
  4. Updates DB: persistent conditions only, `temporaryHp: 0`, `stageModifiers: JSON.stringify({})`
- **Status:** CORRECT

The refactored function preserves identical behavior to the inline code it replaces. The `RECALL_CLEARED_CONDITIONS` array is correctly derived from per-condition `clearsOnRecall` flags (decree-038), which clears: Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed, Stuck, Slowed, Tripped, Vulnerable. It correctly does NOT clear: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned, Asleep, Bad Sleep, Fainted, Dead, Trapped. This matches PTU p.247-248.

### 4. Grid Placement Fallback (commit 2b4a7623)

- **Rule:** PTU p.229: Released Pokemon is placed adjacent to the trainer.
- **Implementation:** `findAdjacentPosition()` in `switching.service.ts` now falls back to `findPlacementPosition()` (grid-wide search) instead of returning the trainer's own position when no free cell is found within radius 5.
- **Status:** CORRECT (no PTU rule impact -- this is a grid display fix, not a game mechanic change)

The fallback change has no PTU rules implications. It simply prevents token overlap on the VTT grid by finding any valid cell on the grid rather than stacking on the trainer's cell. The `side` parameter is now passed through for proper side-based placement in the grid-wide fallback.

## Summary

All five commits implement their intended changes correctly:

1. **ptu-rule-132 (f78a8962):** Evolution species XP is now correctly hooked into `capturedSpecies` tracking. The implementation exactly follows the PTU Core p.461 rule ("catches, hatches, or evolves... +1 Experience") and correctly reuses the proven capture flow pattern with `isNewSpecies()` and `applyTrainerXp()`.

2. **bug-041 (ec07a28e):** All forced-switch references to Whirlwind have been removed from code, comments, tooltips, and design specs. Per decree-034, Whirlwind is correctly identified as a push move with no recall mechanic. Roar references are preserved. Dragon Tail/Circle Throw are correctly marked as TBD pending a future decree.

3. **Refactor (3fee2a90):** Recall side-effects extraction is a clean, behavior-preserving refactor. PTU p.247-248 recall clearing rules are correctly implemented via decree-038's per-condition flags.

4. **Grid fix (2b4a7623):** No rules impact. Prevents token overlap by using grid-wide placement as fallback.

5. **Status updates (5862ccd8):** Ticket status documentation only.

## Rulings

### MEDIUM-1: Pre-existing Trapped bypass in validateForcedSwitch conflicts with decree-039

The `validateForcedSwitch()` function (lines 570, 602) contains:
```
 * - Trapped check is bypassed for forced switches (the move overrides it)
 ...
 // NOTE: Trapped check is SKIPPED for forced switches — the move overrides it
```

This contradicts **decree-039**, which rules: "Roar's forced recall does NOT override the Trapped condition." The decree explicitly states that Trapped prevents Roar's recall. However, this is a **pre-existing issue** not introduced by the reviewed commits. It is already tracked by **ptu-rule-129** and is not within the scope of this review. Noting it here for completeness and to confirm the existing ticket covers it.

**Severity:** MEDIUM (pre-existing, tracked by ptu-rule-129, not introduced by reviewed commits)

## Verdict

**APPROVED**

All reviewed commits correctly implement their intended PTU mechanics. The evolution species XP hookup follows the rulebook exactly (+1 XP on new species evolution, using the same utilities as capture). The Whirlwind cleanup is thorough and decree-034 compliant. The recall refactor preserves behavior. No rule violations introduced.

## Required Changes

None. All changes are rule-correct.
