---
cap_id: scenes-C011
name: scenes-C011
type: —
domain: scenes
---

### scenes-C011
- **name:** Create Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/index.post.ts`
- **game_concept:** Scene creation
- **description:** Creates a new scene with name, description, location, weather, terrains, modifiers, and habitat link. JSON-stringifies array fields.
- **inputs:** Body: { name, description?, locationName?, locationImage?, weather?, terrains?, modifiers?, habitatId? }
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm
