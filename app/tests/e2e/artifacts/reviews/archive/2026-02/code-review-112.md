---
review_id: code-review-112
ticket: ptu-rule-048
commits_reviewed: [ecac81b, 255c3f6]
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
---

## Review Scope

Reviewing the developer's fix for ptu-rule-048 (evasion CS treatment). The ticket originally claimed that evasion combat stages were being applied as flat additive modifiers instead of using the PTU multiplier table. The developer investigated and concluded the formulas were already correct, then delivered UI clarity and documentation improvements across 10 files.

## Verification: "Formulas Already Correct" Claim

This is the most important claim in the changeset. I independently verified it against the PTU rulebook (07-combat.md, lines 594-691).

**PTU defines two distinct evasion mechanics:**

1. **Stat-derived evasion** (lines 598-615, 644-647): `floor(Stat / 5)`, capped at +6. Lines 644-647 state "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion from the artificially increased defense score." This means CS multipliers are applied to the *stat* before the `floor(stat / 5)` division. The code does exactly this -- `calculateEvasion()` calls `applyStageModifier(baseStat, combatStage)` which uses the multiplier table, then divides by 5. Confirmed correct.

2. **Evasion bonus from moves/effects** (lines 648-655): "Besides these base values for evasion, Moves and effects can raise or lower Evasion. These extra Changes in Evasion apply to all types of Evasion, and stack on top." This is explicitly additive with its own -6/+6 range. The `stageModifiers.evasion` field represents this bonus and is added directly. Confirmed correct.

3. **Total evasion cap** (lines 656-657): "+9 max" applied at accuracy threshold time. Code uses `Math.min(9, applicableEvasion)` in `calculate-damage.post.ts:200` and the same in `calculateAccuracyThreshold()`. Confirmed correct.

4. **Negative evasion floor** (lines 654-655): "Negative Evasion can erase Evasion from other sources, but does not increase the Accuracy of an enemy's Moves." Code uses `Math.max(0, statEvasion + evasionBonus)`. Confirmed correct.

**Verdict on claim: ACCEPTED.** The audit's "Approximation" classification was incorrect. The code already implemented the two-part system faithfully. The developer's analysis is accurate and well-sourced.

## Code Changes Review

### `app/types/combat.ts` -- JSDoc on StageModifiers

The JSDoc comments on each field of `StageModifiers` are accurate. The top-level comment correctly identifies the three distinct mechanics (combat stages, accuracy, evasion bonus) sharing the -6/+6 range. Field-level documentation correctly notes which stats affect which evasion types (e.g., defense affects Physical Evasion, speed affects Speed Evasion + movement).

No behavioral changes. Documentation only.

### `app/components/encounter/CombatStagesModal.vue` -- Section Split

The modal now splits into two labeled sections:
- "Combat Stages (stat multipliers)" containing attack/defense/specialAttack/specialDefense/speed
- "Accuracy & Evasion (additive modifiers)" containing accuracy/evasion

Verified:
- `COMBAT_STAGE_STATS` (5 stats) + `ADDITIVE_MODIFIER_STATS` (2 stats) covers all 7 fields. No stat dropped or duplicated.
- `ALL_STATS` spread correctly combines both arrays for `resetStages()` and `applyStages()`. Iteration covers all 7.
- `stageInputs` reactive object still initializes all 7 stats from `props.currentStages`. No init regression.
- Evasion renamed from "Eva" to "Eva Bonus" -- matches the semantic meaning (moves/effects bonus, not the stat-derived evasion).
- SCSS uses project variables (`$spacing-md`, `$spacing-sm`, `$glass-border`, `$font-size-sm`, `$color-text-muted`). No hardcoded values.
- `:not(:first-child)` selector on `.stages-section` correctly adds the divider only between sections, not above the first.
- Template logic (disabled states, value formatting, button handlers) is identical between the two sections -- just split for display.
- File size: 202 lines. Well under 800.
- No emojis in UI.

No behavioral changes to data flow. The `emit('save', changes, true)` call is unchanged.

### `app/components/encounter/CombatantCard.vue` -- "Eva" to "Eva+"

Single label change in `STAT_NAMES` map: `evasion: 'Eva+'`. The comment above the map explains the distinction. Consistent with the abbreviated format used in this component (Atk, Def, SpA, SpD, Spe, Acc). File size: 576 lines.

### `app/components/group/CombatantDetailsPanel.vue` -- "EVA" to "EVA+"

Single label change in `formatStageName` map: `evasion: 'EVA+'`. Consistent with the uppercase convention used in this component (ATK, DEF, SP.ATK, SP.DEF, SPD, ACC). Comment added. File size: 726 lines.

### `app/components/pokemon/PokemonStatsTab.vue` -- "EVA" to "EVA+"

Template-level change only: `<span class="stage-stat">EVA+</span>`. Consistent with the uppercase convention in this component and matches `CombatantDetailsPanel`. File size: 389 lines.

### Label Consistency Across Views

| Component | Old Label | New Label | Convention |
|---|---|---|---|
| CombatStagesModal | Eva | Eva Bonus | Full words (Atk, Def, SpA, SpD, Spe, Acc) |
| CombatantCard | Eva | Eva+ | Abbreviated (Atk, Def, SpA, SpD, Spe, Acc) |
| CombatantDetailsPanel | EVA | EVA+ | Uppercase (ATK, DEF, SP.ATK, SP.DEF, SPD, ACC) |
| PokemonStatsTab | EVA | EVA+ | Uppercase (matches CombatantDetailsPanel) |

Each component's evasion label follows the existing naming convention in that component. The "+" or "Bonus" suffix distinguishes the additive bonus from stat-derived evasion in all views.

**MoveTargetModal** was not changed and correctly should not have been -- it displays "Phys Evasion", "Spec Evasion", or "Speed Evasion" via `getTargetEvasionLabel()`, which refers to the *total resolved evasion type* applied to the accuracy check, not the evasion bonus field. These are different concepts and the labels serve different purposes.

### Composable & Utility Documentation

**`useCombat.ts`**: Expanded comment block above `calculateEvasion` correctly describes the two-part system with PTU page/line references. The code itself (`applyStageModifier` then `/ 5` then `+ evasionBonus` then `Math.max(0, ...)`) is unchanged.

**`useMoveCalculation.ts`**: Two annotation blocks added at lines 196-199 and 235. Both explain that `stages.evasion` is the additive bonus, not a multiplier. No code changes.

**`damageCalculation.ts`**: `calculateEvasion()` JSDoc expanded with the full two-part explanation including PTU quotes. Function body unchanged. `calculateAccuracyThreshold()` reference to +9 cap is unchanged.

**`calculate-damage.post.ts`**: Comment expanded at line 186-188 from "(P1)" to the two-part explanation. No code changes.

**`combatant.service.ts`**: Comment above `VALID_STATS` now explains the three modifier categories. The "All three categories are clamped to -6 to +6" note is accurate.

### File Sizes

All files under 800 lines:
- CombatStagesModal.vue: 202
- CombatantCard.vue: 576
- CombatantDetailsPanel.vue: 726
- PokemonStatsTab.vue: 389
- combat.ts: 71
- useCombat.ts: 246
- useMoveCalculation.ts: 604
- damageCalculation.ts: 307
- calculate-damage.post.ts: 233
- combatant.service.ts: 592

### Duplicate calculateEvasion

There are two copies of the `calculateEvasion` function: one in `useCombat.ts` (composable, lines 64-70) and one in `damageCalculation.ts` (utility, lines 102-108). Both have identical logic. This duplication predates this ticket and is not introduced by this changeset, so it is out of scope for this review. However, it is noted as a pre-existing code smell -- a future refactoring ticket could consolidate them.

## Issues Found

None. The changeset is documentation and label-only. No formula changes, no behavioral changes, no new state, no new API surface.

## Verdict

APPROVED -- The developer's investigation that formulas were already PTU-correct is independently verified against the rulebook. The two-part evasion system (stat-derived via multiplier table, moves/effects bonus additive) was already faithfully implemented. The UI section split in CombatStagesModal clearly separates the two different mechanics. Label changes are consistent across all four display components, following each component's existing naming convention. Documentation annotations are accurate and well-sourced with PTU page/line references. No behavioral regressions.
