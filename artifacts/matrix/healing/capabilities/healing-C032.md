---
cap_id: healing-C032
name: Sync Damage to Database (Service)
type: —
domain: healing
---

## healing-C032: Sync Damage to Database (Service)

- **Type:** service-function
- **Location:** `server/services/entity-update.service.ts:syncDamageToDatabase`
- **Game Concept:** Persist damage and injury changes from encounter to entity DB record
- **Description:** Syncs currentHp, temporaryHp, injuries, statusConditions, and lastInjuryTime (if injury gained) to underlying DB record. Relevant to healing because injuries tracked here affect rest/healing logic and the 24h natural healing timer.
- **Inputs:** `combatant, newHp, newTempHp, newInjuries, statusConditions, injuryGained`
- **Outputs:** `Promise<void>`
- **Accessible From:** `api-only`
- **Orphan:** false
