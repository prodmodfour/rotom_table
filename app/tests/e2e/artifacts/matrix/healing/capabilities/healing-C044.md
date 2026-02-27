---
cap_id: healing-C044
name: Persistent Status Conditions Constant
type: —
domain: healing
---

## healing-C044: Persistent Status Conditions Constant

- **Type:** constant
- **Location:** `constants/statusConditions.ts:PERSISTENT_CONDITIONS`
- **Game Concept:** Status conditions cleared by extended rest
- **Description:** Array of persistent conditions: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. Used by `clearPersistentStatusConditions()` and `getStatusesToClear()`.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Accessible From:** `api-only` (imported by server endpoints and utilities)
- **Orphan:** false
