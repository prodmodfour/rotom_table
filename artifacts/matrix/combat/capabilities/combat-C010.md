---
cap_id: combat-C010
name: Create Encounter
type: api-endpoint
domain: combat
---

### combat-C010: Create Encounter
- **cap_id**: combat-C010
- **name**: Create Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/index.post.ts`
- **game_concept**: Starting a new combat encounter
- **description**: Creates a new encounter with name, battle type (trainer/full_contact), optional weather, and optional significance (multiplier + tier). Returns the created encounter object.
- **inputs**: `{ name, battleType, weather?, significanceMultiplier?, significanceTier? }`
- **outputs**: Encounter data object
- **accessible_from**: gm
