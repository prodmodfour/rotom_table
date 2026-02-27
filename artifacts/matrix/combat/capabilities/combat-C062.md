---
cap_id: combat-C062
name: calculateAccuracyThreshold
type: utility
domain: combat
---

### combat-C062: calculateAccuracyThreshold
- **cap_id**: combat-C062
- **name**: Accuracy Threshold Calculator
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `calculateAccuracyThreshold()`
- **game_concept**: PTU accuracy check
- **description**: Threshold = moveAC + min(9, evasion) - accuracyStage. Min 1.
- **inputs**: moveAC, attackerAccuracyStage, defenderEvasion
- **outputs**: Threshold number
- **accessible_from**: gm
