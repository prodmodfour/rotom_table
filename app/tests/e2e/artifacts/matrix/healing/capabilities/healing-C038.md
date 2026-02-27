---
cap_id: healing-C038
name: Store -- removeInjury()
type: —
domain: healing
---

## healing-C038: Store -- removeInjury()

- **Type:** store-action
- **Location:** `stores/encounterCombat.ts:removeInjury`
- **Game Concept:** Manual injury removal during encounter
- **Description:** Calls `DELETE /api/encounters/:id/injury` with combatantId. Returns updated encounter.
- **Inputs:** `encounterId, combatantId`
- **Outputs:** `Encounter` (updated)
- **Accessible From:** `gm`
- **Orphan:** false
