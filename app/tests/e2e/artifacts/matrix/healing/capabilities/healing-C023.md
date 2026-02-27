---
cap_id: healing-C023
name: Composable -- healInjury()
type: —
domain: healing
---

## healing-C023: Composable -- healInjury()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:healInjury`
- **Game Concept:** Client-side injury healing action
- **Description:** Calls `POST /api/.../heal-injury` with method parameter ('natural' or 'drain_ap').
- **Inputs:** `type: 'pokemon' | 'character', id: string, method: 'natural' | 'drain_ap'`
- **Outputs:** `RestResult | null`
- **Accessible From:** `gm`
- **Orphan:** false
