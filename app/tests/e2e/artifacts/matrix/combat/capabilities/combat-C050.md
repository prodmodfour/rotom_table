---
cap_id: combat-C050
name: calculateDamage (Combatant Service)
type: service-function
domain: combat
---

### combat-C050: calculateDamage (Combatant Service)
- **cap_id**: combat-C050
- **name**: PTU Damage Application Calculator
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `calculateDamage()`
- **game_concept**: Damage with temp HP, massive damage, HP markers, injuries
- **description**: Temp HP absorbs first, massive damage check (50%+ maxHP), HP marker crossings (50%, 0%, -50%, -100%), injury counting, faint detection. Unclamped HP for marker detection, clamped for storage.
- **inputs**: damage, currentHp, maxHp, temporaryHp, currentInjuries
- **outputs**: DamageResult with injury/faint details
- **accessible_from**: gm (via damage/move endpoints)
