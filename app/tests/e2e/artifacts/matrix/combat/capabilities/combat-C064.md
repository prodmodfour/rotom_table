---
cap_id: combat-C064
name: applyStageModifierWithBonus
type: utility
domain: combat
---

### combat-C064: applyStageModifierWithBonus
- **cap_id**: combat-C064
- **name**: Stage Modifier + Focus Bonus
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `applyStageModifierWithBonus()`
- **game_concept**: Focus +5 after combat stages (PTU p.295)
- **description**: Stage multiplier then flat bonus. For Focus-equipped trainers.
- **inputs**: baseStat, stage, postStageBonus
- **outputs**: Modified stat + bonus
- **accessible_from**: gm
