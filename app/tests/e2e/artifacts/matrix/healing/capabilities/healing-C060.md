---
cap_id: healing-C060
name: HealResult Interface
type: —
domain: healing
---

## healing-C060: HealResult Interface

- **Type:** prisma-field
- **Location:** `server/services/combatant.service.ts:HealResult`
- **Game Concept:** In-combat healing result data structure
- **Description:** TypeScript interface for the result of applyHealingToEntity: newHp, newTempHp, newInjuries, faintedRemoved, plus optional hpHealed, tempHpGained, injuriesHealed.
- **Inputs:** N/A (type definition)
- **Outputs:** Returned by applyHealingToEntity, propagated to API response
- **Accessible From:** `api-only`
- **Orphan:** false
