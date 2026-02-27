---
review_id: rules-review-104
target: refactoring-055
trigger: refactoring
verdict: PASS
reviewed_commits: [0de9094]
reviewed_files: [app/utils/damageCalculation.ts, app/composables/useCombat.ts]
date: 2026-02-20
reviewer: game-logic-reviewer
---

## PTU Rules Verification Report

### Scope
- [x] Verify `calculateEvasion` in `damageCalculation.ts` implements correct PTU 1.05 evasion formula
- [x] Verify the removed local version in `useCombat.ts` was identical to the canonical version
- [x] Verify the import-based delegation preserves correct behavior for all three evasion types
- [x] Verify combat stage multiplier interaction with evasion derivation

### Mechanics Verified

#### Stat-Derived Evasion (Part 1)
- **Rule:** "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense." Identical rules for Special Defense -> Special Evasion and Speed -> Speed Evasion. (07-combat.md:598-615) "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion from the artificially increased defense score. However, you can never gain more than +6 Evasion from Stats." (07-combat.md:644-647)
- **Implementation:** `Math.min(6, Math.floor(applyStageModifier(baseStat, combatStage) / 5))` -- applies the combat stage multiplier to the stat first (producing the "artificially increased defense score"), then divides by 5 and floors, then caps at 6.
- **Verification:** Manual spot-checks:
  - Defense 15, CS 0: floor(15 / 5) = 3 -> Physical Evasion +3. Correct (15 points = 3 increments of 5).
  - Defense 15, CS +1: floor(floor(15 * 1.2) / 5) = floor(18 / 5) = floor(3.6) = 3. Correct.
  - Defense 15, CS +2: floor(floor(15 * 1.4) / 5) = floor(21 / 5) = floor(4.2) = 4. Correct (stage boost raises the stat enough to gain another evasion point).
  - Defense 30, CS 0: floor(30 / 5) = 6. Correct (maximum +6 at 30 Defense, per rules).
  - Defense 35, CS 0: min(6, floor(35 / 5)) = min(6, 7) = 6. Correct (capped at +6).
  - Speed 10, CS 0: floor(10 / 5) = 2. Correct.
- **Status:** CORRECT

#### Combat Stage Multipliers Applied to Stats
- **Rule:** "For every Combat Stage above 0, a Stat is raised by 20%, rounded down. For every Combat Stage below 0, a Stat is lowered by 10%, rounded down." (07-combat.md:672-675) Multiplier table: CS -6 = 40%, CS 0 = 100%, CS +6 = 220%.
- **Implementation:** `applyStageModifier(baseStat, stage)` uses `Math.floor(baseStat * STAGE_MULTIPLIERS[clampedStage])` with the correct multiplier table (0.4 at -6 through 2.2 at +6). Both `damageCalculation.ts` and `useCombat.ts` define identical multiplier tables.
- **Status:** CORRECT

#### Evasion Bonus from Moves/Effects (Part 2)
- **Rule:** "Besides these base values for evasion, Moves and effects can raise or lower Evasion. These extra Changes in Evasion apply to all types of Evasion, and stack on top." (07-combat.md:648-651) "Much like Combat Stages; it has a minimum of -6 and a max of +6." (07-combat.md:652-653)
- **Implementation:** `evasionBonus` parameter is added after the stat-derived evasion: `statEvasion + evasionBonus`. The bonus is accepted as a parameter (clamping to -6/+6 range is the caller's responsibility, consistent with how combat stages are stored).
- **Status:** CORRECT

#### Negative Evasion Floor
- **Rule:** "Negative Evasion can erase Evasion from other sources, but does not increase the Accuracy of an enemy's Moves." (07-combat.md:654-655)
- **Implementation:** `Math.max(0, statEvasion + evasionBonus)` -- total is clamped to minimum 0. Negative evasion bonuses can reduce stat-derived evasion to 0, but not below.
- **Status:** CORRECT

#### Evasion Cap on Accuracy Checks (+9)
- **Rule:** "No matter from which sources you receive Evasion, you may only raise a Move's Accuracy Check by a max of +9." (07-combat.md:656-657)
- **Implementation:** This cap is enforced separately in `calculateAccuracyThreshold` via `Math.min(9, defenderEvasion)`, not in `calculateEvasion` itself. This is the correct separation -- `calculateEvasion` returns the raw total evasion (0-12 theoretical max: 6 from stats + 6 from bonus), and the +9 cap is applied at the accuracy check level.
- **Status:** CORRECT (separation of concerns is appropriate)

#### Refactoring Equivalence
- **Old code (removed from useCombat.ts):**
  ```typescript
  const calculateEvasion = (stat: number, combatStages: number = 0, evasionBonus: number = 0): number => {
    const statEvasion = Math.min(6, Math.floor(applyStageModifier(stat, combatStages) / 5))
    return Math.max(0, statEvasion + evasionBonus)
  }
  ```
- **New code (canonical in damageCalculation.ts):**
  ```typescript
  export function calculateEvasion(baseStat: number, combatStage: number = 0, evasionBonus: number = 0): number {
    const statEvasion = Math.min(6, Math.floor(applyStageModifier(baseStat, combatStage) / 5))
    return Math.max(0, statEvasion + evasionBonus)
  }
  ```
- **Analysis:** The function bodies are identical. Parameter names differ (`stat` vs `baseStat`, `combatStages` vs `combatStage`) but the logic and default values are the same. Both versions call `applyStageModifier` with the same arguments -- and both `useCombat.ts` and `damageCalculation.ts` define `applyStageModifier` with an identical multiplier table and `Math.floor` rounding.
- **Status:** CORRECT -- pure refactoring, zero behavior change

### Summary
- Mechanics checked: 5
- Correct: 5
- Incorrect: 0

The `calculateEvasion` function in `damageCalculation.ts` correctly implements all aspects of PTU 1.05 evasion: stat-derived evasion via combat-stage-modified stats (floor(stat/5), capped at +6), additive bonus evasion from moves/effects, and the floor at 0 for negative totals. The refactoring in commit `0de9094` removes an identical local copy from `useCombat.ts` and replaces it with an import, preserving all behavior. The three wrapper aliases (`calculatePhysicalEvasion`, `calculateSpecialEvasion`, `calculateSpeedEvasion`) now delegate to the imported canonical function.
