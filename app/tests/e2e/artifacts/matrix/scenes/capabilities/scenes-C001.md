---
cap_id: scenes-C001
name: scenes-C001
type: —
domain: scenes
---

### scenes-C001
- **name:** Scene Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model Scene
- **game_concept:** Narrative scene with characters, Pokemon, and environment
- **description:** Scene with name, description, location (name + image URL), JSON-stored pokemon/characters/groups arrays with positions, weather, terrains (JSON array — UI deferred), modifiers (JSON array — UI deferred), habitat link (habitatId), active state flag. Timestamps.
- **inputs:** name, description, locationName, locationImage, pokemon[], characters[], groups[], weather, terrains[], modifiers[], habitatId, isActive
- **outputs:** Persisted scene record
- **accessible_from:** gm, group (display), player (read-only via WebSocket)
