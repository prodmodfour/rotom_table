---
cap_id: healing-C037
name: Store -- addInjury()
type: —
domain: healing
---

## healing-C037: Store -- addInjury()

- **Type:** store-action
- **Location:** `stores/encounterCombat.ts:addInjury`
- **Game Concept:** Manual injury addition during encounter
- **Description:** Calls `POST /api/encounters/:id/injury` with combatantId and source description. Returns updated encounter.
- **Inputs:** `encounterId, combatantId, source`
- **Outputs:** `Encounter` (updated)
- **Accessible From:** `gm`
- **Orphan:** false
