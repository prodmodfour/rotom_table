---
cap_id: scenes-C016
name: scenes-C016
type: —
domain: scenes
---

### scenes-C016
- **name:** Add/Remove Pokemon from Scene APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/pokemon.post.ts`, `[id]/pokemon/[pokemonId].delete.ts`
- **game_concept:** Scene Pokemon management
- **description:** Add Pokemon to scene (with position, optional group). Remove Pokemon from scene. Both update JSON pokemon array and broadcast WebSocket events (scene_pokemon_added, scene_pokemon_removed).
- **inputs:** URL params: id, pokemonId. Body (add): { pokemonId, position?, groupId? }
- **outputs:** `{ success, data: ScenePokemon }` or `{ success: true }`
- **accessible_from:** gm
