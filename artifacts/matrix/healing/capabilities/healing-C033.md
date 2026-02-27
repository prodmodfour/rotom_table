---
cap_id: healing-C033
name: Calculate Damage (Injury Mechanics)
type: —
domain: healing
---

## healing-C033: Calculate Damage (Injury Mechanics)

- **Type:** service-function
- **Location:** `server/services/combatant.service.ts:calculateDamage`
- **Game Concept:** Damage to injury tracking (massive damage + HP marker crossings)
- **Description:** Calculates damage with PTU injury mechanics: temp HP absorbs first, massive damage (50%+ maxHp) = 1 injury, HP marker crossings (50%, 0%, -50%, -100%) = 1 injury each. Sets lastInjuryTime when injuries gained. Foundational for the healing system -- determines injury state.
- **Inputs:** `damage, currentHp, maxHp, temporaryHp, currentInjuries`
- **Outputs:** `DamageResult { finalDamage, tempHpAbsorbed, hpDamage, newHp, newTempHp, injuryGained, massiveDamageInjury, markerInjuries, markersCrossed, totalNewInjuries, newInjuries, fainted }`
- **Accessible From:** `api-only`
- **Orphan:** false
