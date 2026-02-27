---
cap_id: healing-C036
name: Store -- takeABreather()
type: —
domain: healing
---

## healing-C036: Store -- takeABreather()

- **Type:** store-action
- **Location:** `stores/encounterCombat.ts:takeABreather`
- **Game Concept:** Store action for Take a Breather maneuver
- **Description:** Calls `POST /api/encounters/:id/breather` with combatantId. Returns updated encounter data.
- **Inputs:** `encounterId, combatantId`
- **Outputs:** `Encounter` (updated)
- **Accessible From:** `gm`
- **Orphan:** false
