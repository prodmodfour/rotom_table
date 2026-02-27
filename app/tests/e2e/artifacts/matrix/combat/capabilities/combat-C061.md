---
cap_id: combat-C061
name: calculateEvasion
type: utility
domain: combat
---

### combat-C061: calculateEvasion
- **cap_id**: combat-C061
- **name**: Dynamic Evasion Calculator
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `calculateEvasion()`
- **game_concept**: PTU two-part evasion
- **description**: Part 1: floor((stageModified(stat) + statBonus) / 5), cap 6. Part 2: bonus from moves/effects/equipment stacks additively. Total min 0.
- **inputs**: baseStat, combatStage, evasionBonus, statBonus
- **outputs**: Evasion value
- **accessible_from**: gm, player
