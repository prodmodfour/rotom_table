---
cap_id: healing-C025
name: Composable -- newDayGlobal()
type: —
domain: healing
---

## healing-C025: Composable -- newDayGlobal()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:newDayGlobal`
- **Game Concept:** Client-side global daily reset action
- **Description:** Calls `POST /api/game/new-day` to reset all entities' daily counters at once.
- **Inputs:** None
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false
