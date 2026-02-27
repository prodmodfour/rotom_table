---
review_id: rules-review-057
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-023
domain: combat
commits_reviewed:
  - 9f54006
files_reviewed:
  - app/composables/useMoveCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/utils/damageCalculation.ts
mechanics_verified:
  - speed-evasion-applicability
  - evasion-selection-logic
  - evasion-calculation-formula
  - evasion-cap-enforcement
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Evasion (p.234)
  - core/07-combat.md#Combat Stages (p.235)
  - core/07-combat.md#Accuracy Check (p.236)
reviewed_at: 2026-02-20T12:00:00
follows_up: rules-review-047
---

## Review Scope

Reviewing the Speed Evasion fix across three files. This is a follow-up to the ruling in rules-review-047 which established that `Math.max(matchingEvasion, speedEvasion)` is the correct auto-selection logic. The code changes are in commit `9f54006` (which also updated bug-026 ticket docs, but the relevant code diff is in `useMoveCalculation.ts` and `calculate-damage.post.ts`).

## Mechanics Verified

### Speed Evasion Applicability

- **Rule:** "Speed Evasion may be applied to any Move with an accuracy check, but you may only add one of your three evasions to any one check." (`core/07-combat.md`, p.234)
- **Implementation:** Both client (`useMoveCalculation.ts:getTargetEvasion()`) and server (`calculate-damage.post.ts`) now compute Speed Evasion alongside the damage-class-matching evasion and use `Math.max()` to auto-select the highest. Previously, only Physical or Special evasion was used depending on the move's damage class; Speed Evasion was computed on the server but not used in the selection.
- **Status:** CORRECT
- **Notes:** The PTU rule is explicit: Speed Evasion can apply to ANY move with an accuracy check. The previous behavior of ignoring it entirely was a clear rule violation. The fix correctly makes Speed Evasion available for consideration against both Physical and Special moves.

### Evasion Selection Logic

- **Rule:** "you may only add one of your three evasions to any one check" (`core/07-combat.md`, p.234). The rule gives the defender the choice of which evasion to apply (Physical/Special vs Speed).
- **Implementation:** `Math.max(matchingEvasion, speedEvasion)` auto-selects the highest applicable evasion. The "matchingEvasion" is Physical for Physical moves and Special for Special moves, which is correct because Physical Evasion can "only modify the accuracy rolls of Moves that target the Defense Stat" and Special Evasion can only modify rolls "that target the Special Defense Stat" (`core/07-combat.md`, p.234). Speed Evasion has no such restriction. The max() ensures only one evasion is used (the highest), satisfying the "only add one" constraint.
- **Status:** CORRECT
- **Notes:** A rational defender will always choose their highest applicable evasion. Auto-selecting via `Math.max()` is a valid automation of this choice. This matches the ruling from rules-review-047. The alternative (letting the user manually pick) would add UI complexity for a decision that has a single optimal answer.

### Evasion Calculation Formula

- **Rule:** "for every 5 points a Pokemon or Trainer has in Speed, they gain +1 Speed Evasion, up to a maximum of +6 at 30 Speed" (`core/07-combat.md`, p.234). "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion from the artificially increased defense score." (`core/07-combat.md`, p.234-235)
- **Implementation:** Client-side: `calculateSpeedEvasion(speedStat, stages.speed, evasionBonus)` which calls `calculateEvasion()` = `Math.min(6, Math.floor(applyStageModifier(stat, combatStages) / 5))` + bonus. Server-side: `calculateEvasion(targetEvasion.speedBase, targetEvasion.speedStage, evasionBonus)` using the same shared utility formula. Both paths correctly: (1) apply combat stage multipliers to the base speed stat first, (2) divide by 5 and floor, (3) cap at +6 from stats, (4) add evasion bonus from moves/effects on top.
- **Status:** CORRECT
- **Notes:** The evasion calculation correctly uses the stage-modified ("calculated") stat, not the raw base stat. This is per PTU p.234-235 which explicitly states combat stages can increase evasion from the "artificially increased defense score."

### Evasion Cap Enforcement

- **Rule:** "you can never gain more than +6 Evasion from Stats" (`core/07-combat.md`, p.234). "No matter from which sources you receive Evasion, you may only raise a Move's Accuracy Check by a max of +9." (`core/07-combat.md`, p.234)
- **Implementation:** The `calculateEvasion` function applies `Math.min(6, ...)` for the stat-derived portion, then adds bonus evasion on top. The server-side code applies `const effectiveEvasion = Math.min(9, applicableEvasion)` as the final cap. This correctly separates the +6 stat cap from the +9 total cap.
- **Status:** CORRECT
- **Notes:** The two-tier cap system is correctly maintained. Even when Speed Evasion is selected via `Math.max()`, both caps still apply correctly because `Math.max()` operates on already-capped values from `calculateEvasion()`, and `effectiveEvasion` applies the final +9 limit.

## Summary

- Mechanics checked: 4
- Correct: 4
- Incorrect: 0
- Needs review: 0

## Rulings

This review confirms the ruling from rules-review-047: `Math.max(matchingEvasion, speedEvasion)` correctly implements the PTU p.234 evasion selection rule. The implementation is consistent across both client and server code paths.

## Verdict

APPROVED -- The Speed Evasion fix correctly implements PTU p.234 evasion rules. Speed Evasion is now considered for all moves with accuracy checks, the highest applicable evasion is auto-selected, combat stage modifiers are correctly applied, and both the +6 stat cap and +9 total cap are enforced.
