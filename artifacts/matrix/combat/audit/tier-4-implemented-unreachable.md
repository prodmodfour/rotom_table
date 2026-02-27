## Tier 4: Implemented-Unreachable

### 36. combat-R131 — AP Accuracy Bonus

- **Rule:** "any Trainer may spend 1 Action Point as a free action before making an Accuracy Roll or Skill Check to add +1 to the result." (06-playing-the-game.md:234-237)
- **Expected behavior:** AP spending UI for +1 accuracy.
- **Actual behavior:** `useCombat.ts:146` — `calculateMaxActionPoints` correctly computes max AP. No UI for spending AP on accuracy. Logic is Implemented-Unreachable as noted in matrix.
- **Classification:** Correct (formula verified; access gap acknowledged)

### 37. combat-R134 — Armor Damage Reduction

- **Rule:** PTU p.293-294: Light Armor provides flat DR. Heavy Armor provides higher DR but -1 speed CS. Helmets provide DR against critical hits only.
- **Expected behavior:** Equipment DR subtracted from damage. Helmet DR conditional on crits.
- **Actual behavior:**
  - `app/utils/equipmentBonuses.ts:30-63` — `computeEquipmentBonuses` sums `damageReduction` from all items, collects `conditionalDR` (helmet crit DR).
  - `app/composables/useMoveCalculation.ts:434-447` — For human targets: base DR + helmet conditional DR on crits.
  - `useMoveCalculation.ts:474` — Total DR subtracted from damage.
- **Classification:** Correct
- **Note:** Player view access gap acknowledged. DR logic itself is correct.

### 38. combat-R135 — Shield Evasion Bonus

- **Rule:** PTU p.294: Shields provide +1 evasion bonus.
- **Expected behavior:** Shield evasion bonus added to all three evasion types additively.
- **Actual behavior:** `equipmentBonuses.ts:47-48` — `evasionBonus` accumulated. `useMoveCalculation.ts:208` — added to evasion computation. `combatant.service.ts:622-624` — included in initial evasion at combatant creation.
- **Classification:** Correct

---
