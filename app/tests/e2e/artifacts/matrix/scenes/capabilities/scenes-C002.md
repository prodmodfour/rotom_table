---
cap_id: scenes-C002
name: scenes-C002
type: —
domain: scenes
---

### scenes-C002
- **name:** GroupViewState Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model GroupViewState
- **game_concept:** Group View tab routing singleton
- **description:** Singleton tracking which tab is shown on Group View (lobby/scene/encounter/map) and the active scene ID. Updated via /api/group/tab endpoints.
- **inputs:** activeTab, activeSceneId
- **outputs:** Persisted singleton state
- **accessible_from:** gm, group

## API Endpoints
