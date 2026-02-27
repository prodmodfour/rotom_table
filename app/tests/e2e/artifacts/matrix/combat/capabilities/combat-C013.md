---
cap_id: combat-C013
name: Update Encounter
type: api-endpoint
domain: combat
---

### combat-C013: Update Encounter
- **cap_id**: combat-C013
- **name**: Update Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id].put.ts`
- **game_concept**: Full encounter state update (used for undo/redo)
- **description**: Replaces encounter state with provided data. Primary use is undo/redo restoring snapshots.
- **inputs**: Full encounter state in body
- **outputs**: Updated encounter data
- **accessible_from**: gm
