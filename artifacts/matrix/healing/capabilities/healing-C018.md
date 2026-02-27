---
cap_id: healing-C018
name: Clear Persistent Status Conditions
type: —
domain: healing
---

## healing-C018: Clear Persistent Status Conditions

- **Type:** utility
- **Location:** `utils/restHealing.ts:clearPersistentStatusConditions`
- **Game Concept:** Extended rest persistent status removal
- **Description:** Returns a new array with all persistent conditions removed (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned). Immutable -- does not mutate input.
- **Inputs:** `statusConditions: string[]`
- **Outputs:** `string[]` (remaining non-persistent conditions)
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false
