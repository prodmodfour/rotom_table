---
cap_id: healing-C059
name: RestHealingInfo Interface
type: —
domain: healing
---

## healing-C059: RestHealingInfo Interface

- **Type:** prisma-field
- **Location:** `utils/restHealing.ts:RestHealingInfo`
- **Game Concept:** Healing status display data structure
- **Description:** TypeScript interface defining the shape of healing status data for UI display: canRestHeal, restMinutesRemaining, hpPerRest, injuries, canHealInjuryNaturally, hoursSinceLastInjury, hoursUntilNaturalHeal, injuriesHealedToday, injuriesRemainingToday.
- **Inputs:** N/A (type definition)
- **Outputs:** Used by getRestHealingInfo and getHealingInfo composable
- **Accessible From:** `gm` (via composable)
- **Orphan:** false
