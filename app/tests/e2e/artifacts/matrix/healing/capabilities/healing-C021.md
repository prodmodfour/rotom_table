---
cap_id: healing-C021
name: Composable -- extendedRest()
type: —
domain: healing
---

## healing-C021: Composable -- extendedRest()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:extendedRest`
- **Game Concept:** Client-side extended rest action
- **Description:** Calls `POST /api/.../extended-rest` for the given entity type.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false
