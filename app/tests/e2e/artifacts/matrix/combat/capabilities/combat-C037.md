---
cap_id: combat-C037
name: Get Character Equipment
type: api-endpoint
domain: combat
---

### combat-C037: Get Character Equipment
- **cap_id**: combat-C037
- **name**: Get Equipment Slots and Bonuses
- **type**: api-endpoint
- **location**: `app/server/api/characters/[id]/equipment.get.ts`
- **game_concept**: Reading a trainer's equipped items
- **description**: Returns current equipment slots and aggregate bonuses (DR, evasion, stat bonuses, speed CS, conditional DR).
- **inputs**: Character ID
- **outputs**: `{ slots, aggregateBonuses }`
- **accessible_from**: gm, player
