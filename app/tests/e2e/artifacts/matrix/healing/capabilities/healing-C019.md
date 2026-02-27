---
cap_id: healing-C019
name: Get Rest Healing Info
type: —
domain: healing
---

## healing-C019: Get Rest Healing Info

- **Type:** utility
- **Location:** `utils/restHealing.ts:getRestHealingInfo`
- **Game Concept:** Healing status display data aggregation
- **Description:** Computes a full RestHealingInfo object for UI display: canRestHeal, restMinutesRemaining, hpPerRest, injury natural heal timing, daily injury remaining count.
- **Inputs:** `{ maxHp, injuries, restMinutesToday, lastInjuryTime, injuriesHealedToday }`
- **Outputs:** `RestHealingInfo` interface (canRestHeal, restMinutesRemaining, hpPerRest, injuries, canHealInjuryNaturally, hoursSinceLastInjury, hoursUntilNaturalHeal, injuriesHealedToday, injuriesRemainingToday)
- **Accessible From:** `gm` (via composable wrapper)
- **Orphan:** false
