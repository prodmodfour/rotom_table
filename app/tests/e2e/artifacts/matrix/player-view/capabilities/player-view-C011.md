---
cap_id: player-view-C011
name: player-view-C011
type: —
domain: player-view
---

### player-view-C011
- **name:** GET /api/characters/:id/player-view
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/player-view.get.ts`
- **game_concept:** Player character data loading
- **description:** Returns the full character (serialized) with all linked Pokemon in a single response. Used by the Player View to populate the character sheet and Pokemon team tabs. Includes all stats, skills, features, edges, equipment, inventory, status conditions, and Pokemon details.
- **inputs:** characterId (route param)
- **outputs:** { success, data: { character: HumanCharacter, pokemon: Pokemon[] } }
- **accessible_from:** player, gm (technically callable)
