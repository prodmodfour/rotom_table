---
review_id: rules-review-115
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-077
domain: combat
commits_reviewed:
  - e4340a2
  - 6dd4c35
  - 5979fae
  - 2594ec9
  - 02033ef
  - c1f7ce9
mechanics_verified:
  - focus-stat-bonus-evasion
  - focus-stat-bonus-initiative
  - focus-stat-bonus-damage
  - evasion-derivation-ordering
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/09-gear-and-items.md#Focus (p.295)
  - core/07-combat.md#Initiative (p.227)
  - core/07-combat.md#Evasion (p.232-234)
  - core/07-combat.md#Combat-Stages (p.670-675)
reviewed_at: 2026-02-21T12:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Focus Stat Bonus (+5) — Evasion Derivation
- **Rule:** "A Focus grants +5 Bonus to a Stat, chosen when crafted. This Bonus is applied AFTER Combat Stages." (`core/09-gear-and-items.md`, p.295)
- **Rule:** "for every 5 points a Pokemon or Trainer has in [Defense/SpDef/Speed], they gain +1 [Physical/Special/Speed] Evasion, up to a maximum of +6" (`core/07-combat.md`, p.598-615)
- **Implementation:** `calculateEvasion(baseStat, combatStage, evasionBonus, statBonus)` in `app/utils/damageCalculation.ts:102-109`. The function applies the combat stage multiplier first (`applyStageModifier(baseStat, combatStage)`), then adds `statBonus`, then divides by 5 and floors. This is the correct ordering: stages first, Focus bonus second, evasion derivation third.
- **Verification trace:** `calculateEvasion(20, -1, 0, 5)` = `floor((floor(20 * 0.9) + 5) / 5)` = `floor((18 + 5) / 5)` = `floor(4.6)` = 4. Matches unit test assertion at line 121.
- **Status:** CORRECT

### 2. Focus Stat Bonus (+5) — Initiative
- **Rule:** "a Pokemon or Trainer's Initiative is simply their Speed Stat, though Items, Features, Moves, and other effects may modify this." (`core/07-combat.md`, p.227)
- **Rule:** Focus +5 to Speed applies after combat stages. (`core/09-gear-and-items.md`, p.295)
- **Implementation:** `buildCombatantFromEntity` in `app/server/services/combatant.service.ts:562-629`. Lines 586-589 compute `effectiveSpeed` as `applyStageModifier(stats.speed, equipmentSpeedDefaultCS) + focusSpeedBonus` (when Heavy Armor applies) or `stats.speed + focusSpeedBonus` (no armor). Then `initiative = effectiveSpeed + initiativeBonus`.
- **Verification:** The Focus Speed bonus is correctly added after the stage modifier and before the initiative bonus. When no Heavy Armor is present, there are no combat stages at init time, so `speed + 5` is correct. When Heavy Armor sets default CS to -1, it becomes `floor(speed * 0.9) + 5 + bonus`. Both orderings match PTU intent.
- **Status:** CORRECT

### 3. Focus Stat Bonus (+5) — Damage Calculation (Attack/Defense)
- **Rule:** Focus +5 applies after combat stages to attack or defense stat. (`core/09-gear-and-items.md`, p.295)
- **Implementation (client):** `useMoveCalculation.ts` lines 359-377: `attackStatValue` computed adds `focusBonus` after `applyStageModifier(baseStat, stages.attack)`. Lines 443-471: `targetDamageCalcs` adds `focusDefBonus` after `applyStageModifier(baseStat, stages.defense)`. Both use `computeEquipmentBonuses` to extract the Focus bonus and only apply for `target.type === 'human'`.
- **Implementation (server):** `calculate-damage.post.ts` lines 191-218: `attackBonus` and `defenseBonus` are extracted from equipment and passed to `calculateDamage()` via `DamageCalcInput.attackBonus` / `defenseBonus`. The `calculateDamage` function in `damageCalculation.ts:262-324` calls `applyStageModifierWithBonus(stat, stage, bonus)` which is `applyStageModifier(stat, stage) + bonus`. Correct ordering.
- **Status:** CORRECT

### 4. Consistency Across Code Paths
- **Paths verified:**
  1. `calculateEvasion` in `damageCalculation.ts` -- canonical evasion function with `statBonus` param (commit e4340a2)
  2. `buildCombatantFromEntity` in `combatant.service.ts` -- uses `initialEvasion(stat + focusBonus)` for initial evasion at combat start (commit 6dd4c35). At stage 0, `initialEvasion(stat + bonus)` = `floor((stat + bonus) / 5)` which equals `calculateEvasion(stat, 0, 0, bonus)`. Consistent.
  3. `useCombat.ts` wrappers (`calculatePhysicalEvasion`, `calculateSpecialEvasion`, `calculateSpeedEvasion`) -- all pass `statBonus` through to `calculateEvasion` (commit 5979fae). Consistent.
  4. `useMoveCalculation.ts` (`getTargetEvasion`, `getTargetEvasionLabel`) -- extracts Focus bonuses per stat from `computeEquipmentBonuses` and passes correct bonus to the correct evasion type (commit 2594ec9). Consistent.
  5. `calculate-damage.post.ts` -- server-side evasion computation passes `focusDefBonus`, `focusSpDefBonus`, `focusSpeedBonus` to `calculateEvasion` (commit 02033ef). Consistent.
- **Status:** CORRECT -- all 5 code paths produce identical results for the same inputs.

### 5. Focus Scope — Trainers Only
- **Rule:** "Focuses are often Accessory-Slot Items... a Trainer may only benefit from one Focus at a time" (`core/09-gear-and-items.md`, p.295). Focus is trainer equipment, not a Pokemon held item.
- **Implementation:** All code paths gate Focus bonus extraction behind `entityType === 'human'` or `target.type === 'human'`. Pokemon combatants correctly receive zero Focus bonuses.
- **Status:** CORRECT

## Summary

The ptu-rule-077 fix correctly implements Focus stat bonus (+5) across all combat code paths:

1. **Evasion:** `statBonus` parameter added to `calculateEvasion` with correct ordering (after combat stage multiplier, before /5 division). Applied consistently in the combatant builder, useCombat wrappers, useMoveCalculation (both `getTargetEvasion` and `getTargetEvasionLabel`), and the server-side calculate-damage endpoint.

2. **Initiative:** Focus Speed +5 is added to effective speed after stage modification in `buildCombatantFromEntity`. Works correctly both with and without Heavy Armor.

3. **Damage stats:** Focus attack/defense bonuses are applied after combat stages in both client (`useMoveCalculation.attackStatValue`, `targetDamageCalcs`) and server (`calculate-damage.post.ts` via `DamageCalcInput.attackBonus/defenseBonus`).

4. **Unit tests:** 4 new test cases verify the core behavior: statBonus increases evasion, statBonus ordering relative to combat stages, and all three evasion aliases pass statBonus through.

## Rulings

1. **RULING: Focus bonus ordering is correct.** PTU p.295 says "This Bonus is applied AFTER Combat Stages." The implementation does `applyStageModifier(stat, stage) + bonus`, which applies the stage multiplier first, then adds the flat +5. This matches the rule text.

2. **RULING: Evasion cap interaction is correct.** The +6 evasion cap (`Math.min(6, ...)`) applies to the stat-derived evasion after Focus bonus is incorporated. A trainer with 25 Defense + Focus (+5) = 30 effective Defense gets `floor(30/5) = 6` evasion (capped at 6). This is correct per PTU p.600: "up to a maximum of +6 at 30 Defense."

3. **RULING: Focus bonus applies to the stat, not to evasion directly.** Focus +5 is a stat bonus, meaning it feeds into the `floor(stat / 5)` derivation. It is NOT an additive evasion bonus (which would bypass the /5 derivation). The implementation correctly distinguishes these: `statBonus` is added to the stat before /5, while `evasionBonus` is added after /5. This matches PTU intent -- Focus raises the stat, and evasion is derived from the raised stat.

## Observations (MEDIUM)

### M1: `useCombat.calculateInitiative` does not include Focus bonus
- **Location:** `app/composables/useCombat.ts:66-82`
- **Issue:** The `calculateInitiative` function in the composable does not incorporate Focus Speed bonus. However, this function is **never called** anywhere in the codebase (confirmed via grep). The actual initiative computation happens only in `buildCombatantFromEntity` on the server, which does include Focus correctly. This is dead code, but if someone were to use `calculateInitiative` in the future without updating it, they would get incorrect initiative values for trainers with Focus (Speed).
- **Impact:** None currently. Low risk of future confusion.
- **Recommendation:** Consider adding a `// NOTE: Does not include equipment bonuses` JSDoc warning, or removing this function if it remains unused.

### M2: Multiple Focus items not explicitly prevented in `computeEquipmentBonuses`
- **Location:** `app/utils/equipmentBonuses.ts:46-49`
- **Rule:** "a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot" (`core/09-gear-and-items.md`, p.295)
- **Issue:** If a trainer had Focus items in two different equipment slots (e.g., head + accessory), `computeEquipmentBonuses` would sum both bonuses. The equipment slot system (one item per slot) makes this unlikely but not impossible since Focus can be crafted for different slots.
- **Impact:** Edge case. Relies on GM discipline rather than code enforcement. Not introduced by this fix -- pre-existing behavior of the equipment system.
- **Recommendation:** Consider adding a "take only first Focus bonus" guard in `computeEquipmentBonuses`, or validate at equipment-assignment time.

## Verdict

**APPROVED** -- All 6 commits correctly implement Focus stat bonus mechanics per PTU 1.05 p.295. The Focus +5 is applied after combat stages and before evasion derivation across all code paths (combatant builder, useCombat wrappers, useMoveCalculation, calculate-damage endpoint). Initiative calculation in `buildCombatantFromEntity` correctly incorporates Focus Speed bonus. Client and server computations are consistent. Unit tests verify the core formula behavior. The two MEDIUM observations are pre-existing edge cases not introduced by this fix and do not block approval.

## Required Changes

None. All changes are approved as implemented.
