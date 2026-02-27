---
cap_id: healing-C034
name: Create Default Stage Modifiers (Service)
type: —
domain: healing
---

## healing-C034: Create Default Stage Modifiers (Service)

- **Type:** service-function
- **Location:** `server/services/combatant.service.ts:createDefaultStageModifiers`
- **Game Concept:** Stage modifier reset (used by Take a Breather)
- **Description:** Creates a default stage modifiers object with all stages at 0. Used by Take a Breather to reset combat stages. Heavy Armor speed CS override is applied in the breather endpoint, not here.
- **Inputs:** None
- **Outputs:** `StageModifiers` (all zeroes)
- **Accessible From:** `api-only`
- **Orphan:** false
