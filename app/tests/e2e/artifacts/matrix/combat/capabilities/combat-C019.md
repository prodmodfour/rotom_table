---
cap_id: combat-C019
name: Remove Combatant
type: api-endpoint
domain: combat
---

### combat-C019: Remove Combatant
- **cap_id**: combat-C019
- **name**: Remove Combatant from Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts`
- **game_concept**: Removing a combatant from battle
- **description**: Removes a combatant by ID, adjusts turn order if needed.
- **inputs**: Encounter ID, Combatant ID
- **outputs**: Updated encounter
- **accessible_from**: gm
