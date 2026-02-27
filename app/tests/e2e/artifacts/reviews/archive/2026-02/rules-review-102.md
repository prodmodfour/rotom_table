---
review_id: rules-review-102
ticket: ptu-rule-048
commits_reviewed: [ecac81b, 255c3f6]
verdict: PASS
reviewer: game-logic-reviewer
date: 2026-02-20
---

# Rules Review: ptu-rule-048 — Evasion Two-Part System Clarification

## Claim Under Review

The developer claims that PTU has a **two-part evasion system** and that the original audit (combat-R010, which flagged the evasion combat stage as an "Approximation" of the multiplier table) was based on a misunderstanding. The developer made no formula changes — only UI labels and documentation.

## Independent PTU Rules Analysis

### Source: `books/markdown/core/07-combat.md`, lines 594-657

I read the full evasion rules block verbatim. PTU defines evasion in two clearly distinct parts:

**Part 1 — Stat-derived evasion (lines 594-647):**
> "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense." (line 598-600)

Same pattern for Special Defense (lines 608-610) and Speed (lines 613-615). Combat stages on Def/SpDef/Speed modify the stat via the multiplier table (lines 664-689), and evasion is derived from the *modified* stat. The rulebook explicitly confirms this shortcut on lines 684-689:

> "One easy way to apply Combat Stages for Defense, Special Defense, and Speed is to simply remember that Stat Evasion is also equal to 20% of a Stat. This means each positive Combat Stage is equal to the Evasion you gain from that Stat."

The +6 cap on stat-derived evasion is stated on lines 646-647:
> "you can never gain more than +6 Evasion from Stats."

**Part 2 — Evasion bonus from moves/effects (lines 648-655):**
> "Besides these base values for evasion, Moves and effects can raise or lower Evasion. These extra Changes in Evasion apply to all types of Evasion, and stack on top." (lines 648-651)

This part has its own -6/+6 range (line 653):
> "Much like Combat Stages; it has a minimum of -6 and a max of +6."

Negative evasion behavior (lines 654-655):
> "Negative Evasion can erase Evasion from other sources, but does not increase the Accuracy of an enemy's Moves."

Global cap (lines 656-657):
> "No matter from which sources you receive Evasion, you may only raise a Move's Accuracy Check by a max of +9."

### Source: `books/markdown/errata-2.md`

Errata references confirm the additive nature: "I Believe In You!" grants "+2 Bonus to evasion for 1 full round" (line 156), and Shields grant "+1 Evasion bonus" (line 185). These are Part 2 bonuses, not stat multipliers.

### Verification Against Rulebook Examples

**Example 1 (page 258):** Struggle Attack with AC 4 vs Oddish with 2 Physical Evasion. Sylvana rolls 6. Threshold = 4 + 2 = 6. Roll 6 >= 6 = hit. "just barely hitting" -- matches.

**Example 2 (page 254):** Poison Powder (AC 6) through smokescreen (penalty 3) vs Sylvana with Speed Evasion 1. "would have needed to roll at least a 10." Threshold = 6 + 1 + 3 = 10. Oddish rolled 8 < 10 = miss -- matches.

## Ruling: The Developer Is Correct

PTU unambiguously defines two separate evasion mechanisms:

1. **Stat-derived evasion**: `min(6, floor(stageModified(Stat) / 5))` where the combat stage multiplier table is applied to the defensive stat *before* dividing by 5.
2. **Evasion bonus**: An additive modifier from moves and effects with its own -6/+6 range that stacks on top of stat-derived evasion.

The original audit (combat-R010) classified the `stageModifiers.evasion` field as an "Approximation" of the multiplier table. This was incorrect — the `evasion` field represents Part 2 (additive bonus from moves/effects), which is a completely separate PTU mechanic from combat stages on defensive stats. The additive treatment was already PTU-correct before this ticket.

## Code Verification

### `calculateEvasion()` in `damageCalculation.ts` (line 102-108)
```typescript
export function calculateEvasion(baseStat: number, combatStage: number = 0, evasionBonus: number = 0): number {
  const statEvasion = Math.min(6, Math.floor(applyStageModifier(baseStat, combatStage) / 5))
  return Math.max(0, statEvasion + evasionBonus)
}
```
- Part 1: `applyStageModifier` uses the correct multiplier table (0.4 to 2.2), then divides by 5, capped at 6. **Correct.**
- Part 2: `evasionBonus` is added on top (additive). **Correct per PTU lines 648-651.**
- Floor at 0: "Negative Evasion can erase Evasion from other sources, but does not increase the Accuracy." **Correct per PTU lines 654-655.**

### `calculateAccuracyThreshold()` in `damageCalculation.ts` (line 117-124)
```typescript
export function calculateAccuracyThreshold(moveAC, attackerAccuracyStage, defenderEvasion) {
  const effectiveEvasion = Math.min(9, defenderEvasion)
  return Math.max(1, moveAC + effectiveEvasion - attackerAccuracyStage)
}
```
- +9 cap on evasion applied to accuracy check. **Correct per PTU line 657.**
- Accuracy combat stage applied directly (not as multiplier). **Correct per PTU lines 624-631.**

### `getTargetEvasion()` in `useMoveCalculation.ts` (line 190-222)
- Picks the higher of damage-class-matching evasion vs Speed Evasion. **Correct per PTU lines 638-643** ("Speed Evasion may be applied to any Move with an accuracy check, but you may only add one of your three evasions to any one check").
- Passes `evasionBonus` (from `stageModifiers.evasion`) to all three evasion calculations. **Correct per PTU line 650** ("apply to all types of Evasion").

### `STAGE_MULTIPLIERS` table (line 27-41)
Matches PTU table on lines 701-728 exactly:
- Negative: -10% per stage (0.9, 0.8, ..., 0.4). **Correct.**
- Positive: +20% per stage (1.2, 1.4, ..., 2.2). **Correct.**

### `StageModifiers` type in `combat.ts`
Fields correctly documented with JSDoc distinguishing the three PTU modifier categories (stat multipliers, accuracy additive, evasion additive).

## What The Commits Actually Changed

Commit `ecac81b` made **zero formula changes**. All modifications were:
- UI: CombatStagesModal split into labeled sections separating stat multipliers from additive modifiers
- Labels: "Eva" renamed to "Eva Bonus" / "Eva+" to prevent confusion
- Documentation: JSDoc on `StageModifiers` type and inline PTU rule references at all evasion calculation callsites

This is purely a clarity improvement. The formulas were already correct.

## Issues Found

None. The evasion implementation fully matches PTU 1.05 rules.

## Verdict: PASS

The developer's analysis is correct. PTU defines a two-part evasion system, and the code correctly implements both parts. The original audit's classification of the evasion bonus as an "Approximation" was a misidentification — the additive treatment is what PTU prescribes for Part 2 evasion. No formula changes were needed; the UI and documentation improvements are appropriate.
