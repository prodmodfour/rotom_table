---
cap_id: scenes-C022
name: scenes-C022
type: —
domain: scenes
---

### scenes-C022
- **name:** GroupViewTabs Store — tab state management
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — fetchTabState(), setActiveTab(), handleTabChange()
- **game_concept:** Group View tab routing
- **description:** Fetches/sets active tab via /api/group/tab. handleTabChange processes WebSocket tab change events.
- **inputs:** tab: GroupViewTab, sceneId?
- **outputs:** Updated activeTab, activeSceneId state
- **accessible_from:** gm (set), group (read)
