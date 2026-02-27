---
cap_id: healing-C026
name: Composable -- getHealingInfo()
type: —
domain: healing
---

## healing-C026: Composable -- getHealingInfo()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:getHealingInfo`
- **Game Concept:** Client-side healing status computation
- **Description:** Wrapper around `getRestHealingInfo()` utility that converts string dates to Date objects for the underlying pure function.
- **Inputs:** `{ maxHp, injuries, restMinutesToday, lastInjuryTime: Date|string|null, injuriesHealedToday }`
- **Outputs:** `RestHealingInfo`
- **Accessible From:** `gm`
- **Orphan:** false
