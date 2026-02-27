---
review_id: rules-review-024
review_type: rules
reviewer: game-logic-reviewer
trigger: refactoring
target_report: refactoring-012
domain: combat
commits_reviewed:
  - ed32385
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/server/api/encounter-templates/[id]/load.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun: []
reviewed_at: 2026-02-18T04:00:00
---

## Review Scope

Verified PTU correctness of commit `ed32385` implementing refactoring-012: cap initial evasion at +6 per PTU rules (p.310-314). The fix extracts an `initialEvasion(stat)` helper that applies `Math.min(6, Math.floor(stat / 5))` and uses it at all combatant creation sites.

## Mechanics Verified

### 1. Evasion Formula: floor(stat / 5)

- **Rule:** PTU 07-combat.md lines 598-615:
  - "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion"
  - "for every 5 points a Pokemon or Trainer has in Special Defense, they gain +1 Special Evasion"
  - "for every 5 points a Pokemon or Trainer has in Speed, they gain +1 Speed Evasion"
- **Implementation:** `Math.floor(stat / 5)` — correct. Each 5 stat points = +1 evasion.
- **Status:** CORRECT

### 2. Evasion Cap: +6 Maximum from Stats

- **Rule:** PTU 07-combat.md lines 599-615:
  - "up to a maximum of +6 at 30 Defense"
  - "up to a maximum of +6 at 30 Special Defense"
  - "up to a maximum of +6 at 30 Speed"
  - Line 647: "you can never gain more than +6 Evasion from Stats"
- **Implementation:** `Math.min(MAX_EVASION, ...)` with `MAX_EVASION = 6` — correct. Cap triggers at stat >= 30 (floor(30/5) = 6), and higher values are clamped.
- **Status:** CORRECT

### 3. Stat Source: Calculated Stats (not Base Stats)

- **Rule:** PTU 07-combat.md lines 644-647: "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion from the artificially increased defense score." This confirms evasion derives from the current stat value, not base stats alone.
- **Implementation:**
  - Site 1 (`buildCombatantFromEntity`): Uses `entity.currentStats` (Pokemon) / `entity.stats` (HumanCharacter) — these are calculated stats (base + level-up + nature). Correct.
  - Site 3 (`load.post.ts`): Uses `tc.entityData.stats` for template human characters. These are the final stored stat values on the template entity data. Correct for this context.
- **Status:** CORRECT

### 4. Consistency with Dynamic Evasion Calculations

- **Rule:** The initial (spawn-time) evasion and the dynamic (accuracy-check-time) evasion should use the same base formula, differing only in combat stage application (zero at spawn, variable during combat).
- **Implementation:**
  - Initial: `Math.min(6, Math.floor(stat / 5))` — no combat stages (correct at spawn)
  - Dynamic (`damageCalculation.ts:92`): `Math.min(6, Math.floor(applyStageModifier(baseStat, combatStage) / 5))` — with combat stages
  - Dynamic (`useCombat.ts:53`): `Math.min(6, Math.floor(applyStageModifier(stat, combatStages) / 5))` — with combat stages
  - All three share the same core formula and +6 cap. Consistent.
- **Status:** CORRECT

### 5. Edge Case Verification

| Stat Value | Expected Evasion | `initialEvasion()` Result | PTU Reference |
|-----------|-----------------|--------------------------|---------------|
| 0 | 0 | `Math.min(6, 0)` = 0 | No stat = no evasion |
| 4 | 0 | `Math.min(6, 0)` = 0 | Below first threshold |
| 5 | 1 | `Math.min(6, 1)` = 1 | "for every 5 points...+1" |
| 10 | 2 | `Math.min(6, 2)` = 2 | 10/5 = 2 |
| 30 | 6 | `Math.min(6, 6)` = 6 | "maximum of +6 at 30" |
| 35 | 6 | `Math.min(6, 7)` = 6 | Capped — this was the bug |
| 100 | 6 | `Math.min(6, 20)` = 6 | Capped |

All edge cases match PTU rules.

### 6. No Remaining Uncapped Sites

- Grep for `Math.floor(.*/ 5)` in `app/server/` returns only `combatant.service.ts:515` (inside the capped helper). No uncapped evasion calculations remain.
- Grep for `Math.floor(.*/ 5)` in `app/composables/` returns `useCombat.ts:53` which already has `Math.min(6, ...)`.
- Grep for `Math.floor(.*/ 5)` in `app/utils/` returns `damageCalculation.ts:92` which already has `Math.min(6, ...)`.

## Errata Check

Searched `books/markdown/errata-2.md` for "evasion" — found references to Shield evasion bonuses and Cheerleader ability, but no corrections to the base evasion formula or +6 cap. No errata affects this fix.

## Summary

- Mechanics checked: 6
- Correct: 6
- Incorrect: 0
- Needs review: 0

## Verdict

APPROVED — The `initialEvasion()` helper correctly implements PTU's evasion-from-stats formula with the mandatory +6 cap. All three evasion types (physical, special, speed) are covered at both fixed sites. No uncapped evasion calculations remain anywhere in the codebase. No scenarios need re-running — initial evasion values are cosmetic at spawn time since live accuracy checks already used the capped `calculateEvasion()`.
