---
cap_id: healing-C020
name: Composable -- rest()
type: —
domain: healing
---

## healing-C020: Composable -- rest()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:rest`
- **Game Concept:** Client-side 30-minute rest action
- **Description:** Calls `POST /api/pokemon/:id/rest` or `POST /api/characters/:id/rest` depending on entity type. Manages loading/error state.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null` (success, message, data)
- **Accessible From:** `gm`
- **Orphan:** false
