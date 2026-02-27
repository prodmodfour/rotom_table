---
cap_id: combat-C022
name: Execute Move
type: api-endpoint
domain: combat
---

### combat-C022: Execute Move
- **cap_id**: combat-C022
- **name**: Execute Move in Combat
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/move.post.ts`
- **game_concept**: Using a Pokemon move in combat
- **description**: Validates move frequency restrictions (At-Will, EOT, Scene, Daily, Static), applies per-target damage using PTU mechanics, increments move usage tracking, creates move log entry, decrements action count. Supports per-target damage via targetDamages map.
- **inputs**: `{ actorId, moveId, targetIds, damage?, targetDamages?, notes? }`
- **outputs**: Updated encounter with move log
- **accessible_from**: gm, player
