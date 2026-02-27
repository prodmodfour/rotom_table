---
cap_id: healing-C052
name: Get Effective Max HP
type: —
domain: healing
---

## healing-C052: Get Effective Max HP

- **Type:** utility
- **Location:** `utils/restHealing.ts:getEffectiveMaxHp`
- **Game Concept:** Injury-reduced effective max HP calculation (PTU Core Chapter 9)
- **Description:** Computes injury-reduced effective max HP. Each injury reduces max HP by 1/10th, capped at 10 injuries. Example: 50 maxHp with 3 injuries = floor(50 * 7/10) = 35. Used by rest healing, Pokemon Center, and in-combat healing to cap HP recovery.
- **Inputs:** `maxHp: number, injuries: number`
- **Outputs:** `number` (effective max HP)
- **Accessible From:** `api-only` (imported by server endpoints and combatant service)
- **Orphan:** false
