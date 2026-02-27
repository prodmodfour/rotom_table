---
cap_id: combat-C060
name: calculateDamage (9-Step)
type: utility
domain: combat
---

### combat-C060: calculateDamage (9-Step)
- **cap_id**: combat-C060
- **name**: PTU 9-Step Damage Formula
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` — `calculateDamage()`
- **game_concept**: Full PTU damage calculation
- **description**: DB + STAB -> set damage + crit -> add stage-modified attack (with Focus bonus) -> subtract stage-modified defense (with Focus bonus) + DR -> type effectiveness -> min 1 (0 if immune). Detailed breakdown.
- **inputs**: DamageCalcInput
- **outputs**: DamageCalcResult
- **accessible_from**: gm (via calc-damage endpoint and MoveTargetModal)
