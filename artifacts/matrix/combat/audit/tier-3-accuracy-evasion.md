---
tier: 3
title: Accuracy & Evasion Chain
audited_at: 2026-02-28T08:00:00Z
items: 4
correct: 4
---

# Tier 3: Accuracy & Evasion Chain

Verifying the complete accuracy/evasion pipeline from move AC through evasion selection to final threshold.

---

### 14. combat-R012 — Accuracy Threshold Formula

- **Rule:** "An Accuracy Check is the number an Accuracy Roll needs to meet or exceed to hit. It's determined first taking the Move's base AC and adding the target's Evasion." (PTU p.236). "Accuracy's Combat Stages apply directly" (PTU p.234).
- **Expected behavior:** threshold = moveAC + evasion(capped 9) - accuracyCS. Min 1.
- **Actual behavior:**
  - `app/utils/damageCalculation.ts:118-125` — `calculateAccuracyThreshold(moveAC, attackerAccuracyStage, defenderEvasion)`: `max(1, moveAC + min(9, evasion) - accuracyStage)`
  - `app/composables/useMoveCalculation.ts:388-397` — `getAccuracyThreshold(targetId)`: adds rough terrain penalty (+2) per decree-003/decree-010 to threshold. Returns `max(1, move.ac + effectiveEvasion - attackerAccuracyStage + roughPenalty)`.
- **Classification:** **Correct**

---

### 15. combat-R013 — Evasion Application Rules

- **Rule:** "Physical Evasion can only modify the accuracy rolls of Moves that target the Defense Stat; similarly, Special Evasion can modify the rolls of attacks that target the Special Defense Stat. Speed Evasion may be applied to any Move with an accuracy check, but you may only add one of your three evasions to any one check." (PTU p.234)
- **Expected behavior:** Physical attacks: max(physEvasion, speedEvasion). Special attacks: max(specEvasion, speedEvasion). Only one type applied per check.
- **Actual behavior:**
  - `app/composables/useMoveCalculation.ts:355-368` — `getTargetEvasion(targetId)`: For Physical: `Math.max(evasions.physical, evasions.speed)`. For non-Physical (Special): `Math.max(evasions.special, evasions.speed)`.
  - `app/utils/evasionCalculation.ts:35-81` — `computeTargetEvasions` calculates all three independently, including equipment bonuses and zero-evasion conditions.
- **Classification:** **Correct**
- **Note:** The auto-selection of best evasion (rational defender) is the correct PTU approach. The matrix flagged missing "strict phys/spec enforcement" but PTU itself says "you may only add ONE" — the max selection enforces exactly that.

---

### 16. combat-R066/R067 — Evasion Caps (6 from stats, 9 total)

- **Rule:** "you can never gain more than +6 Evasion from Stats" (PTU p.234). "you may only raise a Move's Accuracy Check by a max of +9" (PTU p.234)
- **Expected behavior:** Stat-derived evasion capped at 6. Total evasion in accuracy check capped at 9.
- **Actual behavior:**
  - `app/utils/damageCalculation.ts:105` — `Math.min(6, Math.floor(...))` — Stat evasion cap at 6.
  - `app/utils/damageCalculation.ts:123` — `Math.min(9, defenderEvasion)` — Total cap at 9 in accuracy threshold.
  - `app/composables/useMoveCalculation.ts:392` — `effectiveEvasion = Math.min(9, evasion)` — Client mirrors same cap.
- **Classification:** **Correct**

---

### 17. combat-R135 — Shield Evasion Bonus

- **Rule:** PTU p.294 (errata-2.md p.4): "Light Shields (now just Shields) grant a +1 Evasion bonus."
- **Expected behavior:** Shield +1 evasion bonus applied additively to all three evasion types.
- **Actual behavior:**
  - `app/utils/equipmentBonuses.ts:63-65` — `if (item.evasionBonus) { evasionBonus += item.evasionBonus }` — Shield evasion bonus accumulated.
  - `app/utils/evasionCalculation.ts:54-63` — `evasionBonus += equipBonuses.evasionBonus` for human combatants.
  - `app/utils/evasionCalculation.ts:77-80` — All three evasion calculations receive the same `evasionBonus` parameter.
  - `app/utils/damageCalculation.ts:102-108` — `calculateEvasion(baseStat, combatStage, evasionBonus, statBonus)` — evasionBonus added after stat-derived evasion (additive, not part of the cap-6 stat portion).
- **Classification:** **Correct**
- **Note:** The evasion bonus stacks on top of stat-derived evasion (which is capped at 6), consistent with PTU p.234: "These extra Changes in Evasion apply to all types of Evasion, and stack on top."
