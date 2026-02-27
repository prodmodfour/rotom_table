---
cap_id: healing-C031
name: Sync Healing to Database (Service)
type: —
domain: healing
---

## healing-C031: Sync Healing to Database (Service)

- **Type:** service-function
- **Location:** `server/services/entity-update.service.ts:syncHealingToDatabase`
- **Game Concept:** Persist healing changes from encounter to entity DB record
- **Description:** Syncs currentHp, temporaryHp, injuries, and statusConditions from encounter combatant back to the underlying Pokemon or HumanCharacter database record via syncEntityToDatabase.
- **Inputs:** `combatant: Combatant, currentHp, temporaryHp, injuries, statusConditions`
- **Outputs:** `Promise<void>`
- **Accessible From:** `api-only`
- **Orphan:** false
