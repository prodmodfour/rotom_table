---
cap_id: healing-C024
name: Composable -- newDay()
type: —
domain: healing
---

## healing-C024: Composable -- newDay()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:newDay`
- **Game Concept:** Client-side per-entity daily reset action
- **Description:** Calls `POST /api/.../new-day` for a single Pokemon or Character.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false
