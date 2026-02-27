---
cap_id: scenes-C015
name: scenes-C015
type: —
domain: scenes
---

### scenes-C015
- **name:** Add/Remove Character from Scene APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/characters.post.ts`, `[id]/characters/[charId].delete.ts`
- **game_concept:** Scene character management
- **description:** Add character to scene (with position, optional group assignment). Remove character from scene. Both update the JSON characters array and broadcast WebSocket events (scene_character_added, scene_character_removed).
- **inputs:** URL params: id, charId. Body (add): { characterId, position?, groupId? }
- **outputs:** `{ success, data: SceneCharacter }` or `{ success: true }`
- **accessible_from:** gm
