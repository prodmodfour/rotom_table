---
cap_id: combat-C063
name: applyStageModifier
type: utility
domain: combat
---

### combat-C063: applyStageModifier
- **cap_id**: combat-C063
- **name**: Stage Multiplier Application
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `applyStageModifier()`
- **game_concept**: PTU combat stage multipliers
- **description**: Applies stage multiplier table to stat. Clamp -6/+6, floor rounding.
- **inputs**: baseStat, stage
- **outputs**: Modified stat
- **accessible_from**: gm, player
