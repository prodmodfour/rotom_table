---
cap_id: combat-C018
name: Add Combatant
type: api-endpoint
domain: combat
---

### combat-C018: Add Combatant
- **cap_id**: combat-C018
- **name**: Add Combatant to Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/combatants.post.ts`
- **game_concept**: Adding a Pokemon or trainer to combat
- **description**: Looks up entity (Pokemon or HumanCharacter), builds full combatant wrapper with initiative, evasions, equipment bonuses (shields, Focus, Heavy Armor speed CS), and turn state.
- **inputs**: `{ entityId, entityType, side, initiativeBonus?, position? }`
- **outputs**: Updated encounter with new combatant
- **accessible_from**: gm
