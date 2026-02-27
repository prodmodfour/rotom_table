---
cap_id: healing-C017
name: Get Statuses to Clear
type: —
domain: healing
---

## healing-C017: Get Statuses to Clear

- **Type:** utility
- **Location:** `utils/restHealing.ts:getStatusesToClear`
- **Game Concept:** Extended rest persistent status condition identification
- **Description:** Filters status conditions to find which ones would be cleared by extended rest (persistent conditions: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned).
- **Inputs:** `statusConditions: string[]`
- **Outputs:** `string[]` (persistent conditions present)
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false
