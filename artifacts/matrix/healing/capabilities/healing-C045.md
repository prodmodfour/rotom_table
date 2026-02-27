---
cap_id: healing-C045
name: Volatile Status Conditions Constant
type: —
domain: healing
---

## healing-C045: Volatile Status Conditions Constant

- **Type:** constant
- **Location:** `constants/statusConditions.ts:VOLATILE_CONDITIONS`
- **Game Concept:** Status conditions cleared by Take a Breather
- **Description:** Array of volatile conditions: Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed. Used by breather endpoint to determine cured conditions (all except Cursed).
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Accessible From:** `api-only` (imported by server endpoints)
- **Orphan:** false
